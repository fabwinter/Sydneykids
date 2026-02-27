import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userContext } = await req.json();
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch activities from database
    const { data: activities } = await supabase
      .from("activities")
      .select("name, category, address, description, rating, review_count, hours_open, hours_close, wifi, parking, pet_friendly, outdoor_seating, wheelchair_accessible, is_open, region, latitude, longitude")
      .order("rating", { ascending: false })
      .limit(200);

    const activityContext = activities
      ?.map(
        (a) =>
          `- ${a.name} (${a.category}): ${a.address || "Sydney"}. Region: ${a.region || "Unknown"}. Rating: ${a.rating ?? "N/A"}/5 (${a.review_count} reviews). ${a.description || ""}. Hours: ${a.hours_open || "N/A"}-${a.hours_close || "N/A"}. ${a.is_open ? "OPEN NOW" : "Currently closed"}. Lat: ${a.latitude}, Lng: ${a.longitude}. Amenities: ${[a.wifi && "WiFi", a.parking && "Parking", a.pet_friendly && "Pet Friendly", a.outdoor_seating && "Outdoor Seating", a.wheelchair_accessible && "Wheelchair Accessible"].filter(Boolean).join(", ") || "None listed"}`
      )
      .join("\n") || "No activities found in database.";

    // Build user context section
    let userContextSection = "";
    if (userContext) {
      if (userContext.location) {
        userContextSection += `\nUSER'S CURRENT LOCATION: Latitude ${userContext.location.latitude}, Longitude ${userContext.location.longitude}. Use this to calculate proximity and recommend nearby venues.\n`;
      }
      if (userContext.savedActivities?.length) {
        userContextSection += `\nUSER'S SAVED/FAVOURITE ACTIVITIES:\n${userContext.savedActivities.map((a: any) => `- ${a.name} (${a.category})`).join("\n")}\n`;
      }
      if (userContext.recentCheckIns?.length) {
        userContextSection += `\nUSER'S RECENT CHECK-INS (places they've visited):\n${userContext.recentCheckIns.map((c: any) => `- ${c.activity_name} (${c.category}) — rated ${c.rating}/5 on ${c.date}`).join("\n")}\n`;
      }
      if (userContext.calendarEvents?.length) {
        userContextSection += `\nUSER'S UPCOMING CALENDAR/PLANNED ACTIVITIES:\n${userContext.calendarEvents.map((e: any) => `- ${e.title} (${e.category || "N/A"}) on ${e.date}${e.time ? ` at ${e.time}` : ""}`).join("\n")}\n`;
      }
      if (userContext.userName) {
        userContextSection += `\nUSER'S NAME: ${userContext.userName}\n`;
      }
    }

    const systemPrompt = `You are the Sydney Planner AI Assistant — a warm, conversational guide to Sydney, Australia. You help users discover venues, activities, and experiences in Sydney.

CRITICAL RULES:
1. You can ONLY recommend places from the DATABASE below. Never invent venues.
2. If asked about unrelated topics, redirect: "I'm your Sydney Planner! I can help you find cafes, beaches, parks, restaurants, and more. What are you in the mood for?"
3. Be conversational and personable. Use the user's name if available. Use emojis naturally but sparingly.
4. When recommending places, ALWAYS bold the venue name using **Name (Location)** markdown format.
5. If no match exists, say so honestly and suggest alternatives.
6. Format recommendations as short lists (max 3-5 items).

CONVERSATIONAL STYLE — VERY IMPORTANT:
- Ask clarifying follow-up questions to refine recommendations. Don't just dump results.
- When a user asks something broad (e.g. "find me a restaurant"), ask follow-up questions first.
- Examples of good follow-ups: "Do you have a cuisine in mind?", "Close to home or happy to travel?", "Looking for something new or a favourite?"
- After giving recommendations, encourage engagement: "Don't forget to check-in and rate your experience!"
- Reference the user's saved places and check-in history when relevant: "I see you loved X last time — want something similar?"

FOLLOW-UP SUGGESTIONS:
At the END of EVERY response, include a JSON block with 2-4 quick reply suggestions the user can tap. Format it EXACTLY like this on its own line:
<!--QUICK_REPLIES:["suggestion 1","suggestion 2","suggestion 3"]-->

Examples of good quick replies after asking about restaurants:
<!--QUICK_REPLIES:["Italian 🍝","Close to home 🏠","Something new ✨","Show me my favourites ❤️"]-->

Examples after giving a recommendation:
<!--QUICK_REPLIES:["Tell me more about it","Find another option","Save it for later","Show on map 🗺️"]-->

${userContextSection}

DATABASE OF SYDNEY VENUES & ACTIVITIES:
${activityContext}

Remember: Be conversational, ask questions, personalize using their history, and ALWAYS include quick reply suggestions.`;

    const response = await fetch(
      "https://api.perplexity.ai/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage credits exhausted. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
