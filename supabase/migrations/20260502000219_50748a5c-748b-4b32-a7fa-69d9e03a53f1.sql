-- Limpar site_info se estiver em formato de array de caracteres
DELETE FROM public.site_settings WHERE key = 'site_info';
INSERT INTO public.site_settings (key, value)
VALUES ('site_info', '{
  "name": "NC Agro Leilões",
  "email": "contato@ncbrasil.com.br",
  "phone": "(21) 99650-9905",
  "cnpj": "32.000.547/0001-00",
  "logo_url": "https://ccrslflbnxdazvadjlvj.supabase.co/storage/v1/object/public/public_assets/logo-0.9588475542778425.png"
}'::jsonb);

-- Garantir que homepage_sections tenha a ordem correta e formato válido
DELETE FROM public.site_settings WHERE key = 'homepage_sections';
INSERT INTO public.site_settings (key, value)
VALUES ('homepage_sections', '{
  "order": ["banners", "live_now", "upcoming_events", "featured_lots", "sale_menu", "articles", "sellers"],
  "show_articles": true,
  "show_upcoming_events": true,
  "show_featured_lots": true,
  "show_sale_menu": true,
  "show_animated_slides": true,
  "template_id": "model1",
  "stats": {
    "totalSold": 184500000,
    "totalAnimals": 12847,
    "totalUsers": 38420,
    "activeEvents": 14,
    "labels": {
      "totalSold": "Volume Negociado",
      "totalAnimals": "Animais Registrados",
      "totalUsers": "Base de Investidores",
      "activeEvents": "Eventos Ativos"
    }
  }
}'::jsonb);
