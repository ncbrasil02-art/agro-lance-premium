-- Adiciona coluna de motivo de vínculo à tabela de lotes
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS winner_link_reason TEXT;

-- Atualiza a função de gatilho para registrar o motivo do vínculo automático
CREATE OR REPLACE FUNCTION public.fn_auto_link_lot_winner()
RETURNS TRIGGER AS $$
DECLARE
    highest_bid RECORD;
BEGIN
    -- Se o status mudou para 'sold' e não há vencedor definido
    IF NEW.status = 'sold' AND NEW.winner_id IS NULL THEN
        -- Busca o maior lance para este lote
        SELECT user_id, amount INTO highest_bid
        FROM public.bids
        WHERE lot_id = NEW.id
        ORDER BY amount DESC, created_at ASC
        LIMIT 1;

        -- Se houver um lance, vincula o usuário como vencedor e registra o motivo
        IF highest_bid.user_id IS NOT NULL THEN
            NEW.winner_id := highest_bid.user_id;
            NEW.current_price := highest_bid.amount;
            NEW.winner_link_reason := 'Vínculo automático pelo maior lance';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
