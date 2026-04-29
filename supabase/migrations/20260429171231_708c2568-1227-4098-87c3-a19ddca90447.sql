-- Adicionar colunas de progresso na tabela de auditoria
ALTER TABLE public.seo_audits 
ADD COLUMN processed_items INTEGER DEFAULT 0,
ADD COLUMN progress_message TEXT;

-- Garantir que o status possa ser 'processing'
COMMENT ON COLUMN public.seo_audits.status IS 'Status da auditoria: pending, running, processing, completed, failed';
