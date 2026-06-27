# Lumen Book Reading App - Setup Guide

## What Was Changed

### 1. Reading Progress - COMPLETELY REMOVED
- ✅ Database table `reading_progress` dropped
- ✅ Removed from admin dashboard
- ✅ Removed from library page
- ✅ Removed from reader page
- ✅ No more page tracking or progress saving

### 2. Book Submission System - ADDED
- ✅ Users can submit books via `/submit-book`
- ✅ Books require admin approval before publishing
- ✅ Admins can approve/reject at `/admin/submissions`
- ✅ Navigation link "Submit Book" in header

## Quick Setup (5 Minutes)

### Step 1: Run Database Migrations

Go to **Supabase Dashboard → SQL Editor** and run these in order:

```sql
-- 1. Drop reading progress table (if not already done)
DROP TABLE IF EXISTS public.reading_progress CASCADE;

-- 2. Create book submissions table
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

-- 3. Enable RLS
ALTER TABLE public.book_submissions ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_submissions TO authenticated;
GRANT ALL ON public.book_submissions TO service_role;
```

### Step 2: Create Storage Bucket

**Option A: Via Supabase Dashboard (Easiest)**
1. Go to **Storage → Create bucket**
2. Name: `books`
3. Set as **Public**
4. File size limit: 50 MB
5. Allowed MIME types: `application/pdf, image/jpeg, image/png, image/webp`

**Option B: Via SQL**
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('books', 'books', true, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
```

### Step 3: Configure Storage RLS Policies

Go to **Storage → books bucket → Policies tab** and add these 3 policies:

**Policy 1 - Allow Uploads:**
- Operation: INSERT
- Policy name: "Allow authenticated uploads to books"
- USING: `bucket_id = 'books' AND auth.role() = 'authenticated'`

**Policy 2 - Allow Read:**
- Operation: SELECT
- Policy name: "Allow public read from books"
- USING: `bucket_id = 'books'`

**Policy 3 - Allow Delete:**
- Operation: DELETE
- Policy name: "Allow authenticated deletes from books"
- USING: `bucket_id = 'books' AND auth.role() = 'authenticated'`

### Step 4: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
# Then start again:
npm run dev
# or
bun run dev
```

### Step 5: Test

1. **Sign out** and **sign back in** (to refresh session)
2. Visit `/submit-book` - should work now
3. Visit `/admin/submissions` - should show submissions (admin only)

## Full Customization

### Change Storage Bucket Name

If you want to use a different bucket name, update these files:

1. **src/lib/upload-book.ts** - Change bucket name
2. **supabase/migrations/20260622000003_fix_storage_rls.sql** - Update bucket references
3. **src/routes/_authenticated/submit-book.tsx** - Update upload paths

### Modify Submission Fields

Edit these files:
- **src/lib/api/book-submissions.functions.ts** - API functions
- **src/routes/_authenticated/submit-book.tsx** - Form fields
- **supabase/migrations/20260622000000_book_submissions.sql** - Database schema

### Change Admin Approval Flow

Edit:
- **src/routes/_authenticated/admin/submissions.tsx** - Admin UI
- **src/lib/api/book-submissions.functions.ts** - Approval logic

### Add Email Notifications

Add to **src/lib/api/book-submissions.functions.ts**:
```typescript
// After createBookSubmission succeeds
await supabase.functions.invoke('send-email', {
  body: {
    to: adminEmail,
    subject: 'New book submission',
    body: `Book "${title}" submitted by ${user.email}`
  }
});
```

## Troubleshooting

### "New row violates row-level security policy"
- Make sure you ran the RLS policies SQL
- Sign out and sign back in
- Check that `auth.uid()` matches `user_id` in the submission

### "Failed to upload file"
- Make sure the "books" storage bucket exists
- Check storage RLS policies are configured
- Verify bucket is set to Public

### "Route not found (404)"
- Restart dev server
- Run `npx @tanstack/router-cli generate` to regenerate route tree

## Features

### For Users:
- Submit books for review
- View submission status
- Track pending/approved/rejected books

### For Admins:
- Review all submissions
- Approve or reject with notes
- View submission details

### Removed:
- ❌ Reading progress tracking
- ❌ Page number saving
- ❌ Continue reading section
- ❌ Progress statistics

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs in Dashboard
3. Verify all migrations were run
4. Ensure storage bucket exists with correct policies