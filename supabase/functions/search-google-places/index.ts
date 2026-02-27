import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Google Places API is temporarily disabled to control costs
    return new Response(JSON.stringify([]), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const { query, lat = -33.8688, lng = 151.2093, radius = 10000, limit = 20 } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cacheKey = `google_${query}_${lat}_${lng}_${radius}_${limit}`.toLowerCase().replace(/\s+/g, "_");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache (reuse foursquare_cache table with google_ prefix keys)
    const { data: cached } = await supabase
      .from("foursquare_cache")
      .select("data, created_at")
      .eq("id", cacheKey)
      .single();

    if (cached) {
      const cacheAge = Date.now() - new Date(cached.created_at).getTime();
      if (cacheAge < 3600000) {
        return new Response(JSON.stringify(cached.data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GOOGLE_PLACES_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Google Places API (New) - Text Search
    const body = {
      textQuery: query,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radius,
        },
      },
      maxResultCount: Math.min(limit, 20),
      languageCode: "en",
    };

    const fieldMask = [
      "places.id",
      "places.displayName",
      "places.formattedAddress",
      "places.location",
      "places.rating",
      "places.userRatingCount",
      "places.primaryType",
      "places.types",
      "places.nationalPhoneNumber",
      "places.websiteUri",
      "places.photos",
      "places.editorialSummary",
    ].join(",");

    console.log("Calling Google Places API with query:", query);

    let googleRes: Response | null = null;
    let lastErrText = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      googleRes = await fetch(
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": fieldMask,
          },
          body: JSON.stringify(body),
        }
      );

      if (googleRes.status === 429) {
        lastErrText = await googleRes.text();
        const waitMs = Math.pow(2, attempt) * 2000 + Math.random() * 1000;
        console.warn(`Rate limited (429), waiting ${Math.round(waitMs)}ms (attempt ${attempt + 1}/3)`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      break;
    }

    if (!googleRes || !googleRes.ok) {
      if (!lastErrText && googleRes) lastErrText = await googleRes.text();
      console.error("Google Places API error:", googleRes?.status, lastErrText);
      if (cached) {
        return new Response(JSON.stringify(cached.data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Google Places API error", details: lastErrText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const googleData = await googleRes.json();
    const venues = (googleData.places || []).map((place: any) => {
      // Build photo URL from photo resource name
      let photoUrl: string | null = null;
      if (place.photos?.length > 0) {
        const photoName = place.photos[0].name;
        photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=400&key=${apiKey}`;
      }

      return {
        id: place.id,
        name: place.displayName?.text || "Unknown",
        category: place.primaryType?.replace(/_/g, " ") || place.types?.[0]?.replace(/_/g, " ") || "Venue",
        tags: (place.types || []).join(","),
        description: place.editorialSummary?.text || "",
        latitude: place.location?.latitude ?? lat,
        longitude: place.location?.longitude ?? lng,
        address: place.formattedAddress || "",
        photos: photoUrl ? [photoUrl] : [],
        rating: place.rating ? place.rating : null, // Google is already 0-5
        phone: place.nationalPhoneNumber || null,
        website: place.websiteUri || null,
        source: "google",
      };
    });

    // Upsert cache
    await supabase.from("foursquare_cache").upsert(
      { id: cacheKey, data: venues, created_at: new Date().toISOString() },
      { onConflict: "id" }
    );

    return new Response(JSON.stringify(venues), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
