import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface CalendarEvent {
  id: string;
  user_id: string;
  activity_id: string | null;
  title: string;
  event_date: string;
  event_time: string | null;
  notes: string | null;
  created_at: string;
  activities?: {
    id: string;
    name: string;
    category: string;
    hero_image_url: string | null;
    address: string | null;
  } | null;
}

export function useCalendarEvents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["calendar-events", user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();
      if (!profile) return [];

      const { data, error } = await supabase
        .from("calendar_events")
        .select("*, activities(id, name, category, hero_image_url, address)")
        .eq("user_id", profile.id)
        .order("event_date", { ascending: true });

      if (error) throw error;
      return (data || []) as CalendarEvent[];
    },
    enabled: !!user,
  });
}

export function useAddCalendarEvent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      activityId,
      title,
      eventDate,
      eventTime,
      notes,
    }: {
      activityId?: string;
      title: string;
      eventDate: string;
      eventTime?: string;
      notes?: string;
    }) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();
      if (!profile) throw new Error("Profile not found");

      const { error } = await supabase.from("calendar_events").insert({
        user_id: profile.id,
        activity_id: activityId || null,
        title,
        event_date: eventDate,
        event_time: eventTime || null,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Added to calendar");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add to calendar");
    },
  });
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.from("calendar_events").delete().eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Removed from calendar");
    },
    onError: () => toast.error("Failed to remove event"),
  });
}
