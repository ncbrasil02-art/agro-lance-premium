-- Restaurar site_info se estiver corrompido
UPDATE public.site_settings 
SET value = '{
  "name": "NC Agro Leilões",
  "email": "contato@ncbrasil.com.br",
  "phone": "(21) 99650-9905",
  "cnpj": "32.000.547/0001-00",
  "logo_url": "https://ccrslflbnxdazvadjlvj.supabase.co/storage/v1/object/public/public_assets/logo-0.9588475542778425.png"
}'::jsonb
WHERE key = 'site_info' AND (value->>'name' IS NULL OR value->>'name' = '');

-- Garantir que homepage_sections tenha a ordem correta
UPDATE public.site_settings
SET value = jsonb_set(value, '{order}', '["banners", "live_now", "upcoming_events", "featured_lots", "sale_menu", "articles", "sellers"]'::jsonb)
WHERE key = 'homepage_sections';
