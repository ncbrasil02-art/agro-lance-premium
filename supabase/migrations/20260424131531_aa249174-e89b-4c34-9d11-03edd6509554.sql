-- Refine bidding logic with validation
CREATE OR REPLACE FUNCTION public.handle_new_bid()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_bid_extension_seconds INTEGER;
    v_current_end_date TIMESTAMP WITH TIME ZONE;
    v_new_end_date TIMESTAMP WITH TIME ZONE;
    v_current_price NUMERIC;
    v_bid_increment NUMERIC;
    v_lot_status TEXT;
BEGIN
    -- Get current lot info
    SELECT current_price, bid_increment, status, end_date
    INTO v_current_price, v_bid_increment, v_lot_status, v_current_end_date
    FROM public.lots
    WHERE id = NEW.lot_id;

    -- Validation: Lot must be active
    IF v_lot_status != 'active' THEN
        RAISE EXCEPTION 'Este lote não está ativo para lances.';
    END IF;

    -- Validation: Bid must be higher than current price + increment
    IF NEW.amount < (v_current_price + v_bid_increment) THEN
        RAISE EXCEPTION 'O lance deve ser de pelo menos R$ %', (v_current_price + v_bid_increment);
    END IF;

    -- Get the bid extension setting (default 30s)
    SELECT (value->>'bid_extension_seconds')::INTEGER 
    INTO v_bid_extension_seconds
    FROM public.site_settings 
    WHERE key = 'auction_rules';
    
    IF v_bid_extension_seconds IS NULL THEN
        v_bid_extension_seconds := 30;
    END IF;

    -- Update the lot's current price, bids count AND winner_id
    UPDATE public.lots
    SET 
        current_price = NEW.amount,
        bids_count = bids_count + 1,
        winner_id = NEW.user_id,
        updated_at = now()
    WHERE id = NEW.lot_id;

    -- Handle Smart Timer (Bid Extension)
    -- If end_date is set and we are within the extension window
    IF v_current_end_date IS NOT NULL AND (v_current_end_date - now()) < (v_bid_extension_seconds || ' seconds')::INTERVAL THEN
        v_new_end_date := now() + (v_bid_extension_seconds || ' seconds')::INTERVAL;
        
        UPDATE public.lots
        SET end_date = v_new_end_date
        WHERE id = NEW.lot_id;
    END IF;

    RETURN NEW;
END;
$function$;

-- Seed Data: Animals
INSERT INTO public.animals (id, name, breed, species, sex, color, weight, internal_code, registration_number, location, photos)
VALUES 
  (gen_random_uuid(), 'Invencível do Haras', 'Mangalarga Marchador', 'Equino', 'M', 'Tordilho', 550, 'EQ-001', '123456/P', 'Ibiúna - SP', ARRAY['https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80']),
  (gen_random_uuid(), 'Safira da Elite', 'Quarto de Milha', 'Equino', 'F', 'Zaino', 500, 'EQ-002', '789012/P', 'Tatui - SP', ARRAY['https://images.unsplash.com/photo-1534073737927-85f1df9605d2?auto=format&fit=crop&q=80']),
  (gen_random_uuid(), 'Touro Bruto', 'Nelore', 'Bovino', 'M', 'Branco', 1100, 'BOV-001', 'AB-9988', 'Uberaba - MG', ARRAY['https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80']);

-- Seed Data: Events
INSERT INTO public.events (id, name, slug, description, start_date, location, status, mode, banner_url, event_type)
VALUES 
  (gen_random_uuid(), 'Leilão de Elite 2024', 'elite-2024', 'O maior leilão de Mangalarga Marchador do ano, apresentando os melhores exemplares da raça.', now() + interval '1 day', 'Recinto de Exposições - SP', 'scheduled', 'individual', 'https://images.unsplash.com/photo-1518467166778-b88f373ffec7?auto=format&fit=crop&q=80', 'online');

-- Seed Data: Lots
DO $$
DECLARE
    v_event_id UUID;
    v_animal_1_id UUID;
    v_animal_2_id UUID;
    v_animal_3_id UUID;
BEGIN
    SELECT id INTO v_event_id FROM public.events WHERE slug = 'elite-2024' LIMIT 1;
    SELECT id INTO v_animal_1_id FROM public.animals WHERE internal_code = 'EQ-001';
    SELECT id INTO v_animal_2_id FROM public.animals WHERE internal_code = 'EQ-002';
    SELECT id INTO v_animal_3_id FROM public.animals WHERE internal_code = 'BOV-001';

    INSERT INTO public.lots (event_id, animal_id, lot_number, starting_price, current_price, bid_increment, status, end_date)
    VALUES 
      (v_event_id, v_animal_1_id, 1, 50000, 50000, 2000, 'active', now() + interval '2 days'),
      (v_event_id, v_animal_2_id, 2, 35000, 35000, 1000, 'active', now() + interval '2 days'),
      (v_event_id, v_animal_3_id, 3, 150000, 150000, 5000, 'active', now() + interval '2 days');
END $$;

-- Seed Data: Banners
INSERT INTO public.banners (title, image_url, link_url, is_active, display_order)
VALUES 
  ('Bem-vindo à Elite Agro', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80', '/sobre', true, 1),
  ('Leilão de Elite 2024', 'https://images.unsplash.com/photo-1518467166778-b88f373ffec7?auto=format&fit=crop&q=80', '/eventos/elite-2024', true, 2);
