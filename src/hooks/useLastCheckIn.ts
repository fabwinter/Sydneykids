import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useLastCheckIn(activityId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["last-check-in", activityId, user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (!profile) return null;

      const { data, error } = await supabase
        .from("check_ins")
        .select("created_at")
        .eq("user_id", profile.id)
        .eq("activity_id", activityId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!activityId,
  });
}
