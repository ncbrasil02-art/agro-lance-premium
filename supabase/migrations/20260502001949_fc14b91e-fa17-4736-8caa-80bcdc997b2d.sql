-- Fix place_bid security vulnerability
CREATE OR REPLACE FUNCTION public.place_bid(p_lot_id uuid, p_user_id uuid, p_amount numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_lot_status TEXT;
    v_current_price NUMERIC;
    v_min_increment NUMERIC;
    v_is_approved BOOLEAN;
    v_result JSONB;
BEGIN
    -- 0. SECURITY CHECK: Ensure auth.uid() matches p_user_id
    IF auth.uid() != p_user_id THEN
        RETURN jsonb_build_object('success', false, 'message', 'Não é possível efetuar lances em nome de outro usuário.');
    END IF;

    -- 1. Check if user is approved
    SELECT is_approved INTO v_is_approved FROM public.profiles WHERE id = p_user_id;
    IF NOT v_is_approved THEN
        RETURN jsonb_build_object('success', false, 'message', 'Usuário não aprovado para lances.');
    END IF;

    -- 2. Get lot info and lock row for update
    SELECT status, COALESCE(current_price, starting_price), bid_increment 
    INTO v_lot_status, v_current_price, v_min_increment
    FROM public.lots 
    WHERE id = p_lot_id
    FOR UPDATE;

    -- 3. Check lot status
    -- We allow bids on 'active' or 'recebendo_lances' or 'live'
    IF v_lot_status NOT IN ('active', 'live', 'recebendo_lances', 'scheduled', 'pre_lance') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Este lote não está aceitando lances no momento.');
    END IF;

    -- 4. Check bid amount
    IF p_amount < (v_current_price + v_min_increment) THEN
        RETURN jsonb_build_object('success', false, 'message', 'O lance deve ser superior ao lance atual + incremento mínimo.');
    END IF;

    -- 5. Insert bid
    INSERT INTO public.bids (lot_id, user_id, amount, bid_type)
    VALUES (p_lot_id, p_user_id, p_amount, 'online');

    -- 6. Update lot (the trigger handle_new_bid will also do this, but keeping it here for atomicity in RPC)
    UPDATE public.lots 
    SET current_price = p_amount,
        bids_count = bids_count + 1,
        winner_id = p_user_id,
        updated_at = now()
    WHERE id = p_lot_id;

    RETURN jsonb_build_object('success', true, 'message', 'Lance efetuado com sucesso!', 'new_price', p_amount);
END;
$function$;