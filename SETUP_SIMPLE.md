# Lumen Book Reading App - Simple Setup Guide

## What Was Changed

### 1. Reading Progress - REMOVED ✅
- Database table dropped (you already did this!)
- Removed from all pages

### 2. Book Submission System - ADDED ✅
- Users submit books via `/submit-book`
- Admin reviews at `/admin/submissions`
- Navigation link in header

### 3. Profile Picture Upload - ADDED ✅
- Users can upload profile pictures at `/profile`

## Simple Setup (Use Dashboard UI, Not SQL)

### Step 1: Create Database Table

**Go to Supabase Dashboard → Table Editor → Create table**

Table name: `book_submissions`

Columns:
```
- id (uuid, primary key, default: gen_random_uuid())
- user_id (uuid, foreign key to auth.users)
- title (text, not null)
- author (text, not null)
- description (text, nullable)
- cover_url (text, nullable)
- content_url (text, not null)
- year (int, nullable)
- language (text, default: 'en')
- categories (text[], default: '{}')
- source (text, default: 'link')
- status (text, default: 'pending', check: pending/approved/rejected)
- admin_notes (text, nullable)
- reviewed_by (uuid, nullable, foreign key to auth.users)
- reviewed_at (timestamptz, nullable)
- created_at (timestamptz, default: now())
- updated_at (timestamptz, default: now())
```

### Step 2: Enable RLS on book_submissions

**Go to Table Editor → book_submissions → Policies tab**

Click "Enable RLS", then add these policies:

**Policy 1 - Users view own:**
- Operation: SELECT
- Policy: `auth.uid() = user_id`

**Policy 2 - Users create:**
- Operation: INSERT
- Policy: `auth.uid() = user_id`
- WITH CHECK: `auth.uid() = user_id`

**Policy 3 - Users update own pending:**
- Operation: UPDATE
- Policy: `auth.uid() = user_id AND status = 'pending'`
- WITH CHECK: `auth.uid() = user_id AND status = 'pending'`

**Policy 4 - Users delete own pending:**
- Operation: DELETE
- Policy: `auth.uid() = user_id AND status = 'pending'`

**Policy 5 - Admins view all:**
- Operation: SELECT
- Policy: `public.is_admin()`

**Policy 6 - Admins update:**
- Operation: UPDATE
- Policy: `public.is_admin()`
- WITH CHECK: `public.is_admin()`

### Step 3: Create Storage Buckets

**Go to Storage → Create bucket**

**Bucket 1: books**
- Name: `books`
- Public: Yes
- File size limit: 50 MB
- Allowed MIME types: `application/pdf, image/jpeg, image/png, image/webp`

**Bucket 2: avatars**
- Name: `avatars`
- Public: Yes
- File size limit: 5 MB
- Allowed MIME types: `image/jpeg, image/png, image/webp`

### Step 4: Configure Storage RLS

**Go to Storage → books bucket → Policies tab**

Add 3 policies:

**Policy 1 - Upload:**
- Operation: INSERT
- Policy: `bucket_id = 'books' AND auth.role() = 'authenticated'`

**Policy 2 - Read:**
- Operation: SELECT
- Policy: `bucket_id = 'books'`

**Policy 3 - Delete:**
- Operation: DELETE
- Policy: `bucket_id = 'books' AND auth.role() = 'authenticated'`

**Repeat for avatars bucket:**

**Policy 1 - Upload:**
- Operation: INSERT
- Policy: `bucket_id = 'avatars' AND auth.role() = 'authenticated'`

**Policy 2 - Read:**
- Operation: SELECT
- Policy: `bucket_id = 'avatars'`

**Policy 3 - Delete:**
- Operation: DELETE
- Policy: `bucket_id = 'avatars' AND auth.role() = 'authenticated'`

### Step 5: Restart and Test

```bash
# Stop server (Ctrl+C)
# Start again:
npm run dev
```

1. **Sign out and sign back in**
2. **Test book submission:** Go to `/submit-book`
3. **Test profile picture:** Go to `/profile`
4. **Test admin:** Go to `/admin/submissions` (as admin)

## Features

### For Users:
- Submit books with PDF upload
- Auto-filled author name from profile
- Upload profile picture
- View submission status

### For Admins:
- Review all submissions
- See cover image and full description
- Preview book before approving
- Approve/reject with notes

## Troubleshooting

**"New row violates row-level security policy"**
- Make sure you enabled RLS on book_submissions table
- Check that all 6 policies are added correctly
- Sign out and back in

**"Failed to upload file"**
- Make sure storage buckets exist
- Check storage RLS policies
- Verify bucket is Public

**"No submissions showing in admin"**
- Check browser console (F12) for errors
- Verify you're logged in as admin
- Check Supabase Table Editor to see if data exists

## What's Working

✅ Reading progress completely removed
✅ Book submission system
✅ Admin review system
✅ Profile picture upload
✅ Auto-fill author name
✅ Cover image preview in admin
✅ All routes configured
✅ Navigation links added

The app is ready to use!