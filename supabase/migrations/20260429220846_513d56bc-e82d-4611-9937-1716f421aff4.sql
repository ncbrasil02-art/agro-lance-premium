ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS animal_id UUID REFERENCES public.animals(id);

-- Enable RLS on offers if not already
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own offers
DROP POLICY IF EXISTS "Users can view their own offers" ON public.offers;
CREATE POLICY "Users can view their own offers" 
ON public.offers FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to insert their own offers
DROP POLICY IF EXISTS "Users can insert their own offers" ON public.offers;
CREATE POLICY "Users can insert their own offers" 
ON public.offers FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow admins to view all offers
DROP POLICY IF EXISTS "Admins can view all offers" ON public.offers;
CREATE POLICY "Admins can view all offers" 
ON public.offers FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
