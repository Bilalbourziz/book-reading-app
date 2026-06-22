# Apply Database Migration

## Quick Fix for Favorites Count

The "Most Favorited" section is showing only the current user's favorites instead of the total across all users. This is due to Row Level Security (RLS) policies.

## Solution

You need to apply one SQL migration to allow all authenticated users to read the favorites table.

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy and paste the following SQL:

```sql
-- Allow all authenticated users to read favorites for public features
-- This enables the "Most Favorited" section to show total favorites across all users
CREATE POLICY "authenticated users can read favorites"
  ON public.favorites FOR SELECT TO authenticated
  USING (true);
```

5. Click **Run** (or press Ctrl+Enter)
6. You should see: "Success. No rows returned"

### Option 2: Using Supabase CLI (if installed)

If you have the Supabase CLI installed:

```bash
supabase migration up
```

## What This Does

This migration creates a new RLS policy that allows all authenticated users to read the favorites table. This is safe because:

- Users can only READ favorites (not modify them)
- Favorites are public information (similar to likes on social media)
- This enables the "Most Favorited" section to show accurate total counts

## After Applying

1. Refresh your browser (http://localhost:5173)
2. The "Most Favorited" section should now show the correct total favorites count
3. The count will reflect all users' favorites, not just yours

## Verification

- If you're logged in as User A and see "2 total favorites"
- Log in as User B 
- You should still see "2 total favorites" (not just User B's favorites)
- The count should be consistent across all users

## Need Help?

If you encounter any errors:
1. Make sure you're logged into the correct Supabase project
2. Check that the migration file exists: `supabase/migrations/20260621140000_allow_users_read_favorites.sql`
3. Verify you have admin access to the Supabase project