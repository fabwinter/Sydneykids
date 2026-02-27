
-- Add event-specific columns to the activities table for "What's On" events
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS event_dates TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS event_cost TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS ticket_url TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS organizer_name TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS organizer_phone TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS organizer_website TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS organizer_facebook TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS organizer_instagram TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS is_event BOOLEAN NOT NULL DEFAULT false;

-- Index for quickly finding events
CREATE INDEX IF NOT EXISTS idx_activities_is_event ON public.activities (is_event) WHERE is_event = true;
