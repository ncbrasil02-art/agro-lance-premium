-- Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Function to handle syncing email from auth.users to profiles
CREATE OR REPLACE FUNCTION public.handle_user_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.profiles (id, full_name, avatar_url, email)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url', NEW.email)
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  ELSIF (TG_OP = 'UPDATE') THEN
    UPDATE public.profiles
    SET email = NEW.email
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers on auth.users (if possible, or just update profiles)
-- Note: Agents often can't create triggers on auth schema directly depending on the environment.
-- We will try. If it fails, we at least have the column.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_sync') THEN
    CREATE TRIGGER on_auth_user_created_sync
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_user_sync();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_updated_sync') THEN
    CREATE TRIGGER on_auth_user_updated_sync
      AFTER UPDATE OF email ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_user_sync();
  END IF;
END $$;

-- Backfill existing emails from auth.users to profiles
-- This requires access to the auth schema which is allowed for this tool.
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;
