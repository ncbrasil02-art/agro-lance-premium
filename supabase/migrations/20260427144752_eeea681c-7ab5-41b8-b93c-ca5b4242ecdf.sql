-- Add seller fields to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES public.sellers(id) ON DELETE SET NULL;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS seller_name TEXT;

-- Update existing event_type if necessary (it's already text, so no structural change needed, just ensuring we use the right values)
-- Update status column documentation or constraints if any (it's also text)

-- We can add a check constraint to help maintain data integrity if desired, 
-- but since it's already text and has data, we'll just handle it in the application logic as requested.
