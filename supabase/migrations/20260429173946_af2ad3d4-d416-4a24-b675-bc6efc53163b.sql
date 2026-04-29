-- Remover políticas existentes muito permissivas
DROP POLICY IF EXISTS "Leitura pública de auditorias" ON public.seo_audits;
DROP POLICY IF EXISTS "Escrita de auditorias (service role ou admin)" ON public.seo_audits;
DROP POLICY IF EXISTS "Leitura pública de detalhes" ON public.seo_audit_details;
DROP POLICY IF EXISTS "Escrita de detalhes" ON public.seo_audit_details;

-- Habilitar RLS (caso não esteja)
ALTER TABLE public.seo_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_audit_details ENABLE ROW LEVEL SECURITY;

-- Novas políticas para seo_audits
CREATE POLICY "Admins can do everything on seo_audits" 
ON public.seo_audits
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Novas políticas para seo_audit_details
CREATE POLICY "Admins can do everything on seo_audit_details" 
ON public.seo_audit_details
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
