import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserLocation, calculateDistance } from "@/hooks/useUserLocation";
import { useSearchFilters, type SearchFilters } from "@/hooks/useSearchFilters";

export interface FoursquareVenue {
  id: string;
  name: string;
  category: string;
  tags: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  photos: string[];
  rating: number | null;
  phone: string | null;
  website: string | null;
  source: "foursquare";
}

async function searchFoursquare(
  query: string,
  lat: number,
  lng: number,
  radius = 10000,
  limit = 30
): Promise<FoursquareVenue[]> {
  const { data, error } = await supabase.functions.invoke("search-foursquare", {
    body: { query, lat, lng, radius, limit },
  });

  if (error) {
    console.error("Foursquare search error:", error);
    throw error;
  }

  return data as FoursquareVenue[];
}

const SYDNEY_LAT = -33.8688;
const SYDNEY_LNG = 151.2093;

/** Map app categories to Foursquare category name fragments for matching */
const categoryMatchMap: Record<string, string[]> = {
  Cafe: ["cafe", "coffee", "tea", "espresso"],
  Restaurant: ["restaurant", "dining", "food", "eatery", "bistro", "grill", "sushi", "pizza", "burger", "thai", "chinese", "indian", "italian", "japanese", "mexican", "korean", "vietnamese", "noodle", "ramen", "steakhouse", "seafood", "diner", "kitchen", "brasserie", "trattoria", "cantina"],
  Bar: ["bar", "pub", "lounge", "cocktail", "brewery", "tavern", "wine bar", "beer"],
  Beach: ["beach", "surf", "coastal"],
  Park: ["park", "garden", "trail", "nature", "reserve", "botanical"],
  Museum: ["museum", "gallery", "art", "exhibit", "heritage", "cultural"],
  Shopping: ["shop", "store", "mall", "market", "boutique", "retail"],
  Gym: ["gym", "fitness", "sport", "yoga", "pilates", "crossfit"],
  Bakery: ["bakery", "pastry", "bread", "patisserie", "cake", "donut"],
  Playground: ["playground", "play area", "play ground", "kids play"],
  "Swimming Pool": ["swimming", "pool", "aquatic", "swim"],
  "tourist attraction": ["tourist", "attraction", "landmark", "sightseeing", "point of interest"],
  "Sports and Recreation": ["sports", "recreation", "athletic", "stadium", "arena", "golf", "tennis", "cricket"],
  Daycare: ["daycare", "child care", "childcare", "preschool", "kindergarten", "nursery"],
  Education: ["education", "school", "learning", "academy", "tutor", "library"],
};

function matchesCategory(venue: FoursquareVenue, category: string): boolean {
  const keywords = categoryMatchMap[category];
  if (!keywords) return false;
  const venueCat = venue.category.toLowerCase();
  const venueTags = venue.tags.toLowerCase();
  const venueName = venue.name.toLowerCase();
  return keywords.some((kw) => venueCat.includes(kw) || venueTags.includes(kw) || venueName.includes(kw));
}

/** Normalize a Foursquare category string to the closest app category */
export function normalizeFoursquareCategory(fsCategoryStr: string, tags = "", name = ""): string {
  const combined = `${fsCategoryStr} ${tags} ${name}`.toLowerCase();
  for (const [appCat, keywords] of Object.entries(categoryMatchMap)) {
    if (keywords.some((kw) => combined.includes(kw))) return appCat;
  }
  return fsCategoryStr.split(",")[0]?.trim() || "Restaurant";
}

function applyFiltersToVenues(
  venues: FoursquareVenue[],
  filters: SearchFilters,
  userLat: number,
  userLng: number
): FoursquareVenue[] {
  return venues.filter((v) => {
    // Category filter
    if (filters.category && !matchesCategory(v, filters.category)) return false;
    // Min rating
    if (filters.minRating !== null && (v.rating ?? 0) < filters.minRating) return false;
    // Distance
    if (filters.maxDistance !== null) {
      const dist = calculateDistance(userLat, userLng, v.latitude, v.longitude);
      if (dist > filters.maxDistance) return false;
    }
    return true;
  });
}

/**
 * Fetches Foursquare venues and applies local filters via useMemo (not inside queryFn).
 * This means changing filters uses cached API data instead of refetching.
 * 
 * @param query - search term (text query OR category name)
 * @param enabled - whether to run the query
 */
export function useFoursquareSearch(query: string, enabled = true, options?: { lat?: number; lng?: number }) {
  const { location } = useUserLocation();
  const { filters } = useSearchFilters();
  const lat = options?.lat ?? location?.latitude ?? SYDNEY_LAT;
  const lng = options?.lng ?? location?.longitude ?? SYDNEY_LNG;
  // Use maxDistance as API radius (convert km to meters), default 50km
  const radiusMeters = filters.maxDistance ? filters.maxDistance * 1000 : 50000;

  const rawQuery = useQuery({
    queryKey: ["foursquare", query, lat, lng, radiusMeters],
    queryFn: () => searchFoursquare(query, lat, lng, radiusMeters, 30),
    enabled: enabled && query.length >= 2,
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

  // Apply filters client-side via memo — instant when only filters change
  const data = useMemo(() => {
    if (!rawQuery.data) return undefined;
    return applyFiltersToVenues(rawQuery.data, filters, lat, lng);
  }, [rawQuery.data, filters, lat, lng]);

  return {
    ...rawQuery,
    data,
  };
}
