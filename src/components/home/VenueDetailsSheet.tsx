import { MapPin, Star, Phone, Globe, Plus, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { calculateDistance, formatDistance } from "@/hooks/useUserLocation";

export interface VenueDetails {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  address: string;
  description?: string | null;
  photos?: string[];
  rating: number | null;
  phone?: string | null;
  website?: string | null;
  source: "foursquare" | "google";
}

interface Props {
  venue: VenueDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userLat: number;
  userLng: number;
  onImport: () => void;
  importing: boolean;
}

export function VenueDetailsSheet({ venue, open, onOpenChange, userLat, userLng, onImport, importing }: Props) {
  const [imgError, setImgError] = useState(false);

  if (!venue) return null;

  const photo = venue.photos?.[0];
  const dist = calculateDistance(userLat, userLng, venue.latitude, venue.longitude);
  const sourceBadge = venue.source === "foursquare" ? "FSQ" : "G";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto p-0">
        {/* Hero image */}
        <div className="relative w-full aspect-[16/9] bg-muted">
          {photo && !imgError ? (
            <img src={photo} alt={venue.name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
              <MapPin className="w-16 h-16 text-muted-foreground/50" />
            </div>
          )}
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-primary/90 text-[10px] font-bold text-primary-foreground">
            {sourceBadge}
          </div>
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-sm text-xs font-semibold text-foreground">
            {venue.category}
          </div>
        </div>

        <div className="p-5 space-y-4">
          <SheetHeader className="text-left p-0">
            <SheetTitle className="text-lg font-bold text-foreground">{venue.name}</SheetTitle>
          </SheetHeader>

          {/* Rating & distance */}
          <div className="flex items-center gap-3">
            {venue.rating !== null && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-foreground text-foreground" />
                <span className="text-sm font-medium text-foreground">{Number(venue.rating).toFixed(1)}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-sm">{formatDistance(dist)}</span>
            </div>
          </div>

          {/* Address */}
          {venue.address && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{venue.address}</span>
            </div>
          )}

          {/* Description */}
          {venue.description && (
            <p className="text-sm text-muted-foreground">{venue.description}</p>
          )}

          {/* Contact info */}
          <div className="flex flex-wrap gap-3">
            {venue.phone && (
              <a href={`tel:${venue.phone}`} className="flex items-center gap-1.5 text-sm text-primary">
                <Phone className="w-4 h-4" />
                {venue.phone}
              </a>
            )}
            {venue.website && (
              <a href={venue.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-primary">
                <Globe className="w-4 h-4" />
                Website
              </a>
            )}
          </div>

          {/* Add to DB button */}
          <Button
            className="w-full gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onImport();
            }}
            disabled={importing}
          >
            <Plus className="w-4 h-4" />
            {importing ? "Adding..." : "Add to Database"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
