# ⚠️ IMPORTANT: READ THIS FIRST

## The table already exists! Don't run RUN_THIS_IN_SUPABASE.sql

You're getting "relation already exists" error because the `book_submissions` table was already created.

## ✅ DO THIS INSTEAD:

### Run ONLY this file:
**`RUN_POLICIES_ONLY.sql`**

This file will:
- ✅ Create RLS policies (no table creation)
- ✅ Create storage buckets
- ✅ Create storage policies
- ✅ Grant permissions

### Steps:
1. Open Supabase Dashboard → SQL Editor
2. Open file: `RUN_POLICIES_ONLY.sql`
3. Copy ALL contents
4. Paste into SQL Editor
5. Click "Run"

### After running:
1. Restart dev server: `npm run dev`
2. Sign OUT and back IN
3. Test `/submit-book`
4. Test `/profile` (upload avatar)
5. Test `/admin/submissions` (as admin)

## What each file does:

- **RUN_THIS_IN_SUPABASE.sql** - Creates table FROM SCRATCH (causes error if table exists)
- **RUN_POLICIES_ONLY.sql** - Only creates policies (USE THIS ONE)
- **SETUP_SIMPLE.md** - UI-based instructions
- **SETUP_GUIDE_NEW.md** - Detailed guide

## If you still get errors:

Check browser console (F12) and tell me what error you see.

The app code is 100% ready. Just needs the database policies configured.