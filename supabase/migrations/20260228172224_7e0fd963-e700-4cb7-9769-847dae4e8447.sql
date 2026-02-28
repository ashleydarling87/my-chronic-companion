CREATE TABLE public.encouragement_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.encouragement_notes ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read all notes (anonymous community wall)
CREATE POLICY "Authenticated users can read all notes"
  ON public.encouragement_notes FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can insert their own notes
CREATE POLICY "Users can insert own notes"
  ON public.encouragement_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notes
CREATE POLICY "Users can delete own notes"
  ON public.encouragement_notes FOR DELETE
  USING (auth.uid() = user_id);