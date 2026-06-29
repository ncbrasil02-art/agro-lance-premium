
-- animals -> sellers: CASCADE
ALTER TABLE public.animals DROP CONSTRAINT IF EXISTS animals_seller_id_fkey;
ALTER TABLE public.animals
  ADD CONSTRAINT animals_seller_id_fkey
  FOREIGN KEY (seller_id) REFERENCES public.sellers(id) ON DELETE CASCADE;

-- lots -> animals: CASCADE (para propagar)
ALTER TABLE public.lots DROP CONSTRAINT IF EXISTS lots_animal_id_fkey;
ALTER TABLE public.lots
  ADD CONSTRAINT lots_animal_id_fkey
  FOREIGN KEY (animal_id) REFERENCES public.animals(id) ON DELETE CASCADE;

-- offers -> animals/lots: CASCADE
ALTER TABLE public.offers DROP CONSTRAINT IF EXISTS offers_animal_id_fkey;
ALTER TABLE public.offers
  ADD CONSTRAINT offers_animal_id_fkey
  FOREIGN KEY (animal_id) REFERENCES public.animals(id) ON DELETE CASCADE;

ALTER TABLE public.offers DROP CONSTRAINT IF EXISTS offers_lot_id_fkey;
ALTER TABLE public.offers
  ADD CONSTRAINT offers_lot_id_fkey
  FOREIGN KEY (lot_id) REFERENCES public.lots(id) ON DELETE CASCADE;

-- bids -> lots: CASCADE
ALTER TABLE public.bids DROP CONSTRAINT IF EXISTS bids_lot_id_fkey;
ALTER TABLE public.bids
  ADD CONSTRAINT bids_lot_id_fkey
  FOREIGN KEY (lot_id) REFERENCES public.lots(id) ON DELETE CASCADE;

-- followed_lots -> lots: CASCADE
ALTER TABLE public.followed_lots DROP CONSTRAINT IF EXISTS followed_lots_lot_id_fkey;
ALTER TABLE public.followed_lots
  ADD CONSTRAINT followed_lots_lot_id_fkey
  FOREIGN KEY (lot_id) REFERENCES public.lots(id) ON DELETE CASCADE;
