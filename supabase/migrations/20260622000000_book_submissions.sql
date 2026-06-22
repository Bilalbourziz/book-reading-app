-- Book submissions table for user-submitted books requiring admin approval
CREATE TABLE public.book_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  content_url TEXT NOT NULL,
  year INT,
  language TEXT DEFAULT 'en',
  categories TEXT[] DEFAULT '{}',
  source TEXT DEFAULT 'link',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX book_submissions_user_id_idx ON public.book_submissions(user_id);
CREATE INDEX book_submissions_status_idx ON public.book_submissions(status);
CREATE INDEX book_submissions_created_at_idx ON public.book_submissions(created_at);

-- RLS Policies
ALTER TABLE public.book_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "users view own submissions"
  ON public.book_submissions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create submissions
CREATE POLICY "users create submissions"
  ON public.book_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending submissions
CREATE POLICY "users update own pending submissions"
  ON public.book_submissions FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Users can delete their own pending submissions
CREATE POLICY "users delete own pending submissions"
  ON public.book_submissions FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all submissions
CREATE POLICY "admins view all submissions"
  ON public.book_submissions FOR SELECT
  USING (public.is_admin());

-- Admins can update submissions (approve/reject)
CREATE POLICY "admins update submissions"
  ON public.book_submissions FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_submissions TO authenticated;
GRANT ALL ON public.book_submissions TO service_role;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_book_submissions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_book_submissions_updated_at
  BEFORE UPDATE ON public.book_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_book_submissions_updated_at();