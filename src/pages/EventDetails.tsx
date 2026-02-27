import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  MapPin,
  Clock,
  Phone,
  Globe,
  Calendar,
  Ticket,
  ExternalLink,
  Share2,
  Facebook,
  Instagram,
  Hash,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { LocationMap } from "@/components/activity/LocationMap";
import { useActivityById } from "@/hooks/useActivities";
import { useActivityPhotos } from "@/hooks/useReviews";
import { useIsActivitySaved, useToggleSavedItem } from "@/hooks/useSavedItems";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { AdminPanel } from "@/components/activity/AdminPanel";
import { toast } from "sonner";

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const { data: activity, isLoading, error } = useActivityById(id || "");
  const { data: photos } = useActivityPhotos(id || "");
  const { data: isSaved } = useIsActivitySaved(id || "");
  const toggleSaved = useToggleSavedItem();
  const [heroIndex, setHeroIndex] = useState(0);

  const handleToggleSave = () => {
    if (!user) {
      toast.error("Please sign in to save events");
      navigate("/login");
      return;
    }
    toggleSaved.mutate({ activityId: id!, isSaved: isSaved || false });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: activity?.name, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-72 w-full" />
        <div className="px-4 py-6 space-y-4 max-w-3xl mx-auto">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold">Event not found</h2>
          <p className="text-muted-foreground mt-2">This event doesn't exist or has been removed.</p>
          <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  const heroUrl = activity.hero_image_url || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1600&h=900&fit=crop&q=90";
  const galleryUrls = (photos?.map(p => p.photo_url) || []).filter(url => url !== heroUrl);
  const allPhotos = [heroUrl, ...galleryUrls];

  return (
    <div className="min-h-screen bg-background pb-24">
      {isAdmin && <AdminPanel activity={activity} />}

      {/* Hero Image / Carousel */}
      <div className="relative h-64 sm:h-80 md:h-[24rem] lg:h-[28rem]">
        {allPhotos.length === 1 ? (
          <img src={allPhotos[0]} alt={activity.name} className="w-full h-full object-cover" />
        ) : allPhotos.length === 2 ? (
          <div className="w-full h-full grid grid-cols-2 gap-0.5">
            {allPhotos.map((url, i) => (
              <img key={i} src={url} alt={`${activity.name} ${i + 1}`} className="w-full h-full object-cover" />
            ))}
          </div>
        ) : allPhotos.length === 3 ? (
          <div className="w-full h-full grid grid-cols-2 gap-0.5">
            <img src={allPhotos[0]} alt={`${activity.name} 1`} className="w-full h-full object-cover row-span-2" />
            <img src={allPhotos[1]} alt={`${activity.name} 2`} className="w-full h-full object-cover" />
            <img src={allPhotos[2]} alt={`${activity.name} 3`} className="w-full h-full object-cover" />
          </div>
        ) : allPhotos.length === 4 ? (
          <div className="w-full h-full grid grid-cols-3 gap-0.5">
            <img src={allPhotos[0]} alt={`${activity.name} 1`} className="w-full h-full object-cover col-span-2 row-span-2" />
            <img src={allPhotos[1]} alt={`${activity.name} 2`} className="w-full h-full object-cover" />
            <img src={allPhotos[2]} alt={`${activity.name} 3`} className="w-full h-full object-cover" />
          </div>
        ) : (
          /* Carousel for 5+ images */
          <>
            <img src={allPhotos[heroIndex]} alt={activity.name} className="w-full h-full object-cover" />
            <button
              onClick={() => setHeroIndex((heroIndex - 1 + allPhotos.length) % allPhotos.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setHeroIndex((heroIndex + 1) % allPhotos.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
              {heroIndex + 1}/{allPhotos.length}
            </div>
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors z-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 py-5 space-y-6 max-w-3xl mx-auto">
        {/* Category badge + Title */}
        <div>
          {activity.category && (
            <Badge variant="secondary" className="mb-2 text-xs font-semibold">
              {activity.category}
            </Badge>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{activity.name}</h1>
        </div>

        {/* Info Bar: Location | When | Cost */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-card border border-border">
          {/* Location */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <MapPin className="w-3.5 h-3.5" />
              Location
            </div>
            <p className="text-sm text-foreground">{activity.address || "Location TBA"}</p>
            {activity.latitude && activity.longitude && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${activity.latitude},${activity.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
              >
                ↗ Get directions
              </a>
            )}
          </div>

          {/* When */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <Calendar className="w-3.5 h-3.5" />
              When
            </div>
            <p className="text-sm text-foreground">
              {activity.event_dates || (activity.hours_open && activity.hours_close
                ? `${activity.hours_open} – ${activity.hours_close}`
                : "Date TBA")}
            </p>
          </div>

          {/* Cost */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <Ticket className="w-3.5 h-3.5" />
              Cost
            </div>
            <p className="text-sm font-medium text-foreground">{activity.event_cost || "Free"}</p>
            {activity.ticket_url && (
              <a
                href={activity.ticket_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
              >
                Book tickets <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Save to Events button */}
        <Button
          onClick={handleToggleSave}
          variant={isSaved ? "secondary" : "default"}
          className="w-full gap-2"
          size="lg"
        >
          <Heart className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
          {isSaved ? "Saved to Events" : "Save to Events"}
        </Button>

        {/* Description */}
        {activity.description && (
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">Overview</h2>
            <p className="text-foreground text-sm md:text-base leading-relaxed whitespace-pre-line">
              {activity.description}
            </p>
          </section>
        )}

        {/* Organizer / Contact */}
        {(activity.organizer_name || activity.phone || activity.website || activity.organizer_facebook || activity.organizer_instagram) && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">Contact event organiser</h2>
            <div className="space-y-2.5">
              {activity.organizer_name && (
                <p className="text-sm font-semibold text-foreground uppercase tracking-wide">{activity.organizer_name}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activity.phone && (
                  <a href={`tel:${activity.phone}`} className="flex items-center gap-3 text-sm text-foreground hover:text-primary">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {activity.phone}
                  </a>
                )}
                {(activity.website || activity.organizer_website) && (
                  <a
                    href={(activity.organizer_website || activity.website || "").startsWith("http") ? (activity.organizer_website || activity.website) : `https://${activity.organizer_website || activity.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-foreground hover:text-primary"
                  >
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    Website
                  </a>
                )}
                {activity.organizer_facebook && (
                  <a
                    href={activity.organizer_facebook.startsWith("http") ? activity.organizer_facebook : `https://facebook.com/${activity.organizer_facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-foreground hover:text-primary"
                  >
                    <Facebook className="w-4 h-4 text-muted-foreground" />
                    Facebook
                  </a>
                )}
                {activity.organizer_instagram && (
                  <a
                    href={activity.organizer_instagram.startsWith("http") ? activity.organizer_instagram : `https://instagram.com/${activity.organizer_instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-foreground hover:text-primary"
                  >
                    <Instagram className="w-4 h-4 text-muted-foreground" />
                    Instagram
                  </a>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Location Map */}
        {activity.latitude && activity.longitude && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">Location</h2>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="space-y-2 md:w-1/3">
                <p className="text-sm font-semibold text-foreground">{activity.name}</p>
                <p className="text-sm text-muted-foreground">{activity.address}</p>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${activity.latitude},${activity.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
                >
                  <MapPin className="w-4 h-4" />
                  Get Directions
                </a>
              </div>
              <div className="md:w-2/3">
                <LocationMap latitude={activity.latitude} longitude={activity.longitude} name={activity.name} showRefresh />
              </div>
            </div>
          </section>
        )}

        {/* Source link - admin only */}
        {isAdmin && activity.source_url && (
          <a
            href={activity.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <ExternalLink className="w-4 h-4" />
            View original listing
          </a>
        )}
      </div>
    </div>
  );
}
