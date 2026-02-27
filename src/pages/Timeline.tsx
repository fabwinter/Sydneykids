import { useState } from "react";
import { Search, Map, Clock, Star, MapPin, Filter, CalendarDays, X, LayoutList, ChevronLeft as ChevLeft, ChevronRight as ChevRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCheckInTimeline } from "@/hooks/useCheckInTimeline";
import { useAuth } from "@/hooks/useAuth";
import { TimelineMap } from "@/components/timeline/TimelineMap";
import { MediaLightbox } from "@/components/ui/MediaLightbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "cafe", label: "Café" },
  { value: "restaurant", label: "Restaurant" },
  { value: "bar", label: "Bar" },
  { value: "beach", label: "Beach" },
  { value: "park", label: "Park" },
  { value: "museum", label: "Museum" },
  { value: "shopping", label: "Shopping" },
  { value: "walks", label: "Walks" },
  { value: "playground", label: "Playground" },
  { value: "swimming pool", label: "Swimming Pool" },
];

export default function Timeline() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [view, setView] = useState<"list" | "map">("list");

  const { data: groupedCheckIns, isLoading } = useCheckInTimeline(search, category);

  if (!authLoading && !user) {
    navigate("/login");
    return null;
  }

  // Filter by date range client-side
  const filteredGroups = groupedCheckIns?.filter((group) => {
    if (!dateRange?.from) return true;
    const groupDate = new Date(group.date);
    const from = new Date(dateRange.from);
    from.setHours(0, 0, 0, 0);
    if (dateRange.to) {
      const to = new Date(dateRange.to);
      to.setHours(23, 59, 59, 999);
      return groupDate >= from && groupDate <= to;
    }
    return groupDate.toDateString() === from.toDateString();
  });

  const totalCheckIns = filteredGroups?.reduce((sum, group) => sum + group.checkIns.length, 0) || 0;

  const hasDateFilter = !!dateRange?.from;

   return (
     <AppLayout>
       <div className="px-4 py-4 space-y-0 max-w-lg md:max-w-none mx-auto">
        {/* Desktop/tablet: side-by-side | Mobile: toggle */}
        <div className="md:flex md:gap-6">
          {/* List column - hidden on mobile when map view active */}
          <div className={`${view === "map" ? "hidden" : ""} md:block md:w-[45%] lg:w-[40%] md:overflow-y-auto md:max-h-[calc(100vh-140px)] md:pr-2`}>
            {/* Header - inside list column */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">Timeline</h1>
                <p className="text-sm text-muted-foreground">{totalCheckIns} places visited</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 md:hidden"
                onClick={() => setView(view === "list" ? "map" : "list")}
              >
                {view === "list" ? (
                  <><Map className="w-4 h-4" /> Map</>
                ) : (
                  <><LayoutList className="w-4 h-4" /> List</>
                )}
              </Button>
            </div>
            {/* Search & Filters */}
            <div className="space-y-3 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search timeline..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="flex-1">
                    <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={hasDateFilter ? "default" : "outline"}
                      size="sm"
                      className="gap-1.5 shrink-0"
                    >
                      <CalendarDays className="w-4 h-4" />
                      {hasDateFilter
                        ? dateRange?.to
                          ? `${format(dateRange.from!, "d MMM")} – ${format(dateRange.to, "d MMM")}`
                          : format(dateRange.from!, "d MMM yyyy")
                        : "Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={1}
                      initialFocus
                    />
                    {hasDateFilter && (
                      <div className="p-2 border-t border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => setDateRange(undefined)}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Clear dates
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-8 pb-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <div className="space-y-4 ml-4">
                      {Array.from({ length: 2 }).map((_, j) => (
                        <div key={j} className="flex gap-3 p-3 bg-card rounded-xl border border-border">
                          <Skeleton className="w-20 h-20 rounded-lg shrink-0" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : filteredGroups && filteredGroups.length > 0 ? (
                filteredGroups.map((group) => (
                  <div key={group.date}>
                    <h2 className="font-bold text-lg mb-4">{group.label}</h2>
                    <div className="relative ml-3">
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/25 rounded-full" />
                      <div className="space-y-4">
                        {group.checkIns.map((checkIn) => {
                          const time = new Date(checkIn.created_at).toLocaleTimeString("en-AU", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          });
                          const checkInPhotos = (checkIn as any).photo_urls?.length > 0
                            ? (checkIn as any).photo_urls as string[]
                            : checkIn.photo_url ? [checkIn.photo_url] : [];
                          const heroImg = checkInPhotos[0] || checkIn.activities?.hero_image_url;

                          return (
                            <TimelineCheckInCard
                              key={checkIn.id}
                              checkIn={checkIn}
                              time={time}
                              photos={checkInPhotos}
                              heroImg={heroImg}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">
                    {hasDateFilter ? "No check-ins in this date range" : "No check-ins yet"}
                  </p>
                  <p className="text-sm mt-1">
                    {hasDateFilter
                      ? "Try a different date range or clear the filter."
                      : "Start checking in to build your timeline!"}
                  </p>
                  {!hasDateFilter && (
                    <Button
                      variant="link"
                      className="mt-2 text-primary"
                      onClick={() => navigate("/")}
                    >
                      Explore activities
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Map column - hidden on mobile when list view active, always visible on tablet/desktop */}
          <div className={`${view === "list" ? "hidden" : ""} md:block md:flex-1 md:sticky md:top-0 rounded-xl overflow-hidden`} style={{ height: "calc(100vh - 140px)" }}>
            <TimelineMap groups={filteredGroups || []} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function TimelineCheckInCard({ checkIn, time, photos, heroImg }: {
  checkIn: any; time: string; photos: string[]; heroImg: string | undefined;
}) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const allImages = photos.length > 0 ? photos : heroImg ? [heroImg] : [];
  const displayImg = allImages[photoIndex] || heroImg;
  const hasMultiple = allImages.length > 1;

  return (
    <div className="relative pl-8">
      <div className="absolute left-0 top-6 -translate-x-[calc(50%-1px)] w-4 h-4 rounded-full bg-primary border-[3px] border-background shadow-sm z-10 flex items-center justify-center">
        <MapPin className="w-2 h-2 text-primary-foreground" />
      </div>
      <div
        className="block relative w-full overflow-hidden rounded-2xl bg-muted aspect-[4/3] group cursor-pointer"
        onClick={() => photos.length > 0 ? setLightbox(photoIndex) : undefined}
      >
        {displayImg ? (
          <img
            src={displayImg}
            alt={checkIn.activities?.name || ""}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

        {/* Carousel arrows */}
        {hasMultiple && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setPhotoIndex((photoIndex - 1 + allImages.length) % allImages.length); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 text-white hover:bg-black/60 z-10"
            >
              <ChevLeft className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setPhotoIndex((photoIndex + 1) % allImages.length); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 text-white hover:bg-black/60 z-10"
            >
              <ChevRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Dots */}
        {hasMultiple && allImages.length <= 8 && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {allImages.map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === photoIndex ? "bg-white" : "bg-white/40"}`} />
            ))}
          </div>
        )}
        {hasMultiple && allImages.length > 8 && (
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full z-10">
            {photoIndex + 1}/{allImages.length}
          </div>
        )}

        {/* Link overlay for navigation */}
        <a href={`/activity/${checkIn.activity_id}`} className="absolute bottom-0 left-0 right-0 z-10 p-3 space-y-0.5" onClick={(e) => e.stopPropagation()}>
          <h3 className="font-bold text-sm text-white leading-tight line-clamp-1">
            {checkIn.activities?.name || "Unknown venue"}
          </h3>
          <p className="text-xs text-white/70">
            {checkIn.activities?.category}
            {checkIn.activities?.address && ` · ${checkIn.activities.address.split(",")[0]}`}
          </p>
          <div className="flex items-center gap-3 pt-0.5">
            {checkIn.rating > 0 && (
              <span className="flex items-center gap-0.5 text-xs font-semibold text-warning">
                <Star className="w-3 h-3 fill-current" />
                {checkIn.rating}
              </span>
            )}
            <span className="text-xs text-white/60 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {time}
            </span>
          </div>
          {checkIn.comment && (
            <p className="text-xs text-white/60 italic line-clamp-1 mt-0.5">
              "{checkIn.comment}"
            </p>
          )}
        </a>
      </div>

      {lightbox !== null && (
        <MediaLightbox urls={photos} initialIndex={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
