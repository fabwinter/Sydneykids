import { Sparkles, RefreshCw, EyeOff, Trash2, Loader2, Heart, Award } from "lucide-react";
import { useWhatsOnToday, useToggleWhatsOn, useToggleFeatured, type WhatsOnItem } from "@/hooks/useWhatsOnToday";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const categoryColors: Record<string, string> = {
  Cafe: "bg-amber-500",
  Beach: "bg-cyan-500",
  Park: "bg-emerald-500",
  Restaurant: "bg-rose-500",
  Bar: "bg-violet-500",
  Museum: "bg-slate-500",
  Shopping: "bg-fuchsia-500",
  Gym: "bg-orange-500",
  Bakery: "bg-yellow-500",
  Outdoor: "bg-emerald-500",
  Attraction: "bg-primary",
  Playground: "bg-sky-500",
  Walk: "bg-teal-500",
  Pool: "bg-blue-500",
};

function WhatsOnCard({ item, isAdmin }: { item: WhatsOnItem; isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const toggleWhatsOn = useToggleWhatsOn();
  const toggleFeatured = useToggleFeatured();

  const handleToggleFeatured = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!item.activityId) return;
    toggleFeatured.mutate(
      { activityId: item.activityId, show: true },
      {
        onSuccess: () => toast.success(`Added to Featured`),
        onError: (err) => toast.error(err.message || "Failed"),
      }
    );
  };
  const categoryColor = categoryColors[item.category || ""] || "bg-primary";

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!item.activityId) return;
    toggleWhatsOn.mutate(
      { activityId: item.activityId, show: false },
      {
        onSuccess: () => toast.success(`Removed from What's On`),
        onError: (err) => toast.error(err.message || "Failed"),
      }
    );
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!item.activityId) return;
    if (!confirm(`Delete "${item.title}"?`)) return;
    setDeleting(true);
    try {
      const { error } = await supabase.rpc("admin_delete_activity", {
        p_activity_id: item.activityId,
      });
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

  const cardInner = (
    <div className="relative w-full overflow-hidden rounded-2xl bg-muted aspect-[4/3] group-hover:shadow-xl transition-shadow duration-300">
      {/* Image */}
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-primary/50" />
        </div>
      )}

      {/* Bottom gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

      {/* Category badge — top left */}
      {item.category && !isAdmin && (
        <div
          className={`absolute top-3 left-3 z-10 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm ${categoryColor}`}
        >
          {item.category}
        </div>
      )}

      {/* Heart button */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors shadow-sm"
        aria-label="Save"
      >
        <Heart className="w-4 h-4 text-white" />
      </button>




      {/* Admin buttons */}
      {isAdmin && item.activityId && (
        <div className="absolute top-3 left-3 z-10 flex gap-1">
          <button
            onClick={handleRemove}
            disabled={toggleWhatsOn.isPending}
            className="p-1.5 rounded-full bg-warning/90 text-white hover:bg-warning transition-colors shadow-sm"
            title="Remove from What's On"
          >
            {toggleWhatsOn.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={handleToggleFeatured}
            disabled={toggleFeatured.isPending}
            className="p-1.5 rounded-full bg-primary/90 text-white hover:bg-primary transition-colors shadow-sm"
            title="Add to Featured"
          >
            {toggleFeatured.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Award className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-full bg-destructive/90 text-white hover:bg-destructive transition-colors shadow-sm"
            title="Delete event"
          >
            {deleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}

      {/* Info overlay — bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-3 space-y-0.5">
        <h3 className="font-bold text-sm text-white leading-tight line-clamp-2">
          {item.title}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          {item.date && (
            <span className="text-white/80 text-xs font-medium line-clamp-1">{item.date}</span>
          )}
          {item.excerpt && !item.date && (
            <span className="text-white/70 text-xs line-clamp-1">{item.excerpt}</span>
          )}
        </div>
      </div>
    </div>
  );

  if (item.activityId) {
    return (
      <Link to={`/event/${item.activityId}`} className="group flex flex-col">
        {cardInner}
      </Link>
    );
  }

  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="group flex flex-col">
      {cardInner}
    </a>
  );
}

function CarouselSkeleton() {
  return (
    <div className="flex gap-3 md:gap-4 overflow-hidden md:pl-6 lg:pl-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[82vw] sm:w-[360px]">
          <Skeleton className="aspect-[4/3] rounded-2xl" />
        </div>
      ))}
    </div>
  );
}

export function FeaturedSection() {
  const { data: items, isLoading, isError, refetch } = useWhatsOnToday(10);
  const isAdmin = useIsAdmin();

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between md:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-warning" />
          <h2 className="section-header mb-0">What's On</h2>
        </div>
        <Link
          to="/whats-on"
          className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
        >
          See all
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {isLoading ? (
        <CarouselSkeleton />
      ) : isError ? (
        <div className="flex items-center gap-3 py-4">
          <p className="text-sm text-muted-foreground">Couldn't load What's On</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </Button>
        </div>
      ) : items && items.length > 0 ? (
        <div className="relative group">
          <Carousel opts={{ align: "start", loop: false }} className="w-full">
            <CarouselContent className="-ml-3 md:-ml-4 md:pl-6 lg:pl-8">
              {items.map((item) => (
                <CarouselItem
                  key={item.id}
                  className="pl-3 md:pl-4 basis-[82vw] sm:basis-[360px] md:basis-[380px] lg:basis-[400px]"
                >
                  <WhatsOnCard item={item} isAdmin={isAdmin} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex left-4 lg:left-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 backdrop-blur-sm border-border shadow-lg" />
            <CarouselNext className="hidden md:flex right-4 lg:right-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 backdrop-blur-sm border-border shadow-lg" />
          </Carousel>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm md:px-6 lg:px-8">No events found</p>
      )}
    </section>
  );
}
