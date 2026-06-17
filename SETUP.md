# Book Reading App - Setup Guide

## Database Setup

The reviews and ratings feature requires running the database migration in Supabase:

### Step 1: Run the Migration

1. Go to your Supabase project: https://ugorcewqfkdlldwqiknr.supabase.co
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"
4. Copy and paste the contents of `supabase/migrations/20260617024500_book_ratings_reviews_fix.sql`
5. Click "Run" to execute the migration

**Note:** If you get an error about policies already existing, that's okay! This new migration will automatically handle existing objects. Just run it again.

### Step 1b: Add Foreign Key Relationships (REQUIRED for reviews to work)

After running the main migration, you MUST run this additional migration to fix the relationship between reviews and profiles:

1. In the SQL Editor, click "New query"
2. Copy and paste the following SQL:

```sql
-- Add foreign key relationship between reviews and profiles
-- This allows joining reviews with user profile information

-- Drop existing constraints if they exist (to ensure they point to the correct table)
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE public.ratings DROP CONSTRAINT IF EXISTS ratings_user_id_fkey;

-- Add foreign key constraint from reviews.user_id to profiles.id
ALTER TABLE public.reviews 
  ADD CONSTRAINT reviews_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- Add foreign key constraint from ratings.user_id to profiles.id
ALTER TABLE public.ratings 
  ADD CONSTRAINT ratings_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;
```

3. Click "Run" to execute

**Important:** Without this step, you will see the error: "Could not find a relationship between 'reviews' and 'profiles' in the schema cache"

This will create:
- `ratings` table (for star ratings)
- `reviews` table (for text reviews)
- Necessary indexes and RLS policies
- Triggers for automatic timestamp updates

### Step 2: Verify the Setup

After running the migration, verify the tables were created:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ratings', 'reviews');
```

You should see both `ratings` and `reviews` in the results.

## Troubleshooting Reviews Not Displaying

### Check Browser Console

1. Open the book page where you're trying to write a review
2. Press F12 to open Developer Tools
3. Go to the "Console" tab
4. Try to write and post a review
5. Look for these log messages:
   - `"Reviews query:"` - Shows if reviews are being fetched
   - `"Creating review:"` - Shows if the review is being created
   - `"Review created successfully:"` - Shows if creation succeeded
   - Any error messages in red

### Common Issues

#### Issue 1: "Failed to fetch reviews" or "Failed to create review"

**Solution:** The migration hasn't been run. Follow Step 1 above.

#### Issue 2: Reviews fetch successfully but don't display

**Solution:** Check if you're signed in. The reviews section requires authentication to post, but should display existing reviews to everyone.

#### Issue 3: "Permission denied" error

**Solution:** The RLS policies might not be set up correctly. Re-run the migration.

### Testing the Feature

1. **Sign in** to your account
2. Navigate to any book page
3. Scroll to the "Ratings & Reviews" section
4. Click on stars to rate the book
5. Write a review in the text area
6. Click "Post Review"
7. Check the console for success/error messages
8. The review should appear in the list below

## Features Implemented

### ✅ Completed Features

1. **PDF Reading** - PDFs display in an embedded viewer without dark mode filters
2. **External Books** - External book links redirect to their original URL
3. **Star Ratings** - Users can rate books (1-5 stars)
4. **Text Reviews** - Users can write, edit, and delete reviews
5. **Review Display** - Reviews show author name, date, and content
6. **Rating Statistics** - Shows average rating and total review count

### 🔧 Technical Details

- **Frontend:** React with TanStack Router
- **Backend:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Database:** PostgreSQL with RLS policies
- **State Management:** TanStack Query (React Query)

## File Structure

```
├── src/
│   ├── components/
│   │   └── reviews-section.tsx    # Reviews UI component
│   ├── lib/
│   │   └── api/
│   │       └── ratings.functions.ts # Database operations
│   └── routes/
│       └── book.$id.tsx           # Book detail page
├── supabase/
│   └── migrations/
│       └── 20260617024500_book_ratings_reviews.sql
└── SETUP.md                       # This file
```

## Need Help?

If reviews still don't work after following this guide:

1. Check the browser console for specific error messages
2. Verify the migration ran successfully in Supabase
3. Ensure you're signed in when posting reviews
4. Check Supabase logs in the dashboard for database errors

## Recent Fixes

- **PDF Display:** Removed dark mode filter from PDF embeds that was causing display issues
- **External Books:** Changed from iframe embedding to direct URL redirect (external sites block iframes)
- **Review Debugging:** Added comprehensive logging to identify issues