-- Function to prevent deletion of active or finished events
CREATE OR REPLACE FUNCTION public.check_event_deletion_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status NOT IN ('draft', 'cancelled') THEN
    RAISE EXCEPTION 'Eventos que já iniciaram ou foram concluídos não podem ser excluídos para preservar o histórico.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger for event deletion
CREATE TRIGGER tr_prevent_event_deletion
BEFORE DELETE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.check_event_deletion_status();

-- Function to prevent deletion of lots with activity or sold status
CREATE OR REPLACE FUNCTION public.check_lot_deletion_status()
RETURNS TRIGGER AS $$
DECLARE
    v_bids_count INTEGER;
BEGIN
    SELECT count(*) INTO v_bids_count FROM public.bids WHERE lot_id = OLD.id;
    
    IF OLD.status = 'sold' OR v_bids_count > 0 THEN
        RAISE EXCEPTION 'Lotes com lances ou marcados como vendidos não podem ser excluídos para preservar o histórico.';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger for lot deletion
CREATE TRIGGER tr_prevent_lot_deletion
BEFORE DELETE ON public.lots
FOR EACH ROW
EXECUTE FUNCTION public.check_lot_deletion_status();

-- Function to prevent modification of sold animals (unless via revert function)
CREATE OR REPLACE FUNCTION public.check_sold_animal_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.sale_status = 'sold' AND (NEW.sale_status IS NOT DISTINCT FROM OLD.sale_status) THEN
        RAISE EXCEPTION 'Animais vendidos não podem ser alterados. É necessário reverter o lote primeiro.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for animal modification
CREATE TRIGGER tr_prevent_sold_animal_edit
BEFORE UPDATE ON public.animals
FOR EACH ROW
EXECUTE FUNCTION public.check_sold_animal_modification();

-- Function to revert a sold lot
CREATE OR REPLACE FUNCTION public.revert_sold_lot(p_lot_id UUID)
RETURNS VOID AS $$
DECLARE
    v_animal_id UUID;
BEGIN
    -- Get the animal ID
    SELECT animal_id INTO v_animal_id FROM public.lots WHERE id = p_lot_id;
    
    -- Update lot status
    UPDATE public.lots 
    SET status = 'cancelled', 
        winner_id = NULL,
        updated_at = now()
    WHERE id = p_lot_id;
    
    -- Update animal status
    UPDATE public.animals
    SET sale_status = 'available',
        updated_at = now()
    WHERE id = v_animal_id;
    
    -- Log the action (if audit_logs table exists and is used)
    -- This is a placeholder for audit logging
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
