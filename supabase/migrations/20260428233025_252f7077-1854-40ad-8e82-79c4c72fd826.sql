-- Set search_path for all public functions with correct signatures
ALTER FUNCTION public.handle_confirmed_direct_sale() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.place_bid(uuid, uuid, numeric) SET search_path = public;
ALTER FUNCTION public.handle_profile_approval_notification() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.close_lot(uuid) SET search_path = public;
ALTER FUNCTION public.is_approved() SET search_path = public;
ALTER FUNCTION public.increment_viewer_count(text, uuid) SET search_path = public;
ALTER FUNCTION public.handle_new_bid() SET search_path = public;
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.place_bid_safe(uuid, numeric, text) SET search_path = public;
ALTER FUNCTION public.place_bid_safe(uuid, numeric, text, text) SET search_path = public;
ALTER FUNCTION public.check_user_risk(uuid) SET search_path = public;
ALTER FUNCTION public.auto_link_lot_winner() SET search_path = public;
ALTER FUNCTION public.delete_bid_safe(uuid) SET search_path = public;
ALTER FUNCTION public.increment_lot_viewers(uuid) SET search_path = public;
ALTER FUNCTION public.revert_sold_lot(uuid) SET search_path = public;
ALTER FUNCTION public.update_bidder_names_on_profile_change() SET search_path = public;
ALTER FUNCTION public.on_profile_name_update() SET search_path = public;
ALTER FUNCTION public.set_bidder_name() SET search_path = public;

-- Grant permissions for helper functions used in RLS or by clients
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_approved() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_lot_viewers(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_viewer_count(text, uuid) TO anon, authenticated;
