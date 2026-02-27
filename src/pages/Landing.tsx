import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HeroSlideshow } from "@/components/ui/HeroSlideshow";
import { triggerHaptic } from "@/lib/haptics";
import { supabase } from "@/integrations/supabase/client";

const heroImages = [
  "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1600&h=900&fit=crop",
  "https://images.unsplash.com/photo-1523428096881-5bd79d043006?w=1600&h=900&fit=crop",
  "https://images.unsplash.com/photo-1598948485421-33a1655d3c18?w=1600&h=900&fit=crop",
  "https://images.unsplash.com/photo-1624138784614-87fd1b6528f8?w=1600&h=900&fit=crop",
];

export default function Landing() {
  const navigate = useNavigate();

  // Redirect authenticated users to home
  useEffect(() => {
    // Set up listener FIRST to catch incoming auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Landing] onAuthStateChange:", event, !!session);
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        if (session) {
          console.log("[Landing] Redirecting to /home from event:", event);
          navigate("/home", { replace: true });
        }
      }
    });

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[Landing] getSession result:", !!session);
      if (session) {
        navigate("/home", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleStart = () => {
    triggerHaptic("medium");
    navigate("/home");
  };

  return (
    <div className="h-screen overflow-hidden">
      <HeroSlideshow
        images={heroImages}
        title="One app for all your Sydney adventures"
        subtitle="Join thousands exploring the best cafes, beaches, and hidden gems across Australia's most vibrant city."
        ctaText="Start Exploring"
        onCtaClick={handleStart}
      />
    </div>
  );
}
