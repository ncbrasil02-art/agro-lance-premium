INSERT INTO public.webhook_events (gateway_name, external_id, status) 
VALUES ('Test Update Gateway', 'test_update_' || now(), 'pending');

UPDATE public.webhook_events 
SET status = 'failed', error_message = 'Falha induzida via UPDATE para teste.' 
WHERE external_id LIKE 'test_update_%';