-- ============================================
-- BOOK SUBMISSIONS TABLE + POLICIES ONLY
-- (Storage buckets must be created via UI)
-- ============================================

-- ============================================
-- 1. CREATE BOOK SUBMISSIONS TABLE
-- ============================================
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


-- ============================================
-- 2. CREATE INDEXES
-- ============================================
CREATE INDEX book_submissions_user_id_idx ON public.book_submissions(user_id);
CREATE INDEX book_submissions_status_idx ON public.book_submissions(status);
CREATE INDEX book_submissions_created_at_idx ON public.book_submissions(created_at);


-- ============================================
-- 3. ENABLE RLS
-- ============================================
ALTER TABLE public.book_submissions ENABLE ROW LEVEL SECURITY;


-- ============================================
-- 4. CREATE POLICIES
-- ============================================

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

-- Admins can update submissions
CREATE POLICY "admins update submissions"
  ON public.book_submissions FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================
-- 5. GRANT PERMISSIONS
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_submissions TO authenticated;
GRANT ALL ON public.book_submissions TO service_role;


-- ============================================
-- DONE WITH DATABASE!
-- ============================================
-- Now create storage buckets via UI:
-- 1. Go to Storage → Create bucket "books" (public, 50MB)
-- 2. Go to Storage → Create bucket "avatars" (public, 5MB)
-- 3. Add policies to each bucket via UI