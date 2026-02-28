
CREATE TABLE public.mental_health_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  scale_type text NOT NULL DEFAULT 'phq4',
  total_score integer NOT NULL,
  anxiety_score integer,
  depression_score integer,
  answers jsonb DEFAULT '[]'::jsonb,
  severity text
);

ALTER TABLE public.mental_health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own scores" ON public.mental_health_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own scores" ON public.mental_health_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own scores" ON public.mental_health_scores FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own scores" ON public.mental_health_scores FOR DELETE USING (auth.uid() = user_id);
