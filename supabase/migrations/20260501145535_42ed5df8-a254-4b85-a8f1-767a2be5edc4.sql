-- Function to protect installment status
CREATE OR REPLACE FUNCTION public.protect_installment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If not an admin, restrict what can be changed
  IF NOT (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')) THEN
    -- Prevent unauthorized status changes to 'paid'
    IF (NEW.status IS DISTINCT FROM OLD.status AND NEW.status = 'paid') THEN
      RAISE EXCEPTION 'Somente administradores podem confirmar pagamentos.';
    END IF;
    
    -- Prevent changing paid_at
    IF (NEW.paid_at IS DISTINCT FROM OLD.paid_at) THEN
      RAISE EXCEPTION 'Somente administradores podem alterar a data de pagamento.';
    END IF;
    
    -- Prevent changing amounts or due dates (if they were already set)
    IF (NEW.amount IS DISTINCT FROM OLD.amount OR NEW.due_date IS DISTINCT FROM OLD.due_date) THEN
      RAISE EXCEPTION 'Não é permitido alterar o valor ou a data de vencimento.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to enforce the protection
DROP TRIGGER IF EXISTS tr_protect_installment_status ON public.installments;
CREATE TRIGGER tr_protect_installment_status
BEFORE UPDATE ON public.installments
FOR EACH ROW
EXECUTE FUNCTION public.protect_installment_status();

-- Ensure execute permissions are restricted
REVOKE EXECUTE ON FUNCTION public.protect_installment_status() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.protect_installment_status() TO postgres, service_role;
