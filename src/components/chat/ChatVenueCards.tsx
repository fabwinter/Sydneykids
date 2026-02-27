import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Activity {
  id: string;
  name: string;
  category: string;
  rating: number | null;
  hero_image_url: string | null;
  address: string | null;
}

interface ChatVenueCardsProps {
  messageContent: string;
}

// Category fallback icons
const categoryGradients: Record<string, string> = {
  cafe: "from-amber-100 to-orange-100",
  restaurant: "from-red-100 to-pink-100",
  beach: "from-cyan-100 to-blue-100",
  park: "from-green-100 to-emerald-100",
  bar: "from-purple-100 to-violet-100",
  museum: "from-slate-100 to-gray-100",
  bakery: "from-yellow-100 to-amber-100",
};

export function ChatVenueCards({ messageContent }: ChatVenueCardsProps) {
  const [venues, setVenues] = useState<Activity[]>([]);

  useEffect(() => {
    const extractAndFetch = async () => {
      // Extract bold venue names from markdown: **Name (Location)**  or **Name**
      const boldMatches = messageContent.match(/\*\*([^*]+)\*\*/g);
      if (!boldMatches || boldMatches.length === 0) return;

      const venueNames = boldMatches
        .map((m) => m.replace(/\*\*/g, "").trim())
        // Remove parenthetical locations: "The Roastery Rocks (The Rocks)" -> "The Roastery Rocks"
        .map((name) => name.replace(/\s*\([^)]*\)\s*$/, "").trim())
        // Filter out non-venue strings (very short or generic words)
        .filter((name) => name.length > 3 && !name.match(/^(here|note|tip|try|also|open|closed)$/i));

      if (venueNames.length === 0) return;

      // Search for these venues in the database
      const { data } = await supabase
        .from("activities")
        .select("id, name, category, rating, hero_image_url, address")
        .or(venueNames.map((n) => `name.ilike.%${n}%`).join(","))
        .limit(10);

      if (data && data.length > 0) {
        setVenues(data);
      }
    };

    extractAndFetch();
  }, [messageContent]);

  if (venues.length === 0) return null;

  return (
    <div className="mt-2">
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {venues.map((venue) => (
            <Link
              key={venue.id}
              to={`/activity/${venue.id}`}
              className="shrink-0 w-36 rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow group"
            >
              {/* Image */}
              <div className="w-full h-20 overflow-hidden">
                {venue.hero_image_url ? (
                  <img
                    src={venue.hero_image_url}
                    alt={venue.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${categoryGradients[venue.category.toLowerCase()] || "from-muted to-muted/50"} flex items-center justify-center`}>
                    <MapPin className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="p-2">
                <p className="text-xs font-semibold truncate text-foreground">{venue.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] text-muted-foreground capitalize">{venue.category}</span>
                  {venue.rating && (
                    <>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span className="text-[10px] font-medium">{venue.rating}</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
