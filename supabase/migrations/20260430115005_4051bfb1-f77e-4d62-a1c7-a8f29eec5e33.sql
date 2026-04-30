-- Função para lidar com a notificação de lance superado (Outbid)
CREATE OR REPLACE FUNCTION public.handle_outbid_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_prev_bidder_id UUID;
    v_lot_number TEXT;
    v_animal_name TEXT;
BEGIN
    -- Encontrar o licitante anterior com o maior lance para este lote (antes do lance atual)
    SELECT user_id INTO v_prev_bidder_id
    FROM public.bids
    WHERE lot_id = NEW.lot_id
      AND id != NEW.id
      AND amount < NEW.amount
    ORDER BY amount DESC
    LIMIT 1;

    -- Se houver um licitante anterior e não for o mesmo que deu o novo lance
    IF v_prev_bidder_id IS NOT NULL AND v_prev_bidder_id != NEW.user_id THEN
        -- Obter informações do lote para a mensagem
        SELECT l.lot_number, a.name INTO v_lot_number, v_animal_name
        FROM public.lots l
        LEFT JOIN public.animals a ON l.animal_id = a.id
        WHERE l.id = NEW.lot_id;

        -- Inserir a notificação no painel do usuário
        INSERT INTO public.notifications (user_id, title, message, link)
        VALUES (
            v_prev_bidder_id,
            'Seu lance foi superado! 📢',
            'O seu lance no lote #' || COALESCE(v_lot_number, '') || ' (' || COALESCE(v_animal_name, 'Animal') || ') foi superado por ' || format_type(NEW.amount::numeric, NULL) || '. Deseja ofertar um lance superior?',
            '/lotes/' || NEW.lot_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o gatilho na tabela de lances
DROP TRIGGER IF EXISTS on_bid_outbid_notification ON public.bids;
CREATE TRIGGER on_bid_outbid_notification
AFTER INSERT ON public.bids
FOR EACH ROW
EXECUTE FUNCTION public.handle_outbid_notification();

-- Atualizar a função place_bid_safe para retornar o ID do licitante anterior
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
  v_is_admin BOOLEAN := false;
  v_new_bid_id UUID;
  v_prev_bidder_id UUID;
BEGIN
  -- Obter o ID do usuário atual
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Sessão expirada ou não autenticada. Por favor, faça login novamente para continuar.');
  END IF;

  -- Obter o perfil do usuário e verificar bloqueio
  SELECT * INTO v_user_profile FROM public.profiles WHERE id = v_user_id;
  
  -- Verificar se é administrador
  BEGIN
    v_is_admin := v_user_profile.role = 'admin';
  EXCEPTION WHEN OTHERS THEN
    v_is_admin := false;
  END;

  -- Verificar se o usuário já está bloqueado
  IF v_user_profile.is_blocked AND NOT v_is_admin THEN
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

  -- Verificar se o usuário está aprovado (Admins ignoram isso)
  IF NOT v_user_profile.is_approved AND NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'message', 'Seu cadastro ainda está em análise. Para agilizar a aprovação, entre em contato via WhatsApp.');
  END IF;

  -- Obter dados do lote e verificar status
  SELECT * INTO v_lot FROM public.lots WHERE id = p_lot_id;
  IF v_lot IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Lote não encontrado.');
  END IF;

  IF v_lot.status NOT IN ('active', 'live', 'recebendo_lances', 'pre_lance') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Este lote não está aceitando lances no momento.');
  END IF;

  -- Validar valor do lance
  IF p_amount <= COALESCE(v_lot.current_price, v_lot.starting_price, 0) THEN
    RETURN jsonb_build_object('success', false, 'message', 'O valor do lance deve ser superior ao preço atual (' || COALESCE(v_lot.current_price, v_lot.starting_price, 0)::text || ').');
  -- Regra de incremento mínimo (apenas para lances online e não administradores)
  ELSIF NOT v_is_admin AND p_amount < (COALESCE(v_lot.current_price, v_lot.starting_price, 0) + COALESCE(v_lot.bid_increment, 0)) THEN
     RETURN jsonb_build_object('success', false, 'message', 'O lance deve respeitar o incremento mínimo de ' || COALESCE(v_lot.bid_increment, 0)::text);
  END IF;

  -- Detecção de IP (simples)
  BEGIN
    v_ip_address := current_setting('request.headers')::json->>'x-forwarded-for';
  EXCEPTION WHEN OTHERS THEN
    v_ip_address := 'unknown';
  END;

  -- Verificação de frequência (Anti-Flood) - Ignorada para administradores
  IF NOT v_is_admin THEN
    SELECT count(*) INTO v_recent_bids_count 
    FROM public.bids 
    WHERE user_id = v_user_id AND created_at > (now() - interval '1 minute');

    IF v_recent_bids_count > 15 THEN
      UPDATE public.profiles 
      SET is_blocked = true, 
          risk_level = 'high',
          block_reason = 'Bloqueio automático por excesso de lances (possível robô).',
          auto_unlock_at = now() + interval '30 minutes'
      WHERE id = v_user_id;
      
      RETURN jsonb_build_object('success', false, 'message', 'Atividade incomum detectada. Sua conta foi suspensa temporariamente por 30 minutos para análise de segurança.');
    END IF;
  END IF;

  -- Encontrar o licitante anterior com o maior lance para este lote
  SELECT user_id INTO v_prev_bidder_id
  FROM public.bids
  WHERE lot_id = p_lot_id
  ORDER BY amount DESC
  LIMIT 1;

  -- Inserir o lance
  INSERT INTO public.bids (
    lot_id, 
    user_id, 
    amount, 
    bid_type, 
    ip_address,
    session_id
  ) VALUES (
    p_lot_id, 
    v_user_id, 
    p_amount, 
    p_bid_type, 
    v_ip_address,
    p_session_id
  ) RETURNING id INTO v_new_bid_id;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Lance registrado com sucesso!',
    'id', v_new_bid_id,
    'previous_bidder_id', v_prev_bidder_id
  );
END;
$function$;
