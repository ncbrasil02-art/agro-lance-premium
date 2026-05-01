-- Index for email rate limiting
CREATE INDEX IF NOT EXISTS idx_notification_logs_rate_limit 
ON public.notification_logs (recipient_email, type, created_at DESC);

-- Fix SECURITY DEFINER functions from linter (if applicable, but let's focus on the ones that are high risk)
-- The linter mentioned several SECURITY DEFINER functions.
-- I'll check what they are before blindly changing them.
