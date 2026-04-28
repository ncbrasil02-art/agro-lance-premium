-- Initialize site_info if not present or update it
INSERT INTO public.site_settings (key, value, description)
VALUES (
  'site_info', 
  '{"name": "Premium Agro Leilões", "email": "contato@premiumagro.com.br", "phone": "(11) 99999-9999", "cnpj": "00.000.000/0001-00", "logo_url": ""}',
  'Informações básicas do site como nome, contato e logo'
)
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value || public.site_settings.value;

-- Initialize theme settings
INSERT INTO public.site_settings (key, value, description)
VALUES (
  'theme',
  '{"primary_color": "#D4AF37", "secondary_color": "#064E3B", "accent_color": "#10B981", "background_color": "#022C22"}',
  'Configurações visuais e paleta de cores'
)
ON CONFLICT (key) DO NOTHING;

-- Initialize or update homepage sections with order and more controls
INSERT INTO public.site_settings (key, value, description)
VALUES (
  'homepage_sections',
  '{"show_articles": true, "show_upcoming_events": true, "show_featured_lots": true, "show_sale_menu": true, "show_animated_slides": true, "order": ["banners", "upcoming_events", "featured_lots", "sale_menu", "articles"]}',
  'Controle de exibição e ordem das seções na página inicial'
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value || public.site_settings.value;
