-- Ensure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('public_assets', 'public_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for public_assets
-- Allow public access to read
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'public_assets');

-- Allow authenticated users to upload to public_assets
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public_assets');

-- Allow authenticated users to update their own uploads or all if admin (simplifying for now)
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'public_assets');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'public_assets');

-- Ensure sellers are in the default homepage order if not already
-- This is handled in the UI/Code usually, but we can update the site_settings if it exists
UPDATE public.site_settings
SET value = jsonb_set(
  value,
  '{order}',
  (value->'order') || '["sellers"]'::jsonb
)
WHERE key = 'homepage_sections' 
AND NOT (value->'order' @> '["sellers"]'::jsonb);
