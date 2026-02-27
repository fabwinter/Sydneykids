import { useState, useEffect, useMemo } from "react";
import { MediaLightbox } from "@/components/ui/MediaLightbox";
import { useNavigate, Link } from "react-router-dom";
import { Settings, MapPin, Users, Coffee, Award, ChevronRight, ChevronDown, Loader2, Heart, Bookmark, Plus, Trash2, Star, MessageSquare, Image as ImageIcon, CalendarDays, Flame, Share2, BookmarkPlus, Trophy } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PremiumModal } from "@/components/premium/PremiumModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useSavedItems, useToggleSavedItem } from "@/hooks/useSavedItems";
import { usePlaylists, useCreatePlaylist, useDeletePlaylist } from "@/hooks/usePlaylists";
import { useCalendarEvents, useDeleteCalendarEvent } from "@/hooks/useCalendarEvents";
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, differenceInCalendarDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ── Achievement definitions ────────────────────────────────────────
const ACHIEVEMENT_DEFS = [
  { key: "explorer", name: "Explorer", emoji: "🧭", description: "Check in to 20 places", target: 20, type: "total" as const },
  { key: "foodie", name: "Foodie", emoji: "🍽️", description: "10 restaurant check-ins", target: 10, type: "category" as const, category: "restaurant" },
  { key: "cafe_connoisseur", name: "Cafe Connoisseur", emoji: "☕", description: "10 cafe check-ins", target: 10, type: "category" as const, category: "cafe" },
  { key: "beach_lover", name: "Beach Lover", emoji: "🏖️", description: "5 beach check-ins", target: 5, type: "category" as const, category: "beach" },
  { key: "park_ranger", name: "Park Ranger", emoji: "🌳", description: "5 park check-ins", target: 5, type: "category" as const, category: "park" },
  { key: "night_owl", name: "Night Owl", emoji: "🦉", description: "5 bar check-ins", target: 5, type: "category" as const, category: "bar" },
  { key: "culture_vulture", name: "Culture Vulture", emoji: "🏛️", description: "5 museum check-ins", target: 5, type: "category" as const, category: "museum" },
  { key: "shopaholic", name: "Shopaholic", emoji: "🛍️", description: "5 shopping check-ins", target: 5, type: "category" as const, category: "shopping" },
];

export default function Profile() {
  const [showPremium, setShowPremium] = useState(false);
  const { user, isLoading: authLoading, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  // Saved items & playlists
  const { data: savedItems, isLoading: savedLoading } = useSavedItems();
  const { data: playlists, isLoading: playlistsLoading } = usePlaylists();
  const toggleSaved = useToggleSavedItem();
  const createPlaylist = useCreatePlaylist();
  const deletePlaylist = useDeletePlaylist();
  const { data: calendarEvents } = useCalendarEvents();
  const deleteCalendarEvent = useDeleteCalendarEvent();
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistEmoji, setNewPlaylistEmoji] = useState("📍");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch user profile from database
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch user badges
  const { data: badges = [] } = useQuery({
    queryKey: ["badges", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("user_badges")
        .select("*")
        .eq("user_id", profile.id);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Fetch check-in stats
  const { data: stats } = useQuery({
    queryKey: ["profile-stats", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return { checkIns: 0, friends: 0, topCategory: { name: "None", count: 0 } };
      
      const { count: checkInCount } = await supabase
        .from("check_ins")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id);

      const { count: friendCount } = await supabase
        .from("friends")
        .select("*", { count: "exact", head: true })
        .or(`user_id.eq.${profile.id},friend_id.eq.${profile.id}`)
        .eq("status", "accepted");

      return {
        checkIns: checkInCount || 0,
        friends: friendCount || 0,
        topCategory: { name: "Activities", count: checkInCount || 0 },
      };
    },
    enabled: !!profile?.id,
  });

  // Fetch recent check-ins with full details
  const { data: recentCheckIns = [] } = useQuery({
    queryKey: ["recent-checkins", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("check_ins")
        .select(`
          id,
          rating,
          comment,
          created_at,
          photo_url,
          photo_urls,
          activities (
            id,
            name,
            category,
            hero_image_url,
            address,
            rating,
            review_count
          )
        `)
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // ── Derived data ─────────────────────────────────────────────────
  const categoryCounts = useMemo(() => {
    return recentCheckIns.reduce((acc, ci) => {
      const cat = ci.activities?.category?.toLowerCase() || "";
      if (cat) acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [recentCheckIns]);

  // Streak calculation: consecutive days with check-ins ending today or yesterday
  const streak = useMemo(() => {
    if (recentCheckIns.length === 0) return 0;
    const uniqueDays = [...new Set(
      recentCheckIns.map(ci => format(new Date(ci.created_at), "yyyy-MM-dd"))
    )].sort().reverse();
    
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
    if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;
    
    let count = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      const diff = differenceInCalendarDays(parseISO(uniqueDays[i - 1]), parseISO(uniqueDays[i]));
      if (diff === 1) count++;
      else break;
    }
    return count;
  }, [recentCheckIns]);

  // Achievement progress
  const achievementProgress = useMemo(() => {
    return ACHIEVEMENT_DEFS.map(def => {
      let current = 0;
      if (def.type === "total") {
        current = recentCheckIns.length;
      } else if (def.type === "category" && def.category) {
        current = categoryCounts[def.category] || 0;
      }
      const unlocked = current >= def.target;
      return { ...def, current: Math.min(current, def.target), unlocked };
    });
  }, [recentCheckIns, categoryCounts]);

  const totalProgress = achievementProgress.filter(a => a.unlocked).length;
  const progressPercent = recentCheckIns.length > 0 
    ? Math.min(100, Math.round((recentCheckIns.length / 20) * 100))
    : 0;

  // Loading state
  if (authLoading || !isAuthenticated) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const displayName = profile?.name || user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const bio = profile?.bio || "Exploring Sydney ☕";

  const getInitials = () => {
    if (displayName.includes(" ")) {
      return displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return displayName.slice(0, 2).toUpperCase();
  };

  const categoryStickers: Record<string, { emoji: string; color: string }> = {
    cafe: { emoji: "☕", color: "from-amber-400 to-orange-500" },
    restaurant: { emoji: "🍽️", color: "from-red-400 to-rose-500" },
    bar: { emoji: "🍺", color: "from-yellow-400 to-amber-500" },
    beach: { emoji: "🏖️", color: "from-sky-400 to-blue-500" },
    park: { emoji: "🌳", color: "from-emerald-400 to-green-500" },
    museum: { emoji: "🏛️", color: "from-violet-400 to-purple-500" },
    shopping: { emoji: "🛍️", color: "from-pink-400 to-rose-500" },
    bakery: { emoji: "🧁", color: "from-orange-300 to-amber-500" },
    gym: { emoji: "💪", color: "from-slate-400 to-slate-600" },
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    createPlaylist.mutate(
      { name: newPlaylistName, emoji: newPlaylistEmoji },
      {
        onSuccess: () => {
          setNewPlaylistName("");
          setNewPlaylistEmoji("📍");
          setIsDialogOpen(false);
        },
      }
    );
  };

  const handleRemoveSaved = (activityId: string) => {
    toggleSaved.mutate({ activityId, isSaved: true });
  };

  return (
    <AppLayout>
      <div className="max-w-lg lg:max-w-4xl mx-auto pb-8">
        {/* ── Profile Header: Animated Gradient Hero ─────────────── */}
        <div className="relative overflow-hidden">
          {/* Animated gradient background */}
          <div 
            className="absolute inset-0"
            style={{
              background: "var(--gradient-profile)",
              backgroundSize: "200% 200%",
              animation: "gradientShift 8s ease infinite",
            }}
          />
          {/* Overlay pattern for depth */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 40%)",
          }} />
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />

          <div className="relative px-4 pt-10 pb-8 text-center">
            {/* Avatar with Progress Ring */}
            <div className="relative inline-block mb-3">
              <svg className="w-24 h-24" viewBox="0 0 96 96">
                {/* Background ring */}
                <circle cx="48" cy="48" r="44" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                {/* Progress ring */}
                <circle
                  cx="48" cy="48" r="44"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  strokeDashoffset={`${2 * Math.PI * 44 * (1 - progressPercent / 100)}`}
                  transform="rotate(-90 48 48)"
                  className="transition-all duration-1000"
                  style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.5))" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Avatar className="w-[76px] h-[76px] ring-2 ring-white/30 shadow-xl">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-xl bg-white/20 text-white font-bold backdrop-blur-sm">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </div>
              {/* Level badge */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-white text-xs font-bold text-primary shadow-md">
                Lv.{Math.floor(recentCheckIns.length / 5) + 1}
              </div>
            </div>

            <h1 className="text-xl font-bold text-white drop-shadow-md">{displayName}</h1>
            <p className="text-white/80 text-sm mt-0.5">{bio}</p>

            {/* Streak & Coins row */}
            <div className="flex items-center justify-center gap-3 mt-3">
              {streak > 0 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-semibold"
                >
                  <Flame className="w-4 h-4 text-orange-300" />
                  {streak} day streak
                </motion.div>
              )}
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-semibold">
                🪙 {recentCheckIns.length}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mt-4 max-w-xs mx-auto">
              <Button 
                variant="outline" 
                className="flex-1 h-10 rounded-full text-sm border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
                onClick={() => navigate("/settings")}
              >
                Edit Profile
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm" 
                onClick={() => setShowPremium(true)} 
                title="Premium"
              >
                <Award className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* ── Stats Cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-3 mx-4 rounded-2xl bg-card border border-border shadow-sm -mt-6 relative z-10">
          <StatItem icon={MapPin} value={stats?.checkIns || 0} label="Check-ins" />
          <StatItem icon={Users} value={stats?.friends || 0} label="Friends" />
          <StatItem icon={Trophy} value={totalProgress} label="Unlocked" />
        </div>

        {/* ── Tabs ────────────────────────────────────────────────── */}
        <Tabs defaultValue="overview" className="px-4 pt-4 pb-4">
          <TabsList className="w-full overflow-x-auto flex gap-1 bg-transparent p-0 mb-4 scrollbar-hide">
            {["overview", "checkins", "calendar", "saved", "playlists", "friends"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="px-3 py-1.5 rounded-full text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-muted whitespace-nowrap min-h-[36px]"
              >
                {tab === "checkins" ? "Check-Ins" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Overview Tab ─────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            {/* Lists Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">Lists <span className="text-muted-foreground font-normal text-sm">{(playlists?.length || 0) + 1}</span></h3>
                <button className="text-sm text-primary font-medium flex items-center gap-1">
                  See all
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-2xl bg-muted/60 p-6 flex flex-col items-center justify-center min-h-[120px]">
                  <Bookmark className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="font-semibold text-sm">Saved places</p>
                  <p className="text-xs text-muted-foreground">{savedItems?.length || 0} places</p>
                </div>
                {playlists?.slice(0, 1).map((playlist) => (
                  <div key={playlist.id} className="rounded-2xl bg-primary/5 p-6 flex flex-col items-center justify-center min-h-[120px]">
                    <span className="text-3xl mb-2">{playlist.emoji || "📍"}</span>
                    <p className="font-semibold text-sm">{playlist.name}</p>
                    <p className="text-xs text-muted-foreground">{playlist.item_count || 0} places</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Achievements Carousel with Progress ────────────── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">Achievements</h3>
                <span className="text-xs text-muted-foreground font-medium">{totalProgress}/{ACHIEVEMENT_DEFS.length} unlocked</span>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
                {achievementProgress.map((ach) => (
                  <motion.div
                    key={ach.key}
                    className={`shrink-0 w-[140px] rounded-2xl border p-4 flex flex-col items-center text-center transition-all ${
                      ach.unlocked 
                        ? "bg-gradient-to-b from-primary/10 to-primary/5 border-primary/30 shadow-sm" 
                        : "bg-card border-border"
                    }`}
                    whileHover={{ scale: 1.03 }}
                    {...(ach.unlocked ? {
                      initial: { scale: 0.9 },
                      animate: { scale: 1 },
                      transition: { type: "spring", stiffness: 300, damping: 20 }
                    } : {})}
                  >
                    <div className="relative mb-2">
                      <span className={`text-3xl ${ach.unlocked ? "" : "grayscale opacity-40"}`}>{ach.emoji}</span>
                      {ach.unlocked && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring" }}
                          className="absolute -top-1 -right-2 w-5 h-5 rounded-full bg-success flex items-center justify-center"
                        >
                          <span className="text-[10px] text-white">✓</span>
                        </motion.div>
                      )}
                    </div>
                    <p className="text-xs font-semibold line-clamp-1">{ach.name}</p>
                    {/* Progress bar */}
                    <div className="w-full mt-2">
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${ach.unlocked ? "bg-primary" : "bg-muted-foreground/40"}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${(ach.current / ach.target) * 100}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{ach.current}/{ach.target}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ── Category Stickers ──────────────────────────────── */}
            {Object.keys(categoryCounts).length > 0 && (
              <div>
                <h3 className="font-bold text-lg mb-3">Category Stickers</h3>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                  {Object.entries(categoryCounts).map(([cat, count]) => {
                    const sticker = categoryStickers[cat] || { emoji: "📍", color: "from-slate-400 to-slate-500" };
                    return (
                      <div key={cat} className="flex flex-col items-center shrink-0 min-w-[72px]">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${sticker.color} flex items-center justify-center text-3xl shadow-md`}>
                          {sticker.emoji}
                        </div>
                        <p className="text-xs font-medium mt-1.5 text-center capitalize line-clamp-1">{cat}</p>
                        <p className="text-[10px] text-muted-foreground">{count}×</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Recent Check-Ins ───────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">Recent Check-Ins</h3>
              </div>
              
              {recentCheckIns.length > 0 ? (
                <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                  {recentCheckIns.slice(0, 6).map((checkIn) => (
                    <ProfileCheckInCard key={checkIn.id} checkIn={checkIn} categoryStickers={categoryStickers} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No check-ins yet</p>
                  <Button variant="link" className="mt-2 text-primary" onClick={() => navigate("/")}>
                    Start exploring
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Check-Ins Tab ──────────────────────────────────── */}
          <TabsContent value="checkins">
            {recentCheckIns.length > 0 ? (
              <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                {recentCheckIns.map((checkIn) => (
                  <ProfileCheckInCard key={checkIn.id} checkIn={checkIn} categoryStickers={categoryStickers} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No check-ins yet</p>
              </div>
            )}
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-4 mt-0">
            <ProfileCalendar
              calendarEvents={calendarEvents || []}
              checkIns={recentCheckIns}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              onDeleteEvent={(id) => deleteCalendarEvent.mutate(id)}
            />
          </TabsContent>

          {/* Saved Tab */}
          <TabsContent value="saved" className="space-y-4 mt-0">
            {savedLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
              ))
            ) : savedItems && savedItems.length > 0 ? (
              <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                {savedItems.map((item) => (
                  <Link
                    key={item.id}
                    to={`/activity/${item.activity_id}`}
                    className="block relative w-full overflow-hidden rounded-2xl bg-muted aspect-[4/3] group"
                  >
                    <img
                      src={item.activities.hero_image_url || "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop"}
                      alt={item.activities.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveSaved(item.activity_id);
                      }}
                      className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors shadow-sm min-w-[44px] min-h-[44px]"
                    >
                      <Heart className="w-4 h-4 fill-white text-white" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 z-10 p-3 space-y-0.5">
                      <h3 className="font-bold text-sm text-white leading-tight line-clamp-1">
                        {item.activities.name}
                      </h3>
                      <p className="text-xs text-white/70">{item.activities.category}</p>
                      <p className="text-xs text-white/60 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.activities.address || "Sydney, NSW"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No saved places yet</p>
                <p className="text-sm">Start exploring and save your favorite spots!</p>
              </div>
            )}
          </TabsContent>

          {/* Playlists Tab */}
          <TabsContent value="playlists" className="space-y-4 mt-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Your Playlists</h3>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1 h-8 min-h-[44px]">
                    <Plus className="w-3 h-3" />
                    New
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Playlist</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="emoji">Emoji</Label>
                      <Input
                        id="emoji"
                        value={newPlaylistEmoji}
                        onChange={(e) => setNewPlaylistEmoji(e.target.value)}
                        maxLength={2}
                        className="w-20 text-2xl text-center"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g. Weekend Vibes"
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleCreatePlaylist}
                      className="w-full min-h-[44px]"
                      disabled={!newPlaylistName.trim() || createPlaylist.isPending}
                    >
                      {createPlaylist.isPending ? "Creating..." : "Create Playlist"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {playlistsLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : playlists && playlists.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className="bg-card rounded-xl p-4 border border-border hover:border-primary transition-colors cursor-pointer relative group"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePlaylist.mutate(playlist.id);
                      }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className="text-3xl">{playlist.emoji || "📍"}</span>
                    <h3 className="font-semibold text-sm mt-2 line-clamp-1">{playlist.name}</h3>
                    <p className="text-xs text-muted-foreground">{playlist.item_count || 0} places</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No playlists yet</p>
                <Button variant="link" className="mt-2 text-primary" onClick={() => setIsDialogOpen(true)}>
                  Create your first playlist
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Friends Tab */}
          <TabsContent value="friends">
            <div className="text-center py-8 text-muted-foreground">
              <p>Connect with friends</p>
              <Button variant="link" className="mt-2 text-primary">
                Find friends
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}
    </AppLayout>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function StatItem({
  icon: Icon,
  value,
  label,
}: {
  icon: any;
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center py-3">
      <Icon className="w-4 h-4 text-primary mb-0.5" />
      <span className="text-lg font-bold">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

function ProfileCheckInCard({ checkIn, categoryStickers }: { checkIn: any; categoryStickers: Record<string, { emoji: string; color: string }> }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  
  const photos: string[] = (checkIn as any).photo_urls?.length > 0
    ? (checkIn as any).photo_urls
    : checkIn.photo_url ? [checkIn.photo_url] : [];
  const allImages = photos.length > 0 ? photos : checkIn.activities?.hero_image_url ? [checkIn.activities.hero_image_url] : [];
  const displayImg = allImages[photoIndex] || "/placeholder.svg";
  const hasMultiple = allImages.length > 1;
  const cat = checkIn.activities?.category?.toLowerCase() || "";
  const sticker = categoryStickers[cat];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-muted aspect-[4/3] group">
      <img
        src={displayImg}
        alt={checkIn.activities?.name || "Check-in"}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500"
        onClick={() => photos.length > 0 ? setLightbox(photoIndex) : undefined}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

      {/* Category badge top-left */}
      {sticker && (
        <div className={`absolute top-3 left-3 z-10 px-2 py-1 rounded-full bg-gradient-to-r ${sticker.color} text-white text-xs font-medium shadow-md flex items-center gap-1`}>
          {sticker.emoji} {checkIn.activities?.category}
        </div>
      )}

      {/* Quick actions top-right */}
      <div className="absolute top-3 right-3 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 min-w-[44px] min-h-[44px]">
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {hasMultiple && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); setPhotoIndex((photoIndex - 1 + allImages.length) % allImages.length); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); setPhotoIndex((photoIndex + 1) % allImages.length); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {hasMultiple && allImages.length <= 8 && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1 z-10">
          {allImages.map((_, i) => (
            <span key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === photoIndex ? "bg-white" : "bg-white/40"}`} />
          ))}
        </div>
      )}

      <Link to={`/activity/${checkIn.activities?.id}`} className="absolute bottom-0 left-0 right-0 z-10 p-3 space-y-0.5">
        <h3 className="font-bold text-sm text-white leading-tight line-clamp-1">
          {checkIn.activities?.name || "Activity"}
        </h3>
        <div className="flex items-center gap-3 pt-0.5">
          <span className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${i < checkIn.rating ? "fill-warning text-warning" : "text-white/30"}`}
              />
            ))}
          </span>
          <span className="text-xs text-white/60">
            {new Date(checkIn.created_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
          </span>
        </div>
        {checkIn.comment && (
          <p className="text-xs text-white/70 italic line-clamp-1 mt-0.5">"{checkIn.comment}"</p>
        )}
      </Link>

      {lightbox !== null && (
        <MediaLightbox urls={photos} initialIndex={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

function ProfileCalendar({
  calendarEvents,
  checkIns,
  month,
  onMonthChange,
  onDeleteEvent,
}: {
  calendarEvents: any[];
  checkIns: any[];
  month: Date;
  onMonthChange: (d: Date) => void;
  onDeleteEvent: (id: string) => void;
}) {
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  });
  const firstDayOfWeek = getDay(startOfMonth(month));
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const eventsByDate = new Map<string, { type: "planned" | "checkin"; title: string; id?: string; activityId?: string; isEvent?: boolean }[]>();
  
  calendarEvents.forEach((ev: any) => {
    const key = ev.event_date;
    if (!eventsByDate.has(key)) eventsByDate.set(key, []);
    eventsByDate.get(key)!.push({ type: "planned", title: ev.title || ev.activities?.name || "Event", id: ev.id, activityId: ev.activity_id || undefined });
  });
  
  checkIns.forEach((ci: any) => {
    const key = format(new Date(ci.created_at), "yyyy-MM-dd");
    if (!eventsByDate.has(key)) eventsByDate.set(key, []);
    eventsByDate.get(key)!.push({ type: "checkin", title: ci.activities?.name || "Check-in", activityId: ci.activities?.id, isEvent: ci.activities?.is_event });
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedEvents = selectedDate ? eventsByDate.get(selectedDate) || [] : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => onMonthChange(subMonths(month, 1))} className="p-2 rounded-lg hover:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ChevronDown className="w-5 h-5 rotate-90" />
        </button>
        <h3 className="font-bold text-lg">{format(month, "MMMM yyyy")}</h3>
        <button onClick={() => onMonthChange(addMonths(month, 1))} className="p-2 rounded-lg hover:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center">
          <ChevronDown className="w-5 h-5 -rotate-90" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {dayNames.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
        ))}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {daysInMonth.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const events = eventsByDate.get(key);
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDate === key;

          return (
            <button
              key={key}
              onClick={() => setSelectedDate(isSelected ? null : key)}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors min-w-[44px] ${
                isSelected ? "bg-primary text-primary-foreground" :
                isToday ? "bg-primary/10 font-bold" :
                "hover:bg-muted"
              }`}
            >
              {format(day, "d")}
              {events && (
                <div className="flex gap-0.5 mt-0.5">
                  {events.some(e => e.type === "planned") && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  {events.some(e => e.type === "checkin") && <span className="w-1.5 h-1.5 rounded-full bg-warning" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Planned</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> Check-in</span>
      </div>

      {selectedDate && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">{format(parseISO(selectedDate), "EEEE, d MMMM")}</h4>
          {selectedEvents.length > 0 ? (
            selectedEvents.map((ev, i) => {
              const linkTo = ev.activityId
                ? (ev.isEvent ? `/event/${ev.activityId}` : `/activity/${ev.activityId}`)
                : null;
              const content = (
                <div className="flex items-center justify-between bg-card rounded-xl border border-border p-3 hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${ev.type === "planned" ? "bg-primary" : "bg-warning"}`} />
                    <span className="text-sm font-medium truncate">{ev.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{ev.type === "planned" ? "Planned" : "Visited"}</span>
                  </div>
                  {ev.type === "planned" && ev.id && (
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteEvent(ev.id!); }} className="p-1 text-muted-foreground hover:text-destructive shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
              return linkTo ? (
                <Link key={i} to={linkTo}>{content}</Link>
              ) : (
                <div key={i}>{content}</div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">No events on this day</p>
          )}
        </div>
      )}

      {calendarEvents.filter((e: any) => e.event_date >= format(new Date(), "yyyy-MM-dd")).length > 0 && (
        <div>
          <h4 className="font-semibold text-sm mb-2">Upcoming</h4>
          <div className="space-y-2">
            {calendarEvents
              .filter((e: any) => e.event_date >= format(new Date(), "yyyy-MM-dd"))
              .slice(0, 5)
              .map((ev: any) => (
                <Link
                  key={ev.id}
                  to={ev.activity_id ? `/activity/${ev.activity_id}` : "#"}
                  className="flex items-center justify-between bg-card rounded-xl border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(ev.event_date), "EEE d MMM")}
                      {ev.event_time && ` at ${ev.event_time.slice(0, 5)}`}
                    </p>
                  </div>
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
