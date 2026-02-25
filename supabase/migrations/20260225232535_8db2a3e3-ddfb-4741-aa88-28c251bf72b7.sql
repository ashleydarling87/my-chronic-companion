
CREATE TABLE public.entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  raw_text TEXT,
  pain_level INTEGER,
  energy_level INTEGER,
  mood TEXT,
  sleep_hours NUMERIC,
  symptoms JSONB DEFAULT '[]'::jsonb,
  severity TEXT,
  triggers JSONB DEFAULT '[]'::jsonb,
  summary TEXT,
  follow_up_question TEXT,
  emergency BOOLEAN DEFAULT false
);

ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on entries" ON public.entries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on entries" ON public.entries
  FOR SELECT USING (true);
