-- =============================================================================
-- FIX: "new row violates row-level security policy" when updating profile
-- =============================================================================
-- This simplified version only creates/updates policies without requiring
-- table ownership. Run this in Supabase Dashboard -> SQL Editor.
--
-- This fixes the profiles table UPDATE/INSERT policies.
-- The storage policies should already be created by the migrations.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- PART 1: profiles table policies
-- -----------------------------------------------------------------------------

-- Anyone can read profiles (needed to show avatars/names across the app)
DROP POLICY IF EXISTS "profiles readable by all" ON public.profiles;
CREATE POLICY "profiles readable by all"
  ON public.profiles
  FOR SELECT
  USING (true);

-- A user can UPDATE their own profile.
-- IMPORTANT: WITH CHECK is required, otherwise the "new row" is rejected by RLS
-- (this is the exact cause of "new row violates row-level security policy").
DROP POLICY IF EXISTS "users update own profile" ON public.profiles;
CREATE POLICY "users update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- A user can INSERT their own profile row (used as a fallback / upsert).
DROP POLICY IF EXISTS "users insert own profile" ON public.profiles;
CREATE POLICY "users insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);


-- -----------------------------------------------------------------------------
-- PART 2: avatars storage policies (if not already created)
-- -----------------------------------------------------------------------------

-- Allow authenticated users to upload to avatars bucket
DROP POLICY IF EXISTS "Allow authenticated uploads to avatars" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

-- Allow public read access to avatars bucket
DROP POLICY IF EXISTS "Allow public read from avatars" ON storage.objects;
CREATE POLICY "Allow public read from avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Allow authenticated users to delete from avatars bucket (for WhatsApp-style replacement)
DROP POLICY IF EXISTS "Allow authenticated deletes from avatars" ON storage.objects;
CREATE POLICY "Allow authenticated deletes from avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to update existing avatar files (for upsert)
DROP POLICY IF EXISTS "Allow authenticated updates to avatars" ON storage.objects;
CREATE POLICY "Allow authenticated updates to avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');


-- =============================================================================
-- Done. Reload the app and try updating your profile / avatar again.
-- =============================================================================