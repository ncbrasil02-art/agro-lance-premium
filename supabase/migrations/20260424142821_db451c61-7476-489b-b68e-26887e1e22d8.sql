-- Update storage policies to use is_admin()
DROP POLICY IF EXISTS "Admins can upload banners" ON storage.objects;
CREATE POLICY "Admins can upload banners"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'banners' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can update banners" ON storage.objects;
CREATE POLICY "Admins can update banners"
ON storage.objects FOR UPDATE
USING (bucket_id = 'banners' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can upload animal media" ON storage.objects;
CREATE POLICY "Admins can upload animal media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'animals' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can upload documents" ON storage.objects;
CREATE POLICY "Admins can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND public.is_admin());

-- Re-verify public access policies (they don't use subqueries so they are safe from recursion, 
-- but I'll recreate them to be consistent)
DROP POLICY IF EXISTS "Animal media are publicly accessible" ON storage.objects;
CREATE POLICY "Animal media are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'animals');

DROP POLICY IF EXISTS "Banners are publicly accessible" ON storage.objects;
CREATE POLICY "Banners are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');
