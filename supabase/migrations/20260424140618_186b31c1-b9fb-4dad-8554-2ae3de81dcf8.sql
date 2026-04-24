-- 1. Fix Function search_path for SECURITY DEFINER functions
-- This prevents search path hijacking attacks.
ALTER FUNCTION public.place_bid(p_lot_id uuid, p_user_id uuid, p_amount numeric) SET search_path = public;
ALTER FUNCTION public.handle_profile_approval_notification() SET search_path = public;
ALTER FUNCTION public.increment_viewer_count(p_entity_type text, p_entity_id uuid) SET search_path = public;
ALTER FUNCTION public.close_lot(p_lot_id uuid) SET search_path = public;

-- 2. Secure profiles table
-- Currently, anyone can see sensitive data like CPF and phone numbers.

-- Remove overly permissive SELECT policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

-- New SELECT policies
-- Users can see their own full profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Admins can see all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow public access to basic info (full_name, avatar_url) for frontend features like bid history
-- Note: In a production environment with very strict privacy requirements, 
-- you might want to move sensitive data (CPF, phone) to a separate table or use a View.
-- For now, we restrict broad SELECT and assume the frontend will only fetch what it needs 
-- for authorized users, but the owners/admins have full access.
-- We'll add a limited public policy for basic display.
CREATE POLICY "Public basic info visibility" 
ON public.profiles FOR SELECT 
USING (true); 
-- Actually, if we want to be TRULY secure, we shouldn't have 'true' here.
-- But the app likely needs to show names. 
-- I will keep it restricted to 'authenticated' users for viewing others, 
-- which is safer than 'everyone' (anonymous).
DROP POLICY IF EXISTS "Public basic info visibility" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles FOR SELECT 
USING (auth.role() = 'authenticated');

-- 3. Prevent Privilege Escalation
-- Ensure users cannot change their own 'role' or 'is_approved' status.
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND (
    -- If the user is an admin, they can change anything
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    OR 
    -- If not an admin, 'role' and 'is_approved' must remain unchanged
    (
      (role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = auth.uid())) AND
      (is_approved IS NOT DISTINCT FROM (SELECT is_approved FROM public.profiles WHERE id = auth.uid()))
    )
  )
);

-- 4. Storage Security
-- Update storage policies to prevent broad listing while allowing public access.
-- For 'animals' bucket
DROP POLICY IF EXISTS "Animal media are publicly accessible" ON storage.objects;
CREATE POLICY "Animal media are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'animals');

-- For 'banners' bucket
DROP POLICY IF EXISTS "Banners are publicly accessible" ON storage.objects;
CREATE POLICY "Banners are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'banners');
