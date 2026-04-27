-- Set lot 1 as active and currently live
UPDATE public.lots SET status = 'active', is_currently_live = true WHERE lot_number = 1 AND event_id = '17e2e373-d87a-4b8d-a005-fa35620c6a48';

-- Update event to point to this active lot
UPDATE public.events SET active_lot_id = (SELECT id FROM public.lots WHERE lot_number = 1 AND event_id = '17e2e373-d87a-4b8d-a005-fa35620c6a48'), status = 'live' WHERE id = '17e2e373-d87a-4b8d-a005-fa35620c6a48';
