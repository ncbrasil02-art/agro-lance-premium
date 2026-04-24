ALTER TABLE public.events ADD COLUMN slug TEXT UNIQUE;

-- Update existing events if any (optional but good practice)
UPDATE public.events SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) WHERE slug IS NULL;
