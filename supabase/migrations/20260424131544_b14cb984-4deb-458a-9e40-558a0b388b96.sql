-- Set secure search_path for all public functions
ALTER FUNCTION public.handle_new_bid() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
