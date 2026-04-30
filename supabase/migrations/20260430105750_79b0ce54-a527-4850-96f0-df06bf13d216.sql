-- Function to notify on offer updates
CREATE OR REPLACE FUNCTION public.notify_on_offer_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify user if status or description changed and it wasn't them who made the change
    IF (OLD.status IS DISTINCT FROM NEW.status OR OLD.description IS DISTINCT FROM NEW.description) 
       AND (auth.uid() IS NULL OR auth.uid() != NEW.user_id) THEN
        
        INSERT INTO public.notifications (user_id, title, message, link)
        VALUES (
            NEW.user_id,
            'Sua proposta foi atualizada! 📝',
            'O status ou os detalhes da sua proposta para ' || 
            COALESCE((SELECT name FROM public.animals WHERE id = NEW.animal_id), 'um item') || 
            ' foram atualizados pela administração.',
            '/painel'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for offer updates
CREATE TRIGGER on_offer_updated_notification
    AFTER UPDATE ON public.offers
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_on_offer_update();

-- Revoke execute from public
REVOKE EXECUTE ON FUNCTION public.notify_on_offer_update() FROM PUBLIC;
