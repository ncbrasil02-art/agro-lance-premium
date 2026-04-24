-- Add active_lot_id to events for sequential bidding mode
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS active_lot_id UUID REFERENCES public.lots(id) ON DELETE SET NULL;

-- Enable Realtime for key tables
-- First, ensure the publication exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_lots_event_id ON public.lots(event_id);
CREATE INDEX IF NOT EXISTS idx_lots_animal_id ON public.lots(animal_id);
CREATE INDEX IF NOT EXISTS idx_lots_status ON public.lots(status);

CREATE INDEX IF NOT EXISTS idx_bids_lot_id ON public.bids(lot_id);
CREATE INDEX IF NOT EXISTS idx_bids_user_id ON public.bids(user_id);
CREATE INDEX IF NOT EXISTS idx_bids_created_at ON public.bids(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_lot_id ON public.transactions(lot_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON public.transactions(buyer_id);

CREATE INDEX IF NOT EXISTS idx_posts_status_published_at ON public.posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON public.notifications(user_id, is_read);

-- Trigger to notify user on approval
CREATE OR REPLACE FUNCTION public.handle_profile_approval_notification()
RETURNS trigger AS $$
BEGIN
    IF NEW.is_approved = true AND (OLD.is_approved = false OR OLD.is_approved IS NULL) THEN
        INSERT INTO public.notifications (user_id, title, message)
        VALUES (NEW.id, 'Cadastro Aprovado!', 'Parabéns! Seu cadastro foi aprovado e você já pode dar lances nos leilões.');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_approved
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    WHEN (NEW.is_approved IS DISTINCT FROM OLD.is_approved)
    EXECUTE FUNCTION public.handle_profile_approval_notification();