
ALTER TABLE public.encouragement_notes
ADD COLUMN is_anonymous boolean NOT NULL DEFAULT false,
ADD COLUMN display_name text DEFAULT NULL,
ADD COLUMN author_profile_pic text DEFAULT NULL;
