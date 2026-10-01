REVOKE ALL ON FUNCTION public.delete_bid_safe(uuid,text) FROM authenticated,anon,PUBLIC;
REVOKE ALL ON FUNCTION public.revert_sold_lot(uuid) FROM authenticated,anon,PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_bid_safe(uuid,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.revert_sold_lot(uuid) TO service_role;