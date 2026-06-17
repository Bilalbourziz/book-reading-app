-- Add foreign key relationship between reviews and profiles
-- This allows joining reviews with user profile information

-- Drop existing constraints if they exist (to ensure they point to the correct table)
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE public.ratings DROP CONSTRAINT IF EXISTS ratings_user_id_fkey;

-- Add foreign key constraint from reviews.user_id to profiles.id
ALTER TABLE public.reviews 
  ADD CONSTRAINT reviews_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- Add foreign key constraint from ratings.user_id to profiles.id
ALTER TABLE public.ratings 
  ADD CONSTRAINT ratings_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;
