CREATE OR REPLACE FUNCTION public.handle_installment_payment_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify user when installment is marked as paid
  IF (TG_OP = 'UPDATE') THEN
    IF (NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid')) THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        NEW.buyer_id,
        'Confirmação de Quitação',
        'Prezado(a), informamos que o pagamento da parcela nº ' || NEW.installment_number || ' foi processado e baixado em nosso sistema. Obrigado!',
        'info',
        '/painel'
      );
    END IF;
  END IF;
  
  -- Notify admins when a proof is uploaded (Security Priority)
  IF (NEW.proof_url IS NOT NULL) THEN
    IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.proof_url IS NULL OR NEW.proof_url != OLD.proof_url))) THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      SELECT id, 'Alerta: Novo Comprovante de Pagamento', 'O comprador enviou um comprovante para a parcela ' || NEW.installment_number || '. Realize a conferência de segurança.', 'security', '/admin?tab=installments'
      FROM public.profiles
      WHERE role = 'admin';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
