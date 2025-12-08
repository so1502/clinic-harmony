-- Add foreign key from therapists.user_id to profiles.id for join support
ALTER TABLE public.therapists
ADD CONSTRAINT therapists_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;