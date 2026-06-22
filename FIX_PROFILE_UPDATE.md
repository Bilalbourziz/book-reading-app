# FIX: Profile Update Not Working

## The Problem:
"Profile updated!" shows, but changes don't save. This means RLS is blocking the update.

## Solution: Add UPDATE Policy to Profiles Table

### Step 1: Go to Profiles Table
1. Supabase Dashboard → **Table Editor**
2. Click **profiles** table
3. Click **Policies** tab

### Step 2: Check Existing Policies
Look for an UPDATE policy. If none exists, create one.

### Step 3: Create UPDATE Policy
Click **"New Policy"** and fill in:

**Policy name:** `users update own profile`

**Allowed operation:** ☑️ UPDATE

**Policy definition (using section):**
```sql
auth.uid() = id
```

**Policy definition (with check section):**
```sql
auth.uid() = id
```

**Complete SQL:**
```sql
create policy "users update own profile"
  on public."profiles"
  as PERMISSIVE
  for UPDATE
  to public
  using (
    auth.uid() = id
  )
  with check (
    auth.uid() = id
  );
```

### Step 4: Also Check These Policies Exist

**SELECT policy (to view profile):**
```sql
create policy "users view own profile"
  on public."profiles"
  as PERMISSIVE
  for SELECT
  to public
  using (
    auth.uid() = id
  );
```

**INSERT policy (to create profile):**
```sql
create policy "users insert own profile"
  on public."profiles"
  as PERMISSIVE
  for INSERT
  to public
  with check (
    auth.uid() = id
  );
```

---

## For Avatars Storage:

Also make sure you created the **avatars bucket** and added these policies:

**In Storage → avatars → Policies:**

**Policy 1:**
- Name: `Allow authenticated uploads to avatars`
- Operation: ☑️ INSERT
- Definition: `bucket_id = 'avatars' AND auth.role() = 'authenticated'`

**Policy 2:**
- Name: `Allow public read from avatars`
- Operation: ☑️ SELECT
- Definition: `bucket_id = 'avatars'`

**Policy 3:**
- Name: `Allow authenticated deletes from avatars`
- Operation: ☑️ DELETE
- Definition: `bucket_id = 'avatars' AND auth.role() = 'authenticated'`

---

## After Adding Policies:

1. **Sign OUT completely**
2. **Sign back IN**
3. Go to `/profile`
4. Try updating display name
5. Try uploading avatar

## Check Browser Console (F12):

If still not working, check for errors:
- "New row violates row-level security policy" = Missing UPDATE policy
- "Failed to upload" = Storage bucket or policies missing
- "JWT expired" = Need to sign out/in

The most likely issue is missing UPDATE policy on profiles table!