-- Add foreign key from events to lots for active_lot_id
ALTER TABLE public.events
ADD CONSTRAINT fk_events_active_lot
FOREIGN KEY (active_lot_id)
REFERENCES public.lots(id)
ON DELETE SET NULL;

-- Ensure an index exists for performance
CREATE INDEX IF NOT EXISTS idx_events_active_lot_id ON public.events(active_lot_id);
