
-- ============================================================
-- Security hardening migration
-- ============================================================

-- ---------- 1. bids: drop sensitive cols, restrict ----------
-- Move ip/session to admin-only audit table
CREATE TABLE IF NOT EXISTS public.bid_audit (
  bid_id      uuid PRIMARY KEY REFERENCES public.bids(id) ON DELETE CASCADE,
  ip_address  text,
  session_id  text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bid_audit TO authenticated;
GRANT ALL    ON public.bid_audit TO service_role;
ALTER TABLE public.bid_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read bid_audit"  ON public.bid_audit FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins write bid_audit" ON public.bid_audit FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- Move existing ip/session data into audit
INSERT INTO public.bid_audit (bid_id, ip_address, session_id)
SELECT id, ip_address, session_id FROM public.bids
WHERE (ip_address IS NOT NULL OR session_id IS NOT NULL)
ON CONFLICT (bid_id) DO NOTHING;

-- Drop sensitive columns from bids (publicly readable table)
ALTER TABLE public.bids DROP COLUMN IF EXISTS ip_address;
ALTER TABLE public.bids DROP COLUMN IF EXISTS session_id;

-- Tighten bids SELECT: only authenticated users can read bid history
DROP POLICY IF EXISTS "Bids are viewable by everyone." ON public.bids;
CREATE POLICY "Bids viewable by authenticated users" ON public.bids
  FOR SELECT TO authenticated USING (true);

-- Recreate place_bid_safe (4-arg) to write audit row instead of bid cols
CREATE OR REPLACE FUNCTION public.place_bid_safe(
  p_lot_id uuid, p_amount numeric, p_bid_type text DEFAULT 'online'::text, p_session_id text DEFAULT NULL::text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id UUID;
  v_user_profile RECORD;
  v_lot RECORD;
  v_recent_bids_count INTEGER;
  v_block_reason TEXT;
  v_ip_address TEXT;
  v_is_admin BOOLEAN := false;
  v_new_bid_id UUID;
  v_prev_bidder_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Sessão expirada ou não autenticada. Faça login novamente.');
  END IF;

  SELECT * INTO v_user_profile FROM public.profiles WHERE id = v_user_id;
  BEGIN v_is_admin := v_user_profile.role = 'admin'; EXCEPTION WHEN OTHERS THEN v_is_admin := false; END;

  IF v_user_profile.is_blocked AND NOT v_is_admin THEN
    IF v_user_profile.auto_unlock_at IS NOT NULL AND v_user_profile.auto_unlock_at <= now() THEN
      UPDATE public.profiles SET is_blocked = false, auto_unlock_at = NULL, block_reason = NULL, risk_level = 'low' WHERE id = v_user_id;
    ELSE
      v_block_reason := COALESCE(v_user_profile.block_reason, 'Sua conta possui restrições de segurança.');
      RETURN jsonb_build_object('success', false, 'message', v_block_reason);
    END IF;
  END IF;

  IF NOT v_user_profile.is_approved AND NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'message', 'Seu cadastro ainda está em análise.');
  END IF;

  SELECT * INTO v_lot FROM public.lots WHERE id = p_lot_id;
  IF v_lot IS NULL THEN RETURN jsonb_build_object('success', false, 'message', 'Lote não encontrado.'); END IF;
  IF v_lot.status NOT IN ('active','live','recebendo_lances','pre_lance') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Este lote não está aceitando lances no momento.');
  END IF;
  IF p_amount <= COALESCE(v_lot.current_price, v_lot.starting_price, 0) THEN
    RETURN jsonb_build_object('success', false, 'message', 'O valor do lance deve ser superior ao preço atual.');
  ELSIF NOT v_is_admin AND p_amount < (COALESCE(v_lot.current_price, v_lot.starting_price, 0) + COALESCE(v_lot.bid_increment, 0)) THEN
    RETURN jsonb_build_object('success', false, 'message', 'O lance deve respeitar o incremento mínimo.');
  END IF;

  BEGIN v_ip_address := current_setting('request.headers')::json->>'x-forwarded-for'; EXCEPTION WHEN OTHERS THEN v_ip_address := 'unknown'; END;

  IF NOT v_is_admin THEN
    SELECT count(*) INTO v_recent_bids_count FROM public.bids WHERE user_id = v_user_id AND created_at > (now() - interval '1 minute');
    IF v_recent_bids_count > 15 THEN
      UPDATE public.profiles SET is_blocked = true, risk_level = 'high', block_reason = 'Bloqueio automático por excesso de lances.', auto_unlock_at = now() + interval '30 minutes' WHERE id = v_user_id;
      RETURN jsonb_build_object('success', false, 'message', 'Atividade incomum detectada. Conta suspensa por 30 minutos.');
    END IF;
  END IF;

  SELECT user_id INTO v_prev_bidder_id FROM public.bids WHERE lot_id = p_lot_id ORDER BY amount DESC LIMIT 1;

  INSERT INTO public.bids (lot_id, user_id, amount, bid_type)
  VALUES (p_lot_id, v_user_id, p_amount, p_bid_type)
  RETURNING id INTO v_new_bid_id;

  -- audit row (admin-only)
  INSERT INTO public.bid_audit (bid_id, ip_address, session_id)
  VALUES (v_new_bid_id, v_ip_address, p_session_id);

  RETURN jsonb_build_object('success', true, 'message', 'Lance registrado com sucesso!', 'id', v_new_bid_id, 'previous_bidder_id', v_prev_bidder_id);
END;
$$;

-- Recreate place_bid_safe (3-arg) to not touch dropped cols
CREATE OR REPLACE FUNCTION public.place_bid_safe(
  p_lot_id uuid, p_amount numeric, p_bid_type text DEFAULT 'online'::text
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id UUID; v_is_blocked BOOLEAN; v_is_approved BOOLEAN; v_bid_count INT;
  v_lot_status TEXT; v_current_price DECIMAL;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN json_build_object('success', false, 'message', 'Não autenticado'); END IF;
  SELECT is_blocked, is_approved INTO v_is_blocked, v_is_approved FROM public.profiles WHERE id = v_user_id;
  IF v_is_blocked THEN RETURN json_build_object('success', false, 'message', 'Conta bloqueada.'); END IF;
  IF NOT v_is_approved THEN RETURN json_build_object('success', false, 'message', 'Conta aguardando aprovação.'); END IF;
  SELECT status, COALESCE(current_price, starting_price) INTO v_lot_status, v_current_price FROM public.lots WHERE id = p_lot_id;
  IF v_lot_status != 'active' THEN RETURN json_build_object('success', false, 'message', 'Lote não está aceitando lances.'); END IF;
  IF p_amount <= v_current_price THEN RETURN json_build_object('success', false, 'message', 'Lance deve ser maior que o preço atual.'); END IF;
  SELECT COUNT(*) INTO v_bid_count FROM public.bids WHERE user_id = v_user_id AND created_at > (now() - interval '1 minute');
  IF v_bid_count >= 10 THEN
    UPDATE public.profiles SET is_blocked = TRUE, block_reason = 'Bloqueio automático: frequência alta' WHERE id = v_user_id;
    RETURN json_build_object('success', false, 'message', 'Atividade suspeita. Conta bloqueada.');
  END IF;
  INSERT INTO public.bids (lot_id, user_id, amount, bid_type) VALUES (p_lot_id, v_user_id, p_amount, p_bid_type);
  RETURN json_build_object('success', true, 'message', 'Lance efetuado com sucesso!');
END;
$$;

-- fn_auto_link_lot_winner no longer touches dropped lots.last_bid_ip
CREATE OR REPLACE FUNCTION public.fn_auto_link_lot_winner()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE highest_bid RECORD;
BEGIN
  IF NEW.status = 'sold' AND NEW.winner_id IS NULL THEN
    SELECT user_id, amount, is_phone_bid INTO highest_bid
    FROM public.bids WHERE lot_id = NEW.id
    ORDER BY amount DESC, created_at ASC LIMIT 1;
    IF highest_bid.user_id IS NOT NULL THEN
      NEW.winner_id := highest_bid.user_id;
      NEW.current_price := highest_bid.amount;
      NEW.winner_link_reason := CASE WHEN highest_bid.is_phone_bid
        THEN 'Vínculo automático pelo maior lance (Telefone)'
        ELSE 'Vínculo automático pelo maior lance (Online)' END;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ---------- 2. lots: drop ip / user-agent columns ----------
ALTER TABLE public.lots DROP COLUMN IF EXISTS last_bid_ip;
ALTER TABLE public.lots DROP COLUMN IF EXISTS last_bid_user_agent;

-- ---------- 3. sellers: hide contact, public view ----------
DROP POLICY IF EXISTS "Sellers are viewable by everyone" ON public.sellers;
CREATE POLICY "Sellers viewable by authenticated"
  ON public.sellers FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE VIEW public.sellers_public
WITH (security_invoker = true) AS
SELECT id, name, type, location, slug, logo_url, created_at
FROM public.sellers;
GRANT SELECT ON public.sellers_public TO anon, authenticated;

-- ---------- 4. payment_gateways: restrict to authenticated ----------
DROP POLICY IF EXISTS "Users can view enabled gateways" ON public.payment_gateways;
CREATE POLICY "Authenticated can view enabled gateways"
  ON public.payment_gateways FOR SELECT TO authenticated
  USING (is_enabled = true);

-- ---------- 5. db_errors: only authenticated can insert ----------
DROP POLICY IF EXISTS "Anyone can insert db errors" ON public.db_errors;
CREATE POLICY "Authenticated can insert db errors"
  ON public.db_errors FOR INSERT TO authenticated WITH CHECK (true);

-- ---------- 6. event_requests: submitter can read own ----------
CREATE POLICY "Users see own event requests by email"
  ON public.event_requests FOR SELECT TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- ---------- 7. storage: public_assets hardening ----------
DROP POLICY IF EXISTS "Authenticated users can upload"  ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update"  ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete"  ON storage.objects;
DROP POLICY IF EXISTS "Public Access"                   ON storage.objects;
DROP POLICY IF EXISTS "Public Assets bucket public access" ON storage.objects;

-- Read: only files inside a non-empty folder (prevents bucket listing)
CREATE POLICY "Public assets read scoped"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'public_assets' AND (storage.foldername(name))[1] IS NOT NULL);

-- Write: admins only (existing "Admins full access to public_assets" remains)

-- ---------- 8. realtime.messages: require auth ----------
-- Channel-scoped authorization. Block anon; allow authenticated.
DROP POLICY IF EXISTS "Authenticated realtime read"  ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated realtime write" ON realtime.messages;
CREATE POLICY "Authenticated realtime read"
  ON realtime.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated realtime write"
  ON realtime.messages FOR INSERT TO authenticated WITH CHECK (true);

-- ---------- 9. Lock down SECURITY DEFINER functions ----------
-- Revoke EXECUTE from PUBLIC on every SECURITY DEFINER function in public schema
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
                   r.nspname, r.proname, r.args);
  END LOOP;
END $$;

-- Re-grant EXECUTE to authenticated only on RPCs that must be client-callable
GRANT EXECUTE ON FUNCTION public.place_bid(uuid, uuid, numeric)                 TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_bid_safe(uuid, numeric, text)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_bid_safe(uuid, numeric, text, text)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_lot(uuid)                                TO authenticated;
GRANT EXECUTE ON FUNCTION public.revert_sold_lot(uuid)                          TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_bid_safe(uuid)                          TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_lot_viewers(uuid)                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_viewer_count(text, uuid)             TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin()                                     TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_approved()                                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_risk(uuid)                          TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_db_error(text, text, text)                 TO authenticated;
