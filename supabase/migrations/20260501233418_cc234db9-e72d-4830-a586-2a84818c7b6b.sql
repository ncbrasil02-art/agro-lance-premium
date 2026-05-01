-- Revoke execute from public for trigger and sensitive functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_profile_approval_notification() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trigger_webhook_retry_worker() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_link_lot_winner() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_confirmed_direct_sale() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.on_webhook_failure_notify() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_bid() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.on_profile_name_update() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_admin_on_new_offer() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.audit_trigger_func() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_installment_status() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.on_account_block_notify() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.on_gateway_change_notify() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_installment_payment_notification() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.on_role_change_notify() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.close_lot(uuid) FROM PUBLIC;

-- Re-grant to authenticated/service_role if needed, but triggers run as owner.
-- Usually, we want to allow authenticated to call some of these if they are RPCs.
-- If place_bid is an RPC, it needs EXECUTE.
-- Let's check which ones are RPCs.
