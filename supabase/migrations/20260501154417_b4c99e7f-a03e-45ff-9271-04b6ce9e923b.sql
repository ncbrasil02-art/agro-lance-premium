-- Revoke public execution
REVOKE EXECUTE ON FUNCTION public.on_role_change_notify() FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.on_account_block_notify() FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.on_gateway_change_notify() FROM public, anon;

-- Set search_path
ALTER FUNCTION public.on_role_change_notify() SET search_path = public;
ALTER FUNCTION public.on_account_block_notify() SET search_path = public;
ALTER FUNCTION public.on_gateway_change_notify() SET search_path = public;
