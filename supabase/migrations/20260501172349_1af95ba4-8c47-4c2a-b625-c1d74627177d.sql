UPDATE public.webhook_events 
SET status = 'failed', error_message = 'Teste final de trigger.' 
WHERE external_id LIKE 'test_update_%';