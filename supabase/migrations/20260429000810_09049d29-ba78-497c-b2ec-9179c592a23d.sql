-- Safely apply hardening to SECURITY DEFINER functions
DO $$ 
DECLARE 
    func_record RECORD;
BEGIN
    FOR func_record IN (
        SELECT 
            n.nspname as schema_name,
            p.proname as func_name,
            pg_get_function_identity_arguments(p.oid) as func_args
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.prosecdef = true
    ) 
    LOOP
        -- 1. Set search_path to public
        EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public', 
            func_record.schema_name, func_record.func_name, func_record.func_args);
            
        -- 2. Revoke execute from PUBLIC
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC', 
            func_record.schema_name, func_record.func_name, func_record.func_args);
            
        -- 3. Grant execute to authenticated and service_role (base permission)
        EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated, service_role', 
            func_record.schema_name, func_record.func_name, func_record.func_args);
    END LOOP;
END $$;
