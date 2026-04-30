-- Hardening search_path for all public functions
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.handle_profile_approval_notification() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.close_lot(p_lot_id UUID) SET search_path = public;
ALTER FUNCTION public.fn_auto_link_lot_winner() SET search_path = public;
ALTER FUNCTION public.check_sold_animal_modification() SET search_path = public;
ALTER FUNCTION public.check_event_deletion_status() SET search_path = public;
ALTER FUNCTION public.check_lot_deletion_status() SET search_path = public;
ALTER FUNCTION public.place_bid_safe(p_lot_id UUID, p_amount NUMERIC, p_bid_type TEXT, p_session_id TEXT) SET search_path = public;
ALTER FUNCTION public.delete_bid_safe(p_bid_id UUID) SET search_path = public;
ALTER FUNCTION public.increment_lot_viewers(p_lot_id UUID) SET search_path = public;
ALTER FUNCTION public.is_admin() SET search_path = public;

-- Revoke public execute from sensitive functions and grant to authenticated/service_role
REVOKE EXECUTE ON FUNCTION public.close_lot(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.close_lot(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.close_lot(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.delete_bid_safe(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_bid_safe(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_bid_safe(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.place_bid_safe(UUID, NUMERIC, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_bid_safe(UUID, NUMERIC, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.place_bid_safe(UUID, NUMERIC, TEXT, TEXT) TO authenticated;

-- Ensure triggers are also properly scoped
ALTER FUNCTION public.handle_profile_approval_notification() SECURITY DEFINER;
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;
