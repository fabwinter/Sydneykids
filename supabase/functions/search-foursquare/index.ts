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
    const { query, lat = -33.8688, lng = 151.2093, radius = 10000, limit = 20 } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cacheKey = `${query}_${lat}_${lng}_${radius}_${limit}`.toLowerCase().replace(/\s+/g, "_");

    // Check cache first
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: cached } = await supabase
      .from("foursquare_cache")
      .select("data, created_at")
      .eq("id", cacheKey)
      .single();

    if (cached) {
      const cacheAge = Date.now() - new Date(cached.created_at).getTime();
      if (cacheAge < 3600000) {
        // 1 hour
        return new Response(JSON.stringify(cached.data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch from Foursquare
    const fsqKey = Deno.env.get("FSQ_API_KEY");
    if (!fsqKey) {
      return new Response(JSON.stringify({ error: "FSQ_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const params = new URLSearchParams({
      query,
      ll: `${lat},${lng}`,
      radius: String(radius),
      limit: String(limit),
      fields: "fsq_id,name,categories,geocodes,location,tel,website,rating,photos,description",
    });

    console.log("Using FSQ key (first 8 chars):", fsqKey.substring(0, 8));
    const fsqRes = await fetch(`https://api.foursquare.com/v3/places/search?${params}`, {
      headers: { Authorization: fsqKey, Accept: "application/json" },
    });

    if (!fsqRes.ok) {
      const errText = await fsqRes.text();
      console.error("Foursquare API error:", fsqRes.status, errText);
      // Fallback to cache even if expired
      if (cached) {
        return new Response(JSON.stringify(cached.data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Foursquare API error", details: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fsqData = await fsqRes.json();
    const venues = (fsqData.results || []).map((place: any) => ({
      id: place.fsq_id,
      name: place.name,
      category: place.categories?.[0]?.name || "Venue",
      tags: (place.categories || []).map((c: any) => c.name).join(","),
      description: place.description || "",
      latitude: place.geocodes?.main?.latitude ?? lat,
      longitude: place.geocodes?.main?.longitude ?? lng,
      address: place.location?.formatted_address || place.location?.address || "",
      photos: (place.photos || []).map((p: any) => `${p.prefix}300x300${p.suffix}`),
      rating: place.rating ? place.rating / 2 : null, // FSQ is 0-10, normalize to 0-5
      phone: place.tel || null,
      website: place.website || null,
      source: "foursquare",
    }));

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
