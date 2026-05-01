-- Fix mutable search path for functions
ALTER FUNCTION public.notify_on_outbid() SET search_path = public;
ALTER FUNCTION public.notify_followers_on_status_change() SET search_path = public;
ALTER FUNCTION public.notify_on_offer_update() SET search_path = public;
ALTER FUNCTION public.handle_outbid_notification() SET search_path = public;
ALTER FUNCTION public.handle_user_sync() SET search_path = public;

-- Table to store payment gateway configurations
CREATE TABLE IF NOT EXISTS public.payment_gateways (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- 'mercado_pago', 'pagbank', 'pix_manual'
    label TEXT NOT NULL, -- Display name
    is_enabled BOOLEAN DEFAULT false,
    config JSONB DEFAULT '{}'::jsonb, -- Store credentials
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;

-- Only admins can manage payment gateways
CREATE POLICY "Admins can manage payment gateways" ON public.payment_gateways
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Users can view enabled gateways
CREATE POLICY "Users can view enabled gateways" ON public.payment_gateways
    FOR SELECT USING (is_enabled = true);

-- Add fields to transactions for payment tracking
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'payment_gateway_id') THEN
        ALTER TABLE public.transactions ADD COLUMN payment_gateway_id UUID REFERENCES public.payment_gateways(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'gateway_reference') THEN
        ALTER TABLE public.transactions ADD COLUMN gateway_reference TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'payment_method') THEN
        ALTER TABLE public.transactions ADD COLUMN payment_method TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'checkout_url') THEN
        ALTER TABLE public.transactions ADD COLUMN checkout_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'gateway_status') THEN
        ALTER TABLE public.transactions ADD COLUMN gateway_status TEXT;
    END IF;
END $$;

-- Initial data for gateways
INSERT INTO public.payment_gateways (name, label, is_enabled)
VALUES 
('mercado_pago', 'Mercado Pago', false),
('pagbank', 'PagBank', false),
('pix_manual', 'PIX Manual', false)
ON CONFLICT (name) DO UPDATE SET label = EXCLUDED.label;

-- Trigger for updated_at if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payment_gateways_updated_at') THEN
        CREATE TRIGGER update_payment_gateways_updated_at
        BEFORE UPDATE ON public.payment_gateways
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;