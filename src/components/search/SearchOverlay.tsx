import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search, X, SlidersHorizontal, Coffee, Waves, TreePine, Utensils, Landmark,
  ShoppingBag, Cake, Sun, Home, DollarSign, Baby, Dog, Accessibility,
  Wifi, Car, Mountain, Palette, Loader2, GraduationCap, TentTree, Tent, Bike,
  Droplets, MapPin, Trophy, BookOpen, Heart, Footprints,
} from "lucide-react";
import { useSearchFilters } from "@/hooks/useSearchFilters";
import { useAuth } from "@/hooks/useAuth";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

const categories = [
  { id: "Cafe", label: "Cafes", icon: Coffee },
  { id: "Beach", label: "Beaches", icon: Waves },
  { id: "Park", label: "Parks", icon: TreePine },
  { id: "Restaurant", label: "Restaurants", icon: Utensils },
  { id: "Museum", label: "Museums", icon: Landmark },
  { id: "Shopping", label: "Shopping", icon: ShoppingBag },
  { id: "Bakery", label: "Bakeries", icon: Cake },
  { id: "Playground", label: "Playgrounds", icon: TentTree },
  { id: "Swimming Pool", label: "Pools", icon: Droplets },
  { id: "tourist attraction", label: "Attractions", icon: MapPin },
  { id: "Sports and Recreation", label: "Sports & Rec", icon: Trophy },
  { id: "Daycare", label: "Childcare", icon: Heart },
  { id: "Education", label: "Education", icon: BookOpen },
  { id: "Walks", label: "Walks", icon: Footprints },
];

const cuisineCategories = [
  { id: "Pizza", label: "Pizza", icon: Utensils },
  { id: "Thai", label: "Thai", icon: Utensils },
  { id: "Japanese", label: "Japanese", icon: Utensils },
  { id: "Italian", label: "Italian", icon: Utensils },
  { id: "Mexican", label: "Mexican", icon: Utensils },
  { id: "Chinese", label: "Chinese", icon: Utensils },
  { id: "Indian", label: "Indian", icon: Utensils },
  { id: "Korean", label: "Korean", icon: Utensils },
  { id: "Vietnamese", label: "Vietnamese", icon: Utensils },
  { id: "Seafood", label: "Seafood", icon: Utensils },
  { id: "Brunch", label: "Brunch", icon: Coffee },
];

const experienceTags = [
  { id: "outdoor", label: "Outdoors", icon: Sun },
  { id: "indoor", label: "Indoor", icon: Home },
  { id: "free", label: "Free", icon: DollarSign },
  { id: "pet-friendly", label: "Pet Friendly", icon: Dog },
  { id: "accessible", label: "Accessible", icon: Accessibility },
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "parking", label: "Parking", icon: Car },
  { id: "outdoor-seating", label: "Outdoor Seating", icon: Mountain },
];

const familyTags = [
  { id: "play-area", label: "Play Area", icon: TentTree },
  { id: "pram-accessible", label: "Pram Accessible", icon: Baby },
  { id: "change-rooms", label: "Change Rooms", icon: Baby },
  { id: "high-chairs", label: "High Chairs", icon: Baby },
  { id: "educational", label: "Educational", icon: GraduationCap },
  { id: "nature-adventure", label: "Nature & Adventure", icon: Tent },
  { id: "active-play", label: "Active Play", icon: Bike },
  { id: "arts-culture", label: "Arts & Culture", icon: Palette },
];

const ageGroups = [
  { id: "baby", label: "Baby (0–2)", icon: Baby },
  { id: "toddler", label: "Toddler (3–5)", icon: Baby },
  { id: "kids", label: "Kids (6–12)", icon: TentTree },
  { id: "teens", label: "Teens (13–17)", icon: GraduationCap },
];

const allSuggestions = [
  ...categories.map((c) => ({ type: "category" as const, id: c.id, label: c.label, icon: c.icon })),
  ...cuisineCategories.map((c) => ({ type: "cuisine" as const, id: c.id, label: c.label, icon: c.icon })),
  ...experienceTags.map((t) => ({ type: "tag" as const, id: t.id, label: t.label, icon: t.icon })),
  ...familyTags.map((t) => ({ type: "tag" as const, id: t.id, label: t.label, icon: t.icon })),
];

interface SearchOverlayProps {
  className?: string;
  variant?: "home" | "map";
}

export function SearchOverlay({ className = "", variant = "home" }: SearchOverlayProps) {
  const { filters, setQuery, setCategory, setCuisine, toggleTag, toggleAgeGroup, setMaxDistance, setMinRating, setIsOpen, clearFilters } = useSearchFilters();
  const { profile, isAuthenticated } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [searching, setSearching] = useState(false);
  const [localQuery, setLocalQuery] = useState(filters.query);
  const [predictions, setPredictions] = useState<{ id: string; name: string; category: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const firstName = profile?.name?.split(" ")[0];
  const placeholder = isAuthenticated && firstName ? `Hi ${firstName}, where to today?` : "Where to today?";

  useEffect(() => { setLocalQuery(filters.query); }, [filters.query]);

  // Predictive search
  useEffect(() => {
    if (localQuery.length < 2) { setPredictions([]); return; }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("activities")
        .select("id, name, category")
        .or(`name.ilike.%${localQuery}%,category.ilike.%${localQuery}%,address.ilike.%${localQuery}%`)
        .limit(6);
      setPredictions(data ?? []);
    }, 250);
    return () => clearTimeout(timeout);
  }, [localQuery]);

  const matchedSuggestions = useMemo(() => {
    if (localQuery.length < 1) return [];
    const q = localQuery.toLowerCase();
    return allSuggestions.filter((s) => s.label.toLowerCase().includes(q)).slice(0, 4);
  }, [localQuery]);

  // Active filter chips
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (filters.category) {
      const cat = categories.find((c) => c.id === filters.category);
      chips.push({ key: "cat", label: cat?.label ?? filters.category, onRemove: () => setCategory(null) });
    }
    if (filters.cuisine) {
      chips.push({ key: "cuisine", label: filters.cuisine, onRemove: () => setCuisine(null) });
    }
    if (filters.maxDistance !== null) {
      chips.push({ key: "dist", label: `≤${filters.maxDistance}km`, onRemove: () => setMaxDistance(null) });
    }
    if (filters.minRating !== null) {
      chips.push({ key: "rating", label: `${filters.minRating}+ ★`, onRemove: () => setMinRating(null) });
    }
    if (filters.isOpen) {
      chips.push({ key: "open", label: "Open Now", onRemove: () => setIsOpen(false) });
    }
    filters.tags.forEach((tag) => {
      const found = [...experienceTags, ...familyTags].find((t) => t.id === tag);
      chips.push({ key: tag, label: found?.label ?? tag, onRemove: () => toggleTag(tag) });
    });
    filters.ageGroups.forEach((ag) => {
      const found = ageGroups.find((a) => a.id === ag);
      chips.push({ key: `age-${ag}`, label: found?.label ?? ag, onRemove: () => toggleAgeGroup(ag) });
    });
    return chips;
  }, [filters, setCategory, setMaxDistance, setMinRating, setIsOpen, toggleTag]);

  // Close on outside click
  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [expanded]);

  // Prevent body scroll when expanded
  useEffect(() => {
    if (expanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [expanded]);

  const handleSearch = () => {
    setQuery(localQuery);
    setSearching(true);
    setExpanded(false);
    setTimeout(() => setSearching(false), 600);
  };

  const handlePredictionClick = (name: string) => {
    setLocalQuery(name);
    setQuery(name);
    setExpanded(false);
    setSearching(true);
    setTimeout(() => setSearching(false), 600);
  };

  const handleSuggestionClick = (suggestion: typeof allSuggestions[0]) => {
    if (suggestion.type === "category") {
      setCategory(filters.category === suggestion.id ? null : suggestion.id);
    } else if (suggestion.type === "cuisine") {
      setCuisine(filters.cuisine === suggestion.id ? null : suggestion.id);
    } else {
      toggleTag(suggestion.id);
    }
  };

  const wrapperClass = variant === "home"
    ? "bg-transparent"
    : "bg-transparent";

  return (
    <div ref={containerRef} className={`relative z-30 ${className}`}>
      <div className={`${wrapperClass} p-3 md:p-4 relative z-[31]`}>
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onFocus={() => setExpanded(true)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={searching ? "Searching…" : placeholder}
            className="search-input shadow-soft"
          />
          {localQuery && (
            <button
              onClick={() => { setLocalQuery(""); setQuery(""); setPredictions([]); }}
              className="absolute right-14 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
              activeChips.length > 0
                ? "bg-primary text-primary-foreground"
                : "bg-primary/10 hover:bg-primary/20"
            }`}
          >
            <SlidersHorizontal className={`w-5 h-5 ${activeChips.length > 0 ? "" : "text-primary"}`} />
            {activeChips.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {activeChips.length}
              </span>
            )}
          </button>
        </div>

        {/* Active filter chips (collapsed state) */}
        {activeChips.length > 0 && !expanded && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mt-2 py-1">
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                onClick={chip.onRemove}
                className="filter-chip active flex items-center gap-1 text-xs shrink-0"
              >
                {chip.label}
                <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}

        {/* Searching indicator */}
        {searching && !expanded && (
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            Searching…
          </div>
        )}
      </div>

      {/* Expanding filter panel - animates down from search bar */}
      <AnimatePresence>
        {expanded && (
          <>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden -mt-1 pt-4 relative z-[30]"
              style={{ originY: 0 }}
            >
              <div className="px-4 pb-4 max-h-[70dvh] overflow-y-auto overscroll-contain">
                {/* Predictions */}
                {(predictions.length > 0 || matchedSuggestions.length > 0) && localQuery.length >= 1 && (
                  <div className="mb-4 space-y-1">
                    {matchedSuggestions.map((s) => {
                      const Icon = s.icon;
                      const isActive = s.type === "category" ? filters.category === s.id : filters.tags.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => handleSuggestionClick(s)}
                          className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                          }`}
                        >
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span>{s.label}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{s.type === "category" ? "Category" : "Filter"}</span>
                        </button>
                      );
                    })}
                    {predictions.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handlePredictionClick(p.name)}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
                      >
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <span>{p.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{p.category}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-5">
                  {/* Distance slider */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Travel distance</h3>
                    <div className="px-1">
                      <Slider
                        value={[filters.maxDistance ?? 20]}
                        onValueChange={([val]) => setMaxDistance(val === 20 ? null : val)}
                        min={1} max={20} step={1}
                      />
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>1 km</span>
                        <span className="font-medium text-foreground">
                          {filters.maxDistance ? `${filters.maxDistance} km` : "Any distance"}
                        </span>
                        <span>20 km</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Minimum rating</h3>
                    <div className="flex gap-2">
                      {[null, 3, 3.5, 4, 4.5].map((rating) => (
                        <button
                          key={rating ?? "any"}
                          onClick={() => setMinRating(rating)}
                          className={`filter-chip text-xs ${filters.minRating === rating ? "active" : ""}`}
                        >
                          {rating ? `${rating}+ ★` : "Any"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Experience type */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Experience type</h3>
                    <div className="flex flex-wrap gap-2">
                      {experienceTags.map(({ id, label, icon: Icon }) => (
                        <button key={id} onClick={() => toggleTag(id)}
                          className={`filter-chip flex items-center gap-1.5 text-xs ${filters.tags.includes(id) ? "active" : ""}`}
                        >
                          <Icon className="w-3.5 h-3.5" />{label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Age groups */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Kids age group</h3>
                    <div className="flex flex-wrap gap-2">
                      {ageGroups.map(({ id, label, icon: Icon }) => (
                        <button key={id} onClick={() => toggleAgeGroup(id)}
                          className={`filter-chip flex items-center gap-1.5 text-xs ${filters.ageGroups.includes(id) ? "active" : ""}`}
                        >
                          <Icon className="w-3.5 h-3.5" />{label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Family amenities */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Family amenities</h3>
                    <div className="flex flex-wrap gap-2">
                      {familyTags.map(({ id, label, icon: Icon }) => (
                        <button key={id} onClick={() => toggleTag(id)}
                          className={`filter-chip flex items-center gap-1.5 text-xs ${filters.tags.includes(id) ? "active" : ""}`}
                        >
                          <Icon className="w-3.5 h-3.5" />{label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Category</h3>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(({ id, label, icon: Icon }) => (
                        <button key={id} onClick={() => setCategory(filters.category === id ? null : id)}
                          className={`filter-chip flex items-center gap-1.5 text-xs ${filters.category === id ? "active" : ""}`}
                        >
                          <Icon className="w-3.5 h-3.5" />{label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cuisine */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Cuisine</h3>
                    <div className="flex flex-wrap gap-2">
                      {cuisineCategories.map(({ id, label }) => (
                        <button key={id} onClick={() => setCuisine(filters.cuisine === id ? null : id)}
                          className={`filter-chip flex items-center gap-1.5 text-xs ${filters.cuisine === id ? "active" : ""}`}
                        >
                          <Utensils className="w-3.5 h-3.5" />{label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Search button + clear */}
              <div className="px-4 py-3 border-t border-border flex gap-2">
                {activeChips.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-sm text-muted-foreground">
                    Clear all
                  </Button>
                )}
                <Button className="flex-1" onClick={handleSearch}>
                  Search
                </Button>
              </div>
            </motion.div>

            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/20 z-[-1]" onClick={() => setExpanded(false)} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
