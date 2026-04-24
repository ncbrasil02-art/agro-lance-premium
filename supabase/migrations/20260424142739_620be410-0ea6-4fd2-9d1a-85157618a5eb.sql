-- Create a function to check if the current user is approved without triggering recursion
CREATE OR REPLACE FUNCTION public.is_approved()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_approved = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update animals policies
DROP POLICY IF EXISTS "Only admins can modify animals." ON public.animals;
CREATE POLICY "Only admins can modify animals."
ON public.animals FOR ALL
USING (public.is_admin());

-- Update bids policies
DROP POLICY IF EXISTS "Approved users can place bids." ON public.bids;
CREATE POLICY "Approved users can place bids."
ON public.bids FOR INSERT
WITH CHECK (public.is_approved());

-- Update lots policies
DROP POLICY IF EXISTS "Only admins can modify lots." ON public.lots;
CREATE POLICY "Only admins can modify lots."
ON public.lots FOR ALL
USING (public.is_admin());

-- Update posts policies
DROP POLICY IF EXISTS "Only admins can modify posts." ON public.posts;
CREATE POLICY "Only admins can modify posts."
ON public.posts FOR ALL
USING (public.is_admin());

-- Update documents policies
DROP POLICY IF EXISTS "Admins can manage documents." ON public.documents;
CREATE POLICY "Admins can manage documents."
ON public.documents FOR ALL
USING (public.is_admin());

-- Update audit_logs policies
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Only admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (public.is_admin());

-- Update banners policies
DROP POLICY IF EXISTS "Only admins can manage banners" ON public.banners;
CREATE POLICY "Only admins can manage banners"
ON public.banners FOR ALL
USING (public.is_admin());

-- Update site_settings policies
DROP POLICY IF EXISTS "Only admins can manage settings" ON public.site_settings;
CREATE POLICY "Only admins can manage settings"
ON public.site_settings FOR ALL
USING (public.is_admin());

-- Update events policies
DROP POLICY IF EXISTS "Only admins can modify events." ON public.events;
CREATE POLICY "Only admins can modify events."
ON public.events FOR ALL
USING (public.is_admin());

-- Update transactions policies
DROP POLICY IF EXISTS "Admins can manage all transactions." ON public.transactions;
CREATE POLICY "Admins can manage all transactions."
ON public.transactions FOR ALL
USING (public.is_admin());

-- Update contracts policies
DROP POLICY IF EXISTS "Admins can manage all contracts." ON public.contracts;
CREATE POLICY "Admins can manage all contracts."
ON public.contracts FOR ALL
USING (public.is_admin());
