-- Ensure viewers has a default value of 0
ALTER TABLE public.lots ALTER COLUMN viewers SET DEFAULT 0;
UPDATE public.lots SET viewers = 0 WHERE viewers IS NULL;
ALTER TABLE public.lots ALTER COLUMN viewers SET NOT NULL;

-- Create function to increment lot viewers
CREATE OR REPLACE FUNCTION public.increment_lot_viewers(p_lot_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.lots
    SET viewers = viewers + 1
    WHERE id = p_lot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
