-- Habilitar extensão para acentos
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Ajustar funções com search_path seguro
CREATE OR REPLACE FUNCTION public.slugify(text) RETURNS text AS $$
DECLARE
    result text;
BEGIN
    result := public.unaccent($1);
    result := lower(result);
    result := regexp_replace(result, '[^a-z0-9]+', '-', 'g');
    result := trim(both '-' from result);
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_animal_slug() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := public.slugify(NEW.name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_post_slug() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := public.slugify(NEW.title);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_event_slug() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := public.slugify(NEW.name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
