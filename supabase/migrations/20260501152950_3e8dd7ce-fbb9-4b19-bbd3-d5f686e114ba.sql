-- Revoke public execution from all SECURITY DEFINER functions in public schema
-- handle_profile_approval_notification
REVOKE EXECUTE ON FUNCTION public.handle_profile_approval_notification() FROM public, anon;
-- increment_lot_viewers
REVOKE EXECUTE ON FUNCTION public.increment_lot_viewers(UUID) FROM public, anon;
-- place_bid
REVOKE EXECUTE ON FUNCTION public.place_bid(UUID, UUID, NUMERIC) FROM public, anon;
-- place_bid_safe
REVOKE EXECUTE ON FUNCTION public.place_bid_safe(UUID, NUMERIC, TEXT, TEXT) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.place_bid_safe(UUID, NUMERIC, TEXT) FROM public, anon;
-- check_user_risk
REVOKE EXECUTE ON FUNCTION public.check_user_risk(UUID) FROM public, anon;
-- auto_link_lot_winner
REVOKE EXECUTE ON FUNCTION public.auto_link_lot_winner() FROM public, anon;
-- handle_confirmed_direct_sale
REVOKE EXECUTE ON FUNCTION public.handle_confirmed_direct_sale() FROM public, anon;
-- handle_new_bid
REVOKE EXECUTE ON FUNCTION public.handle_new_bid() FROM public, anon;
-- revert_sold_lot
REVOKE EXECUTE ON FUNCTION public.revert_sold_lot(UUID) FROM public, anon;
-- on_profile_name_update
REVOKE EXECUTE ON FUNCTION public.on_profile_name_update() FROM public, anon;
-- update_bidder_names_on_profile_change
REVOKE EXECUTE ON FUNCTION public.update_bidder_names_on_profile_change() FROM public, anon;
-- set_bidder_name
REVOKE EXECUTE ON FUNCTION public.set_bidder_name() FROM public, anon;
-- increment_viewer_count
REVOKE EXECUTE ON FUNCTION public.increment_viewer_count(TEXT, UUID) FROM public, anon;
-- notify_admin_on_new_offer
REVOKE EXECUTE ON FUNCTION public.notify_admin_on_new_offer() FROM public, anon;
-- is_admin
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public, anon;
-- is_approved
REVOKE EXECUTE ON FUNCTION public.is_approved() FROM public, anon;
-- log_db_error
REVOKE EXECUTE ON FUNCTION public.log_db_error(TEXT, TEXT, TEXT) FROM public, anon;
-- audit_trigger_func
REVOKE EXECUTE ON FUNCTION public.audit_trigger_func() FROM public, anon;
-- notify_followers_on_status_change
REVOKE EXECUTE ON FUNCTION public.notify_followers_on_status_change() FROM public, anon;
-- notify_on_outbid
REVOKE EXECUTE ON FUNCTION public.notify_on_outbid() FROM public, anon;
-- protect_installment_status
REVOKE EXECUTE ON FUNCTION public.protect_installment_status() FROM public, anon;
-- close_lot
REVOKE EXECUTE ON FUNCTION public.close_lot(UUID) FROM public, anon;
-- notify_on_offer_update
REVOKE EXECUTE ON FUNCTION public.notify_on_offer_update() FROM public, anon;
-- handle_outbid_notification
REVOKE EXECUTE ON FUNCTION public.handle_outbid_notification() FROM public, anon;
-- handle_user_sync
REVOKE EXECUTE ON FUNCTION public.handle_user_sync() FROM public, anon;
-- delete_bid_safe
REVOKE EXECUTE ON FUNCTION public.delete_bid_safe(UUID) FROM public, anon;
-- handle_installment_payment_notification
REVOKE EXECUTE ON FUNCTION public.handle_installment_payment_notification() FROM public, anon;

-- Grant back to authenticated where needed
GRANT EXECUTE ON FUNCTION public.place_bid(UUID, UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_bid_safe(UUID, NUMERIC, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_bid_safe(UUID, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_approved() TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_lot_viewers(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_viewer_count(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_bidder_name() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_bid_safe(UUID) TO authenticated;
