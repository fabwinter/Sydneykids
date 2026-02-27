
-- Drop and recreate photos INSERT policy to allow admin bypass
DROP POLICY IF EXISTS "Users can upload photos" ON public.photos;

CREATE POLICY "Users can upload photos"
ON public.photos
FOR INSERT
WITH CHECK (
  (user_id = get_profile_id_from_auth()) 
  OR has_role(auth.uid(), 'admin'::app_role)
);
