
-- ============================================================
-- 1. FIX CHECK-INS RLS: change from RESTRICTIVE to PERMISSIVE
-- ============================================================
DROP POLICY IF EXISTS "Users can create check-ins" ON public.check_ins;
DROP POLICY IF EXISTS "Users can view own check-ins" ON public.check_ins;
DROP POLICY IF EXISTS "Users can update own check-ins" ON public.check_ins;
DROP POLICY IF EXISTS "Users can delete own check-ins" ON public.check_ins;

CREATE POLICY "Users can create check-ins" ON public.check_ins
  FOR INSERT TO authenticated
  WITH CHECK ((user_id = get_profile_id_from_auth()) AND (NOT check_in_limit_exceeded()));

CREATE POLICY "Users can view own check-ins" ON public.check_ins
  FOR SELECT TO authenticated
  USING (user_id = get_profile_id_from_auth());

CREATE POLICY "Users can update own check-ins" ON public.check_ins
  FOR UPDATE TO authenticated
  USING (user_id = get_profile_id_from_auth());

CREATE POLICY "Users can delete own check-ins" ON public.check_ins
  FOR DELETE TO authenticated
  USING (user_id = get_profile_id_from_auth());

-- Also fix other tables with the same issue
DROP POLICY IF EXISTS "Anyone can view activities" ON public.activities;
CREATE POLICY "Anyone can view activities" ON public.activities
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can save items" ON public.saved_items;
DROP POLICY IF EXISTS "Users can unsave items" ON public.saved_items;
DROP POLICY IF EXISTS "Users can view own saved items" ON public.saved_items;
CREATE POLICY "Users can save items" ON public.saved_items FOR INSERT TO authenticated WITH CHECK (user_id = get_profile_id_from_auth());
CREATE POLICY "Users can unsave items" ON public.saved_items FOR DELETE TO authenticated USING (user_id = get_profile_id_from_auth());
CREATE POLICY "Users can view own saved items" ON public.saved_items FOR SELECT TO authenticated USING (user_id = get_profile_id_from_auth());

DROP POLICY IF EXISTS "Users can create playlists" ON public.playlists;
DROP POLICY IF EXISTS "Users can delete own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Users can update own playlists" ON public.playlists;
DROP POLICY IF EXISTS "Users can view own playlists" ON public.playlists;
CREATE POLICY "Users can create playlists" ON public.playlists FOR INSERT TO authenticated WITH CHECK ((user_id = get_profile_id_from_auth()) AND (NOT playlist_limit_exceeded()));
CREATE POLICY "Users can delete own playlists" ON public.playlists FOR DELETE TO authenticated USING (user_id = get_profile_id_from_auth());
CREATE POLICY "Users can update own playlists" ON public.playlists FOR UPDATE TO authenticated USING (user_id = get_profile_id_from_auth());
CREATE POLICY "Users can view own playlists" ON public.playlists FOR SELECT TO authenticated USING (user_id = get_profile_id_from_auth());

DROP POLICY IF EXISTS "Users can add to own playlists" ON public.playlist_items;
DROP POLICY IF EXISTS "Users can remove from own playlists" ON public.playlist_items;
DROP POLICY IF EXISTS "Users can view own playlist items" ON public.playlist_items;
CREATE POLICY "Users can add to own playlists" ON public.playlist_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM playlists WHERE playlists.id = playlist_items.playlist_id AND playlists.user_id = get_profile_id_from_auth()));
CREATE POLICY "Users can remove from own playlists" ON public.playlist_items FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM playlists WHERE playlists.id = playlist_items.playlist_id AND playlists.user_id = get_profile_id_from_auth()));
CREATE POLICY "Users can view own playlist items" ON public.playlist_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM playlists WHERE playlists.id = playlist_items.playlist_id AND playlists.user_id = get_profile_id_from_auth()));

DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.chat_messages;
CREATE POLICY "Users can send messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK ((user_id = get_profile_id_from_auth()) AND (NOT chat_message_limit_exceeded()));
CREATE POLICY "Users can view own messages" ON public.chat_messages FOR SELECT TO authenticated USING (user_id = get_profile_id_from_auth());
CREATE POLICY "Users can delete own messages" ON public.chat_messages FOR DELETE TO authenticated USING (user_id = get_profile_id_from_auth());

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges;
CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT TO authenticated USING (user_id = get_profile_id_from_auth());

DROP POLICY IF EXISTS "Users can create friend requests" ON public.friends;
DROP POLICY IF EXISTS "Users can delete own friendships" ON public.friends;
DROP POLICY IF EXISTS "Users can update own friendships" ON public.friends;
DROP POLICY IF EXISTS "Users can view own friendships" ON public.friends;
CREATE POLICY "Users can create friend requests" ON public.friends FOR INSERT TO authenticated WITH CHECK (user_id = get_profile_id_from_auth());
CREATE POLICY "Users can delete own friendships" ON public.friends FOR DELETE TO authenticated USING ((user_id = get_profile_id_from_auth()) OR (friend_id = get_profile_id_from_auth()));
CREATE POLICY "Users can update own friendships" ON public.friends FOR UPDATE TO authenticated USING ((user_id = get_profile_id_from_auth()) OR (friend_id = get_profile_id_from_auth()));
CREATE POLICY "Users can view own friendships" ON public.friends FOR SELECT TO authenticated USING ((user_id = get_profile_id_from_auth()) OR (friend_id = get_profile_id_from_auth()));

DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (user_id = get_profile_id_from_auth());
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE TO authenticated USING (user_id = get_profile_id_from_auth());
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE TO authenticated USING (user_id = get_profile_id_from_auth());

DROP POLICY IF EXISTS "Anyone can view photos" ON public.photos;
DROP POLICY IF EXISTS "Users can upload photos" ON public.photos;
CREATE POLICY "Anyone can view photos" ON public.photos FOR SELECT USING (true);
CREATE POLICY "Users can upload photos" ON public.photos FOR INSERT TO authenticated WITH CHECK (user_id = get_profile_id_from_auth());

DROP POLICY IF EXISTS "Anyone can view partners" ON public.partners;
CREATE POLICY "Anyone can view partners" ON public.partners FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read foursquare cache" ON public.foursquare_cache;
CREATE POLICY "Anyone can read foursquare cache" ON public.foursquare_cache FOR SELECT USING (true);

-- ============================================================
-- 2. ADMIN / GOD MODE SYSTEM
-- ============================================================

-- User roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Grant admin to fabianwinterbine@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('7508c389-a9b6-4645-b127-384ca526993d', 'admin');

-- Admin: update activity
CREATE OR REPLACE FUNCTION public.admin_update_activity(p_activity_id uuid, p_updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE activities SET
    name = COALESCE(p_updates->>'name', name),
    description = COALESCE(p_updates->>'description', description),
    category = COALESCE(p_updates->>'category', category),
    address = COALESCE(p_updates->>'address', address),
    phone = COALESCE(p_updates->>'phone', phone),
    website = COALESCE(p_updates->>'website', website),
    hero_image_url = COALESCE(p_updates->>'hero_image_url', hero_image_url),
    hours_open = COALESCE(p_updates->>'hours_open', hours_open),
    hours_close = COALESCE(p_updates->>'hours_close', hours_close),
    wifi = COALESCE((p_updates->>'wifi')::boolean, wifi),
    parking = COALESCE((p_updates->>'parking')::boolean, parking),
    wheelchair_accessible = COALESCE((p_updates->>'wheelchair_accessible')::boolean, wheelchair_accessible),
    outdoor_seating = COALESCE((p_updates->>'outdoor_seating')::boolean, outdoor_seating),
    pet_friendly = COALESCE((p_updates->>'pet_friendly')::boolean, pet_friendly),
    rating = COALESCE((p_updates->>'rating')::numeric, rating),
    updated_at = now()
  WHERE id = p_activity_id;
END;
$$;

-- Admin: delete activity
CREATE OR REPLACE FUNCTION public.admin_delete_activity(p_activity_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  DELETE FROM check_ins WHERE activity_id = p_activity_id;
  DELETE FROM saved_items WHERE activity_id = p_activity_id;
  DELETE FROM playlist_items WHERE activity_id = p_activity_id;
  DELETE FROM reviews WHERE activity_id = p_activity_id;
  DELETE FROM photos WHERE activity_id = p_activity_id;
  DELETE FROM activities WHERE id = p_activity_id;
END;
$$;

-- Admin: add activity
CREATE OR REPLACE FUNCTION public.admin_add_activity(p_data jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  INSERT INTO activities (
    name, category, latitude, longitude, address, description,
    phone, website, hero_image_url, hours_open, hours_close,
    wifi, parking, wheelchair_accessible, outdoor_seating, pet_friendly,
    rating, is_open, foursquare_id
  ) VALUES (
    p_data->>'name',
    COALESCE(p_data->>'category', 'Other'),
    (p_data->>'latitude')::numeric,
    (p_data->>'longitude')::numeric,
    p_data->>'address',
    p_data->>'description',
    p_data->>'phone',
    p_data->>'website',
    p_data->>'hero_image_url',
    p_data->>'hours_open',
    p_data->>'hours_close',
    COALESCE((p_data->>'wifi')::boolean, false),
    COALESCE((p_data->>'parking')::boolean, false),
    COALESCE((p_data->>'wheelchair_accessible')::boolean, false),
    COALESCE((p_data->>'outdoor_seating')::boolean, false),
    COALESCE((p_data->>'pet_friendly')::boolean, false),
    COALESCE((p_data->>'rating')::numeric, 0),
    true,
    p_data->>'foursquare_id'
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
