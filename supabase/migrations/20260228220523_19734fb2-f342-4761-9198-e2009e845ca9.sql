CREATE TABLE public.saved_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date_range TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own saved reports" ON public.saved_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own saved reports" ON public.saved_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved reports" ON public.saved_reports FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own saved reports" ON public.saved_reports FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);