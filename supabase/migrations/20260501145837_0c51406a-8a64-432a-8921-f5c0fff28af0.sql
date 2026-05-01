ALTER TABLE public.installments 
ADD COLUMN IF NOT EXISTS external_reference TEXT,
ADD COLUMN IF NOT EXISTS gateway_status TEXT;

-- Index for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_installments_external_reference ON public.installments(external_reference);
