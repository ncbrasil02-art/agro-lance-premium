ALTER FUNCTION public.handle_installment_payment_notification() SET search_path = public;
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.is_approved() SET search_path = public;
ALTER FUNCTION public.place_bid(UUID, UUID, NUMERIC) SET search_path = public;
ALTER FUNCTION public.place_bid_safe(UUID, NUMERIC, TEXT, TEXT) SET search_path = public;
ALTER FUNCTION public.place_bid_safe(UUID, NUMERIC, TEXT) SET search_path = public;
