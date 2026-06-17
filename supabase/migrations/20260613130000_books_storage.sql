-- Storage bucket for PDF books and cover images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'books',
  'books',
  true,
  52428800,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "anyone can read books storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'books');

CREATE POLICY "admins upload books storage"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'books' AND public.is_admin());

CREATE POLICY "admins update books storage"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'books' AND public.is_admin())
  WITH CHECK (bucket_id = 'books' AND public.is_admin());

CREATE POLICY "admins delete books storage"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'books' AND public.is_admin());
