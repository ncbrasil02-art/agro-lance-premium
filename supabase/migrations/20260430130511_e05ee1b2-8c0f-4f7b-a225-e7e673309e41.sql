-- Add acceptance columns to lots
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS accepted_ip TEXT;

-- Add acceptance columns to direct_sales
ALTER TABLE public.direct_sales ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.direct_sales ADD COLUMN IF NOT EXISTS accepted_ip TEXT;
