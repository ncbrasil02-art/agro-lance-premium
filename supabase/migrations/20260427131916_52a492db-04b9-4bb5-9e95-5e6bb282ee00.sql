CREATE OR REPLACE FUNCTION public.auto_link_lot_winner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_highest_bid_user_id UUID;
BEGIN
    -- Only run when status changes to 'sold'
    IF NEW.status = 'sold' AND OLD.status != 'sold' THEN
        -- Find the highest bidder for this lot
        SELECT user_id INTO v_highest_bid_user_id
        FROM public.bids
        WHERE lot_id = NEW.id
        ORDER BY amount DESC, created_at DESC
        LIMIT 1;

        -- If we found a bidder and winner_id is not already set
        IF v_highest_bid_user_id IS NOT NULL AND NEW.winner_id IS NULL THEN
            NEW.winner_id := v_highest_bid_user_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create trigger
DROP TRIGGER IF EXISTS tr_auto_link_lot_winner ON public.lots;
CREATE TRIGGER tr_auto_link_lot_winner
BEFORE UPDATE ON public.lots
FOR EACH ROW
EXECUTE FUNCTION public.auto_link_lot_winner();