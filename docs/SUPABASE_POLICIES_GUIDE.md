# CLICK BY CLICK - EXACTLY WHAT TO SELECT

## When you click "New Policy", you'll see a form with fields:

### FIELD 1: Policy name
**Type this:** `Allow authenticated uploads to books`

---

### FIELD 2: Allowed operation
**Click these checkboxes:**
- ☑️ INSERT (check this one)
- ☐ SELECT (leave unchecked)
- ☐ UPDATE (leave unchecked)
- ☐ DELETE (leave unchecked)

**For the NEXT policy, you'll check SELECT instead.**

---

### FIELD 3: Target roles
**Leave as default:** "All roles" or "authenticated"

---

### FIELD 4: Policy definition
**Type this EXACTLY:**
```
bucket_id = 'books' AND auth.role() = 'authenticated'
```

**DO NOT type:** `auth.uid() = user_id` (that's wrong for storage!)

---

## Example: Creating the 3 Books Policies

### Policy 1 (Upload):
- Policy name: `Allow authenticated uploads to books`
- Allowed operation: ☑️ INSERT only
- Policy definition: `bucket_id = 'books' AND auth.role() = 'authenticated'`
- Click "Save"

### Policy 2 (Read):
- Policy name: `Allow public read from books`
- Allowed operation: ☑️ SELECT only
- Policy definition: `bucket_id = 'books'`
- Click "Save"

### Policy 3 (Delete):
- Policy name: `Allow authenticated deletes from books`
- Allowed operation: ☑️ DELETE only
- Policy definition: `bucket_id = 'books' AND auth.role() = 'authenticated'`
- Click "Save"

---

## For Avatars Bucket (same pattern):

### Policy 1 (Upload):
- Policy name: `Allow authenticated uploads to avatars`
- Allowed operation: ☑️ INSERT only
- Policy definition: `bucket_id = 'avatars' AND auth.role() = 'authenticated'`
- Click "Save"

### Policy 2 (Read):
- Policy name: `Allow public read from avatars`
- Allowed operation: ☑️ SELECT only
- Policy definition: `bucket_id = 'avatars'`
- Click "Save"

### Policy 3 (Delete):
- Policy name: `Allow authenticated deletes from avatars`
- Allowed operation: ☑️ DELETE only
- Policy definition: `bucket_id = 'avatars' AND auth.role() = 'authenticated'`
- Click "Save"

---

## REMEMBER:

✅ **CORRECT for Storage:** `bucket_id = 'books'` or `bucket_id = 'avatars'`
❌ **WRONG for Storage:** `auth.uid() = user_id`

✅ **CORRECT for Tables:** `auth.uid() = user_id`
❌ **WRONG for Tables:** `bucket_id = 'books'`

---

## If you see "choose option above to edit":

This means you need to:
1. First select the operation (INSERT, SELECT, UPDATE, or DELETE)
2. Then type the policy definition below

**Don't try to edit an existing policy - just create new ones!**

Click "New Policy" button, fill in the form, click "Save".