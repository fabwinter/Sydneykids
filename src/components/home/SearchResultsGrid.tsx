import { useMemo } from "react";
import { ArrowDownAZ, ArrowUpZA, Star, Grid3X3, MapPin, Navigation, MapIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ActivityCard } from "./ActivityCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchFilters, type SortOption } from "@/hooks/useSearchFilters";
import type { ActivityDisplay } from "@/hooks/useActivities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: "distance", label: "Distance", icon: <Navigation className="w-3.5 h-3.5" /> },
  { value: "name-asc", label: "A → Z", icon: <ArrowDownAZ className="w-3.5 h-3.5" /> },
  { value: "name-desc", label: "Z → A", icon: <ArrowUpZA className="w-3.5 h-3.5" /> },
  { value: "rating", label: "Rating", icon: <Star className="w-3.5 h-3.5" /> },
  { value: "category", label: "Category", icon: <Grid3X3 className="w-3.5 h-3.5" /> },
  { value: "region", label: "Region", icon: <MapPin className="w-3.5 h-3.5" /> },
];

interface SearchResultsGridProps {
  activities: ActivityDisplay[] | undefined;
  isLoading: boolean;
}

interface GroupedActivities {
  title: string;
  items: ActivityDisplay[];
}

function groupActivities(activities: ActivityDisplay[], sortBy: SortOption): GroupedActivities[] {
  if (sortBy === "category") {
    const groups: Record<string, ActivityDisplay[]> = {};
    for (const a of activities) {
      const key = a.category || "Other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([title, items]) => ({ title, items }));
  }

  if (sortBy === "region") {
    const groups: Record<string, ActivityDisplay[]> = {};
    for (const a of activities) {
      const key = a.region || "Sydney";
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([title, items]) => ({ title, items }));
  }

  // No grouping for other sort options
  return [{ title: "", items: activities }];
}

export function SearchResultsGrid({ activities, isLoading }: SearchResultsGridProps) {
  const { filters, setSortBy } = useSearchFilters();
  const navigate = useNavigate();

  const grouped = useMemo(() => {
    if (!activities) return [];
    return groupActivities(activities, filters.sortBy);
  }, [activities, filters.sortBy]);

  const totalCount = activities?.length ?? 0;

  return (
    <section className="space-y-4">
      {/* Header with count and sort */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="section-header mb-0">Results</h2>
          {!isLoading && (
            <p className="text-sm text-muted-foreground">
              {totalCount} {totalCount === 1 ? "listing" : "listings"} found
            </p>
          )}
        </div>
        <Select value={filters.sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[150px] h-9 text-sm">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="flex items-center gap-2">
                  {opt.icon}
                  {opt.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
          ))}
        </div>
      ) : totalCount === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">No listings match your search or filters.</p>
          <p className="text-muted-foreground text-xs mt-1">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group, gi) => (
            <div key={gi}>
              {group.title && (
                <h3 className="text-base font-semibold text-foreground mb-3">{group.title}</h3>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {group.items.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            </div>
          ))}

          {/* View on Map button */}
          <div className="flex justify-center pt-2 pb-4">
            <button
              onClick={() => navigate("/map")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-md hover:opacity-90 transition-opacity"
            >
              <MapIcon className="w-4 h-4" />
              View on Map
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
