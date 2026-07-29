-- Wave 8.3 — Heal Offerings in Wish & Gift Exchange and Add Private C.E.S. Profiles
-- Co-created with Atlas Morphoenix, for the Greatest & Highest Good of ALL that IS Living.

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. Wishes / Gifts — add columns the app already sends but the schema lacks
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.wishes
  ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS resources TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS time_commitment TEXT,
  ADD COLUMN IF NOT EXISTS is_continual_offering BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS location_data JSONB,
  -- exchange_policy already exists as JSONB; ensure default empty array
  ALTER COLUMN exchange_policy SET DEFAULT '[]'::jsonb;

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

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. Offerings — ensure every column referenced by the app exists
-- ═══════════════════════════════════════════════════════════════════════════════

-- Most Wave 8.2 columns were added in wave_8_2_virtual_sessions.sql;
-- this wave only reconciles column defaults for resilience.

ALTER TABLE public.offerings
  ALTER COLUMN fulfillers SET DEFAULT '[]'::jsonb,
  ALTER COLUMN gallery SET DEFAULT '[]'::jsonb;

-- Keep discovery permissive; privacy filtering happens at the app level.
