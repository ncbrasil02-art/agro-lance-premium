ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pref_followed_lot_update BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.profiles.pref_followed_lot_update IS 'Preferência de receber e-mail sobre atualizações nos lotes seguidos';
