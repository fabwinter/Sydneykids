import { Star, MapPin, CheckSquare, Square } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type Activity } from "@/hooks/useActivities";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { getCategoryMeta } from "@/lib/categoryUtils";

interface VenueListProps {
  activities: Activity[];
  isLoading: boolean;
  selectedActivity: Activity | null;
  onSelectActivity: (activity: Activity) => void;
  onNavigateToDetails: (activity: Activity) => void;
  bulkMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const listItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
};

export function VenueList({
  activities,
  isLoading,
  selectedActivity,
  onSelectActivity,
  onNavigateToDetails,
  bulkMode = false,
  selectedIds = new Set(),
  onToggleSelect,
}: VenueListProps) {
  if (isLoading) {
    return (
      <div className="p-4 grid grid-cols-2 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[4/3] bg-muted rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No places found</p>
        <p className="text-sm mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-4">
          {activities.length} places found
        </p>
        <AnimatePresence mode="popLayout">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={listContainerVariants}
            className="grid grid-cols-2 gap-3"
          >
            {activities.map((activity) => {
              const isSelected = selectedActivity?.id === activity.id;
              const isBulkSelected = selectedIds.has(activity.id);
              const meta = getCategoryMeta(activity.category);

              return (
                <motion.div
                  key={activity.id}
                  variants={listItemVariants}
                  layout
                  className={cn(
                    "relative overflow-hidden rounded-2xl cursor-pointer group aspect-[4/3] border-2",
                    bulkMode && isBulkSelected
                      ? "border-destructive shadow-md"
                      : isSelected
                      ? "border-primary shadow-md"
                      : "border-transparent"
                  )}
                  onClick={() => {
                    if (bulkMode && onToggleSelect) {
                      onToggleSelect(activity.id);
                    } else {
                      onNavigateToDetails(activity);
                    }
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Image */}
                  {activity.hero_image_url ? (
                    <img
                      src={activity.hero_image_url}
                      alt={activity.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-muted flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                  {/* Category badge */}
                  <div className={cn("absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white shadow-sm", meta.bg)}>
                    {activity.category}
                  </div>

                  {/* Bulk select */}
                  {bulkMode && (
                    <div className="absolute top-2 right-2 z-10">
                      {isBulkSelected ? (
                        <CheckSquare className="w-5 h-5 text-destructive drop-shadow" />
                      ) : (
                        <Square className="w-5 h-5 text-white drop-shadow" />
                      )}
                    </div>
                  )}

                  {/* Info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 z-10 p-2.5 space-y-0.5">
                    <h3 className="font-bold text-sm text-white leading-tight line-clamp-1">
                      {activity.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      {activity.rating != null && Number(activity.rating) > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-warning text-warning flex-shrink-0" />
                          <span className="text-white font-bold text-xs">{Number(activity.rating).toFixed(1)}</span>
                        </span>
                      )}
                      <span className="text-white/60 text-xs">
                        {activity.review_count} reviews
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
}
