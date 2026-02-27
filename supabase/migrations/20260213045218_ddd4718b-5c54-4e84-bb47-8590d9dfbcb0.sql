
-- Drop existing restrictive policies on storage.objects for check-in-photos
DROP POLICY IF EXISTS "Authenticated users can upload check-in photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view check-in photos" ON storage.objects;

-- Create permissive policies for check-in-photos bucket
CREATE POLICY "Allow authenticated uploads to check-in-photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'check-in-photos');

CREATE POLICY "Allow public read of check-in-photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'check-in-photos');

CREATE POLICY "Allow authenticated delete of own check-in-photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'check-in-photos');
