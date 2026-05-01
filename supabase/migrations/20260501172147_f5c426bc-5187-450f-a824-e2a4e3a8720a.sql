CREATE OR REPLACE FUNCTION public.fn_notify_admin_email(p_title text, p_message text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_api_url TEXT;
  v_service_key TEXT;
BEGIN
  SELECT value #>> '{}' INTO v_api_url FROM site_settings WHERE key = 'api_url' LIMIT 1;
  SELECT value #>> '{}' INTO v_service_key FROM site_settings WHERE key = 'service_role_key' LIMIT 1;

  IF v_api_url IS NOT NULL AND v_service_key IS NOT NULL THEN
    PERFORM net.http_post(
      url := v_api_url || '/functions/v1/user-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      ),
      body := jsonb_build_object(
        'type', 'security_alert',
        'title', p_title,
        'message', p_message
      )
    );
  END IF;
END;
$function$;