-- Adicionar campos à tabela events
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS allows_pre_bidding BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_countdown BOOLEAN DEFAULT true;

-- Adicionar campos à tabela animals
ALTER TABLE public.animals
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS vaccination_records JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS pedigree_url TEXT;

-- Garantir que as colunas existam na tabela lots se precisarem de override
ALTER TABLE public.lots
ADD COLUMN IF NOT EXISTS allows_pre_bidding BOOLEAN DEFAULT true;