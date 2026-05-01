-- Revogar execução pública de funções críticas
REVOKE EXECUTE ON FUNCTION public.place_bid(uuid, uuid, numeric) FROM public;
GRANT EXECUTE ON FUNCTION public.place_bid(uuid, uuid, numeric) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.revert_sold_lot(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.revert_sold_lot(uuid) TO authenticated;

-- Garantir que o log de erros funcione
GRANT INSERT ON TABLE public.db_errors TO anon, authenticated;

-- Ajuste nas seções da home (garantindo que stats e outros dados tenham fallbacks)
-- Isso será feito no código TSX, mas aqui garantimos que as tabelas tenham RLS correto.
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON public.site_settings;
CREATE POLICY "Settings are viewable by everyone" ON public.site_settings FOR SELECT USING (true);
