-- Update the function to be more secure
ALTER FUNCTION public.handle_installment_payment_notification() 
SET search_path = public;

-- Revoke execute from public roles to ensure it's only triggered by the database
REVOKE EXECUTE ON FUNCTION public.handle_installment_payment_notification() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_installment_payment_notification() TO postgres, service_role;
