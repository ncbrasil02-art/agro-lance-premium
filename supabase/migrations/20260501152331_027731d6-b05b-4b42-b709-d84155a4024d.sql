-- Revoke public execution on sensitive functions with correct signatures
REVOKE EXECUTE ON FUNCTION public.place_bid(UUID, UUID, NUMERIC) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.place_bid_safe(UUID, NUMERIC, TEXT, TEXT) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.close_lot(UUID) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.check_user_risk(UUID) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.revert_sold_lot(UUID) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.handle_confirmed_direct_sale() FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon;

-- Grant execute to authenticated users where needed
GRANT EXECUTE ON FUNCTION public.place_bid(UUID, UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_bid_safe(UUID, NUMERIC, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_approved() TO authenticated;

-- Add webhook_secret to payment_gateways
ALTER TABLE public.payment_gateways ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

-- Tighten storage policies
DROP POLICY IF EXISTS "Animals bucket public access" ON storage.objects;
CREATE POLICY "Animals bucket public access" ON storage.objects 
FOR SELECT USING (bucket_id = 'animals' AND (storage.foldername(name))[1] IS NOT NULL);

DROP POLICY IF EXISTS "Banners bucket public access" ON storage.objects;
CREATE POLICY "Banners bucket public access" ON storage.objects 
FOR SELECT USING (bucket_id = 'banners' AND (storage.foldername(name))[1] IS NOT NULL);

DROP POLICY IF EXISTS "Avatars bucket public access" ON storage.objects;
CREATE POLICY "Avatars bucket public access" ON storage.objects 
FOR SELECT USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] IS NOT NULL);
