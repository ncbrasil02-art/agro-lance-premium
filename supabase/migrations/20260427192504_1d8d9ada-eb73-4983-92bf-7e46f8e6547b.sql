-- Fix search path for new functions
ALTER FUNCTION public.check_event_deletion_status() SET search_path = public;
ALTER FUNCTION public.check_lot_deletion_status() SET search_path = public;
ALTER FUNCTION public.check_sold_animal_modification() SET search_path = public;
ALTER FUNCTION public.revert_sold_lot(UUID) SET search_path = public;

-- Revoke execute from public for revert_sold_lot
REVOKE EXECUTE ON FUNCTION public.revert_sold_lot(UUID) FROM public;
REVOKE EXECUTE ON FUNCTION public.revert_sold_lot(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.revert_sold_lot(UUID) FROM authenticated;

-- Grant execute only to service_role or specific admin roles if they exist
GRANT EXECUTE ON FUNCTION public.revert_sold_lot(UUID) TO service_role;
-- If you have a specific admin role, you can grant it here
-- GRANT EXECUTE ON FUNCTION public.revert_sold_lot(UUID) TO authenticated; -- with RLS/logic check inside
