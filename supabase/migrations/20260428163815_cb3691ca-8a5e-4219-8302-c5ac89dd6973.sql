-- Ensure all existing bids have a bidder_name
UPDATE public.bids
SET bidder_name = COALESCE(
    phone_bidder_identifier,
    (SELECT full_name FROM public.profiles WHERE id = bids.user_id),
    'Licitante'
)
WHERE bidder_name IS NULL OR bidder_name = 'Licitante';

-- Update the trigger function to be even more robust
CREATE OR REPLACE FUNCTION public.set_bidder_name()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_full_name TEXT;
BEGIN
    -- Se já tiver um identificador de telefone/mesa, usa ele prioritariamente
    IF NEW.phone_bidder_identifier IS NOT NULL AND NEW.phone_bidder_identifier <> '' THEN
        NEW.bidder_name := NEW.phone_bidder_identifier;
    -- Se for um lance de usuário online, busca o nome no perfil
    ELSIF NEW.user_id IS NOT NULL THEN
        SELECT full_name INTO v_full_name FROM public.profiles WHERE id = NEW.user_id;
        NEW.bidder_name := COALESCE(v_full_name, 'Licitante Online');
    END IF;
    
    -- Fallback final caso tudo falhe (não deve acontecer com perfis válidos)
    IF NEW.bidder_name IS NULL OR NEW.bidder_name = '' THEN
        NEW.bidder_name := 'Licitante';
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Add a trigger to update bidder_name when a profile name is changed
-- This ensures existing bids show the updated name
CREATE OR REPLACE FUNCTION public.on_profile_name_update()
RETURNS trigger AS $$
BEGIN
    IF OLD.full_name IS DISTINCT FROM NEW.full_name THEN
        UPDATE public.bids
        SET bidder_name = NEW.full_name
        WHERE user_id = NEW.id
        AND (phone_bidder_identifier IS NULL OR phone_bidder_identifier = '');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_on_profile_name_update ON public.profiles;
CREATE TRIGGER tr_on_profile_name_update
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.on_profile_name_update();

-- Grant public access to bidder_name on bids table (already public, but double check)
-- Actually, let's make sure the bids table is fully public for SELECT
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bids are viewable by everyone." ON public.bids;
CREATE POLICY "Bids are viewable by everyone." 
ON public.bids FOR SELECT 
USING (true);
