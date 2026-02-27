import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserLocation, calculateDistance } from "@/hooks/useUserLocation";
import { useSearchFilters, type SearchFilters } from "@/hooks/useSearchFilters";

export interface GooglePlaceVenue {
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
  source: "google";
}

async function searchGooglePlaces(
  query: string,
  lat: number,
  lng: number,
  radius = 10000,
  limit = 20
): Promise<GooglePlaceVenue[]> {
  const { data, error } = await supabase.functions.invoke("search-google-places", {
    body: { query, lat, lng, radius, limit },
  });

  if (error) {
    console.error("Google Places search error:", error);
    throw error;
  }

  return data as GooglePlaceVenue[];
}

const SYDNEY_LAT = -33.8688;
const SYDNEY_LNG = 151.2093;

/** Map Google place types to app categories */
const categoryMatchMap: Record<string, string[]> = {
  Cafe: ["cafe", "coffee shop", "coffee", "tea"],
  Restaurant: ["restaurant", "dining", "food", "meal delivery", "meal takeaway", "pizza", "sushi", "burger", "thai", "chinese", "indian", "italian", "japanese", "mexican", "korean", "vietnamese", "seafood"],
  Bar: ["bar", "pub", "night club", "cocktail", "brewery", "wine bar"],
  Beach: ["beach", "surf", "coastal"],
  Park: ["park", "garden", "trail", "nature", "botanical garden"],
  Museum: ["museum", "art gallery", "gallery", "heritage"],
  Shopping: ["shopping mall", "store", "shop", "market", "boutique"],
  Gym: ["gym", "fitness", "sport", "yoga"],
  Bakery: ["bakery", "pastry", "bread"],
  Playground: ["playground", "play area", "play ground", "kids play"],
  "Swimming Pool": ["swimming pool", "pool", "aquatic", "swim"],
  "tourist attraction": ["tourist attraction", "attraction", "landmark", "point of interest", "sightseeing"],
  "Sports and Recreation": ["sports", "recreation", "athletic", "stadium", "arena", "golf", "tennis", "cricket"],
  Daycare: ["daycare", "child care", "childcare", "preschool", "kindergarten", "nursery"],
  Education: ["education", "school", "learning", "academy", "tutor", "library"],
};

function matchesCategory(venue: GooglePlaceVenue, category: string): boolean {
  const keywords = categoryMatchMap[category];
  if (!keywords) return false;
  const venueCat = venue.category.toLowerCase();
  const venueTags = venue.tags.toLowerCase();
  const venueName = venue.name.toLowerCase();
  return keywords.some((kw) => venueCat.includes(kw) || venueTags.includes(kw) || venueName.includes(kw));
}

export function normalizeGoogleCategory(categoryStr: string, tags = "", name = ""): string {
  const combined = `${categoryStr} ${tags} ${name}`.toLowerCase();
  for (const [appCat, keywords] of Object.entries(categoryMatchMap)) {
    if (keywords.some((kw) => combined.includes(kw))) return appCat;
  }
  // Clean up Google's snake_case types
  const cleaned = categoryStr.split(",")[0]?.trim().replace(/_/g, " ") || "Restaurant";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function applyFiltersToVenues(
  venues: GooglePlaceVenue[],
  filters: SearchFilters,
  userLat: number,
  userLng: number
): GooglePlaceVenue[] {
  return venues.filter((v) => {
    if (filters.category && !matchesCategory(v, filters.category)) return false;
    if (filters.minRating !== null && (v.rating ?? 0) < filters.minRating) return false;
    if (filters.maxDistance !== null) {
      const dist = calculateDistance(userLat, userLng, v.latitude, v.longitude);
      if (dist > filters.maxDistance) return false;
    }
    return true;
  });
}

export function useGooglePlacesSearch(query: string, enabled = true, options?: { lat?: number; lng?: number }) {
  const { location } = useUserLocation();
  const { filters } = useSearchFilters();
  const lat = options?.lat ?? location?.latitude ?? SYDNEY_LAT;
  const lng = options?.lng ?? location?.longitude ?? SYDNEY_LNG;
  const radiusMeters = filters.maxDistance ? filters.maxDistance * 1000 : 50000;

  const rawQuery = useQuery({
    queryKey: ["google-places", query, lat, lng, radiusMeters],
    queryFn: () => searchGooglePlaces(query, lat, lng, radiusMeters, 20),
    enabled: enabled && query.length >= 2,
    staleTime: 1000 * 60 * 60,
    retry: 2,
    retryDelay: (attempt) => Math.min(2000 * Math.pow(2, attempt), 15000),
  });

  const data = useMemo(() => {
    if (!rawQuery.data) return undefined;
    return applyFiltersToVenues(rawQuery.data, filters, lat, lng);
  }, [rawQuery.data, filters, lat, lng]);

  return {
    ...rawQuery,
    data,
  };
}
