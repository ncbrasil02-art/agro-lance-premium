-- Atualizar followed_lots
ALTER TABLE public.followed_lots 
DROP CONSTRAINT IF EXISTS followed_lots_user_id_fkey;

ALTER TABLE public.followed_lots
ADD CONSTRAINT followed_lots_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Atualizar messages
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

ALTER TABLE public.messages
ADD CONSTRAINT messages_sender_id_fkey 
FOREIGN KEY (sender_id) 
REFERENCES public.profiles(id)
ON DELETE CASCADE;

ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_recipient_id_fkey;

ALTER TABLE public.messages
ADD CONSTRAINT messages_recipient_id_fkey 
FOREIGN KEY (recipient_id) 
REFERENCES public.profiles(id)
ON DELETE CASCADE;
