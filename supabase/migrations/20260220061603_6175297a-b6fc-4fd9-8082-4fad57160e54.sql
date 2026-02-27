
-- Add show_in_whats_on flag to activities
ALTER TABLE public.activities ADD COLUMN show_in_whats_on boolean NOT NULL DEFAULT false;

-- Set existing events to show in What's On by default
UPDATE public.activities SET show_in_whats_on = true WHERE is_event = true;
