CREATE OR REPLACE FUNCTION public.place_bid_safe(p_lot_id uuid, p_amount numeric, p_bid_type text DEFAULT 'online'::text, p_session_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_user_profile RECORD;
  v_lot RECORD;
  v_recent_bids_count INTEGER;
  v_risk_level TEXT := 'low';
  v_block_reason TEXT;
  v_ip_address TEXT;
  v_auto_unlock_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Obter o ID do usuário atual
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Sessão expirada ou não autenticada. Por favor, faça login novamente para continuar.');
  END IF;

  -- Obter o perfil do usuário e verificar bloqueio
  SELECT * INTO v_user_profile FROM public.profiles WHERE id = v_user_id;
  
  -- Verificar se o usuário já está bloqueado
  IF v_user_profile.is_blocked THEN
    -- Verificar se o bloqueio temporizado já expirou
    IF v_user_profile.auto_unlock_at IS NOT NULL AND v_user_profile.auto_unlock_at <= now() THEN
      UPDATE public.profiles 
      SET is_blocked = false, 
          auto_unlock_at = NULL, 
          block_reason = NULL,
          risk_level = 'low'
      WHERE id = v_user_id;
      v_user_profile.is_blocked := false;
    ELSE
      v_block_reason := COALESCE(v_user_profile.block_reason, 'Sua conta possui restrições de segurança.');
      IF v_user_profile.auto_unlock_at IS NOT NULL THEN
        v_block_reason := v_block_reason || ' Desbloqueio automático em ' || to_char(v_user_profile.auto_unlock_at AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI') || '.';
      END IF;
      RETURN jsonb_build_object(
        'success', false, 
        'message', v_block_reason || ' Entre em contato com o suporte se precisar de ajuda.'
      );
    END IF;
  END IF;

  -- Verificar se o usuário está aprovado
  IF NOT v_user_profile.is_approved THEN
    RETURN jsonb_build_object('success', false, 'message', 'Seu cadastro está em fase de análise pela nossa equipe. Você será notificado assim que for aprovado para dar lances.');
  END IF;

  -- Obter informações do lote
  SELECT * INTO v_lot FROM public.lots WHERE id = p_lot_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'O lote selecionado não foi encontrado ou foi removido.');
  END IF;

  -- Verificar status do lote
  IF v_lot.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Este lote não está aberto para lances no momento. Verifique o cronograma do leilão.');
  END IF;

  -- Validar valor do lance
  IF p_amount <= COALESCE(v_lot.current_price, v_lot.starting_price, 0) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ops! Alguém acabou de dar um lance maior ou igual ao seu. O valor atual é ' || to_char(COALESCE(v_lot.current_price, v_lot.starting_price, 0), 'L999G999G990D99') || '. Tente um valor superior.');
  END IF;

  -- Verificar incremento mínimo
  IF (p_amount - COALESCE(v_lot.current_price, v_lot.starting_price, 0)) < v_lot.bid_increment THEN
    RETURN jsonb_build_object('success', false, 'message', 'O valor do lance deve respeitar o incremento mínimo de ' || to_char(v_lot.bid_increment, 'L999G999G990D99') || '.');
  END IF;

  -- ESCALA DE RISCO INTELIGENTE
  SELECT count(*) INTO v_recent_bids_count 
  FROM public.bids 
  WHERE user_id = v_user_id AND created_at > (now() - interval '1 minute');

  IF v_recent_bids_count >= 10 THEN
    v_auto_unlock_at := now() + interval '15 minutes';
    UPDATE public.profiles 
    SET is_blocked = true, 
        risk_level = 'high',
        block_reason = 'Bloqueio preventivo por excesso de tentativas (frequência muito alta).',
        auto_unlock_at = v_auto_unlock_at
    WHERE id = v_user_id;
    
    RETURN jsonb_build_object('success', false, 'message', 'Detectamos uma frequência de lances muito alta. Por segurança, sua conta foi suspensa por 15 minutos.');
  END IF;

  -- Inserir o lance
  INSERT INTO public.bids (lot_id, user_id, amount, bid_type)
  VALUES (p_lot_id, v_user_id, p_amount, p_bid_type);

  -- Atualizar o preço do lote e o contador de lances
  UPDATE public.lots 
  SET current_price = p_amount,
      bids_count = COALESCE(bids_count, 0) + 1,
      updated_at = now()
  WHERE id = p_lot_id;

  -- Registrar log de auditoria
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, new_data, ip_address)
  VALUES (v_user_id, 'PLACE_BID', 'bid', p_lot_id, jsonb_build_object('amount', p_amount, 'session_id', p_session_id), p_session_id);

  RETURN jsonb_build_object('success', true, 'message', 'Excelente! Seu lance de ' || to_char(p_amount, 'L999G999G990D99') || ' foi registrado com sucesso.');
END;
$function$;
