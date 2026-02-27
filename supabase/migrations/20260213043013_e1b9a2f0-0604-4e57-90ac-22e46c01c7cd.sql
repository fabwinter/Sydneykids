
-- Storage policy for viewing check-in photos (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view check-in photos' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Anyone can view check-in photos"
    ON storage.objects FOR SELECT USING (bucket_id = 'check-in-photos');
  END IF;
END $$;
