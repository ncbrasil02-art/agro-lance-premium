-- Função para gerar slug de forma determinística no SQL
CREATE OR REPLACE FUNCTION public.slugify(text) RETURNS text AS $$
DECLARE
    result text;
BEGIN
    -- Remover acentos e caracteres especiais simples
    result := unaccent($1);
    result := lower(result);
    result := regexp_replace(result, '[^a-z0-9]+', '-', 'g');
    result := trim(both '-' from result);
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT;

-- Trigger para animais
CREATE OR REPLACE FUNCTION public.handle_animal_slug() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := public.slugify(NEW.name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_animal_slug_auto
BEFORE INSERT OR UPDATE OF name ON public.animals
FOR EACH ROW EXECUTE FUNCTION public.handle_animal_slug();

-- Trigger para posts
CREATE OR REPLACE FUNCTION public.handle_post_slug() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := public.slugify(NEW.title);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_post_slug_auto
BEFORE INSERT OR UPDATE OF title ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.handle_post_slug();

-- Trigger para eventos
CREATE OR REPLACE FUNCTION public.handle_event_slug() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := public.slugify(NEW.name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_event_slug_auto
BEFORE INSERT OR UPDATE OF name ON public.events
FOR EACH ROW EXECUTE FUNCTION public.handle_event_slug();
