-- Create the books bucket if it doesn't exist
-- NOTE: Run this in Supabase Dashboard → Storage → Create bucket named "books"
-- Set it as PUBLIC and allow PDF, JPG, PNG, WEBP files
-- Then configure RLS policies in the Storage → Policies tab

-- Storage RLS policies must be configured via Supabase Dashboard UI
-- Go to: Storage → books bucket → Policies tab
-- Add these policies manually:

-- 1. Allow authenticated uploads:
--    Operation: INSERT
--    Policy: Allow authenticated uploads to books
--    USING: bucket_id = 'books' AND auth.role() = 'authenticated'

-- 2. Allow public read:
--    Operation: SELECT
--    Policy: Allow public read from books
--    USING: bucket_id = 'books'

-- 3. Allow authenticated deletes:
--    Operation: DELETE
--    Policy: Allow authenticated deletes from books
--    USING: bucket_id = 'books' AND auth.role() = 'authenticated'
