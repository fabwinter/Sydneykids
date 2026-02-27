import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MAPBOX_TOKEN } from "@/config/mapbox";
import { MapPin, RefreshCw } from "lucide-react";

interface LocationMapProps {
  latitude: number;
  longitude: number;
  name: string;
  showRefresh?: boolean;
  onRefresh?: () => void;
}

export function LocationMap({ latitude, longitude, name, showRefresh, onRefresh }: LocationMapProps) {
  const navigate = useNavigate();
  const [cacheBuster, setCacheBuster] = useState(0);

  // Build Mapbox Static Images API URL
  const zoom = 14;
  const width = 600;
  const height = 300;
  const markerColor = "2190A0"; // primary teal
  const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+${markerColor}(${longitude},${latitude})/${longitude},${latitude},${zoom},0/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}&_=${cacheBuster}`;

  const handleClick = () => {
    navigate(`/map?lat=${latitude}&lng=${longitude}&zoom=16`);
  };

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCacheBuster(Date.now());
    onRefresh?.();
  };

  return (
    <button
      onClick={handleClick}
      className="w-full rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-colors group cursor-pointer relative"
      aria-label={`View ${name} on map`}
    >
      <div className="relative">
        <img
          src={staticMapUrl}
          alt={`Map showing ${name}`}
          className="w-full h-40 sm:h-48 object-cover group-hover:brightness-95 transition-all"
          loading="lazy"
        />
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-card/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground">View on map</span>
        </div>
        {showRefresh && (
          <button
            onClick={handleRefresh}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-card/90 backdrop-blur-sm shadow-sm hover:bg-card transition-colors"
            title="Refresh map"
          >
            <RefreshCw className="w-3.5 h-3.5 text-foreground" />
          </button>
        )}
      </div>
    </button>
  );
}
