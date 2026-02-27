import { useState, useEffect } from "react";

interface UserLocation {
  latitude: number;
  longitude: number;
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported");
      setIsLoading(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!mounted) return;
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLoading(false);
      },
      (err) => {
        if (!mounted) return;
        setError(err.message);
        setIsLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );

    return () => {
      mounted = false;
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { location, error, isLoading };
}

/**
 * Calculate distance between two lat/lng points in km using the Haversine formula.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format a distance in km to a human-readable string.
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)} km`;
}
