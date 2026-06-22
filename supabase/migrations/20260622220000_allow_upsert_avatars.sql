-- Allow upsert (update) on existing avatar files in storage
-- Without this, uploading a second avatar with the same filename (upsert: true) fails.

DROP POLICY IF EXISTS "Allow authenticated updates to avatars" ON storage.objects;

CREATE POLICY "Allow authenticated updates to avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Also grant UPDATE permission
GRANT UPDATE ON storage.objects TO authenticated;