
-- Add user_id to user_preferences for auth
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add buddy and onboarding columns
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS buddy_name text DEFAULT 'Buddy';
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS buddy_avatar text DEFAULT 'bear';
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS age_range text;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;

-- Add user_id to entries
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to doctor_reports
ALTER TABLE public.doctor_reports ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing permissive policies and replace with user-scoped ones
DROP POLICY IF EXISTS "Allow public insert on user_preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Allow public select on user_preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Allow public update on user_preferences" ON public.user_preferences;

CREATE POLICY "Users can read own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow public insert on entries" ON public.entries;
DROP POLICY IF EXISTS "Allow public select on entries" ON public.entries;
DROP POLICY IF EXISTS "Allow public update on entries" ON public.entries;
DROP POLICY IF EXISTS "Allow public delete on entries" ON public.entries;

CREATE POLICY "Users can read own entries" ON public.entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own entries" ON public.entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entries" ON public.entries FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own entries" ON public.entries FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow public insert on doctor_reports" ON public.doctor_reports;
DROP POLICY IF EXISTS "Allow public select on doctor_reports" ON public.doctor_reports;

CREATE POLICY "Users can read own reports" ON public.doctor_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports" ON public.doctor_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
