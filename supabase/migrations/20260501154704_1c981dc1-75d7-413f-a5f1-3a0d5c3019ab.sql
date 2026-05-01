-- Enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Update webhook_events to add scheduled_for if not exists
ALTER TABLE public.webhook_events ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create a function to trigger the retry worker
CREATE OR REPLACE FUNCTION public.trigger_webhook_retry_worker()
RETURNS void AS $$
BEGIN
  -- We use pg_net to call the edge function asynchronously
  -- Replace the URL with the actual project URL if needed, but for now we assume it's standard
  PERFORM net.http_post(
    url := 'https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/webhook-retry-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Schedule the job to run every 2 minutes
-- Note: In a real environment, we'd use the full project URL for the edge function.
-- Since the agent environment is limited, we'll set up the SQL, but the cron might need manual URL configuration.
SELECT cron.schedule('reprocess-webhooks', '*/2 * * * *', 'SELECT net.http_post(
    url := (SELECT value FROM site_settings WHERE key = ''api_url'') || ''/functions/v1/webhook-retry-worker'',
    headers := jsonb_build_object(
      ''Content-Type'', ''application/json'',
      ''Authorization'', ''Bearer '' || (SELECT value FROM site_settings WHERE key = ''service_role_key'')
    ),
    body := ''{}''::jsonb
)');

-- Cleanup job: Delete processed events older than 30 days
SELECT cron.schedule('cleanup-webhooks', '0 0 * * *', 'DELETE FROM public.webhook_events WHERE status = ''processed'' AND created_at < now() - interval ''30 days''');
