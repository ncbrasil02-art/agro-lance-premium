ALTER TABLE public.lots ADD COLUMN is_featured BOOLEAN DEFAULT false;
CREATE INDEX idx_lots_is_featured ON public.lots(is_featured) WHERE is_featured = true;