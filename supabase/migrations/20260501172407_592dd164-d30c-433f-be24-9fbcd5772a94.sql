INSERT INTO public.webhook_events (gateway_name, external_id, status) 
VALUES ('Final Test Gateway', 'final_test_' || now(), 'pending');

UPDATE public.webhook_events 
SET status = 'failed', error_message = 'Validando o trigger automático de ponta a ponta.' 
WHERE external_id LIKE 'final_test_%';