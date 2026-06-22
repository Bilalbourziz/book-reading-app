# CORRECT Storage Policies

## The Error You're Seeing:

```
ERROR: 42703: column "user_id" does not exist
HINT: Perhaps you meant to reference the column "objects.owner_id"
```

## Why This Happens:

You're using the wrong policy definition. The `user_id` column only exists in the `book_submissions` table, NOT in storage.

## CORRECT Policy Definitions for Storage:

### For "books" bucket:

**Policy 1 - Upload:**
- Policy name: `Allow authenticated uploads to books`
- Allowed operation: `INSERT`
- Policy definition: `bucket_id = 'books' AND auth.role() = 'authenticated'`
- ❌ WRONG: `auth.uid() = user_id`
- ✅ CORRECT: `bucket_id = 'books' AND auth.role() = 'authenticated'`

**Policy 2 - Read:**
- Policy name: `Allow public read from books`
- Allowed operation: `SELECT`
- Policy definition: `bucket_id = 'books'`
- ❌ WRONG: `auth.uid() = user_id`
- ✅ CORRECT: `bucket_id = 'books'`

**Policy 3 - Delete:**
- Policy name: `Allow authenticated deletes from books`
- Allowed operation: `DELETE`
- Policy definition: `bucket_id = 'books' AND auth.role() = 'authenticated'`
- ❌ WRONG: `auth.uid() = user_id`
- ✅ CORRECT: `bucket_id = 'books' AND auth.role() = 'authenticated'`

### For "avatars" bucket:

**Policy 1 - Upload:**
- Policy name: `Allow authenticated uploads to avatars`
- Allowed operation: `INSERT`
- Policy definition: `bucket_id = 'avatars' AND auth.role() = 'authenticated'`

**Policy 2 - Read:**
- Policy name: `Allow public read from avatars`
- Allowed operation: `SELECT`
- Policy definition: `bucket_id = 'avatars'`

**Policy 3 - Delete:**
- Policy name: `Allow authenticated deletes from avatars`
- Allowed operation: `DELETE`
- Policy definition: `bucket_id = 'avatars' AND auth.role() = 'authenticated'`

## Summary:

**For book_submissions TABLE (6 policies):**
- Use: `auth.uid() = user_id`
- This checks if the logged-in user matches the user_id in the table

**For STORAGE buckets (6 policies):**
- Use: `bucket_id = 'books'` or `bucket_id = 'avatars'`
- This checks which bucket the file is in
- DO NOT use `user_id` for storage!

## Quick Reference:

| Where | Column to Use | Example |
|-------|---------------|---------|
| book_submissions table | `user_id` | `auth.uid() = user_id` |
| Storage (books bucket) | `bucket_id` | `bucket_id = 'books'` |
| Storage (avatars bucket) | `bucket_id` | `bucket_id = 'avatars'` |

## Delete the Wrong Policy:

1. Go to the "books" bucket → Policies tab
2. Find the policy with error
3. Delete it
4. Create a new one with the CORRECT definition above

Same for "avatars" bucket.

This should fix the error!