-- =============================================================================
-- FIX: "new row violates row-level security policy" when updating profile
-- =============================================================================
-- Run this ENTIRE file in the Supabase Dashboard:
--   Dashboard -> SQL Editor -> New query -> paste -> Run
--
-- This fixes BOTH parts of the profile update:
--   1) The `profiles` table UPDATE/INSERT policies (display name + avatar_url)
--   2) The `avatars` storage bucket policies (uploading/replacing the image)
--
-- The RLS error you saw happens when EITHER of these is missing or incomplete.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- PART 1: profiles table policies
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

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

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;


-- -----------------------------------------------------------------------------
-- PART 2: avatars storage bucket + policies
-- -----------------------------------------------------------------------------

-- Make sure the public 'avatars' bucket exists (5 MB limit, image types only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Clean up any previous versions of these policies
DROP POLICY IF EXISTS "Allow authenticated uploads to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from avatars"        ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to avatars" ON storage.objects;

-- INSERT: any signed-in user can upload into the avatars bucket
CREATE POLICY "Allow authenticated uploads to avatars"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- SELECT: anyone can read avatar images (bucket is public)
CREATE POLICY "Allow public read from avatars"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- UPDATE: needed when overwriting an existing file (upsert: true)
CREATE POLICY "Allow authenticated updates to avatars"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');

-- DELETE: needed for the WhatsApp-style "delete old avatar before upload"
CREATE POLICY "Allow authenticated deletes from avatars"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars');

GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;

-- =============================================================================
-- Done. Reload the app and try updating your profile / avatar again.
-- =============================================================================
