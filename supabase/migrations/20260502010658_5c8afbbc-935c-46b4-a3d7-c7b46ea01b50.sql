UPDATE public.notification_logs 
SET status = 'sent' 
WHERE title ILIKE '%Teste%' OR title ILIKE '%Final Test Gateway%';