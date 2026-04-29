CREATE OR REPLACE FUNCTION public.notify_admin_on_new_offer()
RETURNS TRIGGER AS $$
DECLARE
    v_admin_id UUID;
    v_item_name TEXT;
BEGIN
    -- Obter nome do item (animal ou lote)
    IF NEW.animal_id IS NOT NULL THEN
        SELECT name INTO v_item_name FROM public.animals WHERE id = NEW.animal_id;
    ELSIF NEW.lot_id IS NOT NULL THEN
        SELECT a.name INTO v_item_name FROM public.lots l JOIN public.animals a ON l.animal_id = a.id WHERE l.id = NEW.lot_id;
    END IF;

    -- Notificar todos os administradores (ou apenas o principal por simplicidade inicial)
    FOR v_admin_id IN SELECT id FROM public.profiles WHERE role = 'admin' LOOP
        INSERT INTO public.notifications (user_id, title, message, link)
        VALUES (
            v_admin_id,
            'Nova Proposta Recebida!',
            'Uma nova oferta de ' || to_char(NEW.amount, 'L999G999G990D99') || ' foi feita para ' || COALESCE(v_item_name, 'um item') || '.',
            '/admin' -- Link para o painel de ofertas/lotes
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_offer_created ON public.offers;
CREATE TRIGGER on_offer_created
AFTER INSERT ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_new_offer();
