import { MapPin, Star, ExternalLink, AlertTriangle } from "lucide-react";
import { useFoursquareSearch, type FoursquareVenue } from "@/hooks/useFoursquareSearch";
import { useImportFoursquareVenue } from "@/hooks/useImportFoursquareVenue";
import { useSearchFilters } from "@/hooks/useSearchFilters";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useState } from "react";
import { calculateDistance, formatDistance, useUserLocation } from "@/hooks/useUserLocation";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { toast } from "sonner";
import { VenueDetailsSheet, type VenueDetails } from "./VenueDetailsSheet";
import { useFilteredExternalVenues } from "@/hooks/useDeduplication";

function VenueCard({ venue, userLat, userLng, onSelect }: { venue: FoursquareVenue; userLat: number; userLng: number; onSelect: (v: FoursquareVenue) => void }) {
  const [imgError, setImgError] = useState(false);
  const photo = venue.photos?.[0];
  const dist = calculateDistance(userLat, userLng, venue.latitude, venue.longitude);

  return (
    <div className="group flex flex-col text-left w-full cursor-pointer" onClick={() => onSelect(venue)}>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
        {photo && !imgError ? (
          <img src={photo} alt={venue.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
            <MapPin className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
        <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-white text-xs font-semibold text-foreground shadow-sm">
          {venue.category}
        </div>
        <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded-full bg-primary/90 text-[10px] font-bold text-primary-foreground">
          FSQ
        </div>
      </div>
      <div className="pt-2.5 space-y-0.5">
        <h3 className="font-semibold text-sm text-foreground line-clamp-1">{venue.name}</h3>
        <p className="text-xs text-muted-foreground line-clamp-1">{venue.address}</p>
        <div className="flex items-center gap-1.5 pt-0.5">
          {venue.rating !== null && (
            <>
              <Star className="w-3.5 h-3.5 fill-foreground text-foreground" />
              <span className="text-xs font-medium text-foreground">{Number(venue.rating).toFixed(1)}</span>
            </>
          )}
          <span className="text-xs text-muted-foreground ml-auto flex items-center gap-0.5">
            <MapPin className="w-3 h-3" />
            {formatDistance(dist)}
          </span>
        </div>
      </div>
    </div>
  );
}

const SYDNEY_LAT = -33.8688;
const SYDNEY_LNG = 151.2093;

export function FoursquareSection() {
  const { filters } = useSearchFilters();
  const { location } = useUserLocation();
  const userLat = location?.latitude ?? SYDNEY_LAT;
  const userLng = location?.longitude ?? SYDNEY_LNG;
  const isAdmin = useIsAdmin();
  const [importingId, setImportingId] = useState<string | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<FoursquareVenue | null>(null);

  const fsQuery = (() => {
    const parts: string[] = [];
    if (filters.query) parts.push(filters.query);
    if (filters.cuisine) parts.push(filters.cuisine);
    if (filters.category && !filters.cuisine) parts.push(filters.category);
    if (filters.cuisine && filters.category) parts.push(filters.category);
    return parts.join(" ") || "";
  })();

  const { data: venues, isLoading, error } = useFoursquareSearch(fsQuery, fsQuery.length >= 2);
  const { unique: filteredVenues, duplicates } = useFilteredExternalVenues(venues, "foursquare");
  const importVenue = useImportFoursquareVenue();

  const handleImport = async () => {
    if (!selectedVenue) return;
    setImportingId(selectedVenue.id);
    try {
      await importVenue.mutateAsync(selectedVenue);
      toast.success(`"${selectedVenue.name}" added to database`);
      setSelectedVenue(null);
    } catch (e) {
      console.error("Failed to import venue:", e);
      toast.error("Failed to add venue");
    } finally {
      setImportingId(null);
    }
  };

  const sheetVenue: VenueDetails | null = selectedVenue ? {
    ...selectedVenue,
    source: "foursquare" as const,
  } : null;

  if (!isAdmin) return null;
  if (fsQuery.length < 2) return null;
  if (error || (filteredVenues && filteredVenues.length === 0 && duplicates.length === 0)) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between md:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-primary" />
          <h2 className="section-header mb-0">Discover Nearby</h2>
        </div>
        <span className="text-xs text-muted-foreground">Powered by Foursquare</span>
      </div>
      <div className="flex items-center justify-between -mt-2 md:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">
          Live results for "{fsQuery}"
        </p>
        {duplicates.length > 0 && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            {duplicates.length} already in DB
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex gap-3 md:gap-4 overflow-hidden md:pl-6 lg:pl-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[200px] sm:w-[220px] md:w-[240px]">
              <Skeleton className="aspect-[4/3] rounded-xl" />
              <div className="pt-2.5 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredVenues && filteredVenues.length > 0 ? (
        <div className="relative group">
          <Carousel opts={{ align: "start", loop: false }} className="w-full">
            <CarouselContent className="-ml-3 md:-ml-4 md:pl-6 lg:pl-8">
              {filteredVenues.map((venue) => (
                <CarouselItem key={venue.id} className="pl-3 md:pl-4 basis-[200px] sm:basis-[220px] md:basis-[240px] lg:basis-[260px]">
                  <VenueCard venue={venue} userLat={userLat} userLng={userLng} onSelect={setSelectedVenue} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex left-4 lg:left-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 backdrop-blur-sm border-border shadow-lg" />
            <CarouselNext className="hidden md:flex right-4 lg:right-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 backdrop-blur-sm border-border shadow-lg" />
          </Carousel>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm md:px-6 lg:px-8">All results already in database</p>
      )}

      <VenueDetailsSheet
        venue={sheetVenue}
        open={!!selectedVenue}
        onOpenChange={(open) => { if (!open) setSelectedVenue(null); }}
        userLat={userLat}
        userLng={userLng}
        onImport={handleImport}
        importing={importingId === selectedVenue?.id}
      />
    </section>
  );
}
