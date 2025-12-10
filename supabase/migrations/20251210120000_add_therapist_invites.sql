DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'therapist_status') THEN
    CREATE TYPE public.therapist_status AS ENUM ('pending', 'active');
  END IF;
END
$$;

ALTER TABLE public.therapists
  ADD COLUMN IF NOT EXISTS status therapist_status DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS invite_email TEXT,
  ADD COLUMN IF NOT EXISTS invite_link TEXT,
  ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invite_accepted_at TIMESTAMPTZ;

-- Existing therapists should be active
UPDATE public.therapists
SET status = 'active'
WHERE status IS NULL;

ALTER TABLE public.therapists
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'pending';

