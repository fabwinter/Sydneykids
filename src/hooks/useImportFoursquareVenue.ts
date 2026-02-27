import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FoursquareVenue } from "./useFoursquareSearch";

async function importVenue(venue: FoursquareVenue): Promise<string> {
  const { data, error } = await supabase.rpc("upsert_foursquare_venue", {
    p_foursquare_id: venue.id,
    p_name: venue.name,
    p_category: venue.category,
    p_latitude: venue.latitude,
    p_longitude: venue.longitude,
    p_address: venue.address || null,
    p_description: venue.description || null,
    p_rating: venue.rating,
    p_phone: venue.phone || null,
    p_website: venue.website || null,
    p_hero_image_url: venue.photos?.[0] || null,
  });

  if (error) throw error;
  return data as string;
}

export function useImportFoursquareVenue() {
  return useMutation({
    mutationFn: importVenue,
  });
}
