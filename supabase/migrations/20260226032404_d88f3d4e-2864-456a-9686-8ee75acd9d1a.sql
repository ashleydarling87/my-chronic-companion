
-- Extend entries table with rich pain-tracking fields
ALTER TABLE public.entries
  ADD COLUMN IF NOT EXISTS pain_verbal text,
  ADD COLUMN IF NOT EXISTS pain_face_id text,
  ADD COLUMN IF NOT EXISTS body_regions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS qualities jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS impacts jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS reliefs jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS felt_dismissed_by_provider boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS experienced_discrimination boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS context_notes text,
  ADD COLUMN IF NOT EXISTS journal_text text,
  ADD COLUMN IF NOT EXISTS share_with_doctor_flags jsonb DEFAULT '{"includeContextNotes": true, "includeDiscriminationNotes": false}'::jsonb;

-- Create doctor_reports table
CREATE TABLE IF NOT EXISTS public.doctor_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_period_start date NOT NULL,
  report_period_end date NOT NULL,
  average_pain numeric,
  worst_pain numeric,
  flare_count integer DEFAULT 0,
  average_energy numeric,
  pattern_insights jsonb DEFAULT '[]'::jsonb,
  functional_impact_summary jsonb DEFAULT '[]'::jsonb,
  treatments_tried jsonb DEFAULT '[]'::jsonb,
  patient_voice_quotes jsonb DEFAULT '[]'::jsonb,
  safety_or_red_flags text,
  context_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for doctor_reports (public access for now, no auth)
ALTER TABLE public.doctor_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert on doctor_reports" ON public.doctor_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on doctor_reports" ON public.doctor_reports FOR SELECT USING (true);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pain_preference text NOT NULL DEFAULT 'numeric',
  pain_misunderstanding_note text,
  identity_tags jsonb DEFAULT '[]'::jsonb,
  report_sharing_defaults jsonb DEFAULT '{"includeDiscrimination": false, "includeEmotionalImpact": false}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert on user_preferences" ON public.user_preferences FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on user_preferences" ON public.user_preferences FOR SELECT USING (true);
CREATE POLICY "Allow public update on user_preferences" ON public.user_preferences FOR UPDATE USING (true) WITH CHECK (true);
