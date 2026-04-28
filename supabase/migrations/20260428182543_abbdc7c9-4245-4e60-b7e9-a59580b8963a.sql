-- Atualizar audit_logs
ALTER TABLE public.audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

ALTER TABLE public.audit_logs
ADD CONSTRAINT audit_logs_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- Atualizar offers
ALTER TABLE public.offers 
DROP CONSTRAINT IF EXISTS offers_user_id_fkey;

ALTER TABLE public.offers
ADD CONSTRAINT offers_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id)
ON DELETE SET NULL;
