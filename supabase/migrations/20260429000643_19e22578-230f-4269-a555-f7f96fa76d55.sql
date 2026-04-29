-- 1. Ensure all buckets exist
INSERT INTO storage.buckets (id, name, public) VALUES ('animals', 'animals', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('public_assets', 'public_assets', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT (id) DO UPDATE SET public = false;

-- 2. Clear potentially conflicting/duplicate policies to start fresh
-- We keep a few but standardize them.
-- Actually, it's safer to drop and recreate them with standard names.

-- HELPER: Function to check if user is admin (already exists but ensures usage)
-- We will use the existing public.is_admin() function.

-- === BUCKET: animals ===
DROP POLICY IF EXISTS "Animal media are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload animal media" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to animals" ON storage.objects;

CREATE POLICY "Animals bucket public access" ON storage.objects FOR SELECT USING (bucket_id = 'animals');
CREATE POLICY "Admins full access to animals" ON storage.objects FOR ALL USING (bucket_id = 'animals' AND public.is_admin()) WITH CHECK (bucket_id = 'animals' AND public.is_admin());

-- === BUCKET: banners ===
DROP POLICY IF EXISTS "Banners are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update banners" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to banners" ON storage.objects;

CREATE POLICY "Banners bucket public access" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "Admins full access to banners" ON storage.objects FOR ALL USING (bucket_id = 'banners' AND public.is_admin()) WITH CHECK (bucket_id = 'banners' AND public.is_admin());

-- === BUCKET: avatars ===
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;

CREATE POLICY "Avatars bucket public access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can manage their own avatar" ON storage.objects FOR ALL USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins full access to avatars" ON storage.objects FOR ALL USING (bucket_id = 'avatars' AND public.is_admin()) WITH CHECK (bucket_id = 'avatars' AND public.is_admin());

-- === BUCKET: public_assets ===
DROP POLICY IF EXISTS "Public Access to public_assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload to public_assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update to public_assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete from public_assets" ON storage.objects;

CREATE POLICY "Public Assets bucket public access" ON storage.objects FOR SELECT USING (bucket_id = 'public_assets');
CREATE POLICY "Admins full access to public_assets" ON storage.objects FOR ALL USING (bucket_id = 'public_assets' AND public.is_admin()) WITH CHECK (bucket_id = 'public_assets' AND public.is_admin());

-- === BUCKET: documents ===
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to documents" ON storage.objects;

-- Documents are private, so no public select.
CREATE POLICY "Users can manage their own documents" ON storage.objects FOR ALL USING (bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins full access to documents" ON storage.objects FOR ALL USING (bucket_id = 'documents' AND public.is_admin()) WITH CHECK (bucket_id = 'documents' AND public.is_admin());
