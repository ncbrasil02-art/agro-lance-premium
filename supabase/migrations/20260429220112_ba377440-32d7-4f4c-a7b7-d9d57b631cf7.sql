-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB := NULL;
    v_new_data JSONB := NULL;
    v_user_id UUID;
    v_action TEXT;
BEGIN
    -- Get current user from Supabase auth
    v_user_id := auth.uid();
    v_action := TG_OP;

    IF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
    ELSIF (TG_OP = 'INSERT') THEN
        v_new_data := to_jsonb(NEW);
    ELSIF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
    END IF;

    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data,
        ip_address
    ) VALUES (
        v_user_id,
        v_action,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        v_old_data,
        v_new_data,
        inet_client_addr()::text
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers to critical tables
DROP TRIGGER IF EXISTS audit_lots_trigger ON public.lots;
CREATE TRIGGER audit_lots_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.lots
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_events_trigger ON public.events;
CREATE TRIGGER audit_events_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_animals_trigger ON public.animals;
CREATE TRIGGER audit_animals_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.animals
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_sellers_trigger ON public.sellers;
CREATE TRIGGER audit_sellers_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.sellers
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
