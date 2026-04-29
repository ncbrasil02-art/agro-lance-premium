-- Add commission_rate to events table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'events' AND column_name = 'commission_rate') THEN
        ALTER TABLE public.events ADD COLUMN commission_rate NUMERIC DEFAULT 0;
    END IF;
END $$;