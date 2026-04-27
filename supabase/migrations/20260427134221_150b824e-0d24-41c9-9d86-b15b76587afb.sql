-- Adiciona campos de parcelamento à tabela de lotes
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS installment_count INTEGER DEFAULT 30;
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS installment_interval TEXT DEFAULT 'mensal'; -- 'mensal' ou 'quinzenal'
