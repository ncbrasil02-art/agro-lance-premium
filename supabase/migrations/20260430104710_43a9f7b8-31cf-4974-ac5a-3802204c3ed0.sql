-- Revoke EXECUTE from PUBLIC for SECURITY DEFINER functions in public schema
REVOKE EXECUTE ON FUNCTION public.notify_admin_on_new_offer() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_db_error(text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.audit_trigger_func() FROM PUBLIC;
