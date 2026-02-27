import { useMemo, useRef, useEffect } from "react";
import MapGL, { Marker, Popup, GeolocateControl, NavigationControl, MapRef } from "react-map-gl/mapbox";
import { MapPin, Coffee, Waves, TreePine, Utensils, Wine, ShoppingBag, Dumbbell, Landmark, Cake, Star } from "lucide-react";
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MAPBOX_TOKEN } from "@/config/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl";
import type { GroupedCheckIns } from "@/hooks/useCheckInTimeline";

const categoryIcons: Record<string, any> = {
  cafe: Coffee, restaurant: Utensils, bar: Wine, beach: Waves,
  park: TreePine, shopping: ShoppingBag, gym: Dumbbell, museum: Landmark, bakery: Cake,
};

const categoryColors: Record<string, string> = {
  cafe: "bg-accent", restaurant: "bg-red-500", bar: "bg-purple-500",
  beach: "bg-secondary", park: "bg-green-500", shopping: "bg-pink-500",
  gym: "bg-orange-500", museum: "bg-indigo-500", bakery: "bg-amber-500",
};

const categoryTextColors: Record<string, string> = {
  cafe: "text-accent", restaurant: "text-red-500", bar: "text-purple-500",
  beach: "text-secondary", park: "text-green-500", shopping: "text-pink-500",
  gym: "text-orange-500", museum: "text-indigo-500", bakery: "text-amber-500",
};

interface TimelineMapProps {
  groups: GroupedCheckIns[];
}

type UniqueLocation = {
  activityId: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  rating: number | null;
  visitCount: number;
};

export function TimelineMap({ groups }: TimelineMapProps) {
  const navigate = useNavigate();
  const mapRef = useRef<MapRef>(null);
  const [selected, setSelected] = useState<UniqueLocation | null>(null);

  const locations = useMemo(() => {
    const map = new Map<string, UniqueLocation>();
    for (const group of groups) {
      for (const ci of group.checkIns) {
        const a = ci.activities;
        if (!a || !isFinite(a.latitude) || !isFinite(a.longitude)) continue;
        const existing = map.get(a.id);
        if (existing) {
          existing.visitCount++;
        } else {
          map.set(a.id, {
            activityId: a.id,
            name: a.name,
            category: a.category,
            latitude: a.latitude,
            longitude: a.longitude,
            rating: a.rating,
            visitCount: 1,
          });
        }
      }
    }
    return Array.from(map.values());
  }, [groups]);

  const center = useMemo(() => {
    if (locations.length === 0) return { lat: -33.8688, lng: 151.2093 };
    const lat = locations.reduce((s, l) => s + l.latitude, 0) / locations.length;
    const lng = locations.reduce((s, l) => s + l.longitude, 0) / locations.length;
    return { lat, lng };
  }, [locations]);

  // Auto-zoom to fit all locations
  useEffect(() => {
    if (!mapRef.current || locations.length === 0) return;
    const bounds = new mapboxgl.LngLatBounds();
    locations.forEach((loc) => bounds.extend([loc.longitude, loc.latitude]));
    mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 1000 });
  }, [locations]);

  const handleMarkerClick = useCallback((loc: UniqueLocation) => {
    setSelected(loc);
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted rounded-xl">
        <p className="text-muted-foreground text-sm">Map token required</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <MapGL
        ref={mapRef}
        initialViewState={{ latitude: center.lat, longitude: center.lng, zoom: 12 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        onClick={() => setSelected(null)}
      >
        <NavigationControl position="bottom-right" />
        <GeolocateControl position="bottom-right" />

        {locations.map((loc) => {
          const catKey = loc.category.toLowerCase();
          const IconComponent = categoryIcons[catKey] || MapPin;
          const colorClass = categoryColors[catKey] || "bg-primary";
          const textColor = categoryTextColors[catKey] || "text-primary";
          const isSelected = selected?.activityId === loc.activityId;

          return (
            <Marker
              key={loc.activityId}
              latitude={loc.latitude}
              longitude={loc.longitude}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(loc);
              }}
            >
              <div className="flex flex-col items-center" style={{ transform: 'translateY(0)' }}>
                <span
                  className={`${textColor} text-[11px] font-bold leading-tight max-w-[100px] truncate px-1 py-0.5 rounded bg-white/80 backdrop-blur-sm mb-0.5 text-center`}
                >
                  {loc.name}
                </span>
                <div className={`rounded-full ${colorClass} flex items-center justify-center shadow-lg cursor-pointer transform transition-transform hover:scale-110 ${isSelected ? "w-12 h-12 ring-2 ring-white scale-110" : "w-10 h-10"}`}>
                  <IconComponent className={`text-white ${isSelected ? "w-6 h-6" : "w-5 h-5"}`} />
                </div>
              </div>
            </Marker>
          );
        })}

        {selected && (
          <Popup
            latitude={selected.latitude}
            longitude={selected.longitude}
            anchor="bottom"
            onClose={() => setSelected(null)}
            closeButton
            closeOnClick={false}
            offset={45}
          >
            <div className="p-2 min-w-[180px]">
              <h3 className="font-bold text-foreground text-sm">{selected.name}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <span className="capitalize">{selected.category}</span>
                {selected.rating && (
                  <span className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-warning text-warning" />
                    {Number(selected.rating).toFixed(1)}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{selected.visitCount} visit{selected.visitCount > 1 ? "s" : ""}</p>
              <Button size="sm" className="w-full mt-2" onClick={() => navigate(`/activity/${selected.activityId}`)}>
                View Venue
              </Button>
            </div>
          </Popup>
        )}
      </MapGL>

      {locations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <p className="text-muted-foreground text-sm">No check-in locations to show</p>
        </div>
      )}
    </div>
  );
}
