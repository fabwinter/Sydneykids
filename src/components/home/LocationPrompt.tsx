import { useState, useEffect } from "react";
import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserLocation } from "@/hooks/useUserLocation";

export function LocationPrompt() {
  const { location, error, isLoading } = useUserLocation();
  const [dismissed, setDismissed] = useState(false);

  // Check if already prompted
  useEffect(() => {
    if (localStorage.getItem("location-prompted")) {
      setDismissed(true);
    }
  }, []);

  // Already have location or dismissed
  if (location || dismissed || !isLoading) return null;

  const handleAllow = () => {
    localStorage.setItem("location-prompted", "true");
    // Re-request is handled by useUserLocation hook
    setDismissed(true);
  };

  const handleDismiss = () => {
    localStorage.setItem("location-prompted", "true");
    setDismissed(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleDismiss} />
      <div className="relative bg-card rounded-2xl w-[90%] max-w-sm p-6 text-center space-y-4">
        <button onClick={handleDismiss} className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <MapPin className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-lg font-bold">Enable Location</h2>
        <p className="text-sm text-muted-foreground">
          Allow location access to see activities and events near you.
        </p>
        <Button className="w-full" onClick={handleAllow}>
          Allow Location
        </Button>
        <button onClick={handleDismiss} className="text-sm text-muted-foreground hover:underline">
          Not now
        </button>
      </div>
    </div>
  );
}
