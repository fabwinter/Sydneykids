
-- Add photo_urls array column to check_ins for multiple media uploads
ALTER TABLE public.check_ins ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT '{}';

-- Migrate existing photo_url data into photo_urls array
UPDATE public.check_ins 
SET photo_urls = ARRAY[photo_url] 
WHERE photo_url IS NOT NULL AND (photo_urls IS NULL OR photo_urls = '{}');
