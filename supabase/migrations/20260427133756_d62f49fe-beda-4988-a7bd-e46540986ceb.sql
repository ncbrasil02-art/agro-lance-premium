-- Adiciona coluna CNPJ
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cnpj TEXT;
