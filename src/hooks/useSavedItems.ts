import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export type SavedItem = Tables<"saved_items"> & {
  activities: Tables<"activities">;
};

export function useSavedItems() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["saved-items", user?.id],
    queryFn: async () => {
      // Get profile id first
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (!profile) return [];

      const { data, error } = await supabase
        .from("saved_items")
        .select(`
          *,
          activities (*)
        `)
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SavedItem[];
    },
    enabled: !!user,
  });
}

export function useToggleSavedItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ activityId, isSaved }: { activityId: string; isSaved: boolean }) => {
      // Get profile id first
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      if (isSaved) {
        // Remove from saved
        const { error } = await supabase
          .from("saved_items")
          .delete()
          .eq("user_id", profile.id)
          .eq("activity_id", activityId);

        if (error) throw error;
        return { action: "removed" };
      } else {
        // Add to saved
        const { error } = await supabase
          .from("saved_items")
          .insert({
            user_id: profile.id,
            activity_id: activityId,
          });

        if (error) throw error;
        return { action: "saved" };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["saved-items"] });
      toast.success(result.action === "saved" ? "Added to saved places" : "Removed from saved places");
    },
    onError: (error) => {
      console.error("Error toggling saved item:", error);
      toast.error("Failed to update saved items");
    },
  });
}

export function useIsActivitySaved(activityId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is-saved", activityId, user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (!profile) return false;

      const { data, error } = await supabase
        .from("saved_items")
        .select("id")
        .eq("user_id", profile.id)
        .eq("activity_id", activityId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!activityId,
  });
}
