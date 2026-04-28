INSERT INTO public.site_settings (key, value, description)
VALUES 
  ('about_page', '{"enabled": true, "title": "Sobre"}'::jsonb, 'Configurações da página Sobre'),
  ('custom_texts', '{"hero_title": "Elite em Leilões Agropecuários", "hero_subtitle": "Conectando os melhores criatórios aos investidores mais exigentes do Brasil.", "footer_text": "A Premium Agro é a plataforma definitiva para quem busca excelência, transparência e tecnologia no mercado agropecuário."}'::jsonb, 'Blocos de texto customizáveis do site')
ON CONFLICT (key) DO NOTHING;
