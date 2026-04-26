-- Add blocking and risk columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS block_reason TEXT,
ADD COLUMN IF NOT EXISTS risk_score INT DEFAULT 0;

-- Add IP tracking to bids
ALTER TABLE public.bids 
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Create function to check for suspicious activity (simple version)
CREATE OR REPLACE FUNCTION public.check_user_risk(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_bid_count INT;
    v_is_blocked BOOLEAN;
BEGIN
    -- Check if already blocked
    SELECT is_blocked INTO v_is_blocked FROM public.profiles WHERE id = p_user_id;
    IF v_is_blocked THEN
        RETURN FALSE;
    END IF;

    -- Example risk logic: block if user has more than 20 bids in the last 1 minute (potential bot)
    SELECT COUNT(*) INTO v_bid_count 
    FROM public.bids 
    WHERE user_id = p_user_id 
    AND created_at > (now() - interval '1 minute');

    IF v_bid_count > 20 THEN
        UPDATE public.profiles 
        SET is_blocked = TRUE, 
            block_reason = 'Bloqueio automático: Atividade suspeita (excesso de lances)'
        WHERE id = p_user_id;
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
