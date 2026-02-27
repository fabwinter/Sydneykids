import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export type Playlist = Tables<"playlists"> & {
  item_count?: number;
};

export type PlaylistWithItems = Tables<"playlists"> & {
  playlist_items: (Tables<"playlist_items"> & {
    activities: Tables<"activities">;
  })[];
};

export function usePlaylists() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["playlists", user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (!profile) return [];

      const { data, error } = await supabase
        .from("playlists")
        .select(`
          *,
          playlist_items (id)
        `)
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return data.map((playlist) => ({
        ...playlist,
        item_count: playlist.playlist_items?.length || 0,
        playlist_items: undefined,
      })) as Playlist[];
    },
    enabled: !!user,
  });
}

export function usePlaylistWithItems(playlistId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["playlist", playlistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("playlists")
        .select(`
          *,
          playlist_items (
            *,
            activities (*)
          )
        `)
        .eq("id", playlistId)
        .single();

      if (error) throw error;
      return data as PlaylistWithItems;
    },
    enabled: !!user && !!playlistId,
  });
}

export function useCreatePlaylist() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, emoji = "📍" }: { name: string; emoji?: string }) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      const { data, error } = await supabase
        .from("playlists")
        .insert({
          user_id: profile.id,
          name,
          emoji,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      toast.success("Playlist created");
    },
    onError: (error: any) => {
      console.error("Error creating playlist:", error);
      if (error.message?.includes("limit")) {
        toast.error("Free users can only create 3 playlists. Upgrade to Premium for unlimited playlists!");
      } else {
        toast.error("Failed to create playlist");
      }
    },
  });
}

export function useDeletePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playlistId: string) => {
      const { error } = await supabase
        .from("playlists")
        .delete()
        .eq("id", playlistId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      toast.success("Playlist deleted");
    },
    onError: (error) => {
      console.error("Error deleting playlist:", error);
      toast.error("Failed to delete playlist");
    },
  });
}

export function useAddToPlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playlistId, activityId }: { playlistId: string; activityId: string }) => {
      const { error } = await supabase
        .from("playlist_items")
        .insert({
          playlist_id: playlistId,
          activity_id: activityId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      queryClient.invalidateQueries({ queryKey: ["playlist"] });
      toast.success("Added to playlist");
    },
    onError: (error) => {
      console.error("Error adding to playlist:", error);
      toast.error("Failed to add to playlist");
    },
  });
}

export function useRemoveFromPlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playlistId, activityId }: { playlistId: string; activityId: string }) => {
      const { error } = await supabase
        .from("playlist_items")
        .delete()
        .eq("playlist_id", playlistId)
        .eq("activity_id", activityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      queryClient.invalidateQueries({ queryKey: ["playlist"] });
      toast.success("Removed from playlist");
    },
    onError: (error) => {
      console.error("Error removing from playlist:", error);
      toast.error("Failed to remove from playlist");
    },
  });
}
