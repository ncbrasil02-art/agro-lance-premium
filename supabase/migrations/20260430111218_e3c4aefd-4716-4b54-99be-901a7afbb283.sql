ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS promoter_logo_url TEXT;
