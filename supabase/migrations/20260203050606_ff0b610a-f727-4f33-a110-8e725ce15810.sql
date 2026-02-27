-- =====================================================
-- SYDMAP Database Schema
-- Complete schema for Sydney activity discovery app
-- =====================================================

-- =====================================================
-- 1. PROFILES TABLE (linked to auth.users)
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  premium_expires_at TIMESTAMPTZ,
  newsletter_opt_in BOOLEAN NOT NULL DEFAULT false,
  marketing_opt_in BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. ACTIVITIES TABLE (locations/venues)
-- =====================================================
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  address TEXT,
  phone TEXT,
  website TEXT,
  rating NUMERIC(2, 1) DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  hours_open TEXT,
  hours_close TEXT,
  is_open BOOLEAN NOT NULL DEFAULT true,
  hero_image_url TEXT,
  -- Amenities
  parking BOOLEAN NOT NULL DEFAULT false,
  wheelchair_accessible BOOLEAN NOT NULL DEFAULT false,
  wifi BOOLEAN NOT NULL DEFAULT false,
  outdoor_seating BOOLEAN NOT NULL DEFAULT false,
  pet_friendly BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. CHECK_INS TABLE
-- =====================================================
CREATE TABLE public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  photo_url TEXT,
  share_with_friends BOOLEAN NOT NULL DEFAULT true,
  add_to_public_feed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. SAVED_ITEMS TABLE (bookmarks)
-- =====================================================
CREATE TABLE public.saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_id)
);

-- Enable RLS
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. PLAYLISTS TABLE
-- =====================================================
CREATE TABLE public.playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '📍',
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. PLAYLIST_ITEMS TABLE (junction)
-- =====================================================
CREATE TABLE public.playlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(playlist_id, activity_id)
);

-- Enable RLS
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. USER_BADGES TABLE (gamification)
-- =====================================================
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_name TEXT NOT NULL,
  badge_icon_url TEXT,
  description TEXT,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_name)
);

-- Enable RLS
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. FRIENDS TABLE (social connections)
-- =====================================================
CREATE TABLE public.friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_friend CHECK (user_id != friend_id),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 9. CHAT_MESSAGES TABLE (AI assistant)
-- =====================================================
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'assistant')),
  content TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10. REVIEWS TABLE
-- =====================================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(activity_id, user_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 11. PHOTOS TABLE (gallery)
-- =====================================================
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  photo_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 12. PARTNERS TABLE (discount program)
-- =====================================================
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  discount_percentage INTEGER,
  partnership_tier TEXT CHECK (partnership_tier IN ('standard', 'featured')) DEFAULT 'standard',
  active BOOLEAN NOT NULL DEFAULT true,
  discount_code TEXT UNIQUE,
  redemption_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get profile ID from authenticated user
CREATE OR REPLACE FUNCTION public.get_profile_id_from_auth()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Check if user is premium
CREATE OR REPLACE FUNCTION public.is_premium_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_premium FROM public.profiles WHERE user_id = auth.uid()),
    false
  )
$$;

-- Check daily check-in limit (3 for free users)
CREATE OR REPLACE FUNCTION public.check_in_limit_exceeded()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN public.is_premium_user() THEN false
    ELSE (
      SELECT COUNT(*) >= 3 
      FROM public.check_ins ci
      JOIN public.profiles p ON ci.user_id = p.id
      WHERE p.user_id = auth.uid()
      AND ci.created_at >= CURRENT_DATE
    )
  END
$$;

-- Check daily chat message limit (5 for free users)
CREATE OR REPLACE FUNCTION public.chat_message_limit_exceeded()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN public.is_premium_user() THEN false
    ELSE (
      SELECT COUNT(*) >= 5 
      FROM public.chat_messages cm
      JOIN public.profiles p ON cm.user_id = p.id
      WHERE p.user_id = auth.uid()
      AND cm.message_type = 'user'
      AND cm.created_at >= CURRENT_DATE
    )
  END
$$;

-- Check playlist limit (3 for free users)
CREATE OR REPLACE FUNCTION public.playlist_limit_exceeded()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN public.is_premium_user() THEN false
    ELSE (
      SELECT COUNT(*) >= 3 
      FROM public.playlists pl
      JOIN public.profiles p ON pl.user_id = p.id
      WHERE p.user_id = auth.uid()
    )
  END
$$;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- PROFILES
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

-- ACTIVITIES (publicly readable)
CREATE POLICY "Anyone can view activities" ON public.activities
  FOR SELECT USING (true);

-- CHECK_INS
CREATE POLICY "Users can view own check-ins" ON public.check_ins
  FOR SELECT USING (user_id = public.get_profile_id_from_auth());

CREATE POLICY "Users can create check-ins" ON public.check_ins
  FOR INSERT WITH CHECK (
    user_id = public.get_profile_id_from_auth() 
    AND NOT public.check_in_limit_exceeded()
  );

CREATE POLICY "Users can update own check-ins" ON public.check_ins
  FOR UPDATE USING (user_id = public.get_profile_id_from_auth());

CREATE POLICY "Users can delete own check-ins" ON public.check_ins
  FOR DELETE USING (user_id = public.get_profile_id_from_auth());

-- SAVED_ITEMS
CREATE POLICY "Users can view own saved items" ON public.saved_items
  FOR SELECT USING (user_id = public.get_profile_id_from_auth());

CREATE POLICY "Users can save items" ON public.saved_items
  FOR INSERT WITH CHECK (user_id = public.get_profile_id_from_auth());

CREATE POLICY "Users can unsave items" ON public.saved_items
  FOR DELETE USING (user_id = public.get_profile_id_from_auth());

-- PLAYLISTS
CREATE POLICY "Users can view own playlists" ON public.playlists
  FOR SELECT USING (user_id = public.get_profile_id_from_auth());

CREATE POLICY "Users can create playlists" ON public.playlists
  FOR INSERT WITH CHECK (
    user_id = public.get_profile_id_from_auth() 
    AND NOT public.playlist_limit_exceeded()
  );

CREATE POLICY "Users can update own playlists" ON public.playlists
  FOR UPDATE USING (user_id = public.get_profile_id_from_auth());

CREATE POLICY "Users can delete own playlists" ON public.playlists
  FOR DELETE USING (user_id = public.get_profile_id_from_auth());

-- PLAYLIST_ITEMS
CREATE POLICY "Users can view own playlist items" ON public.playlist_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.playlists 
      WHERE id = playlist_items.playlist_id 
      AND user_id = public.get_profile_id_from_auth()
    )
  );

CREATE POLICY "Users can add to own playlists" ON public.playlist_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.playlists 
      WHERE id = playlist_items.playlist_id 
      AND user_id = public.get_profile_id_from_auth()
    )
  );

CREATE POLICY "Users can remove from own playlists" ON public.playlist_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.playlists 
      WHERE id = playlist_items.playlist_id 
      AND user_id = public.get_profile_id_from_auth()
    )
  );

-- USER_BADGES
CREATE POLICY "Users can view own badges" ON public.user_badges
  FOR SELECT USING (user_id = public.get_profile_id_from_auth());

-- FRIENDS
CREATE POLICY "Users can view own friendships" ON public.friends
  FOR SELECT USING (
    user_id = public.get_profile_id_from_auth() 
    OR friend_id = public.get_profile_id_from_auth()
  );

CREATE POLICY "Users can create friend requests" ON public.friends
  FOR INSERT WITH CHECK (user_id = public.get_profile_id_from_auth());

CREATE POLICY "Users can update own friendships" ON public.friends
  FOR UPDATE USING (
    user_id = public.get_profile_id_from_auth() 
    OR friend_id = public.get_profile_id_from_auth()
  );

CREATE POLICY "Users can delete own friendships" ON public.friends
  FOR DELETE USING (
    user_id = public.get_profile_id_from_auth() 
    OR friend_id = public.get_profile_id_from_auth()
  );

-- CHAT_MESSAGES
CREATE POLICY "Users can view own messages" ON public.chat_messages
  FOR SELECT USING (user_id = public.get_profile_id_from_auth());

CREATE POLICY "Users can send messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    user_id = public.get_profile_id_from_auth()
    AND NOT public.chat_message_limit_exceeded()
  );

CREATE POLICY "Users can delete own messages" ON public.chat_messages
  FOR DELETE USING (user_id = public.get_profile_id_from_auth());

-- REVIEWS (publicly readable, own editable)
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (user_id = public.get_profile_id_from_auth());

CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE USING (user_id = public.get_profile_id_from_auth());

CREATE POLICY "Users can delete own reviews" ON public.reviews
  FOR DELETE USING (user_id = public.get_profile_id_from_auth());

-- PHOTOS (publicly readable)
CREATE POLICY "Anyone can view photos" ON public.photos
  FOR SELECT USING (true);

CREATE POLICY "Users can upload photos" ON public.photos
  FOR INSERT WITH CHECK (user_id = public.get_profile_id_from_auth());

-- PARTNERS (publicly readable basic info)
CREATE POLICY "Anyone can view partners" ON public.partners
  FOR SELECT USING (true);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at
  BEFORE UPDATE ON public.playlists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_friends_updated_at
  BEFORE UPDATE ON public.friends
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- INDEXES for performance
-- =====================================================
CREATE INDEX idx_activities_category ON public.activities(category);
CREATE INDEX idx_activities_location ON public.activities(latitude, longitude);
CREATE INDEX idx_check_ins_user ON public.check_ins(user_id);
CREATE INDEX idx_check_ins_activity ON public.check_ins(activity_id);
CREATE INDEX idx_saved_items_user ON public.saved_items(user_id);
CREATE INDEX idx_playlists_user ON public.playlists(user_id);
CREATE INDEX idx_reviews_activity ON public.reviews(activity_id);
CREATE INDEX idx_friends_user ON public.friends(user_id);
CREATE INDEX idx_friends_friend ON public.friends(friend_id);
CREATE INDEX idx_chat_messages_user ON public.chat_messages(user_id);

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('avatars', 'avatars', true),
  ('check-in-photos', 'check-in-photos', true),
  ('activity-photos', 'activity-photos', true);

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for check-in photos
CREATE POLICY "Check-in photos are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'check-in-photos');

CREATE POLICY "Users can upload check-in photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'check-in-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own check-in photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'check-in-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for activity photos
CREATE POLICY "Activity photos are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'activity-photos');

CREATE POLICY "Users can upload activity photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'activity-photos' 
    AND auth.uid() IS NOT NULL
  );