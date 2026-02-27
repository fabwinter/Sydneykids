import { useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MediaLightbox } from "@/components/ui/MediaLightbox";
import {
  ArrowLeft,
  Heart,
  MapPin,
  Clock,
  Phone,
  Globe,
  Car,
  Wifi,
  Accessibility,
  Star,
  ChevronRight,
  ChevronLeft,
  Check,
  PawPrint,
  UtensilsCrossed,
  Baby,
  Armchair,
  Shirt,
  Sun,
  Coffee,
  Plug,
  ShowerHead,
  Bike,
  CalendarCheck,
  ListPlus,
  Camera,
  Pencil,
  Trash2,
  Loader2,
  X,
  Move,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckInModal } from "@/components/activity/CheckInModal";
import { ShareMenu } from "@/components/activity/ShareMenu";
import { AddToPlaylistModal } from "@/components/activity/AddToPlaylistModal";
import { AddToCalendarModal } from "@/components/activity/AddToCalendarModal";
import { LocationMap } from "@/components/activity/LocationMap";
import { useActivityById } from "@/hooks/useActivities";
import { useActivityReviews, useActivityPhotos } from "@/hooks/useReviews";
import { useIsActivitySaved, useToggleSavedItem } from "@/hooks/useSavedItems";
import { useActivityCheckIns } from "@/hooks/useActivityCheckIns";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { AdminPanel } from "@/components/activity/AdminPanel";
import { toast } from "sonner";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function ActivityDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [visitIndex, setVisitIndex] = useState(0);
  const [editingCheckIn, setEditingCheckIn] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [editPhotoUrls, setEditPhotoUrls] = useState<string[]>([]);
  const [editNewFiles, setEditNewFiles] = useState<File[]>([]);
  const [editNewPreviews, setEditNewPreviews] = useState<string[]>([]);
  const [isUploadingEditPhoto, setIsUploadingEditPhoto] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPosition, setHeroPosition] = useState("center");
  const [lightboxOpen, setLightboxOpen] = useState<{ urls: string[]; index: number } | null>(null);
  const queryClient = useQueryClient();

  const { data: activity, isLoading: activityLoading, error } = useActivityById(id || "");
  const { data: reviews, isLoading: reviewsLoading } = useActivityReviews(id || "");
  const { data: photos } = useActivityPhotos(id || "");
  const { data: isSaved } = useIsActivitySaved(id || "");
  const { data: checkIns } = useActivityCheckIns(id || "");
  const toggleSaved = useToggleSavedItem();

  const visitCount = checkIns?.length || 0;
  const currentVisit = checkIns?.[visitIndex] || null;

  const deleteCheckIn = useMutation({
    mutationFn: async (checkInId: string) => {
      const { error } = await supabase.from("check_ins").delete().eq("id", checkInId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-check-ins"] });
      queryClient.invalidateQueries({ queryKey: ["check-in-timeline"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setVisitIndex(0);
      toast.success("Check-in deleted");
    },
    onError: () => toast.error("Failed to delete check-in"),
  });

  const updateCheckIn = useMutation({
    mutationFn: async ({ checkInId, rating, comment, photoUrl, photoUrls }: { checkInId: string; rating: number; comment: string; photoUrl?: string | null; photoUrls?: string[] }) => {
      const updateData: any = { rating, comment: comment.trim() || null };
      if (photoUrl !== undefined) updateData.photo_url = photoUrl;
      if (photoUrls !== undefined) updateData.photo_urls = photoUrls;
      const { error } = await supabase
        .from("check_ins")
        .update(updateData)
        .eq("id", checkInId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-check-ins"] });
      queryClient.invalidateQueries({ queryKey: ["check-in-timeline"] });
      setEditingCheckIn(null);
      toast.success("Check-in updated");
    },
    onError: () => toast.error("Failed to update check-in"),
  });

  const handleToggleSave = () => {
    if (!user) {
      toast.error("Please sign in to save places");
      navigate("/login");
      return;
    }
    if (!id) return;
    toggleSaved.mutate({ activityId: id, isSaved: isSaved || false });
  };

  const handleCheckIn = () => {
    if (!user) {
      toast.error("Please sign in to check in");
      navigate("/login");
      return;
    }
    setShowCheckIn(true);
  };

  if (activityLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-72 w-full" />
        <div className="px-4 py-4 space-y-6 max-w-lg mx-auto">
          <Skeleton className="h-8 w-3/4" />
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-32 h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold">Activity not found</h2>
          <p className="text-muted-foreground mt-2">This activity doesn't exist or has been removed.</p>
          <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  const heroUrl = activity.hero_image_url || "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1600&h=900&fit=crop&q=90";
  const galleryUrls = (photos?.map(p => p.photo_url) || []).filter(url => url !== heroUrl);
  const allPhotos = [heroUrl, ...galleryUrls];

  const amenities = [
    { icon: Car, label: "Parking", available: activity.parking },
    { icon: Wifi, label: "WiFi", available: activity.wifi },
    { icon: Accessibility, label: "Accessible", available: activity.wheelchair_accessible },
    { icon: UtensilsCrossed, label: "Outdoor Seating", available: activity.outdoor_seating },
    { icon: PawPrint, label: "Pet Friendly", available: activity.pet_friendly },
    { icon: Baby, label: "Family Friendly", available: (activity as any).family_friendly },
    { icon: Armchair, label: "High Chairs", available: (activity as any).high_chairs },
    { icon: Shirt, label: "Change Rooms", available: (activity as any).change_rooms },
    { icon: Coffee, label: "Coffee", available: (activity as any).coffee },
    { icon: Plug, label: "Power Outlets", available: (activity as any).power_outlets },
    { icon: ShowerHead, label: "Showers", available: (activity as any).showers },
    { icon: Bike, label: "Bike Parking", available: (activity as any).bike_parking },
    { icon: Sun, label: "Shade", available: (activity as any).shade },
  ];
  const availableAmenities = amenities.filter(a => a.available);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-12">
      {isAdmin && <AdminPanel activity={activity} />}
      {/* Hero Image Carousel */}
      <div className="relative h-72 sm:h-80 md:h-[28rem] lg:h-[35rem] xl:h-[40rem]">
        <img
          src={allPhotos[heroIndex] || allPhotos[0]}
          alt={activity.name}
          className="w-full h-full object-cover"
          style={{ objectPosition: heroPosition }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent lg:from-black/85 lg:via-black/25" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Desktop title overlay — hidden on mobile */}
        <div className="hidden lg:block absolute bottom-0 inset-x-0 z-10 pb-8">
          <div className="px-8 xl:px-12">
            <h1 className="text-4xl xl:text-5xl font-bold text-white drop-shadow">{activity.name}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
              <span className="text-white/80 text-sm">{activity.category}</span>
              {activity.address && (
                <>
                  <span className="text-white/40 text-xs">•</span>
                  <span className="text-white/70 text-sm">{activity.address.split(",").slice(-2).join(",").trim()}</span>
                </>
              )}
              <span className="text-white/40 text-xs">•</span>
              <span className={`text-sm font-semibold ${activity.is_open ? "text-emerald-400" : "text-rose-400"}`}>
                {activity.is_open ? "Open Now" : "Closed"}
                {activity.hours_close && activity.is_open && ` · Closes ${activity.hours_close}`}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Star className="w-5 h-5 fill-warning text-warning" />
              <span className="text-2xl font-bold text-white">{activity.rating?.toFixed(1) || "—"}</span>
              <span className="text-white/60 text-sm">({(activity.review_count ?? 0).toLocaleString()} reviews)</span>
            </div>
          </div>
        </div>

        {/* Admin crop/position controls */}
        {isAdmin && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
            {["top", "center", "bottom"].map((pos) => (
              <button
                key={pos}
                onClick={() => setHeroPosition(pos)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                  heroPosition === pos ? "bg-white text-black" : "text-white/70 hover:text-white"
                }`}
              >
                {pos.charAt(0).toUpperCase() + pos.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Carousel nav arrows */}
        {allPhotos.length > 1 && (
          <>
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
          </>
        )}
        {/* Photo counter */}
        {allPhotos.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
            {heroIndex + 1}/{allPhotos.length}
          </div>
        )}
      </div>
      
      <div className="px-4 md:px-6 lg:px-10 py-4 md:py-8 space-y-6 max-w-2xl md:max-w-none mx-auto">
        <div className="md:flex md:gap-8 lg:gap-10">
          {/* Main content column */}
          <div className="md:flex-1 min-w-0 space-y-6">
            {/* Title Block — hidden on desktop (shown in hero overlay) */}
            <div className="lg:hidden">
              <h1 className="text-2xl font-bold text-foreground">{activity.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {activity.category}
                {activity.address && ` • ${activity.address.split(",").slice(-2).join(",").trim()}`}
              </p>
              <p className={`text-sm mt-0.5 ${activity.is_open ? "text-success" : "text-destructive"}`}>
                {activity.is_open ? "Open" : "Closed"}
                {activity.hours_close && !activity.is_open && ` until ${activity.hours_close}`}
                {activity.hours_close && activity.is_open && ` · Closes at ${activity.hours_close}`}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <Star className="w-5 h-5 fill-warning text-warning" />
                <span className="text-lg font-bold">{activity.rating?.toFixed(1) || "—"}</span>
                <span className="text-sm text-muted-foreground">({(activity.review_count ?? 0).toLocaleString()})</span>
              </div>
            </div>

            {/* About */}
            <section>
              <h2 className="section-header">About</h2>
              <div className="md:grid md:grid-cols-2 md:gap-x-6 md:gap-y-4 space-y-4 md:space-y-0">
                {activity.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <a href={`tel:${activity.phone}`} className="text-sm text-primary hover:underline">{activity.phone}</a>
                  </div>
                )}
                {activity.website && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <a href={activity.website.startsWith("http") ? activity.website : `https://${activity.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-foreground truncate">{activity.website}</a>
                  </div>
                )}
                {activity.address && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="text-sm text-foreground">{activity.address}</span>
                  </div>
                )}
                {(activity.hours_open || activity.hours_close) && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="text-sm text-foreground">
                      {activity.hours_open && activity.hours_close
                        ? `${activity.hours_open} – ${activity.hours_close}`
                        : "Hours not available"}
                    </span>
                  </div>
                )}
              </div>
              {activity.description && (
                <p className="text-muted-foreground text-sm leading-relaxed mt-4">{activity.description}</p>
              )}
            </section>

            {/* Photos — horizontal scroll on mobile, grid on desktop */}
            {allPhotos.length > 1 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="section-header mb-0">Photos</h2>
                  <button className="text-sm text-primary font-medium flex items-center gap-1">
                    See all <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                {/* Mobile: horizontal scroll */}
                <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 md:hidden">
                  {allPhotos.map((photo, i) => (
                    <img
                      key={i}
                      src={photo}
                      alt={`${activity.name} ${i + 1}`}
                      className="w-32 h-24 shrink-0 rounded-xl object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setLightboxOpen({ urls: allPhotos, index: i })}
                    />
                  ))}
                </div>
                {/* Desktop: responsive grid */}
                <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {allPhotos.slice(0, 8).map((photo, i) => (
                    <img
                      key={i}
                      src={photo}
                      alt={`${activity.name} ${i + 1}`}
                      className="w-full h-36 lg:h-40 rounded-xl object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setLightboxOpen({ urls: allPhotos, index: i })}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Amenities */}
            {availableAmenities.length > 0 && (
              <section>
                <h2 className="section-header">Amenities</h2>
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {availableAmenities.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1.5 text-foreground">
                      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <span className="text-[11px] text-center leading-tight text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Visits (Check-in History) */}
            {visitCount > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="section-header mb-0">Visits ({visitCount})</h2>
                  <Button size="sm" variant="outline" onClick={handleCheckIn} className="text-xs gap-1">
                    <Check className="w-3 h-3" /> Check-In Again
                  </Button>
                </div>

                {visitCount > 1 && (
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <button
                      onClick={() => setVisitIndex(Math.min(visitIndex + 1, visitCount - 1))}
                      disabled={visitIndex >= visitCount - 1}
                      className="p-1 rounded-full hover:bg-muted disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-muted-foreground font-medium">
                      Visit {visitCount - visitIndex} of {visitCount}
                    </span>
                    <button
                      onClick={() => setVisitIndex(Math.max(visitIndex - 1, 0))}
                      disabled={visitIndex <= 0}
                      className="p-1 rounded-full hover:bg-muted disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {currentVisit && editingCheckIn === currentVisit.id ? (
                  <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                    <div className="flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setEditRating(star)} className="p-0.5">
                          <Star className={`w-6 h-6 ${star <= editRating ? "fill-warning text-warning" : "text-muted"}`} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value.slice(0, 300))}
                      placeholder="Update your comment..."
                      rows={2}
                      className="w-full bg-muted rounded-xl px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const validFiles = files.filter(f => f.size <= 10 * 1024 * 1024);
                        if (validFiles.length < files.length) toast.error("Some files exceed 10MB limit");
                        const newFiles = [...editNewFiles, ...validFiles];
                        setEditNewFiles(newFiles);
                        validFiles.forEach(f => {
                          const reader = new FileReader();
                          reader.onload = (ev) => setEditNewPreviews(prev => [...prev, ev.target?.result as string]);
                          reader.readAsDataURL(f);
                        });
                      }}
                    />
                    {/* Existing + new photos grid */}
                    {(editPhotoUrls.length > 0 || editNewPreviews.length > 0) && (
                      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {editPhotoUrls.map((url, i) => (
                          <div key={`existing-${i}`} className="relative shrink-0">
                            <img src={url} alt={`Photo ${i + 1}`} className="w-20 h-16 rounded-lg object-cover" />
                            <button
                              onClick={() => setEditPhotoUrls(editPhotoUrls.filter((_, j) => j !== i))}
                              className="absolute -top-1 -right-1 p-0.5 rounded-full bg-destructive text-destructive-foreground"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {editNewPreviews.map((url, i) => (
                          <div key={`new-${i}`} className="relative shrink-0">
                            <img src={url} alt={`New ${i + 1}`} className="w-20 h-16 rounded-lg object-cover" />
                            <button
                              onClick={() => {
                                setEditNewFiles(editNewFiles.filter((_, j) => j !== i));
                                setEditNewPreviews(editNewPreviews.filter((_, j) => j !== i));
                              }}
                              className="absolute -top-1 -right-1 p-0.5 rounded-full bg-destructive text-destructive-foreground"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => editFileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors text-sm text-muted-foreground"
                    >
                      <Camera className="w-4 h-4" /> Add photos
                    </button>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditingCheckIn(null); setEditNewFiles([]); setEditNewPreviews([]); }}>Cancel</Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={updateCheckIn.isPending || isUploadingEditPhoto || editRating === 0}
                        onClick={async () => {
                          setIsUploadingEditPhoto(true);
                          try {
                            if (!user) { toast.error("Please sign in"); return; }
                            let finalUrls = [...editPhotoUrls];
                            if (editNewFiles.length > 0) {
                              const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
                              if (!profile) throw new Error("Profile not found");
                              for (const file of editNewFiles) {
                                const ext = file.name.split(".").pop() || "jpg";
                                const path = `${profile.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                                const { error: uploadError } = await supabase.storage.from("check-in-photos").upload(path, file, { contentType: file.type });
                                if (uploadError) throw uploadError;
                                const { data: urlData } = supabase.storage.from("check-in-photos").getPublicUrl(path);
                                finalUrls.push(urlData.publicUrl);
                              }
                            }
                            updateCheckIn.mutate({
                              checkInId: currentVisit.id,
                              rating: editRating,
                              comment: editComment,
                              photoUrl: finalUrls[0] || null,
                              photoUrls: finalUrls,
                            });
                          } catch (err: any) {
                            toast.error(err.message || "Photo upload failed");
                          }
                          setIsUploadingEditPhoto(false);
                        }}
                      >
                        {(updateCheckIn.isPending || isUploadingEditPhoto) ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : currentVisit ? (
                  <div className="bg-card rounded-xl border border-border p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {format(new Date(currentVisit.created_at), "EEE d MMM yyyy, h:mm a")}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < currentVisit.rating ? "fill-warning text-warning" : "text-muted"}`}
                          />
                        ))}
                      </div>
                    </div>
                    {currentVisit.comment && (
                      <p className="text-sm text-muted-foreground italic">"{currentVisit.comment}"</p>
                    )}
                    {(() => {
                      const urls = (currentVisit as any).photo_urls?.length > 0
                        ? (currentVisit as any).photo_urls as string[]
                        : currentVisit.photo_url ? [currentVisit.photo_url] : [];
                      if (urls.length === 0) return null;
                      return (
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
                          {urls.map((url: string, i: number) => (
                            <img
                              key={i}
                              src={url}
                              alt={`Check-in ${i + 1}`}
                              className="w-32 h-24 rounded-lg object-cover shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setLightboxOpen({ urls, index: i })}
                            />
                          ))}
                        </div>
                      );
                    })()}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => {
                          const urls = (currentVisit as any).photo_urls?.length > 0
                            ? [...(currentVisit as any).photo_urls] as string[]
                            : currentVisit.photo_url ? [currentVisit.photo_url] : [];
                          setEditingCheckIn(currentVisit.id);
                          setEditRating(currentVisit.rating);
                          setEditComment(currentVisit.comment || "");
                          setEditPhotoUrls(urls);
                          setEditNewFiles([]);
                          setEditNewPreviews([]);
                        }}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Delete this check-in?")) {
                            deleteCheckIn.mutate(currentVisit.id);
                          }
                        }}
                        disabled={deleteCheckIn.isPending}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>
            )}

            {/* Reviews — in main content on desktop */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="section-header mb-0">Reviews</h2>
                <button className="text-sm text-primary font-medium flex items-center gap-1">
                  View all <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
                {reviewsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                  ))
                ) : reviews && reviews.length > 0 ? (
                  reviews.slice(0, 6).map((review) => (
                    <div key={review.id} className="bg-card rounded-xl p-4 border border-border">
                      <div className="flex items-start gap-3">
                        <img
                          src={review.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.user_id}`}
                          alt={review.profiles?.name || "User"}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">{review.profiles?.name || "Anonymous"}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(review.created_at), "d MMM yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < review.rating ? "fill-warning text-warning" : "text-muted"}`} />
                            ))}
                          </div>
                          {review.review_text && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{review.review_text}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground md:col-span-full">
                    <p className="text-sm">No reviews yet. Be the first to review!</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar (desktop): CTA + Location */}
          <div className="md:w-[340px] lg:w-[380px] md:shrink-0 space-y-6 mt-6 md:mt-0 md:sticky md:top-6 md:self-start">
            {/* Desktop CTA card — hidden on mobile (mobile uses sticky bottom bar) */}
            <section className="hidden md:block">
              <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
                <Button
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-base font-semibold"
                  onClick={handleCheckIn}
                >
                  <Check className="w-5 h-5 mr-2" />
                  {visitCount > 0 ? `Check In Again (${visitCount})` : "Check In"}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-10 text-sm gap-1.5"
                    onClick={handleToggleSave}
                    disabled={toggleSaved.isPending}
                  >
                    <Heart className={`w-4 h-4 ${isSaved ? "fill-destructive text-destructive" : ""}`} />
                    {isSaved ? "Saved" : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-10 text-sm gap-1.5"
                    onClick={() => {
                      if (!user) { toast.error("Please sign in to save to playlists"); navigate("/login"); return; }
                      setShowPlaylistModal(true);
                    }}
                  >
                    <ListPlus className="w-4 h-4" />
                    Add to List
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    title="Add to Calendar"
                    onClick={() => {
                      if (!user) { toast.error("Please sign in to add to calendar"); navigate("/login"); return; }
                      setShowCalendarModal(true);
                    }}
                  >
                    <CalendarCheck className="w-4 h-4" />
                  </Button>
                  <ShareMenu activityName={activity.name} activityId={activity.id} />
                </div>
              </div>
            </section>

            <section>
              <h2 className="section-header">Location</h2>
              <LocationMap latitude={activity.latitude} longitude={activity.longitude} name={activity.name} />
              {activity.latitude && activity.longitude && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${activity.latitude},${activity.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors text-sm font-medium text-foreground"
                >
                  <MapPin className="w-4 h-4 text-primary" />
                  Get Directions
                </a>
              )}
            </section>
          </div>
        </div>
      </div>
      
      {/* Sticky Bottom Actions — mobile only */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 safe-bottom md:hidden">
        <div className="flex gap-3 max-w-2xl mx-auto">
          <Button variant="outline" size="icon" onClick={handleToggleSave} className="shrink-0" disabled={toggleSaved.isPending}>
            <Heart className={`w-5 h-5 ${isSaved ? "fill-destructive text-destructive" : ""}`} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (!user) { toast.error("Please sign in to save to playlists"); navigate("/login"); return; }
              setShowPlaylistModal(true);
            }}
            className="shrink-0"
          >
            <ListPlus className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (!user) { toast.error("Please sign in to add to calendar"); navigate("/login"); return; }
              setShowCalendarModal(true);
            }}
            className="shrink-0"
          >
            <CalendarCheck className="w-5 h-5" />
          </Button>
          <ShareMenu activityName={activity.name} activityId={activity.id} />
          <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleCheckIn}>
            <Check className="w-5 h-5 mr-2" />
            {visitCount > 0 ? `Check-In Again (${visitCount})` : "Check-In"}
          </Button>
        </div>
      </div>

      {showCheckIn && (
        <CheckInModal activityId={activity.id} activityName={activity.name} onClose={() => setShowCheckIn(false)} />
      )}
      {showPlaylistModal && (
        <AddToPlaylistModal activityId={activity.id} activityName={activity.name} onClose={() => setShowPlaylistModal(false)} />
      )}
      {showCalendarModal && (
        <AddToCalendarModal activityId={activity.id} activityName={activity.name} onClose={() => setShowCalendarModal(false)} />
      )}
      {lightboxOpen && (
        <MediaLightbox
          urls={lightboxOpen.urls}
          initialIndex={lightboxOpen.index}
          onClose={() => setLightboxOpen(null)}
        />
      )}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, href }: { icon: any; label: string; value: string; href?: string }) {
  const content = href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
      {value}
    </a>
  ) : (
    <span className="text-foreground truncate">{value}</span>
  );

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className="text-sm text-muted-foreground w-16 shrink-0">{label}</span>
      <div className="text-sm truncate flex-1">{content}</div>
    </div>
  );
}
