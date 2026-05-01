REVOKE EXECUTE ON FUNCTION public.handle_installment_payment_notification() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_installment_payment_notification() TO postgres, service_role;
