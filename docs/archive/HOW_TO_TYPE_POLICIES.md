# HOW TO TYPE THE POLICY - STEP BY STEP

## I can see from your screenshot - you're creating a TABLE policy (not storage)!

The error is because the "with check" section is EMPTY. You need to type the policy there.

---

## For book_submissions TABLE Policies:

### Look at your screenshot - you need to type in the SQL editor at the bottom.

**After line 7** (the line with `with check (`), **type this on line 8:**

```sql
auth.uid() = user_id
```

**Your final SQL should look like this:**
```sql
create policy "Allow authenticated uploads to books"
  on public."book_submissions"
  as PERMISSIVE
  for INSERT
  to public
  with check (
    auth.uid() = user_id
  );
```

---

## The 6 Table Policies - What to Type:

### Policy 1 (SELECT):
```sql
create policy "users view own submissions"
  on public."book_submissions"
  as PERMISSIVE
  for SELECT
  to public
  using (
    auth.uid() = user_id
  );
```

### Policy 2 (INSERT):
```sql
create policy "users create submissions"
  on public."book_submissions"
  as PERMISSIVE
  for INSERT
  to public
  with check (
    auth.uid() = user_id
  );
```

### Policy 3 (UPDATE):
```sql
create policy "users update own pending"
  on public."book_submissions"
  as PERMISSIVE
  for UPDATE
  to public
  using (
    auth.uid() = user_id AND status = 'pending'
  )
  with check (
    auth.uid() = user_id AND status = 'pending'
  );
```

### Policy 4 (DELETE):
```sql
create policy "users delete own pending"
  on public."book_submissions"
  as PERMISSIVE
  for DELETE
  to public
  using (
    auth.uid() = user_id AND status = 'pending'
  );
```

### Policy 5 (SELECT for admins):
```sql
create policy "admins view all"
  on public."book_submissions"
  as PERMISSIVE
  for SELECT
  to public
  using (
    public.is_admin()
  );
```

### Policy 6 (UPDATE for admins):
```sql
create policy "admins update all"
  on public."book_submissions"
  as PERMISSIVE
  for UPDATE
  to public
  using (
    public.is_admin()
  )
  with check (
    public.is_admin()
  );
```

---

## WHERE TO PUT EACH PART:

### For SELECT, UPDATE, DELETE:
- Use `using (` section (line 7 in your screenshot)
- Type: `auth.uid() = user_id`

### For INSERT:
- Use `with check (` section (line 7 in your screenshot)
- Type: `auth.uid() = user_id`

---

## In Your Screenshot:

You have:
- Policy name: ✅ `Allow authenticated uploads to books`
- Table: ✅ `public.book_submissions`
- Operation: ✅ INSERT is selected

**You need to add in the SQL editor:**
```sql
  with check (
    auth.uid() = user_id
  );
```

**Complete it like this:**
```
create policy "Allow authenticated uploads to books"
  on public."book_submissions"
  as PERMISSIVE
  for INSERT
  to public
  with check (
    auth.uid() = user_id
  );
```

Then click "Save policy".

---

## Summary:

**For book_submissions table:**
- Use: `auth.uid() = user_id`
- Put it in: `using (...)` for SELECT/UPDATE/DELETE
- Put it in: `with check (...)` for INSERT

**For storage buckets (later):**
- Use: `bucket_id = 'books'` or `bucket_id = 'avatars'`
- Don't use `user_id` for storage!