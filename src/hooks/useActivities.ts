import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { useSearchFilters, type SearchFilters } from "@/hooks/useSearchFilters";
import { useUserLocation, calculateDistance, formatDistance } from "@/hooks/useUserLocation";

export type Activity = Tables<"activities">;

export interface ActivityDisplay {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  distance: string;
  distanceKm: number;
  image: string;
  isOpen: boolean;
  isEvent: boolean;
  closesAt?: string;
  region?: string;
  address?: string;
  showInWhatsOn?: boolean;
  showInFeatured?: boolean;
}

// Sydney CBD as fallback
const SYDNEY_LAT = -33.8688;
const SYDNEY_LNG = 151.2093;

// Helper to extract closing time from hours_close
function extractClosingTime(hoursClose: string | null): string | undefined {
  if (!hoursClose) return undefined;
  return hoursClose.replace(":00", "").toLowerCase();
}

// Transform database activity to display format
export function transformActivity(activity: Activity, lat?: number, lng?: number): ActivityDisplay {
  const userLat = lat ?? SYDNEY_LAT;
  const userLng = lng ?? SYDNEY_LNG;
  const dist = calculateDistance(userLat, userLng, activity.latitude, activity.longitude);
  return {
    id: activity.id,
    name: activity.name,
    category: activity.category,
    rating: activity.rating ?? 0,
    reviewCount: activity.review_count ?? 0,
    distance: formatDistance(dist),
    distanceKm: dist,
    image: activity.hero_image_url ?? "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop",
    isOpen: activity.is_open,
    isEvent: activity.is_event,
    closesAt: extractClosingTime(activity.hours_close),
    region: activity.region ?? undefined,
    address: activity.address ?? undefined,
    showInWhatsOn: activity.show_in_whats_on,
    showInFeatured: activity.show_in_featured,
  };
}

// Map tags to database boolean columns
const tagToColumn: Record<string, string> = {
  "pet-friendly": "pet_friendly",
  "accessible": "wheelchair_accessible",
  "wifi": "wifi",
  "parking": "parking",
  "outdoor-seating": "outdoor_seating",
};

// Apply filters to query builder
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilters(queryBuilder: PostgrestFilterBuilder<any, any, any>, filters: SearchFilters) {
  let query = queryBuilder;

  // Combine text query + cuisine into a single ilike search
  const searchTerms: string[] = [];
  if (filters.query) searchTerms.push(filters.query);
  if (filters.cuisine) searchTerms.push(filters.cuisine);
  
  if (searchTerms.length > 0) {
    const term = searchTerms.join(" ");
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%,category.ilike.%${term}%,address.ilike.%${term}%`);
  }

  if (filters.category) {
    query = query.ilike("category", filters.category);
  }

  if (filters.region) {
    query = query.ilike("region", filters.region);
  }

  if (filters.isOpen) {
    query = query.eq("is_open", true);
  }

  if (filters.minRating !== null) {
    query = query.gte("rating", filters.minRating);
  }

  // Apply tag-based boolean filters
  for (const tag of filters.tags) {
    const column = tagToColumn[tag];
    if (column) {
      query = query.eq(column, true);
    }
  }

  // Category-based tag filters (outdoor/indoor mapped to categories)
  if (filters.tags.includes("outdoor")) {
    query = query.in("category", ["Beach", "Park"]);
  }
  if (filters.tags.includes("indoor")) {
    query = query.in("category", ["Museum", "Gym", "Shopping"]);
  }

  return query;
}

/** Client-side distance filter using user location */
function filterByDistance(activities: Activity[], maxDistanceKm: number | null, userLat: number, userLng: number): Activity[] {
  if (maxDistanceKm === null) return activities;
  return activities.filter((a) => {
    const dist = calculateDistance(userLat, userLng, a.latitude, a.longitude);
    return dist <= maxDistanceKm;
  });
}

/** Sort activities by distance from user */
function sortByDistance(activities: Activity[], userLat: number, userLng: number): Activity[] {
  return [...activities].sort((a, b) => {
    const distA = calculateDistance(userLat, userLng, a.latitude, a.longitude);
    const distB = calculateDistance(userLat, userLng, b.latitude, b.longitude);
    return distA - distB;
  });
}

export function useFeaturedActivities(limit = 10) {
  const { filters } = useSearchFilters();
  const { location } = useUserLocation();
  const lat = location?.latitude ?? SYDNEY_LAT;
  const lng = location?.longitude ?? SYDNEY_LNG;

  return useQuery({
    queryKey: ["activities", "featured", limit, filters, lat, lng],
    queryFn: async () => {
      let query = supabase
        .from("activities")
        .select("*")
        .eq("is_open", true) as any;

      if (filters.query || filters.cuisine) {
        const term = [filters.query, filters.cuisine].filter(Boolean).join(" ");
        query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%,category.ilike.%${term}%,address.ilike.%${term}%`);
      }
      if (filters.category) {
        query = query.ilike("category", filters.category);
      }
      if (filters.region) {
        query = query.ilike("region", filters.region);
      }
      if (filters.minRating !== null) {
        query = query.gte("rating", filters.minRating);
      }
      for (const tag of filters.tags) {
        const column = tagToColumn[tag];
        if (column) {
          query = query.eq(column, true);
        }
      }

      const { data, error } = await query
        .order("rating", { ascending: false })
        .limit(200); // Fetch more, then filter by distance

      if (error) throw error;

      let results = data as Activity[];
      results = filterByDistance(results, filters.maxDistance, lat, lng);
      results = sortByDistance(results, lat, lng);

      return results.slice(0, limit).map((a) => transformActivity(a, lat, lng));
    },
  });
}

export function useRecommendedActivities(limit = 12) {
  const { filters } = useSearchFilters();
  const { location } = useUserLocation();
  const lat = location?.latitude ?? SYDNEY_LAT;
  const lng = location?.longitude ?? SYDNEY_LNG;

  // When filters are active, fetch more results
  const hasFilters = !!(filters.query || filters.category || filters.cuisine || filters.region || filters.isOpen || filters.minRating !== null || filters.maxDistance !== null || filters.tags.length > 0 || filters.ageGroups.length > 0);
  const fetchLimit = hasFilters ? 200 : limit;

  return useQuery({
    queryKey: ["activities", "recommended", limit, filters, lat, lng],
    queryFn: async () => {
      let queryBuilder = supabase
        .from("activities")
        .select("*");

      queryBuilder = applyFilters(queryBuilder, filters);

      const { data, error } = await queryBuilder
        .order("review_count", { ascending: false })
        .limit(fetchLimit);

      if (error) throw error;

      let results = data as Activity[];
      results = filterByDistance(results, filters.maxDistance, lat, lng);
      
      // Apply sort based on filter
      const sortedResults = sortActivities(results, filters.sortBy, lat, lng);

      return sortedResults.slice(0, hasFilters ? 200 : limit).map((a) => transformActivity(a, lat, lng));
    },
  });
}

/** Sort activities based on selected sort option */
function sortActivities(activities: Activity[], sortBy: string, lat: number, lng: number): Activity[] {
  const sorted = [...activities];
  switch (sortBy) {
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case "rating":
      return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case "category":
      return sorted.sort((a, b) => a.category.localeCompare(b.category));
    case "region":
      return sorted.sort((a, b) => (a.region ?? "").localeCompare(b.region ?? ""));
    case "distance":
    default:
      return sortByDistance(sorted, lat, lng);
  }
}

export function useActivityById(id: string) {
  return useQuery({
    queryKey: ["activity", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useActivitiesByCategory(category: string, limit = 20) {
  const { location } = useUserLocation();
  const lat = location?.latitude ?? SYDNEY_LAT;
  const lng = location?.longitude ?? SYDNEY_LNG;

  return useQuery({
    queryKey: ["activities", "category", category, limit, lat, lng],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .ilike("category", category)
        .order("rating", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return sortByDistance(data, lat, lng).map((a) => transformActivity(a, lat, lng));
    },
    enabled: !!category,
  });
}

export function useSearchActivities(query: string, filters?: { category?: string; isOpen?: boolean }) {
  const { location } = useUserLocation();
  const lat = location?.latitude ?? SYDNEY_LAT;
  const lng = location?.longitude ?? SYDNEY_LNG;

  return useQuery({
    queryKey: ["activities", "search", query, filters, lat, lng],
    queryFn: async () => {
      let queryBuilder = supabase
        .from("activities")
        .select("*");

      if (query) {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%,address.ilike.%${query}%`);
      }

      if (filters?.category) {
        queryBuilder = queryBuilder.ilike("category", filters.category);
      }

      if (filters?.isOpen) {
        queryBuilder = queryBuilder.eq("is_open", true);
      }

      const { data, error } = await queryBuilder
        .order("rating", { ascending: false })
        .limit(50);

      if (error) throw error;
      return sortByDistance(data, lat, lng).map((a) => transformActivity(a, lat, lng));
    },
    enabled: query.length > 0 || !!filters?.category || !!filters?.isOpen,
  });
}

export function useAllActivities(limit = 100) {
  return useQuery({
    queryKey: ["activities", "all", limit],
    queryFn: async () => {
      // Supabase has a 1000-row limit per request, so paginate if needed
      const batchSize = Math.min(limit, 1000);
      let allData: any[] = [];
      let offset = 0;

      while (allData.length < limit) {
        const { data, error } = await supabase
          .from("activities")
          .select("*")
          .order("created_at", { ascending: false })
          .range(offset, offset + batchSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        offset += batchSize;
        if (data.length < batchSize) break; // no more rows
      }

      return allData.slice(0, limit);
    },
  });
}
