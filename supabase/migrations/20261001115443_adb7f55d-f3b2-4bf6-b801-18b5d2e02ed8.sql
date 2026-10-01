ALTER VIEW public.sellers_public SET (security_invoker=true);

CREATE OR REPLACE FUNCTION public.increment_viewer_count(p_entity_type text,p_entity_id uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$BEGIN IF p_entity_type='event' THEN UPDATE public.events SET viewers=LEAST(COALESCE(viewers,0)+1,2147483647) WHERE id=p_entity_id;ELSIF p_entity_type='lot' THEN UPDATE public.lots SET viewers=LEAST(COALESCE(viewers,0)+1,2147483647) WHERE id=p_entity_id;END IF;END$$;
CREATE OR REPLACE FUNCTION public.increment_lot_viewers(p_lot_id uuid) RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path=public AS $$UPDATE public.lots SET viewers=LEAST(COALESCE(viewers,0)+1,2147483647) WHERE id=p_lot_id$$;

REVOKE ALL ON FUNCTION public.has_role(uuid,public.app_role) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.claim_initial_admin() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.place_bid_safe(uuid,numeric,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.handle_new_bid() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.increment_viewer_count(text,uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_lot_viewers(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.claim_initial_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_bid_safe(uuid,numeric,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_bid() TO service_role;
GRANT EXECUTE ON FUNCTION public.touch_updated_at() TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_viewer_count(text,uuid) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.increment_lot_viewers(uuid) TO anon,authenticated;

CREATE POLICY events_public_counter ON public.events FOR UPDATE TO anon,authenticated USING(true) WITH CHECK(true);
CREATE POLICY lots_public_counter ON public.lots FOR UPDATE TO anon,authenticated USING(true) WITH CHECK(true);