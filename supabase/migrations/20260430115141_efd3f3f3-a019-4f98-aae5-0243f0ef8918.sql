CREATE OR REPLACE FUNCTION public.handle_outbid_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_prev_bidder_id UUID;
    v_lot_number TEXT;
    v_animal_name TEXT;
    v_formatted_amount TEXT;
BEGIN
    -- Encontrar o licitante anterior com o maior lance para este lote (antes do lance atual)
    SELECT user_id INTO v_prev_bidder_id
    FROM public.bids
    WHERE lot_id = NEW.lot_id
      AND id != NEW.id
      AND amount < NEW.amount
    ORDER BY amount DESC
    LIMIT 1;

    -- Se houver um licitante anterior e não for o mesmo que deu o novo lance
    IF v_prev_bidder_id IS NOT NULL AND v_prev_bidder_id != NEW.user_id THEN
        -- Obter informações do lote para a mensagem
        SELECT l.lot_number, a.name INTO v_lot_number, v_animal_name
        FROM public.lots l
        LEFT JOIN public.animals a ON l.animal_id = a.id
        WHERE l.id = NEW.lot_id;

        -- Formatar o valor (ex: 1500.00 -> 1.500,00)
        v_formatted_amount := 'R$ ' || REPLACE(REPLACE(REPLACE(TO_CHAR(NEW.amount, 'FM999G999G999G990D00'), '.', 'X'), ',', '.'), 'X', ',');

        -- Inserir a notificação no painel do usuário
        INSERT INTO public.notifications (user_id, title, message, link)
        VALUES (
            v_prev_bidder_id,
            'Seu lance foi superado! 📢',
            'O seu lance no lote #' || COALESCE(v_lot_number, '') || ' (' || COALESCE(v_animal_name, 'Animal') || ') foi superado por um novo lance de ' || v_formatted_amount || '. Deseja ofertar um lance superior?',
            '/lotes/' || NEW.lot_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
