import { memo } from "react";
import { Marker } from "react-map-gl/mapbox";
import { CheckSquare } from "lucide-react";
import { getCategoryMeta } from "@/lib/categoryUtils";
import type { Activity } from "@/hooks/useActivities";

interface MapMarkerProps {
  activity: Activity;
  isSelected: boolean;
  isBulkSelected: boolean;
  bulkMode: boolean;
  isAdmin: boolean;
  simplified: boolean;
  onClick: (activity: Activity) => void;
}

function MapMarkerInner({
  activity,
  isSelected,
  isBulkSelected,
  bulkMode,
  isAdmin,
  simplified,
  onClick,
}: MapMarkerProps) {
  const meta = getCategoryMeta(activity.category);
  const IconComponent = meta.icon;
  const isFoursquare = activity.id.startsWith("fs-");
  const isGoogle = activity.id.startsWith("g-");

  // Simplified dot marker at low zoom
  if (simplified) {
    const dotColor = isFoursquare ? "bg-orange-500" : isGoogle ? "bg-blue-500" : meta.bg;
    return (
      <Marker
        latitude={activity.latitude}
        longitude={activity.longitude}
        anchor="center"
        onClick={(e) => {
          e.originalEvent.stopPropagation();
          onClick(activity);
        }}
      >
        <div
          className={`rounded-full ${dotColor} ${isSelected ? "w-4 h-4 ring-2 ring-white" : "w-2.5 h-2.5"} shadow-sm cursor-pointer transition-all`}
        />
      </Marker>
    );
  }

  const sourceBadgeColor = isGoogle ? "bg-blue-500" : isFoursquare ? "bg-orange-500" : "bg-green-600";
  const sourceBadgeLabel = isGoogle ? "G" : isFoursquare ? "F" : "DB";

  return (
    <Marker
      latitude={activity.latitude}
      longitude={activity.longitude}
      anchor="bottom"
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onClick(activity);
      }}
    >
      <div className="flex flex-col items-center" style={{ transform: "translateY(0)" }}>
        <span
          className={`${meta.text} text-[11px] font-bold leading-tight max-w-[100px] truncate px-1 py-0.5 rounded bg-white/80 backdrop-blur-sm mb-0.5 text-center`}
        >
          {activity.name}
        </span>
        <div className="relative">
          <div
            className={`rounded-full ${meta.bg} flex items-center justify-center shadow-lg cursor-pointer transform transition-transform hover:scale-110 ${
              isBulkSelected
                ? "w-12 h-12 ring-3 ring-destructive scale-110"
                : isSelected
                ? "w-12 h-12 ring-2 ring-white scale-110"
                : "w-10 h-10"
            }`}
          >
            {bulkMode && isBulkSelected ? (
              <CheckSquare className={`text-white ${isSelected ? "w-6 h-6" : "w-5 h-5"}`} />
            ) : (
              <IconComponent className={`text-white ${isSelected ? "w-6 h-6" : "w-5 h-5"}`} />
            )}
          </div>
          {isAdmin && !bulkMode && (
            <div
              className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold ${sourceBadgeColor}`}
            >
              {sourceBadgeLabel}
            </div>
          )}
        </div>
      </div>
    </Marker>
  );
}

export const MapMarker = memo(MapMarkerInner, (prev, next) => {
  return (
    prev.activity.id === next.activity.id &&
    prev.isSelected === next.isSelected &&
    prev.isBulkSelected === next.isBulkSelected &&
    prev.bulkMode === next.bulkMode &&
    prev.simplified === next.simplified &&
    prev.isAdmin === next.isAdmin
  );
});
