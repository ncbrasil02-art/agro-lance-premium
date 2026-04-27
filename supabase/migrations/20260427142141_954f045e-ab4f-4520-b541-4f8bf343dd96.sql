-- Adicionar incremento padrão aos animais
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS default_bid_increment NUMERIC DEFAULT 1000;

-- Garantir que a tabela lots tenha bid_increment (já tem, mas por segurança)
-- ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS bid_increment NUMERIC DEFAULT 1000;

-- Adicionar índice para performance no winner_id
CREATE INDEX IF NOT EXISTS idx_lots_winner_id ON public.lots(winner_id);

-- Verificar e ajustar permissões de leitura no painel (RLS já deve estar habilitado)
-- Mas vamos garantir que a query de lots won seja permitida
DROP POLICY IF EXISTS "Users can view their own won lots" ON public.lots;
CREATE POLICY "Users can view their own won lots" 
ON public.lots 
FOR SELECT 
USING (auth.uid() = winner_id OR auth.uid() IN (SELECT user_id FROM public.bids WHERE lot_id = id));
