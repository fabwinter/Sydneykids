import { useState } from "react";
import {
  Coffee, Waves, TreePine, Utensils, Landmark, ShoppingBag, Cake,
  SlidersHorizontal, X, Baby, Sun, Home, DollarSign, Dog, Accessibility,
  Wifi, Car, Mountain, Palette, GraduationCap, TentTree, Tent, Bike,
  UtensilsCrossed, Droplets, MapPin, Trophy, BookOpen, Heart, Footprints,
  Navigation,
} from "lucide-react";
import { useSearchFilters } from "@/hooks/useSearchFilters";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  { id: "Library", label: "Libraries", icon: BookOpen },
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

const regions = [
  "City Centre",
  "Sydney Inner West",
  "Sydney Inner East",
  "Sydney East",
  "Sydney West",
  "Western Sydney",
  "South Sydney",
  "Lower North Shore",
  "Upper North Shore",
  "Online",
];

export function FilterChips() {
  const { filters, setCategory, setCuisine, setRegion, toggleTag, toggleAgeGroup, setMaxDistance, setMinRating, clearFilters } = useSearchFilters();
  const [isOpen, setIsOpen] = useState(false);

  const activeFilterCount =
    (filters.category ? 1 : 0) +
    (filters.cuisine ? 1 : 0) +
    (filters.region ? 1 : 0) +
    filters.tags.length +
    filters.ageGroups.length +
    (filters.maxDistance !== null ? 1 : 0) +
    (filters.minRating !== null ? 1 : 0) +
    (filters.isOpen ? 1 : 0);

  return (
    <div className="space-y-3">
      {/* Top row: category chips + filter button */}
      <div className="flex gap-2 items-center">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 flex-1">
          {categories.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCategory(filters.category === id ? null : id)}
              className={`filter-chip flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                filters.category === id ? "active" : ""
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Filter toggle button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="filter-chip flex items-center gap-1.5 shrink-0 relative">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
            <SheetHeader className="pb-2">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-lg font-bold">Filters</SheetTitle>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-sm text-muted-foreground">
                    Clear all
                  </Button>
                )}
              </div>
            </SheetHeader>
            <ScrollArea className="h-[calc(85vh-120px)]">
              <div className="space-y-6 pb-6 pr-2">
                {/* Distance slider */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Travel distance</h3>
                  <div className="px-1">
                    <Slider
                      value={[filters.maxDistance ?? 20]}
                      onValueChange={([val]) => setMaxDistance(val === 20 ? null : val)}
                      min={1}
                      max={20}
                      step={1}
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

                {/* Rating filter */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Minimum rating</h3>
                  <div className="flex gap-2">
                    {[null, 3, 3.5, 4, 4.5].map((rating) => (
                      <button
                        key={rating ?? "any"}
                        onClick={() => setMinRating(rating)}
                        className={`filter-chip text-xs ${
                          filters.minRating === rating ? "active" : ""
                        }`}
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
                      <button
                        key={id}
                        onClick={() => toggleTag(id)}
                        className={`filter-chip flex items-center gap-1.5 text-xs ${
                          filters.tags.includes(id) ? "active" : ""
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age groups */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Kids age group</h3>
                  <div className="flex flex-wrap gap-2">
                    {ageGroups.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => toggleAgeGroup(id)}
                        className={`filter-chip flex items-center gap-1.5 text-xs ${
                          filters.ageGroups.includes(id) ? "active" : ""
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Family amenities */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Family amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {familyTags.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => toggleTag(id)}
                        className={`filter-chip flex items-center gap-1.5 text-xs ${
                          filters.tags.includes(id) ? "active" : ""
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Region */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Region</h3>
                  <div className="flex flex-wrap gap-2">
                    {regions.map((region) => (
                      <button
                        key={region}
                        onClick={() => setRegion(filters.region === region ? null : region)}
                        className={`filter-chip flex items-center gap-1.5 text-xs ${
                          filters.region === region ? "active" : ""
                        }`}
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        {region}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category (in expanded view too) */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Category</h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setCategory(filters.category === id ? null : id)}
                        className={`filter-chip flex items-center gap-1.5 text-xs ${
                          filters.category === id ? "active" : ""
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cuisine */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Cuisine</h3>
                  <div className="flex flex-wrap gap-2">
                    {cuisineCategories.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setCuisine(filters.cuisine === id ? null : id)}
                        className={`filter-chip flex items-center gap-1.5 text-xs ${
                          filters.cuisine === id ? "active" : ""
                        }`}
                      >
                        <UtensilsCrossed className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Apply button */}
            <div className="pt-3 border-t border-border">
              <Button className="w-full" onClick={() => setIsOpen(false)}>
                Show results
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
