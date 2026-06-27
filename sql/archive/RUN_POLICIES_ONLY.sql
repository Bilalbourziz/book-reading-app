-- ============================================
-- RUN THIS IF TABLE ALREADY EXISTS
-- ============================================
-- This only creates RLS policies and storage setup
-- Use this if you get "relation already exists" error

-- ============================================
-- 1. ENABLE RLS ON BOOK_SUBMISSIONS
-- ============================================
ALTER TABLE public.book_submissions ENABLE ROW LEVEL SECURITY;


-- ============================================
-- 2. DROP EXISTING POLICIES (if any)
-- ============================================
DROP POLICY IF EXISTS "users view own submissions" ON public.book_submissions;
DROP POLICY IF EXISTS "users create submissions" ON public.book_submissions;
DROP POLICY IF EXISTS "users update own pending submissions" ON public.book_submissions;
DROP POLICY IF EXISTS "users delete own pending submissions" ON public.book_submissions;
DROP POLICY IF EXISTS "admins view all submissions" ON public.book_submissions;
DROP POLICY IF EXISTS "admins update submissions" ON public.book_submissions;


-- ============================================
-- 3. CREATE RLS POLICIES FOR BOOK_SUBMISSIONS
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

-- Admins can update submissions (approve/reject)
CREATE POLICY "admins update submissions"
  ON public.book_submissions FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================
-- 4. GRANT PERMISSIONS
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_submissions TO authenticated;
GRANT ALL ON public.book_submissions TO service_role;


-- ============================================
-- 5. CREATE STORAGE BUCKETS
-- ============================================

-- Create books bucket (for PDFs and cover images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('books', 'books', true, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create avatars bucket (for profile pictures)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;


-- ============================================
-- 6. ENABLE RLS ON STORAGE
-- ============================================
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;


-- ============================================
-- 7. DROP EXISTING STORAGE POLICIES
-- ============================================
DROP POLICY IF EXISTS "Allow authenticated uploads to books" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from books" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from books" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from avatars" ON storage.objects;


-- ============================================
-- 8. STORAGE POLICIES FOR BOOKS BUCKET
-- ============================================

-- Allow authenticated uploads to books
CREATE POLICY "Allow authenticated uploads to books"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'books' 
    AND auth.role() = 'authenticated'
  );

-- Allow public read from books
CREATE POLICY "Allow public read from books"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'books');

-- Allow authenticated deletes from books
CREATE POLICY "Allow authenticated deletes from books"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'books' 
    AND auth.role() = 'authenticated'
  );


-- ============================================
-- 9. STORAGE POLICIES FOR AVATARS BUCKET
-- ============================================

-- Allow authenticated uploads to avatars
CREATE POLICY "Allow authenticated uploads to avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
  );

-- Allow public read from avatars
CREATE POLICY "Allow public read from avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Allow authenticated deletes from avatars
CREATE POLICY "Allow authenticated deletes from avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
  );


-- ============================================
-- 10. GRANT STORAGE PERMISSIONS
-- ============================================
GRANT SELECT, INSERT, DELETE ON storage.objects TO authenticated;
GRANT ALL ON storage.objects TO service_role;


-- ============================================
-- DONE! 
-- ============================================
-- Now restart your dev server and test:
-- 1. npm run dev
-- 2. Sign out and back in
-- 3. Test /submit-book
-- 4. Test /profile (upload avatar)
-- 5. Test /admin/submissions (as admin)