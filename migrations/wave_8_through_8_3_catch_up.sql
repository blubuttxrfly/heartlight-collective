-- Wave 8 through 8.3 consolidated catch-up migration
-- Idempotent: safe to re-run even if some parts already exist.
-- Co-created with Atlas Morphoenix, for the Greatest & Highest Good of ALL that IS Living.

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. Wishes / Gifts — add all columns the app expects (Wave 8 + Wave 8.3)
-- ═══════════════════════════════════════════════════════════════════════════════

-- First ensure exchange_policy exists (it was introduced in Wave 8)
ALTER TABLE public.wishes
  ADD COLUMN IF NOT EXISTS exchange_policy jsonb DEFAULT '[]'::jsonb;

-- Then add the Wave 8.3 columns
ALTER TABLE public.wishes
  ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS resources TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS time_commitment TEXT,
  ADD COLUMN IF NOT EXISTS is_continual_offering BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS location_data JSONB;

-- Backfill sensible defaults for existing rows
UPDATE public.wishes
SET urgency = COALESCE(urgency, 'low'),
    resources = COALESCE(resources, '{}'),
    roles = COALESCE(roles, '{}'),
    exchange_policy = COALESCE(exchange_policy, '[]'::jsonb),
    is_continual_offering = COALESCE(is_continual_offering, false)
WHERE urgency IS NULL
   OR resources IS NULL
   OR roles IS NULL
   OR exchange_policy IS NULL
   OR is_continual_offering IS NULL;

CREATE INDEX IF NOT EXISTS idx_wishes_urgency ON public.wishes(urgency);
CREATE INDEX IF NOT EXISTS idx_wishes_category_status ON public.wishes(category, status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. Profiles — add directory-privacy toggle (public by default)
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

UPDATE public.profiles
SET is_private = COALESCE(is_private, false)
WHERE is_private IS NULL;

-- Ensure RLS is on and permissive for anon/authenticated users
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow anon read" ON public.profiles;
  DROP POLICY IF EXISTS "Allow anon insert" ON public.profiles;
  DROP POLICY IF EXISTS "Allow anon update" ON public.profiles;
  DROP POLICY IF EXISTS "Allow anon delete" ON public.profiles;
  CREATE POLICY "Allow anon read" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
  CREATE POLICY "Allow anon insert" ON public.profiles FOR INSERT TO anon, authenticated WITH CHECK (true);
  CREATE POLICY "Allow anon update" ON public.profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "Allow anon delete" ON public.profiles FOR DELETE TO anon, authenticated USING (true);
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. Offerings / Vendors — ensure columns referenced by the app exist
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS core_directive text DEFAULT '',
  ADD COLUMN IF NOT EXISTS exchange_policy jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS location_data jsonb,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

ALTER TABLE public.offerings
  ADD COLUMN IF NOT EXISTS exchange_policy jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ALTER COLUMN fulfillers SET DEFAULT '[]'::jsonb,
  ALTER COLUMN gallery SET DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_vendors_slug ON public.vendors(slug);
CREATE INDEX IF NOT EXISTS idx_vendors_owner_ces ON public.vendors(owner_ces);
CREATE INDEX IF NOT EXISTS idx_offerings_vendor_id ON public.offerings(vendor_id);

-- Quick sanity checks
SELECT 'wishes' AS table_name, count(*) AS rows FROM public.wishes
UNION ALL SELECT 'profiles', count(*) FROM public.profiles
UNION ALL SELECT 'vendors', count(*) FROM public.vendors
UNION ALL SELECT 'offerings', count(*) FROM public.offerings;
