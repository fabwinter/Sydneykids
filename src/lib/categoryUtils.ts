import {
  Coffee, Waves, TreePine, Utensils, Wine, ShoppingBag, Dumbbell, Landmark, Cake,
  MapPin, Droplets, Trophy, BookOpen, Heart, Hotel, TentTree, Footprints,
  Baby, Users, Home,
} from "lucide-react";

/**
 * Canonical category definitions with icons, colors, and text colors.
 * All lookups should use `getCategoryMeta` for case-insensitive matching.
 */
const categoryDefs = [
  { key: "Cafe", icon: Coffee, bg: "bg-accent", text: "text-accent" },
  { key: "Beach", icon: Waves, bg: "bg-secondary", text: "text-secondary" },
  { key: "Park", icon: TreePine, bg: "bg-green-500", text: "text-green-500" },
  { key: "Restaurant", icon: Utensils, bg: "bg-red-500", text: "text-red-500" },
  { key: "Bar", icon: Wine, bg: "bg-purple-500", text: "text-purple-500" },
  { key: "Shopping", icon: ShoppingBag, bg: "bg-pink-500", text: "text-pink-500" },
  { key: "Gym", icon: Dumbbell, bg: "bg-orange-500", text: "text-orange-500" },
  { key: "Museum", icon: Landmark, bg: "bg-indigo-500", text: "text-indigo-500" },
  { key: "Bakery", icon: Cake, bg: "bg-amber-500", text: "text-amber-500" },
  { key: "Playground", icon: TentTree, bg: "bg-yellow-500", text: "text-yellow-500" },
  { key: "Swimming Pool", icon: Droplets, bg: "bg-cyan-500", text: "text-cyan-500" },
  { key: "tourist attraction", icon: MapPin, bg: "bg-teal-500", text: "text-teal-500" },
  { key: "Sports and Recreation", icon: Trophy, bg: "bg-emerald-600", text: "text-emerald-600" },
  { key: "Daycare", icon: Heart, bg: "bg-rose-500", text: "text-rose-500" },
  { key: "Library", icon: BookOpen, bg: "bg-violet-500", text: "text-violet-500" },
  { key: "Education", icon: BookOpen, bg: "bg-violet-600", text: "text-violet-600" },
  { key: "Hotel", icon: Hotel, bg: "bg-sky-500", text: "text-sky-500" },
  { key: "Walks", icon: Footprints, bg: "bg-lime-600", text: "text-lime-600" },
  { key: "Kids Event", icon: Baby, bg: "bg-orange-400", text: "text-orange-400" },
  { key: "Parent Event", icon: Users, bg: "bg-blue-500", text: "text-blue-500" },
  { key: "Family Event", icon: Home, bg: "bg-teal-500", text: "text-teal-500" },
];

// Build a case-insensitive lookup map
const lowerMap = new Map(categoryDefs.map((d) => [d.key.toLowerCase(), d]));

const defaultMeta = { icon: MapPin, bg: "bg-primary", text: "text-primary" };

export interface CategoryMeta {
  icon: typeof MapPin;
  bg: string;
  text: string;
}

/**
 * Case-insensitive category lookup. Returns icon, bg color class, and text color class.
 */
export function getCategoryMeta(category: string): CategoryMeta {
  return lowerMap.get(category.toLowerCase()) ?? defaultMeta;
}

/**
 * Case-insensitive category filter match.
 * Returns true if the activity category matches the filter category (case-insensitive).
 */
export function categoryMatches(activityCategory: string, filterCategory: string): boolean {
  return activityCategory.toLowerCase() === filterCategory.toLowerCase();
}
