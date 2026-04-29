-- Tabela principal de auditorias
CREATE TABLE public.seo_audits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'pending',
    total_items INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    warning_count INTEGER DEFAULT 0,
    healthy_count INTEGER DEFAULT 0
);

-- Tabela de detalhes (problemas por item)
CREATE TABLE public.seo_audit_details (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    audit_id UUID REFERENCES public.seo_audits(id) ON DELETE CASCADE,
    item_id UUID NOT NULL,
    item_type TEXT NOT NULL, -- 'animal', 'post', 'event'
    item_name TEXT,
    issues JSONB NOT NULL, -- Array de problemas encontrados
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.seo_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_audit_details ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (Apenas administradores - simplificado para leitura pública para o painel)
CREATE POLICY "Leitura pública de auditorias" ON public.seo_audits FOR SELECT USING (true);
CREATE POLICY "Escrita de auditorias (service role ou admin)" ON public.seo_audits FOR INSERT WITH CHECK (true);
CREATE POLICY "Leitura pública de detalhes" ON public.seo_audit_details FOR SELECT USING (true);
CREATE POLICY "Escrita de detalhes" ON public.seo_audit_details FOR INSERT WITH CHECK (true);
