ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'processed';
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing records to 'processed'
UPDATE public.webhook_events SET status = 'processed' WHERE status IS NULL;
