-- Adicionar campos OG para animais
ALTER TABLE public.animals 
ADD COLUMN og_title TEXT,
ADD COLUMN og_description TEXT,
ADD COLUMN og_image_url TEXT;

-- Adicionar campos OG para posts (notícias)
ALTER TABLE public.posts 
ADD COLUMN og_title TEXT,
ADD COLUMN og_description TEXT,
ADD COLUMN og_image_url TEXT;

-- Adicionar campos OG para eventos
ALTER TABLE public.events 
ADD COLUMN og_title TEXT,
ADD COLUMN og_description TEXT,
ADD COLUMN og_image_url TEXT;
