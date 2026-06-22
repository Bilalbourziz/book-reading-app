-- Run this in Supabase → SQL Editor (one time)
-- Replace with YOUR sign-in email

INSERT INTO public.admin_emails (email)
VALUES ('your-email@gmail.com')
ON CONFLICT DO NOTHING;

-- Also run these migration files if not done yet:
-- 1. supabase/migrations/20260613120000_admin_book_policies.sql
-- 2. supabase/migrations/20260613130000_books_storage.sql
-- 3. supabase/migrations/20260615120000_profiles_email_admin_visibility.sql

-- Check it worked:
SELECT * FROM public.admin_emails;
