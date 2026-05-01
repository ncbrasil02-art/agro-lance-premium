CREATE TRIGGER tr_webhook_failure_notify
AFTER UPDATE ON public.webhook_events
FOR EACH ROW
EXECUTE FUNCTION public.on_webhook_failure_notify();