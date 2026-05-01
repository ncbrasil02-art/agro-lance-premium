-- Revoke EXECUTE from public for trigger functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public;
REVOKE EXECUTE ON FUNCTION public.handle_profile_approval_notification() FROM public;
REVOKE EXECUTE ON FUNCTION public.fn_auto_link_lot_winner() FROM public;
REVOKE EXECUTE ON FUNCTION public.check_sold_animal_modification() FROM public;
REVOKE EXECUTE ON FUNCTION public.check_event_deletion_status() FROM public;
REVOKE EXECUTE ON FUNCTION public.check_lot_deletion_status() FROM public;
REVOKE EXECUTE ON FUNCTION public.handle_animal_slug() FROM public;
REVOKE EXECUTE ON FUNCTION public.handle_post_slug() FROM public;
REVOKE EXECUTE ON FUNCTION public.handle_event_slug() FROM public;
REVOKE EXECUTE ON FUNCTION public.handle_outbid_notification() FROM public;
REVOKE EXECUTE ON FUNCTION public.handle_user_sync() FROM public;
REVOKE EXECUTE ON FUNCTION public.on_profile_name_update() FROM public;
REVOKE EXECUTE ON FUNCTION public.update_bidder_names_on_profile_change() FROM public;

-- Also for some sensitive internal functions
REVOKE EXECUTE ON FUNCTION public.revert_sold_lot(uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.close_lot(uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.delete_bid_safe(uuid) FROM public;
