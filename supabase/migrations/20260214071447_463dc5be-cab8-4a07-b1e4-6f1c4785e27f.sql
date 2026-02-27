
-- Add foursquare_id to activities for deduplication
ALTER TABLE public.activities ADD COLUMN foursquare_id text UNIQUE;

-- Create index for fast lookups
CREATE INDEX idx_activities_foursquare_id ON public.activities (foursquare_id) WHERE foursquare_id IS NOT NULL;

-- Database function to upsert a Foursquare venue into activities and return its ID
CREATE OR REPLACE FUNCTION public.upsert_foursquare_venue(
  p_foursquare_id text,
  p_name text,
  p_category text,
  p_latitude numeric,
  p_longitude numeric,
  p_address text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_rating numeric DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_website text DEFAULT NULL,
  p_hero_image_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Try to find existing activity by foursquare_id
  SELECT id INTO v_id FROM activities WHERE foursquare_id = p_foursquare_id;
  
  IF v_id IS NOT NULL THEN
    -- Update existing record with latest data
    UPDATE activities SET
      name = p_name,
      rating = COALESCE(p_rating, rating),
      description = COALESCE(p_description, description),
      hero_image_url = COALESCE(p_hero_image_url, hero_image_url),
      phone = COALESCE(p_phone, phone),
      website = COALESCE(p_website, website),
      updated_at = now()
    WHERE id = v_id;
    RETURN v_id;
  END IF;
  
  -- Insert new activity
  INSERT INTO activities (
    foursquare_id, name, category, latitude, longitude, address,
    description, rating, phone, website, hero_image_url, is_open
  ) VALUES (
    p_foursquare_id, p_name, p_category, p_latitude, p_longitude, p_address,
    p_description, p_rating, p_phone, p_website, p_hero_image_url, true
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;
