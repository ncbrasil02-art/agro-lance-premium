-- Add type column to notifications
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info';

-- Trigger function for role changes
CREATE OR REPLACE FUNCTION public.on_role_change_notify()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.role != NEW.role) THEN
    -- Notify the user
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.id,
      'Privilégios Alterados',
      'Seu nível de acesso foi alterado para: ' || UPPER(NEW.role) || '.',
      'security'
    );
    
    -- Notify admins about this change
    INSERT INTO public.notifications (user_id, title, message, type)
    SELECT id, 'Alerta de Segurança: Alteração de Cargo', 'O usuário ' || NEW.full_name || ' teve seu cargo alterado de ' || OLD.role || ' para ' || NEW.role || '.', 'security'
    FROM public.profiles
    WHERE role = 'admin' AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger function for account blocking
CREATE OR REPLACE FUNCTION public.on_account_block_notify()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.is_blocked != NEW.is_blocked) THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.id,
      CASE WHEN NEW.is_blocked THEN 'Conta Bloqueada' ELSE 'Conta Desbloqueada' END,
      CASE WHEN NEW.is_blocked THEN 'Sua conta foi bloqueada por: ' || COALESCE(NEW.block_reason, 'motivos de segurança') ELSE 'Sua conta foi desbloqueada. Você já pode acessar a plataforma.' END,
      'security'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger function for payment gateway changes
CREATE OR REPLACE FUNCTION public.on_gateway_change_notify()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  SELECT id, 'Alerta: Configuração de Pagamento Alterada', 'As configurações do gateway ' || NEW.label || ' foram modificadas. Por favor, verifique se está tudo correto.', 'security'
  FROM public.profiles
  WHERE role = 'admin';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply triggers
DROP TRIGGER IF EXISTS tr_on_role_change ON public.profiles;
CREATE TRIGGER tr_on_role_change
AFTER UPDATE OF role ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.on_role_change_notify();

DROP TRIGGER IF EXISTS tr_on_account_block ON public.profiles;
CREATE TRIGGER tr_on_account_block
AFTER UPDATE OF is_blocked ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.on_account_block_notify();

DROP TRIGGER IF EXISTS tr_on_gateway_change ON public.payment_gateways;
CREATE TRIGGER tr_on_gateway_change
AFTER UPDATE ON public.payment_gateways
FOR EACH ROW EXECUTE FUNCTION public.on_gateway_change_notify();
