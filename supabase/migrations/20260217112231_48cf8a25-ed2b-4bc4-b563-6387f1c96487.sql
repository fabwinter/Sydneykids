-- Add source_url column for deduplication of imported What's On events
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS source_url text;

-- Create index for fast lookup by source_url
CREATE INDEX IF NOT EXISTS idx_activities_source_url ON public.activities (source_url) WHERE source_url IS NOT NULL;