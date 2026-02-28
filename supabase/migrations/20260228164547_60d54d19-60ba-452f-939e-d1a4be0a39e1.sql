ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS intake_condition text,
  ADD COLUMN IF NOT EXISTS intake_duration text,
  ADD COLUMN IF NOT EXISTS intake_body_regions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS intake_treatments jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS intake_goals text,
  ADD COLUMN IF NOT EXISTS intake_raw jsonb;