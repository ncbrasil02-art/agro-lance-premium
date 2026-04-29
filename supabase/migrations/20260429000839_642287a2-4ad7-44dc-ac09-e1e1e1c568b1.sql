-- 1. Hardening prices and counts in lots
ALTER TABLE public.lots ADD CONSTRAINT check_starting_price_positive CHECK (starting_price >= 0);
ALTER TABLE public.lots ADD CONSTRAINT check_current_price_positive CHECK (current_price >= 0);
ALTER TABLE public.lots ADD CONSTRAINT check_bid_increment_positive CHECK (bid_increment > 0);
ALTER TABLE public.lots ADD CONSTRAINT check_bids_count_non_negative CHECK (bids_count >= 0);

-- 2. Hardening bids
ALTER TABLE public.bids ADD CONSTRAINT check_bid_amount_positive CHECK (amount > 0);

-- 3. Hardening animals
ALTER TABLE public.animals ADD CONSTRAINT check_sale_price_positive CHECK (sale_price >= 0);

-- 4. Error Logging Fallback (Blindagem de Erros)
-- Create a table for database errors if it doesn't exist
CREATE TABLE IF NOT EXISTS public.db_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    function_name TEXT,
    error_message TEXT,
    error_context TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for db_errors
ALTER TABLE public.db_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view db errors" ON public.db_errors FOR SELECT USING (public.is_admin());

-- Create a helper function for error logging
CREATE OR REPLACE FUNCTION public.log_db_error(p_function_name TEXT, p_error_message TEXT, p_error_context TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.db_errors (function_name, error_message, error_context)
    VALUES (p_function_name, p_error_message, p_error_context);
END;
$$;
