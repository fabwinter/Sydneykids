
-- Create foursquare cache table
CREATE TABLE public.foursquare_cache (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.foursquare_cache ENABLE ROW LEVEL SECURITY;

-- Anyone can read cache
CREATE POLICY "Anyone can read foursquare cache"
ON public.foursquare_cache FOR SELECT
USING (true);

-- Only service role can insert/update (via edge function)
-- No user-facing write policies needed
