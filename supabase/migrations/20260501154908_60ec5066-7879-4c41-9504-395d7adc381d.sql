-- Revoke public execution
REVOKE EXECUTE ON FUNCTION public.fn_notify_admin_email(TEXT, TEXT) FROM public, anon;

-- Set search_path
ALTER FUNCTION public.fn_notify_admin_email(TEXT, TEXT) SET search_path = public;
