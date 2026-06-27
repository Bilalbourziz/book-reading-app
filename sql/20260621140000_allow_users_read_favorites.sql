-- Allow all authenticated users to read favorites for public features
-- This enables the "Most Favorited" section to show total favorites across all users
CREATE POLICY "authenticated users can read favorites"
  ON public.favorites FOR SELECT TO authenticated
  USING (true);