ALTER TABLE public.events ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;

-- No special function needed, we can just update the status to 'finished'.
-- However, we could add a comment or just proceed with the code changes.
