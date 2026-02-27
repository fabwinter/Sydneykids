import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import Map, { Popup, GeolocateControl, NavigationControl, MapRef } from "react-map-gl/mapbox";
import { LngLatBounds } from "mapbox-gl";
import { AppLayout } from "@/components/layout/AppLayout";
import { MapPin, Star, LayoutList, MapIcon, Search, Plus, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN } from "@/config/mapbox";
import { useAllActivities, type Activity } from "@/hooks/useActivities";
import { useSearchFilters } from "@/hooks/useSearchFilters";
import { useUserLocation, calculateDistance } from "@/hooks/useUserLocation";
import { useFoursquareSearch, type FoursquareVenue, normalizeFoursquareCategory } from "@/hooks/useFoursquareSearch";
import { useImportFoursquareVenue } from "@/hooks/useImportFoursquareVenue";
import { useGooglePlacesSearch, type GooglePlaceVenue, normalizeGoogleCategory } from "@/hooks/useGooglePlacesSearch";
import { useImportGoogleVenue } from "@/hooks/useImportGoogleVenue";
import { MapMarker } from "@/components/map/MapMarker";

type SourceFilter = "all" | "db" | "foursquare" | "google";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { VenueList } from "@/components/map/VenueList";
import { MapFilters } from "@/components/map/MapFilters";
import { MobileVenueCard } from "@/components/map/MobileVenueCard";
import { BulkActionBar } from "@/components/map/BulkActionBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { triggerHaptic } from "@/lib/haptics";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getCategoryMeta } from "@/lib/categoryUtils";

// Sydney CBD fallback
const SYDNEY_LAT = -33.8688;
const SYDNEY_LNG = 151.2093;

const tagToColumn: Record<string, keyof Activity> = {
  "pet-friendly": "pet_friendly",
  "accessible": "wheelchair_accessible",
  "wifi": "wifi",
  "parking": "parking",
  "outdoor-seating": "outdoor_seating",
};

export default function MapView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [listingLimit, setListingLimit] = useState(200);
  const { filters, setMapBounds } = useSearchFilters();
  // When map bounds are active, fetch all activities to ensure geographic search works
  const effectiveLimit = filters.mapBounds ? Math.max(listingLimit, 2000) : listingLimit;
  const { data: activities, isLoading } = useAllActivities(effectiveLimit);
  const { location: userLocation } = useUserLocation();
  const importVenue = useImportFoursquareVenue();
  const importGoogleVenue = useImportGoogleVenue();
  const isAdmin = useIsAdmin();
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [mobileView, setMobileView] = useState<"map" | "list">("map");
  const [showSearchHere, setShowSearchHere] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const mapRef = useRef<MapRef>(null);
  const isMobile = useIsMobile();
  const userMovedMap = useRef(false);
  const queryClient = useQueryClient();

  const toggleBulkSelect = useCallback((id: string) => {
    setBulkSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // Only delete DB activities (not fs- prefixed)
      const dbIds = ids.filter(id => !id.startsWith("fs-"));
      for (const id of dbIds) {
        const { error } = await supabase.rpc("admin_delete_activity", { p_activity_id: id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      const dbCount = Array.from(bulkSelected).filter(id => !id.startsWith("fs-")).length;
      toast.success(`Removed ${dbCount} activities from database`);
      setBulkSelected(new Set());
      setBulkMode(false);
    },
    onError: (err: any) => toast.error(err.message || "Bulk delete failed"),
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (activityIds: string[]) => {
      let imported = 0;
      for (const actId of activityIds) {
        if (actId.startsWith("fs-")) {
          const fsId = actId.replace("fs-", "");
          const venue = foursquareVenues?.find(v => v.id === fsId);
          if (venue) { await importVenue.mutateAsync(venue); imported++; }
        } else if (actId.startsWith("g-")) {
          const gId = actId.replace("g-", "");
          const venue = googleVenues?.find(v => v.id === gId);
          if (venue) { await importGoogleVenue.mutateAsync(venue); imported++; }
        }
      }
      return imported;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["foursquare"] });
      queryClient.invalidateQueries({ queryKey: ["google-places"] });
      toast.success(`Added ${count} venues to database`);
      setBulkSelected(new Set());
      setBulkMode(false);
    },
    onError: (err: any) => toast.error(err.message || "Bulk import failed"),
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Record<string, any> }) => {
      const dbIds = ids.filter(id => !id.startsWith("fs-") && !id.startsWith("g-"));
      let updated = 0;
      for (const id of dbIds) {
        const { error } = await supabase.rpc("admin_update_activity", {
          p_activity_id: id,
          p_updates: updates,
        });
        if (error) throw error;
        updated++;
      }
      return updated;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success(`Updated ${count} activities`);
      setBulkSelected(new Set());
      setBulkMode(false);
    },
    onError: (err: any) => toast.error(err.message || "Bulk update failed"),
  });

  const userLat = userLocation?.latitude ?? SYDNEY_LAT;
  const userLng = userLocation?.longitude ?? SYDNEY_LNG;

  const urlLat = searchParams.get("lat");
  const urlLng = searchParams.get("lng");
  const urlZoom = searchParams.get("zoom");

  const [viewState, setViewState] = useState({
    latitude: urlLat ? parseFloat(urlLat) : SYDNEY_LAT,
    longitude: urlLng ? parseFloat(urlLng) : SYDNEY_LNG,
    zoom: urlZoom ? parseFloat(urlZoom) : 12,
  });

  // Foursquare search: build combined query from all active filters
  const fsQuery = useMemo(() => {
    const parts: string[] = [];
    if (filters.query) parts.push(filters.query);
    if (filters.cuisine) parts.push(filters.cuisine);
    if (filters.category && !filters.cuisine) parts.push(filters.category);
    if (filters.cuisine && filters.category) parts.push(filters.category);
    // Fallback: when no filters are set, use a broad query so external APIs still return results on the map
    return parts.join(" ") || "things to do";
  }, [filters.query, filters.cuisine, filters.category]);
  const wantExternal = sourceFilter === "all" || sourceFilter === "foursquare" || sourceFilter === "google";
  // Use the map's current center for external API calls so results match the visible area
  const mapCenter = useMemo(() => ({ lat: viewState.latitude, lng: viewState.longitude }), [viewState.latitude, viewState.longitude]);
  const { data: foursquareVenues } = useFoursquareSearch(fsQuery, wantExternal && (sourceFilter === "all" || sourceFilter === "foursquare"), mapCenter);
  const { data: googleVenues } = useGooglePlacesSearch(fsQuery, wantExternal && (sourceFilter === "all" || sourceFilter === "google"), mapCenter);
  const foursquareAsActivities: Activity[] = useMemo(() => {
    if (!foursquareVenues?.length) return [];
    const localFsIds = new Set(activities?.filter(a => a.foursquare_id).map(a => a.foursquare_id) ?? []);
    return foursquareVenues
      .filter(v => !localFsIds.has(v.id))
      .map((v): Activity => {
        const normalizedCategory = normalizeFoursquareCategory(v.category, v.tags, v.name);
        return {
          id: `fs-${v.id}`, name: v.name, category: normalizedCategory,
          latitude: v.latitude, longitude: v.longitude, address: v.address || null,
          description: v.description || null, rating: v.rating, review_count: 0,
          hero_image_url: v.photos?.[0] || null, is_open: true, phone: v.phone || null,
          website: v.website || null, hours_open: null, hours_close: null,
          parking: false, wheelchair_accessible: false, wifi: false,
          outdoor_seating: false, pet_friendly: false, foursquare_id: v.id,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
          source_url: null, region: null,
          is_event: false, event_dates: null, event_cost: null, ticket_url: null,
          organizer_name: null, organizer_phone: null, organizer_website: null,
          organizer_facebook: null, organizer_instagram: null,
          family_friendly: false, high_chairs: false, change_rooms: false,
          coffee: false, power_outlets: false, showers: false, bike_parking: false, shade: false,
          show_in_whats_on: false,
          show_in_featured: false,
        };
      });
  }, [foursquareVenues, activities]);

  // Convert Google venues to Activity-compatible objects
  const googleAsActivities: Activity[] = useMemo(() => {
    if (!googleVenues?.length) return [];
    const localGoogleIds = new Set(activities?.filter(a => a.foursquare_id?.startsWith("google-")).map(a => a.foursquare_id) ?? []);
    return googleVenues
      .filter(v => !localGoogleIds.has(`google-${v.id}`))
      .map((v): Activity => {
        const normalizedCategory = normalizeGoogleCategory(v.category, v.tags, v.name);
        return {
          id: `g-${v.id}`, name: v.name, category: normalizedCategory,
          latitude: v.latitude, longitude: v.longitude, address: v.address || null,
          description: v.description || null, rating: v.rating, review_count: 0,
          hero_image_url: v.photos?.[0] || null, is_open: true, phone: v.phone || null,
          website: v.website || null, hours_open: null, hours_close: null,
          parking: false, wheelchair_accessible: false, wifi: false,
          outdoor_seating: false, pet_friendly: false, foursquare_id: `google-${v.id}`,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
          source_url: null, region: null,
          is_event: false, event_dates: null, event_cost: null, ticket_url: null,
          organizer_name: null, organizer_phone: null, organizer_website: null,
          organizer_facebook: null, organizer_instagram: null,
          family_friendly: false, high_chairs: false, change_rooms: false,
          coffee: false, power_outlets: false, showers: false, bike_parking: false, shade: false,
          show_in_whats_on: false,
          show_in_featured: false,
        };
      });
  }, [googleVenues, activities]);

  // Get user's location on mount (only if no URL params)
  useEffect(() => {
    if (urlLat && urlLng) return;
    if (userLocation) {
      setViewState((prev) => ({ ...prev, latitude: userLocation.latitude, longitude: userLocation.longitude }));
    }
  }, [urlLat, urlLng, userLocation]);

  // Apply all filters from shared state
  const filteredActivities = useMemo(() => {
    const effectiveSource = isAdmin ? sourceFilter : "db";
    let allActivities: Activity[] = [];
    if (effectiveSource === "all") {
      allActivities = [...(activities || []), ...foursquareAsActivities, ...googleAsActivities];
    } else if (effectiveSource === "db") {
      allActivities = [...(activities || [])];
    } else if (effectiveSource === "foursquare") {
      allActivities = [...foursquareAsActivities];
    } else if (effectiveSource === "google") {
      allActivities = [...googleAsActivities];
    }

    return allActivities.filter((activity) => {
      // Text search
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const matchesQuery =
          activity.name.toLowerCase().includes(query) ||
          activity.category.toLowerCase().includes(query) ||
          (activity.description?.toLowerCase().includes(query) ?? false) ||
          (activity.address?.toLowerCase().includes(query) ?? false);
        if (!matchesQuery) return false;
      }
      // Category
      if (filters.category && activity.category.toLowerCase() !== filters.category.toLowerCase()) return false;
      // Cuisine: when a cuisine is selected, only show food-related categories (Restaurant, Cafe, Bakery, Bar)
      if (filters.cuisine && !filters.category) {
        const foodCategories = ["restaurant", "cafe", "bakery", "bar"];
        if (!foodCategories.includes(activity.category.toLowerCase())) return false;
      }
      // Open now
      if (filters.isOpen && !activity.is_open) return false;
      // Min rating
      if (filters.minRating !== null && (activity.rating ?? 0) < filters.minRating) return false;
      // Distance from user
      if (filters.maxDistance !== null) {
        const dist = calculateDistance(userLat, userLng, activity.latitude, activity.longitude);
        if (dist > filters.maxDistance) return false;
      }
      // Tag-based boolean filters
      for (const tag of filters.tags) {
        const column = tagToColumn[tag];
        if (column && !activity[column]) return false;
      }
      // Outdoor/indoor category tags
      if (filters.tags.includes("outdoor") && !["beach", "park"].includes(activity.category.toLowerCase())) return false;
      if (filters.tags.includes("indoor") && !["museum", "gym", "shopping"].includes(activity.category.toLowerCase())) return false;
      // Map bounds (search this area)
      if (filters.mapBounds) {
        const { north, south, east, west } = filters.mapBounds;
        if (
          activity.latitude < south || activity.latitude > north ||
          activity.longitude < west || activity.longitude > east
        ) return false;
      }
      return true;
    });
  }, [activities, foursquareAsActivities, googleAsActivities, filters, userLat, userLng, sourceFilter]);

  // Auto-fit map bounds on initial load to show all pins
  const initialFitDone = useRef(false);
  useEffect(() => {
    if (initialFitDone.current) return;
    if (urlLat && urlLng) { initialFitDone.current = true; return; }
    if (!mapRef.current || filteredActivities.length === 0) return;
    initialFitDone.current = true;
    const bounds = new LngLatBounds();
    filteredActivities.forEach((a) => bounds.extend([a.longitude, a.latitude]));
    mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 1000 });
  }, [filteredActivities, urlLat, urlLng]);

  // Auto-fit map bounds when filters change (but not mapBounds itself)
  const filterKey = JSON.stringify({ ...filters, mapBounds: null });
  const prevFilterKey = useRef(filterKey);
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      prevFilterKey.current = filterKey;
      return;
    }
    if (filterKey === prevFilterKey.current) return;
    prevFilterKey.current = filterKey;
    if (urlLat && urlLng) return;

    // When filters change, clear previous map bounds so all matching results show,
    // then fit the map to the filtered results automatically
    setMapBounds(null);
    setShowSearchHere(false);

    // Wait a tick for filteredActivities to update with cleared mapBounds
    requestAnimationFrame(() => {
      if (!mapRef.current) return;
      const allFiltered = filteredActivities;
      if (allFiltered.length === 0) return;
      const bounds = new LngLatBounds();
      allFiltered.forEach((a) => bounds.extend([a.longitude, a.latitude]));
      mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 1000 });
    });
  }, [filterKey, filteredActivities, urlLat, urlLng, setMapBounds]);

  const handleMarkerClick = useCallback((activity: Activity) => {
    setSelectedActivity(activity);
    setViewState((prev) => ({
      ...prev, latitude: activity.latitude, longitude: activity.longitude, zoom: 15,
    }));
  }, []);

  const handleNavigateToDetails = useCallback(async (activity: Activity) => {
    // If it's a Foursquare venue (fs- prefix), import it first
    if (activity.id.startsWith("fs-")) {
      const fsId = activity.id.replace("fs-", "");
      const venue = foursquareVenues?.find(v => v.id === fsId);
      if (venue) {
        try {
          const realId = await importVenue.mutateAsync(venue);
          navigate(`/activity/${realId}`);
          return;
        } catch (e) {
          toast.error("Failed to load venue details");
          return;
        }
      }
    }
    // If it's a Google venue (g- prefix), import it first
    if (activity.id.startsWith("g-")) {
      const gId = activity.id.replace("g-", "");
      const venue = googleVenues?.find(v => v.id === gId);
      if (venue) {
        try {
          const realId = await importGoogleVenue.mutateAsync(venue);
          navigate(`/activity/${realId}`);
          return;
        } catch (e) {
          toast.error("Failed to load venue details");
          return;
        }
      }
    }
    navigate(`/activity/${activity.id}`);
  }, [navigate, foursquareVenues, googleVenues, importVenue, importGoogleVenue]);

  const handleSearchHere = useCallback(() => {
    if (!mapRef.current) return;
    const bounds = mapRef.current.getBounds();
    if (!bounds) return;
    setMapBounds({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    });
    setShowSearchHere(false);
    triggerHaptic("light");
  }, [setMapBounds]);

  const handleMapMove = useCallback((evt: any) => {
    setViewState(evt.viewState);
    if (userMovedMap.current) {
      setShowSearchHere(true);
    }
  }, []);

  const handleMapMoveStart = useCallback(() => {
    userMovedMap.current = true;
  }, []);

  // Viewport culling: only render markers visible on screen + a small buffer
  const visibleActivities = useMemo(() => {
    if (!mapRef.current) return filteredActivities;
    const bounds = mapRef.current.getBounds();
    if (!bounds) return filteredActivities;
    const latBuffer = (bounds.getNorth() - bounds.getSouth()) * 0.1;
    const lngBuffer = (bounds.getEast() - bounds.getWest()) * 0.1;
    const north = bounds.getNorth() + latBuffer;
    const south = bounds.getSouth() - latBuffer;
    const east = bounds.getEast() + lngBuffer;
    const west = bounds.getWest() - lngBuffer;
    return filteredActivities.filter(
      (a) => a.latitude >= south && a.latitude <= north && a.longitude >= west && a.longitude <= east
    );
  }, [filteredActivities, viewState.latitude, viewState.longitude, viewState.zoom]);

  // Use simplified dot markers at low zoom or when too many visible
  const simplified = viewState.zoom < 11 || visibleActivities.length > 200;

  const handleMarkerClickCb = useCallback(
    (activity: Activity) => {
      if (bulkMode) {
        toggleBulkSelect(activity.id);
      } else {
        handleMarkerClick(activity);
      }
    },
    [bulkMode, toggleBulkSelect, handleMarkerClick]
  );

  if (!MAPBOX_TOKEN) {
    return (
      <AppLayout fullHeight>
        <div className="h-full flex items-center justify-center bg-muted">
          <div className="text-center space-y-4 p-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <MapPin className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Mapbox Token Required</h2>
              <p className="text-muted-foreground text-sm mt-1">Please add your VITE_MAPBOX_TOKEN to enable the map</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const mapContent = (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={handleMapMove}
      onMoveStart={handleMapMoveStart}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      mapboxAccessToken={MAPBOX_TOKEN}
      onClick={() => { if (isMobile) setSelectedActivity(null); }}
    >
      <NavigationControl position="bottom-right" style={{ marginBottom: "20px" }} />
      <GeolocateControl position="bottom-right" style={{ marginBottom: "80px" }} trackUserLocation showUserHeading />

      {visibleActivities.map((activity) => (
        <MapMarker
          key={activity.id}
          activity={activity}
          isSelected={selectedActivity?.id === activity.id}
          isBulkSelected={bulkSelected.has(activity.id)}
          bulkMode={bulkMode}
          isAdmin={isAdmin}
          simplified={simplified}
          onClick={handleMarkerClickCb}
        />
      ))}

      {selectedActivity && !isMobile && (
        <Popup latitude={selectedActivity.latitude} longitude={selectedActivity.longitude} anchor="bottom" onClose={() => setSelectedActivity(null)} closeButton closeOnClick={false} offset={45}>
          <div className="p-2 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded-full text-xs text-white ${getCategoryMeta(selectedActivity.category).bg}`}>{selectedActivity.category}</span>
              {selectedActivity.is_open ? (
                <span className="px-2 py-0.5 rounded-full text-xs bg-success/10 text-success">Open</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-xs bg-destructive/10 text-destructive">Closed</span>
              )}
            </div>
            <h3 className="font-bold text-foreground">{selectedActivity.name}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <Star className="w-3 h-3 fill-warning text-warning" />
              <span>{selectedActivity.rating != null ? Number(selectedActivity.rating).toFixed(1) : "N/A"}</span>
              <span className="text-xs">({selectedActivity.review_count ?? 0} reviews)</span>
            </div>
            {isAdmin && selectedActivity.id.startsWith("fs-") && (
              <Button size="sm" variant="outline" className="w-full mt-2 gap-1 text-xs" disabled={importVenue.isPending}
                onClick={async () => {
                  const fsId = selectedActivity.id.replace("fs-", "");
                  const venue = foursquareVenues?.find(v => v.id === fsId);
                  if (venue) { try { await importVenue.mutateAsync(venue); toast.success("Added to database!"); } catch { toast.error("Failed to import"); } }
                }}>
                <Plus className="w-3 h-3" /> Add to DB
              </Button>
            )}
            {isAdmin && selectedActivity.id.startsWith("g-") && (
              <Button size="sm" variant="outline" className="w-full mt-2 gap-1 text-xs" disabled={importGoogleVenue.isPending}
                onClick={async () => {
                  const gId = selectedActivity.id.replace("g-", "");
                  const venue = googleVenues?.find(v => v.id === gId);
                  if (venue) { try { await importGoogleVenue.mutateAsync(venue); toast.success("Added to database!"); } catch { toast.error("Failed to import"); } }
                }}>
                <Plus className="w-3 h-3" /> Add to DB
              </Button>
            )}
            <Button size="sm" className="w-full mt-2" onClick={() => handleNavigateToDetails(selectedActivity)}>View Details</Button>
          </div>
        </Popup>
      )}
    </Map>
  );

  return (
    <AppLayout fullHeight>
      <div className="flex h-[100dvh] overflow-hidden">
        {/* LEFT COLUMN: SCROLLABLE LIST - desktop */}
        <div className="hidden md:flex flex-col w-[400px] border-r border-border bg-background h-full">
          <div className="p-4 sticky top-0 bg-background z-10 border-b border-border shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                {isLoading ? "Loading..." : `${filteredActivities.length} places`}
              </span>
              <div className="flex items-center gap-2">
               {isAdmin && (
                  <div className="flex items-center gap-1 mr-2">
                    {(["all", "db", "foursquare", "google"] as SourceFilter[]).map((src) => {
                      const labels: Record<SourceFilter, string> = { all: "All", db: "DB", foursquare: "FSQ", google: "G" };
                      const colors: Record<SourceFilter, string> = { all: "bg-foreground text-background", db: "bg-green-600 text-white", foursquare: "bg-orange-500 text-white", google: "bg-blue-500 text-white" };
                      return (
                        <button key={src} onClick={() => setSourceFilter(src)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-full transition-colors ${sourceFilter === src ? colors[src] : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                        >
                          {labels[src]}
                        </button>
                      );
                    })}
                  </div>
                )}
                {isAdmin && (
                  <div className="flex items-center gap-1.5 mr-2">
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">Limit:</span>
                    <select
                      value={listingLimit}
                      onChange={(e) => setListingLimit(Number(e.target.value))}
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted border border-border text-foreground"
                    >
                      {[50, 100, 200, 500, 1000].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                )}
               {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setBulkMode(!bulkMode); setBulkSelected(new Set()); }}
                      className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-colors ${bulkMode ? "bg-destructive text-destructive-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                    >
                      {bulkMode ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                      {bulkMode ? "Selecting" : "Select"}
                    </button>
                    {bulkMode && (
                      <button
                        onClick={() => {
                          const allIds = filteredActivities.map(a => a.id);
                          if (bulkSelected.size === allIds.length) {
                            setBulkSelected(new Set());
                          } else {
                            setBulkSelected(new Set(allIds));
                          }
                        }}
                        className="text-xs font-medium px-2 py-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        {bulkSelected.size === filteredActivities.length ? "Deselect All" : "Select All"}
                      </button>
                    )}
                  </div>
                )}
                <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                  <LayoutList className="w-4 h-4" />List View
                </Link>
              </div>
            </div>
            <MapFilters activityCount={filteredActivities.length} isLoading={isLoading} />
          </div>
          <div className="flex-1 overflow-y-auto">
            <VenueList activities={filteredActivities} isLoading={isLoading} selectedActivity={selectedActivity} onSelectActivity={handleMarkerClick} onNavigateToDetails={handleNavigateToDetails} bulkMode={bulkMode} selectedIds={bulkSelected} onToggleSelect={toggleBulkSelect} />
          </div>
        </div>

        {/* RIGHT COLUMN: MAP */}
        <div className="flex-1 h-full relative flex flex-col">
          {/* Fixed search bar - mobile */}
          <div className="md:hidden shrink-0 z-30 bg-background/90 backdrop-blur-sm px-3 py-2 safe-top fixed top-0 left-0 right-0 pointer-events-auto" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
            <div className="pointer-events-auto">
              <MapFilters activityCount={filteredActivities.length} isLoading={isLoading} />
            </div>
          </div>
          <div className="md:hidden shrink-0 h-[88px]" />

          <div className="flex-1 relative min-h-0">
            {mapContent}

            {/* "Search this area" button */}
            <AnimatePresence>
              {showSearchHere && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-1/2 md:top-3 left-1/2 -translate-x-1/2 -translate-y-1/2 md:translate-y-0 z-20"
                >
                  <Button
                    onClick={handleSearchHere}
                    size="sm"
                    className="rounded-full shadow-elevated gap-2 bg-card text-foreground border border-border hover:bg-muted"
                  >
                    <Search className="w-4 h-4 text-primary" />
                    Search this area
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active bounds chip */}
            {filters.mapBounds && !showSearchHere && (
              <div className="absolute top-1/2 md:top-3 left-1/2 -translate-x-1/2 -translate-y-1/2 md:translate-y-0 z-20">
                <button
                  onClick={() => { setMapBounds(null); setShowSearchHere(false); }}
                  className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-full px-4 py-2 text-xs font-medium shadow-elevated"
                >
                  Showing this area
                  <span className="ml-1">✕</span>
                </button>
              </div>
            )}

            {mobileView === "map" && (
              <MobileVenueCard
                activity={selectedActivity}
                onClose={() => setSelectedActivity(null)}
                onNavigate={handleNavigateToDetails}
                isImporting={importVenue.isPending || importGoogleVenue.isPending}
                onImportToDb={async (activity) => {
                  if (activity.id.startsWith("fs-")) {
                    const fsId = activity.id.replace("fs-", "");
                    const venue = foursquareVenues?.find(v => v.id === fsId);
                    if (venue) { try { await importVenue.mutateAsync(venue); toast.success("Added to database!"); } catch { toast.error("Failed to import"); } }
                  } else if (activity.id.startsWith("g-")) {
                    const gId = activity.id.replace("g-", "");
                    const venue = googleVenues?.find(v => v.id === gId);
                    if (venue) { try { await importGoogleVenue.mutateAsync(venue); toast.success("Added to database!"); } catch { toast.error("Failed to import"); } }
                  }
                }}
              />
            )}

            {isMobile && (
              <AnimatePresence>
                {mobileView === "list" && (
                  <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="absolute inset-x-0 bottom-0 top-0 z-10 bg-background/95 backdrop-blur-sm rounded-t-2xl shadow-elevated flex flex-col">
                    <div className="flex justify-center py-2 shrink-0"><div className="w-10 h-1 rounded-full bg-muted-foreground/30" /></div>
                    <div className="flex-1 overflow-y-auto pb-20">
                      <VenueList activities={filteredActivities} isLoading={isLoading} selectedActivity={selectedActivity} onSelectActivity={handleMarkerClick} onNavigateToDetails={handleNavigateToDetails} bulkMode={bulkMode} selectedIds={bulkSelected} onToggleSelect={toggleBulkSelect} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {isMobile && (
            <button
              onClick={() => { triggerHaptic("medium"); setMobileView(mobileView === "map" ? "list" : "map"); }}
              className="fixed bottom-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-elevated font-semibold text-sm touch-none"
              style={{ userSelect: 'none', WebkitUserSelect: 'none', marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              {mobileView === "map" ? (<><LayoutList className="w-4 h-4" />List</>) : (<><MapIcon className="w-4 h-4" />Map</>)}
            </button>
          )}
        </div>

        <AnimatePresence>
          {bulkMode && (
            <BulkActionBar
              selectedCount={bulkSelected.size}
              totalCount={filteredActivities.length}
              onDelete={() => {
                const dbIds = Array.from(bulkSelected).filter(id => !id.startsWith("fs-"));
                if (dbIds.length === 0) { toast.error("No DB activities selected to remove"); return; }
                if (!confirm(`Remove ${dbIds.length} activities from database? This cannot be undone.`)) return;
                bulkDeleteMutation.mutate(dbIds);
              }}
              onClear={() => { setBulkSelected(new Set()); setBulkMode(false); }}
              onSelectAll={() => {
                const allIds = filteredActivities.map(a => a.id);
                if (bulkSelected.size === allIds.length) {
                  setBulkSelected(new Set());
                } else {
                  setBulkSelected(new Set(allIds));
                }
              }}
              onAddToDb={() => {
                const externalIds = Array.from(bulkSelected).filter(id => id.startsWith("fs-") || id.startsWith("g-"));
                if (externalIds.length === 0) { toast.error("No external venues selected"); return; }
                bulkImportMutation.mutate(externalIds);
              }}
              onRemoveFromDb={() => {
                const dbIds = Array.from(bulkSelected).filter(id => !id.startsWith("fs-") && !id.startsWith("g-"));
                if (dbIds.length === 0) { toast.error("No DB activities selected"); return; }
                if (!confirm(`Remove ${dbIds.length} activities from database?`)) return;
                bulkDeleteMutation.mutate(dbIds);
              }}
              onBulkUpdate={(updates) => {
                const dbIds = Array.from(bulkSelected).filter(id => !id.startsWith("fs-") && !id.startsWith("g-"));
                if (dbIds.length === 0) { toast.error("No DB activities selected to update"); return; }
                bulkUpdateMutation.mutate({ ids: dbIds, updates });
              }}
              isDeleting={bulkDeleteMutation.isPending}
              isImporting={bulkImportMutation.isPending}
              isUpdating={bulkUpdateMutation.isPending}
              hasDbSelected={Array.from(bulkSelected).some(id => !id.startsWith("fs-") && !id.startsWith("g-"))}
              hasFsSelected={Array.from(bulkSelected).some(id => id.startsWith("fs-") || id.startsWith("g-"))}
            />
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
