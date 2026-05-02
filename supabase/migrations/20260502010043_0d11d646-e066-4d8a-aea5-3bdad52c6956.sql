UPDATE public.webhook_events 
SET status = 'processed', error_message = 'Acknowleged as test data: ' || error_message, processed_at = now()
WHERE gateway_name ILIKE '%test%';