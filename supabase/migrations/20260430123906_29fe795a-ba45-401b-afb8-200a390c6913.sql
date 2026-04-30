-- Add negotiated_terms to offers table
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS negotiated_terms TEXT;

-- Add negotiated_terms to direct_sales table
ALTER TABLE public.direct_sales ADD COLUMN IF NOT EXISTS negotiated_terms TEXT;

-- Update RLS policies to allow reading these columns (they should be covered by existing policies, but let's be sure)
-- Assuming current policies allow SELECT for relevant users.