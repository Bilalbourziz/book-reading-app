-- Create avatars storage bucket and RLS policies
-- This allows users to upload profile pictures

-- Create the avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from avatars" ON storage.objects;

-- Allow authenticated users to upload to avatars bucket
CREATE POLICY "Allow authenticated uploads to avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
  );

-- Allow public read access to avatars bucket
CREATE POLICY "Allow public read from avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Allow authenticated users to delete from avatars bucket
CREATE POLICY "Allow authenticated deletes from avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
  );

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON storage.objects TO authenticated;
GRANT ALL ON storage.objects TO service_role;