-- Add com_terco boolean to novenas_progress.
-- When true, the daily prayer flow includes a rosary before marking the day.
ALTER TABLE public.novenas_progress
  ADD COLUMN IF NOT EXISTS com_terco boolean NOT NULL DEFAULT false;
