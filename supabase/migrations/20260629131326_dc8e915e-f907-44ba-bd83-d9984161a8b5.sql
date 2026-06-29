WITH ranked AS (
  SELECT id, start_date, end_date,
         row_number() OVER (ORDER BY start_date) AS rn
  FROM public.events
  WHERE start_date < now() - interval '24 hours'
     OR status = 'finished'
)
UPDATE public.events e
SET status = 'scheduled',
    start_date = now() + (interval '7 days' * r.rn),
    end_date = CASE WHEN e.end_date IS NOT NULL
      THEN now() + (interval '7 days' * r.rn) + (e.end_date - e.start_date)
      ELSE NULL END
FROM ranked r
WHERE e.id = r.id;