-- Add approval audit columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Ensure audit_logs is properly set up if it's missing something or to reinforce RLS
-- (The table already exists based on earlier query)

-- Allow admins to insert into audit_logs (if they can't already)
CREATE POLICY "Admins can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (is_admin());

-- Update profiles RLS to allow admins to update the new columns
-- Assuming there's already a policy for admins to update profiles. Let's check.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Admins can update all profiles'
    ) THEN
        CREATE POLICY "Admins can update all profiles" 
        ON public.profiles 
        FOR UPDATE 
        USING (is_admin());
    END IF;
END $$;
