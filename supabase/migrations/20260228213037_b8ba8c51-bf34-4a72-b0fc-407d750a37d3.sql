ALTER TABLE public.user_preferences 
  ADD COLUMN care_recipient_name text DEFAULT NULL,
  ADD COLUMN care_recipient_age_range text DEFAULT NULL;