import { TreePine, Trophy, Moon, Coffee } from "lucide-react";
import {
  useOutdoorActivities,
  useBestOfActivities,
  useNightlifeActivities,
  useActivitiesByCategories,
} from "@/hooks/useCuratedActivities";
import { ActivityCarouselSection } from "./ActivityCarouselSection";

export function CuratedSections() {
  const outdoor = useOutdoorActivities(15);
  const bestOf = useBestOfActivities(15);
  const nightlife = useNightlifeActivities(15);
  const cafes = useActivitiesByCategories(["Cafe", "Bakery"], 15, "cafes");

  return (
    <>
      <ActivityCarouselSection
        title="Sydney Walks & Outdoors"
        subtitle="Beaches, parks, and coastal trails"
        icon={<TreePine className="w-5 h-5 text-emerald-500" />}
        activities={outdoor.data}
        isLoading={outdoor.isLoading}
        linkTo="/explore?section=outdoor"
      />

      <ActivityCarouselSection
        title="Best of Sydney"
        subtitle="Top-rated spots locals love"
        icon={<Trophy className="w-5 h-5 text-amber-500" />}
        activities={bestOf.data}
        isLoading={bestOf.isLoading}
        linkTo="/explore?section=best-of"
      />

      <ActivityCarouselSection
        title="Cafes & Bakeries"
        subtitle="Your next favourite coffee spot"
        icon={<Coffee className="w-5 h-5 text-amber-700" />}
        activities={cafes.data}
        isLoading={cafes.isLoading}
        linkTo="/explore?section=cafes"
      />

      <ActivityCarouselSection
        title="Nightlife & Dining"
        subtitle="Bars, restaurants, and late-night eats"
        icon={<Moon className="w-5 h-5 text-violet-500" />}
        activities={nightlife.data}
        isLoading={nightlife.isLoading}
        linkTo="/explore?section=nightlife"
      />
    </>
  );
}
