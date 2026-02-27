import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ActivityData {
  name: string;
  category: string;
  suburb: string;
  latitude: number;
  longitude: number;
  rating: number;
  review_count: number;
  description: string;
  address: string;
  phone: string;
  amenities: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { activities, batchNumber = 1 } = await req.json();
    
    if (!activities || !Array.isArray(activities)) {
      return new Response(
        JSON.stringify({ error: "Activities array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call the bulk import function (v2 handles JSON format with amenities arrays)
    const { data, error } = await supabase.rpc('bulk_import_activities_v2', {
      activities_json: activities
    });

    if (error) {
      console.error("Import error:", error);
      return new Response(
        JSON.stringify({ error: error.message, details: error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        inserted: data,
        batchNumber,
        message: `Batch ${batchNumber}: Inserted ${data} activities`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
