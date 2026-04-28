-- Set fixed search path for SECURITY DEFINER functions to prevent hijacking
ALTER FUNCTION public.delete_bid_safe(uuid) SET search_path = public;
ALTER FUNCTION public.place_bid_safe(uuid, numeric, text, text) SET search_path = public;
ALTER FUNCTION public.increment_lot_viewers(uuid) SET search_path = public;
ALTER FUNCTION public.increment_viewer_count(text, uuid) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.handle_new_bid() SET search_path = public;
ALTER FUNCTION public.revert_sold_lot(uuid) SET search_path = public;

-- Fix revert_sold_lot security check
CREATE OR REPLACE FUNCTION public.revert_sold_lot(p_lot_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    v_animal_id UUID;
    v_user_id UUID;
BEGIN
    -- Check if user is admin
    v_user_id := auth.uid();
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND role = 'admin') THEN
        RAISE EXCEPTION 'Acesso negado. Apenas administradores podem reverter lotes.';
    END IF;

    -- Get the animal ID
    SELECT animal_id INTO v_animal_id FROM public.lots WHERE id = p_lot_id;
    
    -- Update lot status
    UPDATE public.lots 
    SET status = 'cancelled', 
        winner_id = NULL,
        updated_at = now()
    WHERE id = p_lot_id;
    
    -- Update animal status
    UPDATE public.animals
    SET sale_status = 'available',
        updated_at = now()
    WHERE id = v_animal_id;
    
    -- Audit log
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, new_data)
    VALUES (v_user_id, 'REVERT_LOT', 'lot', p_lot_id, jsonb_build_object('animal_id', v_animal_id));
END;
$function$;

-- Revoke execute from public/anon on sensitive functions
REVOKE EXECUTE ON FUNCTION public.revert_sold_lot(uuid) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.delete_bid_safe(uuid) FROM public, anon;

-- Grant execute to authenticated where needed (they still have internal role checks)
GRANT EXECUTE ON FUNCTION public.revert_sold_lot(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_bid_safe(uuid) TO authenticated;
