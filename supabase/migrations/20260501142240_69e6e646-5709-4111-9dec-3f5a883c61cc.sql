-- Add payment_formula column
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS payment_formula TEXT DEFAULT '1';
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS payment_formula TEXT DEFAULT '1';

-- Create installments table
CREATE TABLE IF NOT EXISTS public.installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES auth.users(id),
    amount NUMERIC NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    installment_number INTEGER NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, paid, overdue, under_review
    payment_method TEXT DEFAULT 'pix_manual',
    proof_url TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on installments
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;

-- Policies for installments
CREATE POLICY "Users can view their own installments"
ON public.installments FOR SELECT
USING (auth.uid() = buyer_id);

CREATE POLICY "Users can update their own installments (upload proof)"
ON public.installments FOR UPDATE
USING (auth.uid() = buyer_id);

CREATE POLICY "Admins can do everything with installments"
ON public.installments FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

-- Storage bucket is handled by Lovable Cloud, but I'll add policies if I can.
-- Actually, let's just ensure the table is there first.
