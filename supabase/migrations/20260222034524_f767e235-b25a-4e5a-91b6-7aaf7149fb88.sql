
-- Calendar events table for planned activities
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own calendar events"
  ON public.calendar_events FOR SELECT
  USING (user_id = get_profile_id_from_auth());

CREATE POLICY "Users can create calendar events"
  ON public.calendar_events FOR INSERT
  WITH CHECK (user_id = get_profile_id_from_auth());

CREATE POLICY "Users can update own calendar events"
  ON public.calendar_events FOR UPDATE
  USING (user_id = get_profile_id_from_auth());

CREATE POLICY "Users can delete own calendar events"
  ON public.calendar_events FOR DELETE
  USING (user_id = get_profile_id_from_auth());
