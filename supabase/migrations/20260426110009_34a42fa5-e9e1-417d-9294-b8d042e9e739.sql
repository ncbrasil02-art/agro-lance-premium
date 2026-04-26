-- Adiciona colunas para desbloqueio temporizado e escala de risco
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS auto_unlock_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'low';

-- Adiciona session_id nos lances para rastreamento de proteção por sessão
ALTER TABLE public.bids 
ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.profiles.auto_unlock_at IS 'Data/hora para desbloqueio automático do usuário após um período de bloqueio por risco.';
COMMENT ON COLUMN public.profiles.risk_level IS 'Nível de risco calculado (low, medium, high).';
COMMENT ON COLUMN public.bids.session_id IS 'Identificador da sessão do usuário no momento do lance para proteção contra bots e acessos múltiplos.';

-- Trigger para limpar o status de bloqueio quando o tempo expirar (opcional, pode ser feito via edge function ou cron)
-- Por enquanto, faremos a verificação no carregamento do usuário e via cron jobs se necessário.