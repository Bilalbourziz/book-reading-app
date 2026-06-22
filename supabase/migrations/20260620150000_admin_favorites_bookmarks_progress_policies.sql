-- Admin RLS policies for favorites, bookmarks, and reading_progress
-- Allow admins to view all records across these tables for the dashboard

CREATE POLICY "admins select favorites"
  ON public.favorites FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "admins select bookmarks"
  ON public.bookmarks FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "admins select reading_progress"
  ON public.reading_progress FOR SELECT TO authenticated
  USING (public.is_admin());