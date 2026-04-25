-- Add veterinary_history column to animals table
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS veterinary_history JSONB DEFAULT '{}'::jsonb;
