-- 11. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('animals', 'animals', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- 12. STORAGE POLICIES

-- Banners: Public Read, Admin Write
CREATE POLICY "Banners are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

CREATE POLICY "Admins can upload banners"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'banners' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can update banners"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'banners' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Animals: Public Read, Admin Write
CREATE POLICY "Animal media are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'animals');

CREATE POLICY "Admins can upload animal media"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'animals' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Documents: Authenticated Read, Admin Write
CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'documents' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Admins can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'documents' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);
