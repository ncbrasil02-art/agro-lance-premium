-- Add end_date and winner_id to lots
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES auth.users(id);

-- Ensure current_price and bids_count have defaults if they don't
ALTER TABLE public.lots ALTER COLUMN current_price SET DEFAULT 0;
ALTER TABLE public.lots ALTER COLUMN bids_count SET DEFAULT 0;

-- Function to handle new bids and implement smart timer
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

    -- Update the lot's current price and bids count
    UPDATE public.lots
    SET 
        current_price = NEW.amount,
        bids_count = bids_count + 1,
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

-- Trigger for new bids
DROP TRIGGER IF EXISTS on_bid_placed ON public.bids;
CREATE TRIGGER on_bid_placed
AFTER INSERT ON public.bids
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_bid();