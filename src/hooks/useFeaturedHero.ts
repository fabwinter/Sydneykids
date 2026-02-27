import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { transformActivity, type Activity } from "@/hooks/useActivities";
import { useUserLocation } from "@/hooks/useUserLocation";

const SYDNEY_LAT = -33.8688;
const SYDNEY_LNG = 151.2093;

export function useFeaturedHeroActivities(limit = 5) {
  const { location } = useUserLocation();
  const lat = location?.latitude ?? SYDNEY_LAT;
  const lng = location?.longitude ?? SYDNEY_LNG;

  return useQuery({
    queryKey: ["featured-hero", limit, lat, lng],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("show_in_featured", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as Activity[]).map((a) => transformActivity(a, lat, lng));
    },
    staleTime: 10 * 60 * 1000,
  });
}
