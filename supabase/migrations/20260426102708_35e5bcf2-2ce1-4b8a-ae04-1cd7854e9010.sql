-- RPC to place a bid with safety checks
CREATE OR REPLACE FUNCTION public.place_bid_safe(
    p_lot_id UUID,
    p_amount DECIMAL,
    p_bid_type TEXT DEFAULT 'online'
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_is_blocked BOOLEAN;
    v_is_approved BOOLEAN;
    v_bid_count INT;
    v_lot_status TEXT;
    v_current_price DECIMAL;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Não autenticado');
    END IF;

    -- Check profile status
    SELECT is_blocked, is_approved INTO v_is_blocked, v_is_approved 
    FROM public.profiles 
    WHERE id = v_user_id;

    IF v_is_blocked THEN
        RETURN json_build_object('success', false, 'message', 'Sua conta está bloqueada por atividade suspeita. Contate o suporte.');
    END IF;

    IF NOT v_is_approved THEN
        RETURN json_build_object('success', false, 'message', 'Sua conta aguarda aprovação para realizar lances.');
    END IF;

    -- Check lot status
    SELECT status, COALESCE(current_price, starting_price) INTO v_lot_status, v_current_price 
    FROM public.lots 
    WHERE id = p_lot_id;

    IF v_lot_status != 'active' THEN
        RETURN json_build_object('success', false, 'message', 'Este lote não está aceitando lances no momento.');
    END IF;

    IF p_amount <= v_current_price THEN
        RETURN json_build_object('success', false, 'message', 'O lance deve ser maior que o preço atual.');
    END IF;

    -- Anti-bot / Risk check: Max 10 bids per minute per user
    SELECT COUNT(*) INTO v_bid_count 
    FROM public.bids 
    WHERE user_id = v_user_id 
    AND created_at > (now() - interval '1 minute');

    IF v_bid_count >= 10 THEN
        UPDATE public.profiles 
        SET is_blocked = TRUE, 
            block_reason = 'Bloqueio automático: Frequência de lances muito alta (possível robô)'
        WHERE id = v_user_id;
        
        RETURN json_build_object('success', false, 'message', 'Atividade suspeita detectada. Sua conta foi bloqueada temporariamente para análise.');
    END IF;

    -- Insert bid
    INSERT INTO public.bids (lot_id, user_id, amount, bid_type)
    VALUES (p_lot_id, v_user_id, p_amount, p_bid_type);

    RETURN json_build_object('success', true, 'message', 'Lance efetuado com sucesso!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
