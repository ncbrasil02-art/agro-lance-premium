-- Add accepts_offers to animals
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS accepts_offers BOOLEAN DEFAULT false;

-- Create offers table
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lot_id UUID REFERENCES public.lots(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC,
    description TEXT,
    status TEXT DEFAULT 'pending', -- pending, accepted, rejected
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Policies for offers
CREATE POLICY "Users can create their own offers" ON public.offers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own offers" ON public.offers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all offers" ON public.offers FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admins can update offers" ON public.offers FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
