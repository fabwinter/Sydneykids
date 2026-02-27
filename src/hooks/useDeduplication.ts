import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateDistance } from "@/hooks/useUserLocation";

interface DbVenueRef {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  foursquare_id: string | null;
}

/** Normalize a name for fuzzy comparison */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Check if two names are similar enough to be duplicates */
function namesSimilar(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  // Check word overlap ratio
  const wordsA = new Set(na.split(" "));
  const wordsB = new Set(nb.split(" "));
  const intersection = [...wordsA].filter((w) => wordsB.has(w));
  const minLen = Math.min(wordsA.size, wordsB.size);
  return minLen > 0 && intersection.length / minLen >= 0.7;
}

/** Returns true if the external venue likely already exists in the DB */
function isDuplicate(
  externalName: string,
  externalLat: number,
  externalLng: number,
  externalId: string | null,
  dbVenues: DbVenueRef[]
): DbVenueRef | null {
  for (const db of dbVenues) {
    // Exact external ID match (foursquare_id includes google- prefix)
    if (externalId && db.foursquare_id === externalId) return db;

    // Name similarity + within 200m
    const dist = calculateDistance(db.latitude, db.longitude, externalLat, externalLng);
    if (dist < 0.2 && namesSimilar(externalName, db.name)) return db;
  }
  return null;
}

/** Hook to fetch lightweight DB venue list for deduplication */
export function useDeduplication() {
  const { data: dbVenues } = useQuery({
    queryKey: ["dedup-db-venues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("id, name, latitude, longitude, foursquare_id")
        .limit(1000);
      if (error) throw error;
      return data as DbVenueRef[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const checkDuplicate = useMemo(() => {
    if (!dbVenues) return () => null;
    return (name: string, lat: number, lng: number, externalId: string | null) =>
      isDuplicate(name, lat, lng, externalId, dbVenues);
  }, [dbVenues]);

  return { checkDuplicate, dbVenues: dbVenues ?? [] };
}

/** Filter external venues, returning non-duplicates and duplicates separately */
export function useFilteredExternalVenues<T extends { id: string; name: string; latitude: number; longitude: number }>(
  venues: T[] | undefined,
  source: "foursquare" | "google"
) {
  const { checkDuplicate } = useDeduplication();

  return useMemo(() => {
    if (!venues) return { unique: undefined, duplicates: [] };

    const unique: T[] = [];
    const duplicates: { venue: T; dbMatch: DbVenueRef }[] = [];

    for (const v of venues) {
      const externalId = source === "foursquare" ? v.id : `google-${v.id}`;
      const match = checkDuplicate(v.name, v.latitude, v.longitude, externalId);
      if (match) {
        duplicates.push({ venue: v, dbMatch: match });
      } else {
        unique.push(v);
      }
    }

    return { unique, duplicates };
  }, [venues, checkDuplicate, source]);
}
