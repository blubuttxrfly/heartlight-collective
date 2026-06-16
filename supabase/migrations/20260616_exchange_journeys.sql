-- ============================================
-- Heartlight Collective — exchange_journeys
-- Slim table: quest state linked to agreements
-- Idempotent. Safe to re-run.
-- ============================================

-- 1. Ensure table exists (do not include party_ces here; add below for idempotent upgrades)
CREATE TABLE IF NOT EXISTS public.exchange_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid NOT NULL REFERENCES public.exchange_agreements(id) ON DELETE CASCADE,
  status text DEFAULT 'active',
  main_quest jsonb NOT NULL,
  side_quests jsonb DEFAULT '[]'::jsonb,
  logs jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Ensure party_ces column exists (added after initial table creation)
ALTER TABLE public.exchange_journeys
  ADD COLUMN IF NOT EXISTS party_ces text[] DEFAULT '{}';

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_exchange_journeys_agreement_id ON public.exchange_journeys(agreement_id);
CREATE INDEX IF NOT EXISTS idx_exchange_journeys_party_ces ON public.exchange_journeys USING GIN(party_ces);
CREATE INDEX IF NOT EXISTS idx_exchange_journeys_updated_at ON public.exchange_journeys(updated_at DESC);

-- 4. Enable RLS
ALTER TABLE public.exchange_journeys ENABLE ROW LEVEL SECURITY;

-- 5. Policies (open collective read/write during the current development phase)
DROP POLICY IF EXISTS "Allow anon read" ON public.exchange_journeys;
DROP POLICY IF EXISTS "Allow anon insert" ON public.exchange_journeys;
DROP POLICY IF EXISTS "Allow anon update" ON public.exchange_journeys;
DROP POLICY IF EXISTS "Allow anon delete" ON public.exchange_journeys;

CREATE POLICY "Allow anon read" ON public.exchange_journeys FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow anon insert" ON public.exchange_journeys FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.exchange_journeys FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete" ON public.exchange_journeys FOR DELETE TO anon, authenticated USING (true);

-- Sanity check
SELECT 'exchange_journeys' AS table_name, count(*) AS rows FROM public.exchange_journeys;
