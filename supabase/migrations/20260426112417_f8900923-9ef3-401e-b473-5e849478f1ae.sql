-- Add DELETE policy for bids for admins
CREATE POLICY "Only admins can delete bids" ON public.bids
FOR DELETE TO authenticated
USING (is_admin());

-- Add UPDATE policy for bids for admins (just in case)
CREATE POLICY "Only admins can update bids" ON public.bids
FOR UPDATE TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Ensure audit_logs are viewable only by admins (already exists, but reinforcing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'audit_logs' AND policyname = 'Only admins can view audit logs'
    ) THEN
        CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
        FOR SELECT TO authenticated
        USING (is_admin());
    END IF;
END $$;
