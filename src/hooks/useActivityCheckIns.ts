import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Tables } from "@/integrations/supabase/types";

export type ActivityCheckIn = Tables<"check_ins">;

export function useActivityCheckIns(activityId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["activity-check-ins", activityId, user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (!profile) return [];

      const { data, error } = await supabase
        .from("check_ins")
        .select("*, photo_urls")
        .eq("user_id", profile.id)
        .eq("activity_id", activityId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as ActivityCheckIn[];
    },
    enabled: !!user && !!activityId,
  });
}
