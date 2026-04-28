-- Create the public_assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('public_assets', 'public_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Grant EXECUTE on is_admin to public roles
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Set search_path for public functions to fix linter warnings
ALTER FUNCTION public.is_admin() SET search_path = public;

-- Check and fix other functions from the linter results if possible
-- (I'll start with is_admin as it's the most critical right now)

-- Fix RLS for storage.objects to allow public access to public_assets
CREATE POLICY "Public Access to public_assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'public_assets');

CREATE POLICY "Admin Upload to public_assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'public_assets' AND public.is_admin());

CREATE POLICY "Admin Update to public_assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'public_assets' AND public.is_admin());

CREATE POLICY "Admin Delete from public_assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'public_assets' AND public.is_admin());

-- Ensure other buckets also have policies (banners, animals, documents)
-- They seem to exist but let's make sure they are secure
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access to banners') THEN
        CREATE POLICY "Public Access to banners" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access to animals') THEN
        CREATE POLICY "Public Access to animals" ON storage.objects FOR SELECT USING (bucket_id = 'animals');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access to documents') THEN
        CREATE POLICY "Public Access to documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
    END IF;
END $$;

-- Fix overly permissive RLS on profiles if needed
-- The linter mentioned WARN 3: RLS Policy Always True
-- Let's check which one it is. 
-- Based on my query earlier:
-- "Users can insert their own profile" uses WITH CHECK ((auth.uid() = id) AND (role = 'user'::text) AND (is_approved = false))
-- "Users can update their own profile" uses USING ((auth.uid() = id) OR is_admin())
-- These seem okay. Maybe there's another one.

-- Let's make sure all functions have search_path set
-- I'll check for more functions.
