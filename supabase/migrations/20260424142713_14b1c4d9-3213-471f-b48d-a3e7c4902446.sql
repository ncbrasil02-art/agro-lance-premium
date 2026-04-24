-- Create a function to check if the current user is an admin without triggering recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop all existing profiles policies to avoid conflicts and ensure clean state
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new policies
CREATE POLICY "Profiles are viewable by owners or admins"
ON public.profiles
FOR SELECT
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id AND role = 'user' AND is_approved = false);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (
  (auth.uid() = id OR public.is_admin()) AND 
  (
    public.is_admin() OR 
    (
      -- Non-admins cannot change sensitive fields
      (role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = auth.uid())) AND
      (is_approved IS NOT DISTINCT FROM (SELECT is_approved FROM public.profiles WHERE id = auth.uid()))
    )
  )
);
