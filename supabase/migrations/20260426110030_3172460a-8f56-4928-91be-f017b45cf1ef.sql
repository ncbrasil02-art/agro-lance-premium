-- Função RPC para lances com inteligência de risco
CREATE OR REPLACE FUNCTION public.place_bid_safe(
  p_lot_id UUID,
  p_amount NUMERIC,
  p_bid_type TEXT,
  p_session_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    RETURN jsonb_build_object('success', false, 'message', 'Usuário não autenticado.');
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
      RETURN jsonb_build_object(
        'success', false, 
        'message', COALESCE(v_user_profile.block_reason, 'Sua conta está bloqueada.')
      );
    END IF;
  END IF;

  -- Verificar se o usuário está aprovado
  IF NOT v_user_profile.is_approved THEN
    RETURN jsonb_build_object('success', false, 'message', 'Sua conta ainda não foi aprovada para dar lances.');
  END IF;

  -- Obter informações do lote
  SELECT * INTO v_lot FROM public.lots WHERE id = p_lot_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Lote não encontrado.');
  END IF;

  -- Validar valor do lance
  IF p_amount <= COALESCE(v_lot.current_price, v_lot.starting_price, 0) THEN
    RETURN jsonb_build_object('success', false, 'message', 'O lance deve ser maior que o preço atual.');
  END IF;

  -- ESCALA DE RISCO INTELIGENTE
  -- Contar lances do usuário nos últimos 60 segundos (em qualquer lote)
  SELECT count(*) INTO v_recent_bids_count 
  FROM public.bids 
  WHERE user_id = v_user_id AND created_at > (now() - interval '1 minute');

  -- Determinar nível de risco e bloqueio automático
  IF v_recent_bids_count >= 10 THEN
    v_risk_level := 'high';
    v_block_reason := 'Bloqueio automático: Excesso de lances detectado (Risco Alto).';
    -- Bloqueio permanente (requer admin para desbloquear)
  ELSIF v_recent_bids_count >= 5 THEN
    v_risk_level := 'medium';
    v_block_reason := 'Bloqueio temporário: Comportamento de lance atípico. Tente novamente em 15 minutos.';
    v_auto_unlock_at := now() + interval '15 minutes';
  END IF;

  -- Atualizar perfil com o novo nível de risco e bloqueio se necessário
  IF v_risk_level != 'low' THEN
    UPDATE public.profiles 
    SET risk_level = v_risk_level,
        is_blocked = (v_risk_level IN ('medium', 'high')),
        block_reason = v_block_reason,
        auto_unlock_at = v_auto_unlock_at
    WHERE id = v_user_id;
    
    -- Se foi bloqueado, interromper o lance
    IF v_risk_level IN ('medium', 'high') THEN
      RETURN jsonb_build_object('success', false, 'message', v_block_reason);
    END IF;
  END IF;

  -- Obter IP do lance (simulado via header ou passado se possível, Supabase edge functions injetam isso normalmente)
  -- Como RPC não tem acesso direto a headers de forma confiável sem configuração extra, 
  -- o ideal é que o client passe ou usemos o que o PostgREST fornece se disponível.
  v_ip_address := current_setting('request.headers', true)::jsonb->>'x-forwarded-for';

  -- Registrar o lance
  INSERT INTO public.bids (
    lot_id, 
    user_id, 
    amount, 
    bid_type, 
    ip_address, 
    session_id,
    created_at
  ) VALUES (
    p_lot_id,
    v_user_id,
    p_amount,
    p_bid_type,
    v_ip_address,
    p_session_id,
    now()
  );

  -- Atualizar o preço atual do lote
  UPDATE public.lots 
  SET current_price = p_amount,
      updated_at = now()
  WHERE id = p_lot_id;

  RETURN jsonb_build_object('success', true, 'message', 'Lance efetuado com sucesso!');
END;
$$;