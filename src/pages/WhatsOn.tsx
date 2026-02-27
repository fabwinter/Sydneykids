import { Sparkles, RefreshCw, Download, Loader2, Trash2, Calendar, EyeOff } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useWhatsOnToday, useImportWhatsOnEvents, useToggleWhatsOn, type WhatsOnItem } from "@/hooks/useWhatsOnToday";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

function EventCard({ item, isAdmin }: { item: WhatsOnItem; isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const toggleWhatsOn = useToggleWhatsOn();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!item.activityId) return;
    if (!confirm(`Delete "${item.title}"?`)) return;
    setDeleting(true);
    try {
      const { error } = await supabase.rpc("admin_delete_activity", { p_activity_id: item.activityId });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["whats-on-today"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Event deleted");
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleRemoveFromWhatsOn = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!item.activityId) return;
    toggleWhatsOn.mutate(
      { activityId: item.activityId, show: false },
      {
        onSuccess: () => toast.success(`"${item.title}" removed from What's On`),
        onError: (err) => toast.error(err.message || "Failed to remove"),
      }
    );
  };

  const content = (
    <>
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-primary/50" />
          </div>
        )}
        {item.category && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white text-xs font-semibold text-foreground shadow-sm">
            {item.category}
          </div>
        )}
        <div className="absolute top-3 right-3 flex gap-1.5">
          {item.activityId && (
            <div className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
              In App
            </div>
          )}
          {isAdmin && item.activityId && (
            <button
              onClick={handleRemoveFromWhatsOn}
              disabled={toggleWhatsOn.isPending}
              className="p-1.5 rounded-full bg-warning/90 text-white hover:bg-warning transition-colors"
              title="Remove from What's On"
            >
              {toggleWhatsOn.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          )}
          {isAdmin && item.activityId && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 rounded-full bg-destructive/90 text-white hover:bg-destructive transition-colors"
              title="Delete event"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>
      <div className="p-4 space-y-1.5">
        <h3 className="font-semibold text-foreground line-clamp-2">{item.title}</h3>
        {item.date && (
          <p className="text-xs text-primary font-medium flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {item.date}
          </p>
        )}
        {item.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-3">{item.excerpt}</p>
        )}
      </div>
    </>
  );

  if (item.activityId) {
    return (
      <Link
        to={`/event/${item.activityId}`}
        className="group flex flex-col bg-card rounded-xl border border-border overflow-hidden hover:border-primary transition-colors"
      >
        {content}
      </Link>
    );
  }

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col bg-card rounded-xl border border-border overflow-hidden hover:border-primary transition-colors"
    >
      {content}
    </a>
  );
}

export default function WhatsOn() {
  const { data: items, isLoading, isError, refetch } = useWhatsOnToday(50);
  const importMutation = useImportWhatsOnEvents();
  const isAdmin = useIsAdmin();

  const unimportedItems = items?.filter((i) => !i.activityId) || [];

  const handleImportAll = () => {
    if (!unimportedItems.length) {
      toast.info("All events are already imported");
      return;
    }
    importMutation.mutate(unimportedItems, {
      onSuccess: (data) => {
        toast.success(`Imported ${data.imported} events (${data.skipped} already existed)`);
      },
      onError: (err) => {
        toast.error("Import failed: " + (err instanceof Error ? err.message : "Unknown error"));
      },
    });
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-warning" />
            <h1 className="text-2xl font-bold">What's On in Sydney</h1>
          </div>
          {items && items.length > 0 && (
            <Button
              onClick={handleImportAll}
              disabled={importMutation.isPending || !unimportedItems.length}
              size="sm"
              className="gap-1.5"
            >
              {importMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {unimportedItems.length
                ? `Import ${unimportedItems.length} Events`
                : "All Imported"}
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-[16/9] rounded-xl" />
                <div className="pt-3 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <p className="text-muted-foreground">Couldn't load events</p>
            <Button variant="outline" onClick={() => refetch()} className="gap-1.5">
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        ) : items && items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <EventCard key={item.id} item={item} isAdmin={isAdmin} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-12">No events found</p>
        )}
      </div>
    </AppLayout>
  );
}
