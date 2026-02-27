import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Tables } from "@/integrations/supabase/types";

export type TimelineCheckIn = Tables<"check_ins"> & {
  activities: Tables<"activities">;
};

export type GroupedCheckIns = {
  date: string;
  label: string;
  checkIns: TimelineCheckIn[];
};

export function useCheckInTimeline(search?: string, category?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["check-in-timeline", user?.id, search, category],
    queryFn: async () => {
      // Use the DB function to get profile id in one call
      const { data: profileId } = await supabase.rpc("get_profile_id_from_auth");
      if (!profileId) return [];

      let query = supabase
        .from("check_ins")
        .select(`
          id, activity_id, rating, comment, photo_url, photo_urls, created_at,
          activities!inner ( id, name, category, address, hero_image_url, latitude, longitude, rating )
        `)
        .eq("user_id", profileId)
        .order("created_at", { ascending: false })
        .limit(200);

      // Server-side category filter
      if (category && category !== "all") {
        query = query.ilike("activities.category", category);
      }

      const { data, error } = await query;
      if (error) throw error;

      let items = (data || []) as TimelineCheckIn[];

      // Client-side search only
      if (search) {
        const lowerSearch = search.toLowerCase();
        items = items.filter(
          (item) =>
            item.activities?.name?.toLowerCase().includes(lowerSearch) ||
            item.activities?.address?.toLowerCase().includes(lowerSearch)
        );
      }

      // Group by date
      const grouped = new Map<string, TimelineCheckIn[]>();
      for (const item of items) {
        const dateKey = new Date(item.created_at).toISOString().split("T")[0];
        if (!grouped.has(dateKey)) grouped.set(dateKey, []);
        grouped.get(dateKey)!.push(item);
      }

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const result: GroupedCheckIns[] = [];
      for (const [dateKey, checkIns] of grouped) {
        const d = new Date(dateKey);
        let label: string;
        if (d.toDateString() === today.toDateString()) label = "Today";
        else if (d.toDateString() === yesterday.toDateString()) label = "Yesterday";
        else label = d.toLocaleDateString("en-AU", { weekday: "short", month: "short", day: "numeric" });
        result.push({ date: dateKey, label, checkIns });
      }

      return result;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });
}
