CREATE OR REPLACE FUNCTION public.handle_confirmed_direct_sale()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
        -- Atualizar status do animal
        UPDATE public.animals 
        SET sale_status = 'sold' 
        WHERE id = NEW.animal_id;
        
        -- Atualizar status de qualquer lote ativo que contenha este animal
        -- Status permitidos em lots: 'upcoming', 'active', 'sold', 'passed'
        UPDATE public.lots 
        SET status = 'sold' 
        WHERE animal_id = NEW.animal_id AND status IN ('upcoming', 'active');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
