import { useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ActivityCard } from "@/components/home/ActivityCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ArrowDownAZ, ArrowUpZA, Star, Grid3X3, MapPin, Navigation } from "lucide-react";
import { useAllActivities, transformActivity, type ActivityDisplay } from "@/hooks/useActivities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption = "distance" | "rating" | "name-asc" | "name-desc" | "category" | "region";

const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: "distance", label: "Distance", icon: <Navigation className="w-3.5 h-3.5" /> },
  { value: "name-asc", label: "A → Z", icon: <ArrowDownAZ className="w-3.5 h-3.5" /> },
  { value: "name-desc", label: "Z → A", icon: <ArrowUpZA className="w-3.5 h-3.5" /> },
  { value: "rating", label: "Rating", icon: <Star className="w-3.5 h-3.5" /> },
  { value: "category", label: "Category", icon: <Grid3X3 className="w-3.5 h-3.5" /> },
  { value: "region", label: "Region", icon: <MapPin className="w-3.5 h-3.5" /> },
];

const sectionConfig: Record<string, { title: string; categories: string[]; minRating?: number }> = {
  "whats-on": { title: "What's On Today", categories: [], minRating: undefined },
  "recommended": { title: "Recommended For You", categories: [] },
  "outdoor": { title: "Sydney Walks & Outdoors", categories: ["Park", "Beach"] },
  "best-of": { title: "Best of Sydney", categories: [], minRating: 4 },
  "cafes": { title: "Cafes & Bakeries", categories: ["Cafe", "Bakery"] },
  "nightlife": { title: "Nightlife & Dining", categories: ["Bar", "Restaurant"] },
};

export default function CategoryView() {
  const [searchParams] = useSearchParams();
  const section = searchParams.get("section") || "recommended";
  const config = sectionConfig[section] || { title: "Activities", categories: [] };
  const [sortBy, setSortBy] = useState<SortOption>("rating");

  const { data: allActivities, isLoading } = useAllActivities(500);

  const filtered = useMemo(() => {
    if (!allActivities) return [];

    let result = allActivities;

    if (section === "whats-on") {
      result = result.filter((a) => a.is_open);
    }

    if (config.categories.length > 0) {
      result = result.filter((a) => config.categories.includes(a.category));
    }

    if (config.minRating) {
      result = result.filter((a) => (a.rating ?? 0) >= config.minRating!);
    }

    const transformed = result.map((a) => transformActivity(a));

    // Apply sort
    transformed.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "rating":
          return (b.rating ?? 0) - (a.rating ?? 0);
        case "category":
          return (a.category || "").localeCompare(b.category || "");
        case "region":
          return (a.region || "").localeCompare(b.region || "");
        case "distance":
          return (parseFloat(String(a.distance ?? "999")) - parseFloat(String(b.distance ?? "999")));
        default:
          return 0;
      }
    });

    return transformed;
  }, [allActivities, section, config, sortBy]);

  return (
    <AppLayout>
      <div className="bg-background pt-20 md:pt-24 min-h-screen">
        <div className="max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-8 py-6">
          {/* Back + Title + Sort */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <Link
                to="/home"
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{config.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {isLoading ? "Loading..." : `${filtered.length} places`}
                </p>
              </div>
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
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

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-[4/3] rounded-xl" />
                  <div className="pt-2 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} variant="featured" />
              ))}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No activities found in this category.</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
