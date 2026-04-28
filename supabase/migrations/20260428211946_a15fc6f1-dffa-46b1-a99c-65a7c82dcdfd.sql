-- Generate slugs for events that don't have one
UPDATE public.events
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || floor(random() * 1000)::text
WHERE slug IS NULL OR slug = '';

-- Ensure slugs are unique (basic approach, might need more refinement if many collisions)
-- For now, this is enough to fix the "not opening" issue.
