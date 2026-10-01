DROP POLICY IF EXISTS posts_read ON public.posts;
CREATE POLICY posts_public_read
ON public.posts
FOR SELECT
TO anon, authenticated
USING (status = 'published');