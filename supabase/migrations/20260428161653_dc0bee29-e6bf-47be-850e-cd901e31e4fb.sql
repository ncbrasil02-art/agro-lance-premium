-- Adiciona a coluna bidder_name se não existir
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS bidder_name TEXT;

-- Atualiza os lances existentes
UPDATE public.bids b
SET bidder_name = COALESCE(
  b.phone_bidder_identifier,
  (SELECT full_name FROM public.profiles p WHERE p.id = b.user_id),
  'Licitante'
);

-- Função para definir o nome do licitante automaticamente
CREATE OR REPLACE FUNCTION public.set_bidder_name()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
BEGIN
    -- Se já tiver um identificador de telefone/mesa, usa ele
    IF NEW.phone_bidder_identifier IS NOT NULL AND NEW.phone_bidder_identifier <> '' THEN
        NEW.bidder_name := NEW.phone_bidder_identifier;
    -- Se for um lance de usuário online, busca o nome no perfil
    ELSIF NEW.user_id IS NOT NULL THEN
        SELECT full_name INTO v_full_name FROM public.profiles WHERE id = NEW.user_id;
        NEW.bidder_name := COALESCE(v_full_name, 'Licitante Online');
    END IF;
    
    -- Fallback final
    IF NEW.bidder_name IS NULL THEN
        NEW.bidder_name := 'Licitante';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para novos lances
DROP TRIGGER IF EXISTS tr_set_bidder_name ON public.bids;
CREATE TRIGGER tr_set_bidder_name
BEFORE INSERT ON public.bids
FOR EACH ROW
EXECUTE FUNCTION public.set_bidder_name();

-- Trigger para quando o perfil for atualizado, atualizar os nomes nos lances (opcional, mas recomendado para consistência)
CREATE OR REPLACE FUNCTION public.update_bidder_names_on_profile_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.full_name IS DISTINCT FROM NEW.full_name THEN
        UPDATE public.bids 
        SET bidder_name = NEW.full_name 
        WHERE user_id = NEW.id AND is_phone_bid = false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_update_bidder_names ON public.profiles;
CREATE TRIGGER tr_update_bidder_names
AFTER UPDATE OF full_name ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_bidder_names_on_profile_change();
