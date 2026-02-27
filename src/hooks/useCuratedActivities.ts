import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { transformActivity, type Activity } from "@/hooks/useActivities";

/**
 * Fetch activities filtered by one or more categories.
 */
export function useActivitiesByCategories(
  categories: string[],
  limit = 15,
  label = "curated"
) {
  return useQuery({
    queryKey: ["activities", label, categories, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .in("category", categories)
        .order("rating", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as Activity[]).map((a) => transformActivity(a));
    },
  });
}

/**
 * Fetch top-rated activities across all categories.
 */
export function useBestOfActivities(limit = 15) {
  return useQuery({
    queryKey: ["activities", "best-of", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .gte("rating", 4)
        .order("rating", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as Activity[]).map((a) => transformActivity(a));
    },
  });
}

/**
 * Fetch outdoor / walk-friendly activities.
 */
export function useOutdoorActivities(limit = 15) {
  return useQuery({
    queryKey: ["activities", "outdoor", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .in("category", ["Park", "Beach"])
        .order("rating", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as Activity[]).map((a) => transformActivity(a));
    },
  });
}

/**
 * Fetch nightlife-oriented activities.
 */
export function useNightlifeActivities(limit = 15) {
  return useQuery({
    queryKey: ["activities", "nightlife", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .in("category", ["Bar", "Restaurant"])
        .order("rating", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as Activity[]).map((a) => transformActivity(a));
    },
  });
}
