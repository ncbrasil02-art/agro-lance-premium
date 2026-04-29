-- Add SEO and metadata columns to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS author_name TEXT,
ADD COLUMN IF NOT EXISTS read_time TEXT;

-- Update RLS if necessary (usually not needed for adding columns unless specific policies apply)
