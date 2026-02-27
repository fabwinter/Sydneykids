
-- Add region column to activities table
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS region text;

-- Create an index for region filtering
CREATE INDEX IF NOT EXISTS idx_activities_region ON public.activities(region);

-- Update existing activities with approximate regions based on known suburb patterns
-- (This gives a starting point; admins can refine via bulk edit)
