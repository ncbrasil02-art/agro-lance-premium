-- Add photos column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';

-- Update RLS policies if necessary (usually they cover all columns)
-- No changes needed to RLS as existing policies should cover the new column.