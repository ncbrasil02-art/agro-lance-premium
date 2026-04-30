ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pref_outbid_whatsapp BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS pref_outbid_sms BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pref_new_event_whatsapp BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS pref_new_event_sms BOOLEAN DEFAULT false;