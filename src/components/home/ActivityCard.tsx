import { useState } from "react";
import { MapPin, Star, Heart, Coffee, Waves, TreePine, Utensils, Wine, Landmark, ShoppingBag, Dumbbell, Cake, Sparkles, Loader2, Trash2, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsActivitySaved, useToggleSavedItem } from "@/hooks/useSavedItems";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useToggleWhatsOn, useToggleFeatured } from "@/hooks/useWhatsOnToday";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { ActivityDisplay } from "@/hooks/useActivities";

// Re-export for backward compatibility
export type Activity = ActivityDisplay;

// Category badge colors (bg class)
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

// Category icon mapping (for fallback)
const categoryIcons: Record<string, React.ElementType> = {
  Cafe: Coffee,
  Beach: Waves,
  Park: TreePine,
  Restaurant: Utensils,
  Bar: Wine,
  Museum: Landmark,
  Shopping: ShoppingBag,
  Gym: Dumbbell,
  Bakery: Cake,
};

// Category gradient colors (for fallback)
const categoryGradients: Record<string, string> = {
  Cafe: "from-amber-400 to-orange-500",
  Beach: "from-cyan-400 to-blue-500",
  Park: "from-green-400 to-emerald-500",
  Restaurant: "from-red-400 to-rose-500",
  Bar: "from-purple-400 to-violet-500",
  Museum: "from-slate-400 to-slate-600",
  Shopping: "from-pink-400 to-fuchsia-500",
  Gym: "from-orange-400 to-red-500",
  Bakery: "from-yellow-400 to-amber-500",
};

interface ActivityCardProps {
  activity: ActivityDisplay;
  variant?: "default" | "featured";
}

function ImageWithFallback({
  src,
  alt,
  category,
  className,
}: {
  src: string;
  alt: string;
  category: string;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const Icon = categoryIcons[category] || MapPin;
  const gradient = categoryGradients[category] || "from-slate-400 to-slate-600";

  if (hasError || !src) {
    return (
      <div className={`bg-gradient-to-br ${gradient} flex items-center justify-center ${className}`}>
        <Icon className="w-12 h-12 text-white/80" />
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className={`absolute inset-0 bg-muted animate-pulse ${className}`} />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        onError={() => setHasError(true)}
        onLoad={() => setIsLoading(false)}
      />
    </>
  );
}

function WhatsOnButton({
  activityId,
  name,
  showInWhatsOn,
}: {
  activityId: string;
  name: string;
  showInWhatsOn?: boolean;
}) {
  const toggleWhatsOn = useToggleWhatsOn();
  const newState = !showInWhatsOn;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWhatsOn.mutate(
      { activityId, show: newState },
      {
        onSuccess: () =>
          toast.success(
            newState
              ? `"${name}" added to What's On`
              : `"${name}" removed from What's On`
          ),
        onError: (err) => toast.error(err.message || "Failed"),
      }
    );
  };

  return (
    <button
      onClick={handleClick}
      disabled={toggleWhatsOn.isPending}
      className={`w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-sm transition-colors shadow-sm ${
        showInWhatsOn
          ? "bg-warning/90 text-white"
          : "bg-white/20 text-white hover:bg-white/40"
      }`}
      aria-label={showInWhatsOn ? "Remove from What's On" : "Add to What's On"}
      title={showInWhatsOn ? "Remove from What's On" : "Add to What's On"}
    >
      {toggleWhatsOn.isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4" />
      )}
    </button>
  );
}

function FeaturedButton({
  activityId,
  name,
  showInFeatured,
}: {
  activityId: string;
  name: string;
  showInFeatured?: boolean;
}) {
  const toggleFeatured = useToggleFeatured();
  const newState = !showInFeatured;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFeatured.mutate(
      { activityId, show: newState },
      {
        onSuccess: () =>
          toast.success(
            newState
              ? `"${name}" added to Featured`
              : `"${name}" removed from Featured`
          ),
        onError: (err) => toast.error(err.message || "Failed"),
      }
    );
  };

  return (
    <button
      onClick={handleClick}
      disabled={toggleFeatured.isPending}
      className={`w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-sm transition-colors shadow-sm ${
        showInFeatured
          ? "bg-primary/90 text-white"
          : "bg-white/20 text-white hover:bg-white/40"
      }`}
      aria-label={showInFeatured ? "Remove from Featured" : "Add to Featured"}
      title={showInFeatured ? "Remove from Featured" : "Add to Featured"}
    >
      {toggleFeatured.isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Award className="w-4 h-4" />
      )}
    </button>
  );
}

function HeartButton({ activityId }: { activityId: string }) {
  const { isAuthenticated } = useAuth();
  const { data: isSaved } = useIsActivitySaved(activityId);
  const toggleSaved = useToggleSavedItem();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    toggleSaved.mutate({ activityId, isSaved: !!isSaved });
  };

  return (
    <button
      onClick={handleClick}
      className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors shadow-sm"
      aria-label={isSaved ? "Remove from saved" : "Save"}
    >
      <Heart
        className={`w-4 h-4 transition-colors ${
          isSaved ? "fill-white text-white" : "text-white"
        }`}
      />
    </button>
  );
}

function AdminDeleteButton({ activityId, name }: { activityId: string; name: string }) {
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(true);
    try {
      const { error } = await supabase.rpc("admin_delete_activity", { p_activity_id: activityId });
      if (error) throw error;
      toast.success(`"${name}" deleted`);
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["whats-on"] });
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="absolute bottom-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-destructive/80 backdrop-blur-sm hover:bg-destructive transition-colors shadow-sm"
      aria-label="Delete activity"
      title="Delete activity"
    >
      {deleting ? (
        <Loader2 className="w-4 h-4 text-white animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4 text-white" />
      )}
    </button>
  );
}

export function ActivityCard({ activity, variant = "default" }: ActivityCardProps) {
  const isAdmin = useIsAdmin();
  const categoryColor = categoryColors[activity.category] || "bg-primary";

  const cardContent = (
    <div className="relative w-full overflow-hidden rounded-2xl bg-muted aspect-[4/3] group-hover:shadow-xl transition-shadow duration-300">
      {/* Full-bleed image */}
      <ImageWithFallback
        src={activity.image}
        alt={activity.name}
        category={activity.category}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />

      {/* Bottom gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

      {/* Category badge — top left (hidden if admin sparkle shown) */}
      {!isAdmin && (
        <div
          className={`absolute top-3 left-3 z-10 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm ${categoryColor}`}
        >
          {activity.category}
        </div>
      )}

      {/* Admin: What's On + Featured toggles */}
      {isAdmin && (
        <div className="absolute top-3 left-3 z-10 flex gap-1">
          <WhatsOnButton
            activityId={activity.id}
            name={activity.name}
            showInWhatsOn={activity.showInWhatsOn}
          />
          <FeaturedButton
            activityId={activity.id}
            name={activity.name}
            showInFeatured={activity.showInFeatured}
          />
        </div>
      )}

      {/* Heart button — top right */}
      <HeartButton activityId={activity.id} />

      {/* Admin: Delete button — bottom right */}
      {isAdmin && (
        <AdminDeleteButton activityId={activity.id} name={activity.name} />
      )}

      {/* Info overlay — bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-3 space-y-0.5">
        <h3 className="font-bold text-sm text-white leading-tight line-clamp-2">
          {activity.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-0.5 text-white/80 text-xs">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="line-clamp-1">{activity.distance}</span>
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-warning text-warning flex-shrink-0" />
            <span className="text-white font-bold text-xs">{activity.rating}</span>
            <span className="text-white/60 text-xs">({activity.reviewCount})</span>
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <Link
      to={activity.isEvent ? `/event/${activity.id}` : `/activity/${activity.id}`}
      className="group flex flex-col"
    >
      {cardContent}
    </Link>
  );
}
