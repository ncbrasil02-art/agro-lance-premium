ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP WITH TIME ZONE;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_retry ON public.webhook_events (status, retry_count, next_retry_at) 
WHERE status = 'failed';
