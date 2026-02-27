import { AppLayout } from "@/components/layout/AppLayout";
import { ControlPanel } from "@/components/home/ControlPanel";
import { HeroFeatured } from "@/components/home/HeroFeatured";
import { FeaturedSection } from "@/components/home/FeaturedSection";
import { RecommendedSection } from "@/components/home/RecommendedSection";
import { CuratedSections } from "@/components/home/CuratedSections";
import { FoursquareSection } from "@/components/home/FoursquareSection";
import { GoogleSection } from "@/components/home/GoogleSection";
import { SearchResultsGrid } from "@/components/home/SearchResultsGrid";
import { LocationPrompt } from "@/components/home/LocationPrompt";
import { useSearchFilters } from "@/hooks/useSearchFilters";
import { useRecommendedActivities } from "@/hooks/useActivities";

const Index = () => {
  const { hasActiveFilters } = useSearchFilters();
  const isFiltering = hasActiveFilters();
  const { data: activities, isLoading } = useRecommendedActivities(isFiltering ? 200 : 15);

  return (
    <AppLayout>
      <LocationPrompt />
      <div className="bg-background">
        {/* Hero Featured section with floating search */}
        {!isFiltering && (
          <div className="relative">
            <HeroFeatured />
            {/* Floating search bar overlaid on hero */}
            <div className="absolute top-4 left-4 right-4 z-20">
              <ControlPanel />
            </div>
          </div>
        )}

        {isFiltering ? (
          <div className="max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-8 py-6 md:py-8 space-y-8">
            <ControlPanel />
            <SearchResultsGrid activities={activities} isLoading={isLoading} />
          </div>
        ) : (
          <div className="px-4 md:px-0 py-6 md:py-8 space-y-8">
            <div id="featured-section">
              <FeaturedSection />
            </div>
            <RecommendedSection />
            <CuratedSections />
            <FoursquareSection />
            <GoogleSection />
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
