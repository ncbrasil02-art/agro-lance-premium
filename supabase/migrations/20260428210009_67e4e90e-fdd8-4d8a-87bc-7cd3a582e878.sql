-- Add category_id to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);

-- Add is_featured to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add homepage visibility settings
INSERT INTO public.site_settings (key, value, description)
VALUES 
  ('homepage_sections', '{"show_articles": true, "show_upcoming_events": true, "show_featured_lots": true}', 'Controla a exibição de seções na página inicial')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Ensure some categories exist for articles
INSERT INTO public.categories (name)
VALUES 
  ('Cavalos'),
  ('Fazendas'),
  ('Criatórios'),
  ('Eventos de Leilão'),
  ('Mercado Agro')
ON CONFLICT DO NOTHING;
