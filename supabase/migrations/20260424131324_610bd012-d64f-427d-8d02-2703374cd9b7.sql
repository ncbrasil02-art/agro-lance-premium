-- Add viewers column to events and lots
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS viewers INTEGER DEFAULT 0;
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS viewers INTEGER DEFAULT 0;

-- Update handle_new_bid to also set the winner_id
CREATE OR REPLACE FUNCTION public.handle_new_bid()
RETURNS TRIGGER AS $$
DECLARE
    v_bid_extension_seconds INTEGER;
    v_current_end_date TIMESTAMP WITH TIME ZONE;
    v_new_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get the bid extension setting (default 30s)
    SELECT (value->>'bid_extension_seconds')::INTEGER 
    INTO v_bid_extension_seconds
    FROM public.site_settings 
    WHERE key = 'auction_rules';
    
    IF v_bid_extension_seconds IS NULL THEN
        v_bid_extension_seconds := 30;
    END IF;

    -- Update the lot's current price, bids count AND winner_id
    UPDATE public.lots
    SET 
        current_price = NEW.amount,
        bids_count = bids_count + 1,
        winner_id = NEW.user_id,
        updated_at = now()
    WHERE id = NEW.lot_id;

    -- Handle Smart Timer (Bid Extension)
    SELECT end_date INTO v_current_end_date
    FROM public.lots
    WHERE id = NEW.lot_id;

    -- If end_date is set and we are within the extension window
    IF v_current_end_date IS NOT NULL AND (v_current_end_date - now()) < (v_bid_extension_seconds || ' seconds')::INTERVAL THEN
        v_new_end_date := now() + (v_bid_extension_seconds || ' seconds')::INTERVAL;
        
        UPDATE public.lots
        SET end_date = v_new_end_date
        WHERE id = NEW.lot_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment viewer count
CREATE OR REPLACE FUNCTION public.increment_viewer_count(p_entity_type TEXT, p_entity_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_entity_type = 'event' THEN
        UPDATE public.events SET viewers = viewers + 1 WHERE id = p_entity_id;
    ELSIF p_entity_type = 'lot' THEN
        UPDATE public.lots SET viewers = viewers + 1 WHERE id = p_entity_id;
    END IF;
END;
$$;

-- Function to close a lot and handle the outcome
CREATE OR REPLACE FUNCTION public.close_lot(p_lot_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lot public.lots%ROWTYPE;
    v_winner_id UUID;
    v_final_price NUMERIC;
    v_transaction_id UUID;
BEGIN
    -- 1. Get lot data
    SELECT * INTO v_lot FROM public.lots WHERE id = p_lot_id;
    
    IF v_lot.status != 'active' THEN
        RETURN jsonb_build_object('success', false, 'message', 'O lote não está ativo.');
    END IF;

    v_winner_id := v_lot.winner_id;
    v_final_price := v_lot.current_price;

    -- 2. Determine outcome
    IF v_winner_id IS NOT NULL AND (v_lot.reserve_price IS NULL OR v_final_price >= v_lot.reserve_price) THEN
        -- SOLD
        UPDATE public.lots SET status = 'sold' WHERE id = p_lot_id;
        
        -- Create transaction
        INSERT INTO public.transactions (lot_id, buyer_id, final_price, status)
        VALUES (p_lot_id, v_winner_id, v_final_price, 'pending')
        RETURNING id INTO v_transaction_id;

        -- Notify winner
        INSERT INTO public.notifications (user_id, title, message, link)
        VALUES (v_winner_id, 'Parabéns! Você arrematou o lote!', 'O lote ' || v_lot.lot_number || ' agora é seu. Veja os detalhes do contrato.', '/lotes/' || p_lot_id);

        RETURN jsonb_build_object('success', true, 'status', 'sold', 'transaction_id', v_transaction_id);
    ELSE
        -- PASSED (NÃO VENDIDO)
        UPDATE public.lots SET status = 'passed' WHERE id = p_lot_id;
        
        RETURN jsonb_build_object('success', true, 'status', 'passed');
    END IF;
END;
$$;