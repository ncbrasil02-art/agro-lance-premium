-- Corrigir a chave estrangeira de winner_id para apontar para public.profiles em vez de auth.users
-- Isso permite que o Supabase reconheça a relação ao realizar joins

ALTER TABLE public.lots 
DROP CONSTRAINT IF EXISTS lots_winner_id_fkey;

ALTER TABLE public.lots
ADD CONSTRAINT lots_winner_id_fkey 
FOREIGN KEY (winner_id) 
REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- Também garantir que bids.user_id aponte para profiles se ainda não apontar (alguns apontam para auth.users)
ALTER TABLE public.bids
DROP CONSTRAINT IF EXISTS bids_user_id_fkey;

ALTER TABLE public.bids
ADD CONSTRAINT bids_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE SET NULL;
