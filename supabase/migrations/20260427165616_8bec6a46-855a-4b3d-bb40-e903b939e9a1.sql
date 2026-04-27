-- Drop the existing constraint
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;

-- Add the updated constraint with all allowed statuses
ALTER TABLE public.events ADD CONSTRAINT events_status_check 
CHECK (status = ANY (ARRAY[
  'scheduled'::text, 
  'live'::text, 
  'finished'::text, 
  'em_loteamento'::text, 
  'recebendo_lances'::text, 
  'em_condicional'::text, 
  'evento_adiado'::text
]));

-- Fix search_path for is_admin function (Security best practice)
ALTER FUNCTION public.is_admin() SET search_path = public;
