INSERT INTO public.site_settings (key, value) 
VALUES 
  ('api_url', '"https://ccrslflbnxdazvadjlvj.supabase.co"'),
  ('service_role_key', '"PLACEHOLDER_SERVICE_ROLE_KEY"')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;