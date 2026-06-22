# WHERE TO PUT EACH POLICY - VISUAL GUIDE

## You have 3 places to add policies:

### 1️⃣ TABLE POLICIES (6 policies) - For book_submissions table
### 2️⃣ STORAGE POLICIES FOR BOOKS (3 policies) - For books bucket
### 3️⃣ STORAGE POLICIES FOR AVATARS (3 policies) - For avatars bucket

---

## LOCATION 1: Table Policies (book_submissions)

**Path:** Table Editor → book_submissions → Policies tab

**Here you add 6 policies:**

1. Click "New Policy"
2. Fill in:
   - Policy name: `users view own submissions`
   - Allowed operation: SELECT
   - Policy definition: `auth.uid() = user_id`
3. Click "Save"
4. Repeat 5 more times with the other table policies

**Table policies use:** `auth.uid() = user_id`

---

## LOCATION 2: Storage Policies for BOOKS bucket

**Path:** Storage → books → Policies tab

**Here you add 3 policies:**

1. Click "New Policy"
2. Fill in:
   - Policy name: `Allow authenticated uploads to books`
   - Allowed operation: INSERT
   - Policy definition: `bucket_id = 'books' AND auth.role() = 'authenticated'`
3. Click "Save"
4. Repeat 2 more times with the other books policies

**Storage policies use:** `bucket_id = 'books'`

---

## LOCATION 3: Storage Policies for AVATARS bucket

**Path:** Storage → avatars → Policies tab

**Here you add 3 policies:**

1. Click "New Policy"
2. Fill in:
   - Policy name: `Allow authenticated uploads to avatars`
   - Allowed operation: INSERT
   - Policy definition: `bucket_id = 'avatars' AND auth.role() = 'authenticated'`
3. Click "Save"
4. Repeat 2 more times with the other avatars policies

**Storage policies use:** `bucket_id = 'avatars'`

---

## VISUAL MAP:

```
Supabase Dashboard
├── Table Editor
│   └── book_submissions (table)
│       └── Policies tab
│           ├── Policy 1: users view own submissions (SELECT: auth.uid() = user_id)
│           ├── Policy 2: users create submissions (INSERT: auth.uid() = user_id)
│           ├── Policy 3: users update own pending (UPDATE: auth.uid() = user_id AND status = 'pending')
│           ├── Policy 4: users delete own pending (DELETE: auth.uid() = user_id AND status = 'pending')
│           ├── Policy 5: admins view all (SELECT: public.is_admin())
│           └── Policy 6: admins update all (UPDATE: public.is_admin())
│
├── Storage
│   ├── books (bucket)
│   │   └── Policies tab
│   │       ├── Policy 1: Allow authenticated uploads (INSERT: bucket_id = 'books' AND auth.role() = 'authenticated')
│   │       ├── Policy 2: Allow public read (SELECT: bucket_id = 'books')
│   │       └── Policy 3: Allow authenticated deletes (DELETE: bucket_id = 'books' AND auth.role() = 'authenticated')
│   │
│   └── avatars (bucket)
│       └── Policies tab
│           ├── Policy 1: Allow authenticated uploads (INSERT: bucket_id = 'avatars' AND auth.role() = 'authenticated')
│           ├── Policy 2: Allow public read (SELECT: bucket_id = 'avatars')
│           └── Policy 3: Allow authenticated deletes (DELETE: bucket_id = 'avatars' AND auth.role() = 'authenticated')
```

---

## STEP BY STEP:

### Step 1: Table Policies (DO THIS FIRST)
1. Go to **Table Editor** (left sidebar)
2. Click **book_submissions** table
3. Click **"Enable RLS"** button
4. Click **"Policies"** tab
5. Click **"New Policy"** 6 times and add each policy listed above

### Step 2: Books Storage Policies
1. Go to **Storage** (left sidebar)
2. Click on **books** bucket
3. Click **"Policies"** tab
4. Click **"New Policy"** 3 times and add each policy listed above

### Step 3: Avatars Storage Policies
1. Go to **Storage** (left sidebar)
2. Click on **avatars** bucket
3. Click **"Policies"** tab
4. Click **"New Policy"** 3 times and add each policy listed above

---

## REMEMBER:

- **Table policies** = use `user_id`
- **Storage policies** = use `bucket_id`

You're currently in the Storage section (from your screenshot), so you're adding storage policies. Make sure you use `bucket_id = 'books'` NOT `user_id`.

After you finish storage policies, you still need to add the 6 table policies in the Table Editor!