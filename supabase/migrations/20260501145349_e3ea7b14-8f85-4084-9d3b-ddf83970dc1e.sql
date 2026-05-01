-- Update the function to handle INSERT and UPDATE
CREATE OR REPLACE FUNCTION public.handle_installment_payment_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify user when installment is marked as paid
  IF (TG_OP = 'UPDATE') THEN
    IF (NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid')) THEN
      INSERT INTO public.notifications (user_id, title, message, link)
      VALUES (
        NEW.buyer_id,
        'Pagamento Confirmado',
        'O pagamento da sua parcela ' || NEW.installment_number || ' foi confirmado com sucesso. Obrigado!',
        '/painel'
      );
    END IF;
  END IF;
  
  -- Notify admins when a proof is uploaded (INSERT or UPDATE)
  IF (NEW.proof_url IS NOT NULL) THEN
    IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.proof_url IS NULL OR NEW.proof_url != OLD.proof_url))) THEN
      -- Find admins to notify
      INSERT INTO public.notifications (user_id, title, message, link)
      SELECT id, 'Novo Comprovante Recebido', 'Um novo comprovante de pagamento foi enviado para conferência (Parcela ' || NEW.installment_number || ').', '/admin?tab=installments'
      FROM public.profiles
      WHERE role = 'admin';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-create trigger for both INSERT and UPDATE
DROP TRIGGER IF EXISTS on_installment_update ON public.installments;
CREATE TRIGGER on_installment_change
AFTER INSERT OR UPDATE ON public.installments
FOR EACH ROW
EXECUTE FUNCTION public.handle_installment_payment_notification();
