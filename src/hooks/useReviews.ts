import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export type Review = Tables<"reviews"> & {
  profiles: {
    name: string | null;
    avatar_url: string | null;
  } | null;
};

export function useActivityReviews(activityId: string) {
  return useQuery({
    queryKey: ["reviews", activityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          profiles (name, avatar_url)
        `)
        .eq("activity_id", activityId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
    enabled: !!activityId,
  });
}

export function useActivityPhotos(activityId: string) {
  return useQuery({
    queryKey: ["photos", activityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("activity_id", activityId)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!activityId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      activityId, 
      rating, 
      reviewText 
    }: { 
      activityId: string; 
      rating: number; 
      reviewText?: string;
    }) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      const { data, error } = await supabase
        .from("reviews")
        .insert({
          activity_id: activityId,
          user_id: profile.id,
          rating,
          review_text: reviewText,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", variables.activityId] });
      queryClient.invalidateQueries({ queryKey: ["activity", variables.activityId] });
      toast.success("Review posted");
    },
    onError: (error) => {
      console.error("Error creating review:", error);
      toast.error("Failed to post review");
    },
  });
}
