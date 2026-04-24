-- Remove the broad policy that allowed any logged-in user to see all profiles (including CPFs)
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Now only owners and admins can see profile rows.
-- Note: If you need to show names in the bid history, consider creating a database VIEW 
-- that only selects non-sensitive columns (id, full_name, avatar_url).
