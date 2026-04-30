-- Function to notify when a user is outbid
CREATE OR REPLACE FUNCTION public.notify_on_outbid()
RETURNS TRIGGER AS $$
DECLARE
    v_prev_bidder_id UUID;
    v_lot_name TEXT;
BEGIN
    -- Get the previous winner before the update
    SELECT winner_id INTO v_prev_bidder_id 
    FROM public.lots 
    WHERE id = NEW.lot_id;

    -- If there was a previous winner and it's not the new bidder
    IF v_prev_bidder_id IS NOT NULL AND v_prev_bidder_id != NEW.user_id THEN
        -- Get lot name
        SELECT a.name INTO v_lot_name 
        FROM public.lots l 
        JOIN public.animals a ON l.animal_id = a.id 
        WHERE l.id = NEW.lot_id;

        INSERT INTO public.notifications (user_id, title, message, link)
        VALUES (
            v_prev_bidder_id,
            'Seu lance foi superado! ⚠️',
            'Seu lance no lote ' || COALESCE(v_lot_name, '') || ' foi superado. Volte ao leilão para continuar participando!',
            '/ao-vivo'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for outbid notifications
-- We run this BEFORE the UPDATE in handle_new_bid so we can get the OLD winner_id
CREATE TRIGGER on_outbid_notification
    BEFORE INSERT ON public.bids
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_on_outbid();

-- Function to notify followers when lot status changes
CREATE OR REPLACE FUNCTION public.notify_followers_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_lot_name TEXT;
    v_follower_id UUID;
    v_status_label TEXT;
BEGIN
    -- Only notify if status changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Get lot name
        SELECT a.name INTO v_lot_name 
        FROM public.animals a 
        WHERE a.id = NEW.animal_id;

        v_status_label := CASE 
            WHEN NEW.status = 'sold' THEN 'ARREMATADO'
            WHEN NEW.status = 'cancelled' THEN 'CANCELADO'
            WHEN NEW.status = 'active' THEN 'ATIVO'
            ELSE NEW.status
        END;

        FOR v_follower_id IN SELECT user_id FROM public.followed_lots WHERE lot_id = NEW.id LOOP
            INSERT INTO public.notifications (user_id, title, message, link)
            VALUES (
                v_follower_id,
                'Atualização no Lote: ' || COALESCE(v_lot_name, ''),
                'O lote que você está seguindo agora está: ' || v_status_label || '.',
                '/lotes/' || NEW.id
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for lot status change notifications
CREATE TRIGGER on_lot_status_change
    AFTER UPDATE ON public.lots
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_followers_on_status_change();
