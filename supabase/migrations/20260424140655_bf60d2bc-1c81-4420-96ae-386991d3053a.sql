-- Prevent privilege escalation on INSERT
-- Ensures users cannot set their own role to 'admin' or approve themselves during signup.
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (
  auth.uid() = id AND 
  role = 'user' AND 
  is_approved = false
);
