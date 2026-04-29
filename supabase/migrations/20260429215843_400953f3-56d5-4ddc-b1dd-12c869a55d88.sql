-- Fix the lots policy logic
DROP POLICY IF EXISTS "Users can view their own won lots" ON public.lots;
CREATE POLICY "Users can view their own won lots" 
ON public.lots 
FOR SELECT 
USING (
  (auth.uid() = winner_id) OR 
  (auth.uid() IN (
    SELECT bids.user_id 
    FROM bids 
    WHERE bids.lot_id = public.lots.id
  ))
);

-- Tighten event_requests policy (at least require authentication)
DROP POLICY IF EXISTS "Anyone can create event requests" ON public.event_requests;
CREATE POLICY "Authenticated users can create event requests" 
ON public.event_requests 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Tighten direct_sales policy
DROP POLICY IF EXISTS "Anyone can create a direct sale" ON public.direct_sales;
CREATE POLICY "Authenticated users can create a direct sale" 
ON public.direct_sales 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');
