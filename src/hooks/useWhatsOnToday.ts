import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WhatsOnItem {
  id: string;
  title: string;
  url: string;
  category?: string;
  excerpt?: string;
  imageUrl?: string;
  date?: string;
  source: string;
  activityId?: string; // set if imported into DB
}

async function fetchWhatsOnToday(): Promise<WhatsOnItem[]> {
  // Only fetch DB activities with show_in_whats_on = true (no scraped events)
  const { data: dbActivities } = await supabase
    .from("activities")
    .select("id, name, category, description, hero_image_url, event_dates, source_url, is_event")
    .eq("show_in_whats_on", true)
    .order("created_at", { ascending: false });

  const items: WhatsOnItem[] = [];

  if (dbActivities?.length) {
    for (const a of dbActivities) {
      items.push({
        id: `db-${a.id}`,
        title: a.name,
        url: a.source_url || "",
        category: a.category,
        excerpt: a.description?.slice(0, 200) || undefined,
        imageUrl: a.hero_image_url || undefined,
        date: a.event_dates || undefined,
        source: "database",
        activityId: a.id,
      });
    }
  }

  return items;
}

export function useWhatsOnToday(limit = 10) {
  return useQuery({
    queryKey: ["whats-on-today", limit],
    queryFn: async () => {
      const items = await fetchWhatsOnToday();
      return items.slice(0, limit);
    },
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });
}

export function useImportWhatsOnEvents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: WhatsOnItem[]) => {
      const { data, error } = await supabase.functions.invoke("import-whats-on", {
        body: { items },
      });
      if (error) throw error;
      return data as {
        imported: number;
        skipped: number;
        errors: number;
        mappings: Record<string, string>;
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whats-on-today"] });
    },
  });
}

/** Toggle show_in_whats_on for an activity */
export function useToggleWhatsOn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ activityId, show }: { activityId: string; show: boolean }) => {
      const { error } = await supabase.rpc("admin_update_activity", {
        p_activity_id: activityId,
        p_updates: { show_in_whats_on: show } as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whats-on-today"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

/** Toggle show_in_featured for an activity */
export function useToggleFeatured() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ activityId, show }: { activityId: string; show: boolean }) => {
      const { error } = await supabase.rpc("admin_update_activity", {
        p_activity_id: activityId,
        p_updates: { show_in_featured: show } as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommended-activities"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["featured-hero"] });
    },
  });
}
