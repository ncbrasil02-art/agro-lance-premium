-- Update trigger to run on UPDATE as well
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
    ELSE
        -- Fallback final
        NEW.bidder_name := 'Licitante';
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Apply trigger on both INSERT and UPDATE
DROP TRIGGER IF EXISTS tr_set_bidder_name ON public.bids;
CREATE TRIGGER tr_set_bidder_name
BEFORE INSERT OR UPDATE OF phone_bidder_identifier, user_id ON public.bids
FOR EACH ROW
EXECUTE FUNCTION public.set_bidder_name();

-- Sync existing bids where bidder_name might be wrong due to post-insert updates
UPDATE public.bids
SET bidder_name = phone_bidder_identifier
WHERE phone_bidder_identifier IS NOT NULL AND phone_bidder_identifier <> '' AND bidder_name <> phone_bidder_identifier;
