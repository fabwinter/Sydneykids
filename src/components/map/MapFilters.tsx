import { SearchOverlay } from "@/components/search/SearchOverlay";

interface MapFiltersProps {
  activityCount: number;
  isLoading: boolean;
}

export function MapFilters({ activityCount, isLoading }: MapFiltersProps) {
  return <SearchOverlay variant="map" />;
}
