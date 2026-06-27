-- Fix RLS policies for book_submissions table
-- This migration fixes the RLS policies without recreating the table

-- Enable RLS (in case it's not enabled)
ALTER TABLE public.book_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users view own submissions" ON public.book_submissions;
DROP POLICY IF EXISTS "users create submissions" ON public.book_submissions;
DROP POLICY IF EXISTS "users update own pending submissions" ON public.book_submissions;
DROP POLICY IF EXISTS "users delete own pending submissions" ON public.book_submissions;
DROP POLICY IF EXISTS "admins view all submissions" ON public.book_submissions;
DROP POLICY IF EXISTS "admins update submissions" ON public.book_submissions;

-- Create policies for users
CREATE POLICY "users view own submissions"
  ON public.book_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users create submissions"
  ON public.book_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own pending submissions"
  ON public.book_submissions FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "users delete own pending submissions"
  ON public.book_submissions FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');

-- Create policies for admins
CREATE POLICY "admins view all submissions"
  ON public.book_submissions FOR SELECT
  USING (public.is_admin());

CREATE POLICY "admins update submissions"
  ON public.book_submissions FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_submissions TO authenticated;
GRANT ALL ON public.book_submissions TO service_role;