CREATE OR REPLACE FUNCTION public.delete_bid_safe(p_bid_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_bid RECORD;
  v_lot_id UUID;
  v_new_price DECIMAL;
  v_new_count INTEGER;
BEGIN
  -- Get current user and check if admin
  v_user_id := auth.uid();
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND role = 'admin') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Acesso negado. Apenas administradores podem excluir lances.');
  END IF;

  -- Get bid details
  SELECT * INTO v_bid FROM public.bids WHERE id = p_bid_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Lance não encontrado.');
  END IF;

  v_lot_id := v_bid.lot_id;

  -- Delete the bid
  DELETE FROM public.bids WHERE id = p_bid_id;

  -- Recalculate lot values
  SELECT MAX(amount), COUNT(*) INTO v_new_price, v_new_count 
  FROM public.bids 
  WHERE lot_id = v_lot_id;

  -- Update lot
  UPDATE public.lots 
  SET current_price = COALESCE(v_new_price, starting_price),
      bids_count = v_new_count,
      updated_at = now()
  WHERE id = v_lot_id;

  -- Audit log
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, new_data)
  VALUES (v_user_id, 'DELETE_BID', 'bid', v_lot_id, jsonb_build_object('deleted_bid_id', p_bid_id, 'deleted_amount', v_bid.amount, 'bid_user_id', v_bid.user_id));

  RETURN jsonb_build_object('success', true, 'message', 'Lance excluído e valores do lote atualizados com sucesso.');
END;
$function$;
