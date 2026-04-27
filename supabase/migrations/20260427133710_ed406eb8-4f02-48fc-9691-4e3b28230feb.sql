-- Adiciona colunas para auditoria do arremate
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS last_bid_ip TEXT;
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS last_bid_user_agent TEXT;

-- Atualiza a função de gatilho para registrar o IP e User Agent do lance vencedor
CREATE OR REPLACE FUNCTION public.fn_auto_link_lot_winner()
RETURNS TRIGGER AS $$
DECLARE
    highest_bid RECORD;
BEGIN
    -- Se o status mudou para 'sold' e não há vencedor definido
    IF NEW.status = 'sold' AND NEW.winner_id IS NULL THEN
        -- Busca o maior lance para este lote
        SELECT user_id, amount, is_phone_bid, ip_address INTO highest_bid
        FROM public.bids
        WHERE lot_id = NEW.id
        ORDER BY amount DESC, created_at ASC
        LIMIT 1;

        -- Se houver um lance, vincula o usuário como vencedor e registra o motivo e auditoria
        IF highest_bid.user_id IS NOT NULL THEN
            NEW.winner_id := highest_bid.user_id;
            NEW.current_price := highest_bid.amount;
            NEW.last_bid_ip := highest_bid.ip_address;
            NEW.winner_link_reason := CASE 
                WHEN highest_bid.is_phone_bid THEN 'Vínculo automático pelo maior lance (Telefone)'
                ELSE 'Vínculo automático pelo maior lance (Online)'
            END;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
