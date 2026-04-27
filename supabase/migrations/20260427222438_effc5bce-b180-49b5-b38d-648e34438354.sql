-- Update event_type check constraint
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_event_type_check;
ALTER TABLE public.events ADD CONSTRAINT events_event_type_check 
CHECK (event_type = ANY (ARRAY['presencial'::text, 'online'::text, 'híbrido'::text, 'ao_vivo'::text]));

-- Update status check constraint
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE public.events ADD CONSTRAINT events_status_check 
CHECK (status = ANY (ARRAY['scheduled'::text, 'live'::text, 'finished'::text, 'em_loteamento'::text, 'recebendo_lances'::text, 'em_condicional'::text, 'evento_adiado'::text, 'incondicional'::text]));