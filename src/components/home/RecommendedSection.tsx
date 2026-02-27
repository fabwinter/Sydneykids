import { useRecommendedActivities } from "@/hooks/useActivities";
import { ActivityCarouselSection } from "./ActivityCarouselSection";

export function RecommendedSection() {
  const { data: activities, isLoading, error } = useRecommendedActivities(15);

  if (error) {
    console.error("Failed to load recommended activities:", error);
  }

  return (
    <ActivityCarouselSection
      title="Recommended For You"
      activities={activities}
      isLoading={isLoading}
      linkTo="/explore?section=recommended"
    />
  );
}
