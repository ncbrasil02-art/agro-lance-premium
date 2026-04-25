-- Fix impersonation in bids
DROP POLICY IF EXISTS "Approved users can place bids." ON public.bids;
CREATE POLICY "Approved users can place bids." 
ON public.bids 
FOR INSERT 
WITH CHECK (
  is_approved() AND 
  (auth.uid() = user_id)
);

-- Fix broad access to documents
DROP POLICY IF EXISTS "Documents are viewable by authenticated users." ON public.documents;
CREATE POLICY "Documents are viewable by owners or admins" 
ON public.documents 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  is_admin()
);

-- Ensure users can only insert their own documents
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
CREATE POLICY "Users can insert their own documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id)
);

-- Ensure users can only update their own documents
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
CREATE POLICY "Users can update their own documents" 
ON public.documents 
FOR UPDATE 
USING (
  (auth.uid() = user_id) OR 
  is_admin()
);
