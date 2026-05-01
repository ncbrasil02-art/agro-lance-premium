-- Helper function to call the user-notifications edge function for admins
CREATE OR REPLACE FUNCTION public.fn_notify_admin_email(p_title TEXT, p_message TEXT)
RETURNS void AS $$
BEGIN
  -- We assume the edge function handles the email sending to all admins
  -- We use pg_net for async execution
  PERFORM net.http_post(
    url := (SELECT value FROM site_settings WHERE key = 'api_url' LIMIT 1) || '/functions/v1/user-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT value FROM site_settings WHERE key = 'service_role_key' LIMIT 1)
    ),
    body := jsonb_build_object(
      'type', 'security_alert',
      'title', p_title,
      'message', p_message
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update role change trigger to include email
CREATE OR REPLACE FUNCTION public.on_role_change_notify()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.role != NEW.role) THEN
    -- In-app notification for the user
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (NEW.id, 'Privilégios Alterados', 'Seu nível de acesso foi alterado para: ' || UPPER(NEW.role) || '.', 'security');
    
    -- In-app for other admins
    INSERT INTO public.notifications (user_id, title, message, type)
    SELECT id, 'Alerta de Segurança: Alteração de Cargo', 'O usuário ' || NEW.full_name || ' teve seu cargo alterado de ' || OLD.role || ' para ' || NEW.role || '.', 'security'
    FROM public.profiles WHERE role = 'admin' AND id != NEW.id;

    -- Email for all admins
    PERFORM public.fn_notify_admin_email(
      'Alteração de Privilégios detectada', 
      'O usuário ' || NEW.full_name || ' (ID: ' || NEW.id || ') foi promovido/alterado de ' || OLD.role || ' para ' || NEW.role || '.'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update webhook failures to notify admins via email if it's a first failure or critical
-- We can add this to the webhook functions themselves or a dedicated trigger on webhook_events
CREATE OR REPLACE FUNCTION public.on_webhook_failure_notify()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status != 'failed')) THEN
    PERFORM public.fn_notify_admin_email(
      'Falha Crítica no Webhook: ' || NEW.gateway_name,
      'O sistema não conseguiu processar uma notificação do ' || NEW.gateway_name || '. Referência externa: ' || NEW.external_id || '. Erro: ' || NEW.error_message
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_on_webhook_failure ON public.webhook_events;
CREATE TRIGGER tr_on_webhook_failure
AFTER UPDATE OR INSERT ON public.webhook_events
FOR EACH ROW
WHEN (NEW.status = 'failed')
EXECUTE FUNCTION public.on_webhook_failure_notify();
