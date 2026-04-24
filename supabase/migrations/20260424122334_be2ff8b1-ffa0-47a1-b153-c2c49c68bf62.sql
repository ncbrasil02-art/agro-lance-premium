-- 9. TRANSACTIONS TABLE (Arremates)
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lot_id UUID REFERENCES public.lots(id) NOT NULL UNIQUE,
    buyer_id UUID REFERENCES public.profiles(id) NOT NULL,
    seller_id UUID REFERENCES public.profiles(id),
    final_price NUMERIC NOT NULL,
    buyer_commission NUMERIC NOT NULL DEFAULT 0,
    seller_commission NUMERIC NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. CONTRACTS TABLE
CREATE TABLE public.contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
    contract_url TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'void')),
    signed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Policies for Transactions
CREATE POLICY "Admins can manage all transactions." ON public.transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can view their own transactions." ON public.transactions
    FOR SELECT USING (
        auth.uid() = buyer_id OR auth.uid() = seller_id
    );

-- Policies for Contracts
CREATE POLICY "Admins can manage all contracts." ON public.contracts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can view their own contracts." ON public.contracts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.transactions
            WHERE transactions.id = public.contracts.transaction_id
            AND (transactions.buyer_id = auth.uid() OR transactions.seller_id = auth.uid())
        )
    );

-- FUNCTION: place_bid
-- This function handles the logic of placing a bid, ensuring validations
CREATE OR REPLACE FUNCTION public.place_bid(
    p_lot_id UUID,
    p_user_id UUID,
    p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lot_status TEXT;
    v_current_price NUMERIC;
    v_min_increment NUMERIC;
    v_is_approved BOOLEAN;
    v_result JSONB;
BEGIN
    -- 1. Check if user is approved
    SELECT is_approved INTO v_is_approved FROM public.profiles WHERE id = p_user_id;
    IF NOT v_is_approved THEN
        RETURN jsonb_build_object('success', false, 'message', 'Usuário não aprovado para lances.');
    END IF;

    -- 2. Get lot info and lock row for update
    SELECT status, COALESCE(current_price, starting_price), bid_increment 
    INTO v_lot_status, v_current_price, v_min_increment
    FROM public.lots 
    WHERE id = p_lot_id
    FOR UPDATE;

    -- 3. Check lot status
    IF v_lot_status != 'active' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Este lote não está aceitando lances no momento.');
    END IF;

    -- 4. Check bid amount
    IF p_amount < (v_current_price + v_min_increment) THEN
        RETURN jsonb_build_object('success', false, 'message', 'O lance deve ser superior ao lance atual + incremento mínimo.');
    END IF;

    -- 5. Insert bid
    INSERT INTO public.bids (lot_id, user_id, amount, bid_type)
    VALUES (p_lot_id, p_user_id, p_amount, 'online');

    -- 6. Update lot
    UPDATE public.lots 
    SET current_price = p_amount,
        bids_count = bids_count + 1,
        updated_at = now()
    WHERE id = p_lot_id;

    RETURN jsonb_build_object('success', true, 'message', 'Lance efetuado com sucesso!', 'new_price', p_amount);
END;
$$;

-- Trigger to update updated_at for new tables
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();