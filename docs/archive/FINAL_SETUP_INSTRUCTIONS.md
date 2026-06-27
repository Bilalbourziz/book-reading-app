# FINAL SETUP INSTRUCTIONS

## What You Can Do in SQL vs UI

### ✅ CAN DO IN SQL:
- Create book_submissions table
- Create RLS policies for book_submissions
- Grant permissions

### ❌ CANNOT DO IN SQL (Supabase limitation):
- Create storage buckets
- Create storage RLS policies
- Access storage.objects table

## STEP 1: Run This SQL (Database Setup)

Copy and paste into Supabase SQL Editor:

```sql
-- Create book_submissions table
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

-- Create indexes
CREATE INDEX book_submissions_user_id_idx ON public.book_submissions(user_id);
CREATE INDEX book_submissions_status_idx ON public.book_submissions(status);
CREATE INDEX book_submissions_created_at_idx ON public.book_submissions(created_at);

-- Enable RLS
ALTER TABLE public.book_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies
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
```

## STEP 2: Create Storage Buckets (MUST USE UI)

**You cannot do this in SQL. You must use the Supabase Dashboard.**

### Go to: Supabase Dashboard → Storage

### Create Bucket 1: "books"
- Click "New bucket"
- Name: `books`
- Public: **Enabled** (toggle ON)
- File size limit: `52428800` (50 MB)
- Allowed MIME types: `application/pdf, image/jpeg, image/png, image/webp`
- Click "Create bucket"

### Create Bucket 2: "avatars"
- Click "New bucket"
- Name: `avatars`
- Public: **Enabled** (toggle ON)
- File size limit: `5242880` (5 MB)
- Allowed MIME types: `image/jpeg, image/png, image/webp`
- Click "Create bucket"

## STEP 3: Add Storage Policies (MUST USE UI)

### For "books" bucket:
1. Click on "books" bucket
2. Go to "Policies" tab
3. Click "New Policy" 3 times:

**Policy 1:**
- Policy name: `Allow authenticated uploads to books`
- Allowed operation: `INSERT`
- Policy definition: `bucket_id = 'books' AND auth.role() = 'authenticated'`

**Policy 2:**
- Policy name: `Allow public read from books`
- Allowed operation: `SELECT`
- Policy definition: `bucket_id = 'books'`

**Policy 3:**
- Policy name: `Allow authenticated deletes from books`
- Allowed operation: `DELETE`
- Policy definition: `bucket_id = 'books' AND auth.role() = 'authenticated'`

### For "avatars" bucket:
1. Click on "avatars" bucket
2. Go to "Policies" tab
3. Click "New Policy" 3 times:

**Policy 1:**
- Policy name: `Allow authenticated uploads to avatars`
- Allowed operation: `INSERT`
- Policy definition: `bucket_id = 'avatars' AND auth.role() = 'authenticated'`

**Policy 2:**
- Policy name: `Allow public read from avatars`
- Allowed operation: `SELECT`
- Policy definition: `bucket_id = 'avatars'`

**Policy 3:**
- Policy name: `Allow authenticated deletes from avatars`
- Allowed operation: `DELETE`
- Policy definition: `bucket_id = 'avatars' AND auth.role() = 'authenticated'`

## STEP 4: Test

1. Restart dev server: `npm run dev`
2. Sign OUT and back IN
3. Test `/submit-book` - should work
4. Test `/profile` - should be able to upload avatar
5. Test `/admin/submissions` - should show submissions (as admin)

## Why Storage Requires UI:

Supabase's storage system uses a special `storage.objects` table that:
- Has special internal permissions
- Cannot be modified by regular SQL
- Requires the Dashboard UI to configure

This is a Supabase security feature, not a bug. There's no way around it.

## Summary:

- **SQL**: book_submissions table + RLS policies ✅
- **UI**: Storage buckets + storage policies ❌ (required)

Everything else in the app is ready to go!