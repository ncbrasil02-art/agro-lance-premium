-- Update the set_bidder_name function to be more robust
CREATE OR REPLACE FUNCTION public.set_bidder_name()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    v_full_name TEXT;
    v_email TEXT;
BEGIN
    -- 1. Se já tiver um identificador de telefone/mesa/auditório (lances manuais), usa ele
    IF NEW.phone_bidder_identifier IS NOT NULL AND NEW.phone_bidder_identifier <> '' THEN
        NEW.bidder_name := NEW.phone_bidder_identifier;
        RETURN NEW;
    END IF;

    -- 2. Se for um lance de usuário online, busca o nome no perfil
    IF NEW.user_id IS NOT NULL THEN
        SELECT full_name INTO v_full_name FROM public.profiles WHERE id = NEW.user_id;
        
        IF v_full_name IS NOT NULL AND v_full_name <> '' AND v_full_name <> 'Licitante' THEN
            NEW.bidder_name := v_full_name;
        ELSE
            -- Se não tem nome no perfil, tenta pegar parte do e-mail
            SELECT email INTO v_email FROM auth.users WHERE id = NEW.user_id;
            IF v_email IS NOT NULL THEN
                NEW.bidder_name := 'Licitante (' || split_part(v_email, '@', 1) || ')';
            ELSE
                NEW.bidder_name := 'Licitante #' || substring(NEW.user_id::text, 1, 4);
            END IF;
        END IF;
    ELSE
        -- 3. Fallback final para casos sem user_id nem identificador
        NEW.bidder_name := 'Licitante';
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Ensure the trigger is correctly set up
DROP TRIGGER IF EXISTS tr_set_bidder_name ON public.bids;
CREATE TRIGGER tr_set_bidder_name
BEFORE INSERT OR UPDATE OF phone_bidder_identifier, user_id ON public.bids
FOR EACH ROW EXECUTE FUNCTION set_bidder_name();

-- Synchronize existing bids bidder_name with profile full_names
UPDATE public.bids b
SET bidder_name = p.full_name
FROM public.profiles p
WHERE b.user_id = p.id
AND p.full_name IS NOT NULL 
AND p.full_name <> ''
AND (b.bidder_name = 'Licitante' OR b.bidder_name = 'Licitante Online' OR b.bidder_name IS NULL);

-- Final check for bids without name but with user_id
UPDATE public.bids b
SET bidder_name = 'Licitante (' || split_part(u.email, '@', 1) || ')'
FROM auth.users u
WHERE b.user_id = u.id
AND (b.bidder_name = 'Licitante' OR b.bidder_name = 'Licitante Online' OR b.bidder_name IS NULL);
