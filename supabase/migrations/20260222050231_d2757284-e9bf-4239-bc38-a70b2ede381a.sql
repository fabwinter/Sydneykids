ALTER TABLE public.activities ADD COLUMN show_in_featured boolean NOT NULL DEFAULT false;

CREATE INDEX idx_activities_featured ON public.activities (show_in_featured) WHERE show_in_featured = true;