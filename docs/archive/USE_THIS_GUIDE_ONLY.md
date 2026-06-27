# ⚠️ STOP! READ THIS!

## You CANNOT use SQL for this setup!

The errors you're getting mean:
- "relation already exists" = Table already created
- "must be owner of table objects" = You don't have SQL permissions

## ✅ THE ONLY SOLUTION: Use Supabase Dashboard UI

Follow these steps EXACTLY:

---

## STEP 1: Enable RLS on book_submissions Table

1. Go to **Supabase Dashboard**
2. Click **Table Editor** (left sidebar)
3. Find and click on **book_submissions** table
4. Click **"Enable RLS"** button (top right)
5. Click **"Policies"** tab
6. Click **"New Policy"** button

### Add These 6 Policies One by One:

**Policy 1:**
- Policy name: `users view own submissions`
- Allowed operation: `SELECT`
- Policy definition: `auth.uid() = user_id`
- Click "Save"

**Policy 2:**
- Policy name: `users create submissions`
- Allowed operation: `INSERT`
- Policy definition: `auth.uid() = user_id`
- WITH CHECK: `auth.uid() = user_id`
- Click "Save"

**Policy 3:**
- Policy name: `users update own pending`
- Allowed operation: `UPDATE`
- Policy definition: `auth.uid() = user_id AND status = 'pending'`
- WITH CHECK: `auth.uid() = user_id AND status = 'pending'`
- Click "Save"

**Policy 4:**
- Policy name: `users delete own pending`
- Allowed operation: `DELETE`
- Policy definition: `auth.uid() = user_id AND status = 'pending'`
- Click "Save"

**Policy 5:**
- Policy name: `admins view all`
- Allowed operation: `SELECT`
- Policy definition: `public.is_admin()`
- Click "Save"

**Policy 6:**
- Policy name: `admins update all`
- Allowed operation: `UPDATE`
- Policy definition: `public.is_admin()`
- WITH CHECK: `public.is_admin()`
- Click "Save"

---

## STEP 2: Create Storage Buckets

1. Go to **Storage** (left sidebar)
2. Click **"New bucket"**

### Create "books" bucket:
- Name: `books`
- Public: **Toggle ON** (important!)
- File size limit: `52428800` (50 MB)
- Allowed MIME types: `application/pdf, image/jpeg, image/png, image/webp`
- Click **"Create bucket"**

### Create "avatars" bucket:
- Click **"New bucket"** again
- Name: `avatars`
- Public: **Toggle ON** (important!)
- File size limit: `5242880` (5 MB)
- Allowed MIME types: `image/jpeg, image/png, image/webp`
- Click **"Create bucket"**

---

## STEP 3: Add Storage Policies

### For "books" bucket:
1. Click on **"books"** bucket
2. Click **"Policies"** tab
3. Click **"New Policy"** 3 times:

**Policy 1:**
- Policy name: `Allow authenticated uploads to books`
- Allowed operation: `INSERT`
- Policy definition: `bucket_id = 'books' AND auth.role() = 'authenticated'`
- Click "Save"

**Policy 2:**
- Policy name: `Allow public read from books`
- Allowed operation: `SELECT`
- Policy definition: `bucket_id = 'books'`
- Click "Save"

**Policy 3:**
- Policy name: `Allow authenticated deletes from books`
- Allowed operation: `DELETE`
- Policy definition: `bucket_id = 'books' AND auth.role() = 'authenticated'`
- Click "Save"

### For "avatars" bucket:
1. Click on **"avatars"** bucket
2. Click **"Policies"** tab
3. Click **"New Policy"** 3 times:

**Policy 1:**
- Policy name: `Allow authenticated uploads to avatars`
- Allowed operation: `INSERT`
- Policy definition: `bucket_id = 'avatars' AND auth.role() = 'authenticated'`
- Click "Save"

**Policy 2:**
- Policy name: `Allow public read from avatars`
- Allowed operation: `SELECT`
- Policy definition: `bucket_id = 'avatars'`
- Click "Save"

**Policy 3:**
- Policy name: `Allow authenticated deletes from avatars`
- Allowed operation: `DELETE`
- Policy definition: `bucket_id = 'avatars' AND auth.role() = 'authenticated'`
- Click "Save"

---

## STEP 4: Test

1. Go back to your terminal
2. Stop the dev server (Ctrl+C)
3. Start it again: `npm run dev`
4. Open browser: `http://localhost:5173`
5. **Sign OUT and sign back IN** (important!)
6. Test these:
   - `/submit-book` - Submit a book
   - `/profile` - Upload avatar
   - `/admin/submissions` - Review books (as admin)

---

## Summary

**Total steps in UI:**
- ✅ 6 RLS policies for book_submissions table
- ✅ 2 storage buckets created
- ✅ 6 storage policies (3 per bucket)

**No SQL needed!** Everything is done through the Supabase Dashboard UI.

This is the ONLY way to set this up. SQL won't work due to permissions.