-- Adiciona mensagens de status para o leiloeiro e flag de interatividade
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS live_status_message TEXT,
ADD COLUMN IF NOT EXISTS is_live_interactive BOOLEAN DEFAULT false;

-- Adiciona flag de lote ativo no ao vivo e cronômetro rápido
ALTER TABLE public.lots
ADD COLUMN IF NOT EXISTS is_currently_live BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS live_timer_seconds INTEGER DEFAULT 60;

-- Adiciona campos para lances de telefone
ALTER TABLE public.bids
ADD COLUMN IF NOT EXISTS is_phone_bid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_bidder_identifier TEXT;

-- Atualiza permissões de RLS para os novos campos (geralmente cobertas por políticas existentes, mas garantindo acesso de leitura para todos)
-- Nota: Políticas de atualização devem ser restritas a admin.