-- Fix the profiles UPDATE policy to include WITH CHECK
-- The original policy (from 20260610194325) was missing WITH CHECK,
-- which caused "new row violates row-level security policy" errors
-- when PostgREST upserts attempted to INSERT (which requires WITH CHECK).

-- Also ensure INSERT policy exists with proper WITH CHECK.

-- Drop the existing UPDATE policy so we can recreate it with WITH CHECK
DROP POLICY IF EXISTS "users update own profile" ON public.profiles;

-- Recreate with both USING (target row filter) and WITH CHECK (new row validation)
CREATE POLICY "users update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure INSERT policy exists too (for upsert fallback)
DROP POLICY IF EXISTS "users insert own profile" ON public.profiles;
CREATE POLICY "users insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);