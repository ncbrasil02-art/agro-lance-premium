-- Adicionar colunas de preferências de notificação
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pref_outbid_email BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS pref_outbid_push BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS pref_new_event_email BOOLEAN DEFAULT TRUE;

-- Comentários para documentação
COMMENT ON COLUMN public.profiles.pref_outbid_email IS 'Preferência de receber e-mail quando for superado em um lance';
COMMENT ON COLUMN public.profiles.pref_outbid_push IS 'Preferência de receber notificação push quando for superado em um lance';
COMMENT ON COLUMN public.profiles.pref_new_event_email IS 'Preferência de receber e-mail sobre novos eventos/leilões';
