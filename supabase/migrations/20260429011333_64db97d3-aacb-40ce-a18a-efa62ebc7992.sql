-- Add slug column to categories
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Add slug column to sellers
ALTER TABLE public.sellers 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Function to auto-generate slugs for existing records (if any)
-- This is optional but good practice
UPDATE public.categories SET slug = lower(trim(name)) WHERE slug IS NULL;
UPDATE public.sellers SET slug = lower(trim(name)) WHERE slug IS NULL;
