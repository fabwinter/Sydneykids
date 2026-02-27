import { Link } from "react-router-dom";
import { useToggleFeatured } from "@/hooks/useWhatsOnToday";
import { useFeaturedHeroActivities } from "@/hooks/useFeaturedHero";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Loader2, EyeOff } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface FeaturedItem {
  id: string;
  name: string;
  imageUrl: string;
  category?: string;
  address?: string;
  linkTo: string;
  isEvent?: boolean;
  activityId?: string;
}

function HeroCard({ item, isAdmin }: { item: FeaturedItem; isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const toggleFeatured = useToggleFeatured();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!item.activityId) return;
    if (!confirm(`Delete "${item.name}"?`)) return;
    setDeleting(true);
    try {
      const { error } = await supabase.rpc("admin_delete_activity", {
        p_activity_id: item.activityId,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["whats-on-today"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["recommended-activities"] });
      queryClient.invalidateQueries({ queryKey: ["featured-hero"] });
      toast.success("Deleted");
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleRemoveFeatured = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!item.activityId) return;
    toggleFeatured.mutate(
      { activityId: item.activityId, show: false },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["featured-hero"] });
          toast.success("Removed from Featured");
        },
        onError: (err) => toast.error(err.message || "Failed"),
      }
    );
  };

  return (
    <Link
      to={item.linkTo}
      className="relative block w-full aspect-[4/5] sm:aspect-[16/9] overflow-hidden group max-h-[45dvh]"
    >
      <img
        src={item.imageUrl}
        alt={item.name}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Admin buttons */}
      {isAdmin && item.activityId && (
        <div className="absolute bottom-16 right-3 z-20 flex gap-1.5">
          <button
            onClick={handleRemoveFeatured}
            disabled={toggleFeatured.isPending}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-warning/80 backdrop-blur-sm hover:bg-warning transition-colors shadow-sm"
            aria-label="Remove from Featured"
            title="Remove from Featured"
          >
            {toggleFeatured.isPending ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <EyeOff className="w-4 h-4 text-white" />
            )}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-destructive/80 backdrop-blur-sm hover:bg-destructive transition-colors shadow-sm"
            aria-label="Delete"
            title="Delete"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      )}

      {/* Title & details */}
      <div className="absolute bottom-4 left-4 right-4 z-10 space-y-1">
        <span className="inline-block px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold mb-1">
          Featured
        </span>
        <h2 className="text-white text-2xl sm:text-3xl font-bold leading-tight line-clamp-2">
          {item.name}
        </h2>
        <div className="flex items-center gap-3 text-white/80 text-sm">
          {item.category && <span>{item.category}</span>}
          {item.address && <span>📍 {item.address}</span>}
        </div>
      </div>
    </Link>
  );
}

export function HeroFeatured() {
  const { data: featured, isLoading } = useFeaturedHeroActivities(10);
  const isAdmin = useIsAdmin();

  const items: FeaturedItem[] = [];

  // Only show items with show_in_featured = true
  if (featured?.length) {
    featured.forEach((a) => {
      if (a.image) {
        items.push({
          id: a.id,
          name: a.name,
          imageUrl: a.image,
          category: a.category,
          address: a.address?.split(",").slice(-2).join(",").trim(),
          linkTo: a.isEvent ? `/event/${a.id}` : `/activity/${a.id}`,
          activityId: a.id,
        });
      }
    });
  }

  if (isLoading || items.length === 0) {
    return (
      <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] bg-muted rounded-none max-h-[45dvh]">
        <Skeleton className="absolute inset-0 rounded-none" />
      </div>
    );
  }

  return (
    <Carousel opts={{ align: "start", loop: true }} plugins={[Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })]} className="w-full">
      <CarouselContent className="ml-0">
        {items.map((item) => (
          <CarouselItem key={item.id} className="pl-0 basis-full">
            <HeroCard item={item} isAdmin={isAdmin} />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
