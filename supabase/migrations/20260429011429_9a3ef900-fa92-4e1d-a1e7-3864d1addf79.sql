-- Add SEO columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT;
