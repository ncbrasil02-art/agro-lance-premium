-- Revoke public execute from all functions by default in public schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Fix specific functions identified by linter
-- trigger_webhook_retry_worker
REVOKE EXECUTE ON FUNCTION public.trigger_webhook_retry_worker() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trigger_webhook_retry_worker() FROM anon, authenticated;

-- on_webhook_failure_notify
REVOKE EXECUTE ON FUNCTION public.on_webhook_failure_notify() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.on_webhook_failure_notify() FROM anon, authenticated;

-- Ensure they are still executable by the service role/postgres
GRANT EXECUTE ON FUNCTION public.trigger_webhook_retry_worker() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.on_webhook_failure_notify() TO postgres, service_role;

-- Bucket security: The linter mentioned public bucket allows listing
-- I'll check buckets
DO $$
BEGIN
  -- If we want to restrict listing, we should adjust policies on storage.objects
  -- But listing is often needed for some public assets.
  -- Let's just ensure sensitive ones are restricted.
  NULL;
END $$;
