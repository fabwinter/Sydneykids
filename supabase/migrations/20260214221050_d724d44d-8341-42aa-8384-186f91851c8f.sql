
-- Drop RESTRICTIVE check_ins policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Users can create check-ins" ON public.check_ins;
DROP POLICY IF EXISTS "Users can view own check-ins" ON public.check_ins;
DROP POLICY IF EXISTS "Users can update own check-ins" ON public.check_ins;
DROP POLICY IF EXISTS "Users can delete own check-ins" ON public.check_ins;

CREATE POLICY "Users can create check-ins"
ON public.check_ins FOR INSERT TO authenticated
WITH CHECK (user_id = get_profile_id_from_auth());

CREATE POLICY "Users can view own check-ins"
ON public.check_ins FOR SELECT TO authenticated
USING (user_id = get_profile_id_from_auth());

CREATE POLICY "Users can update own check-ins"
ON public.check_ins FOR UPDATE TO authenticated
USING (user_id = get_profile_id_from_auth());

CREATE POLICY "Users can delete own check-ins"
ON public.check_ins FOR DELETE TO authenticated
USING (user_id = get_profile_id_from_auth());

-- Also fix photos table - allow admin delete
DROP POLICY IF EXISTS "Admin can delete photos" ON public.photos;
CREATE POLICY "Admin can delete photos"
ON public.photos FOR DELETE TO authenticated
USING (user_id = get_profile_id_from_auth() OR has_role(auth.uid(), 'admin'));
