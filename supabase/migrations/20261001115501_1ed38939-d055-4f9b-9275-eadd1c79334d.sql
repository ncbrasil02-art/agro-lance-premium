DROP POLICY IF EXISTS events_public_counter ON public.events;
DROP POLICY IF EXISTS lots_public_counter ON public.lots;
REVOKE ALL ON FUNCTION public.increment_viewer_count(text,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.increment_lot_viewers(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.increment_viewer_count(text,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_lot_viewers(uuid) TO service_role;