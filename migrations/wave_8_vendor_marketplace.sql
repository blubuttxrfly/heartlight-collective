-- ============================================
-- Heartlight Collective — Wave 8 Vendor E-Marketplace
-- Schema additions: Core Directive + Exchange Policies
-- Safe to re-run.
-- ============================================

-- Vendor Shop Core Directive + exchange policy
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS core_directive text DEFAULT '',
  ADD COLUMN IF NOT EXISTS exchange_policy jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS location_data jsonb,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Offering exchange policy (accepted forms of exchange)
ALTER TABLE public.offerings
  ADD COLUMN IF NOT EXISTS exchange_policy jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Wish / gift exchange policy
ALTER TABLE public.wishes
  ADD COLUMN IF NOT EXISTS exchange_policy jsonb DEFAULT '[]'::jsonb;

-- Ensure RLS policies allow anon/authenticated read+write on vendors/offerings
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offerings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Vendors
  DROP POLICY IF EXISTS "Allow anon read" ON public.vendors;
  DROP POLICY IF EXISTS "Allow anon insert" ON public.vendors;
  DROP POLICY IF EXISTS "Allow anon update" ON public.vendors;
  DROP POLICY IF EXISTS "Allow anon delete" ON public.vendors;
  CREATE POLICY "Allow anon read" ON public.vendors FOR SELECT TO anon, authenticated USING (true);
  CREATE POLICY "Allow anon insert" ON public.vendors FOR INSERT TO anon, authenticated WITH CHECK (true);
  CREATE POLICY "Allow anon update" ON public.vendors FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "Allow anon delete" ON public.vendors FOR DELETE TO anon, authenticated USING (true);

  -- Offerings
  DROP POLICY IF EXISTS "Allow anon read" ON public.offerings;
  DROP POLICY IF EXISTS "Allow anon insert" ON public.offerings;
  DROP POLICY IF EXISTS "Allow anon update" ON public.offerings;
  DROP POLICY IF EXISTS "Allow anon delete" ON public.offerings;
  CREATE POLICY "Allow anon read" ON public.offerings FOR SELECT TO anon, authenticated USING (true);
  CREATE POLICY "Allow anon insert" ON public.offerings FOR INSERT TO anon, authenticated WITH CHECK (true);
  CREATE POLICY "Allow anon update" ON public.offerings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  CREATE POLICY "Allow anon delete" ON public.offerings FOR DELETE TO anon, authenticated USING (true);
END $$;

-- Index vendor slug and owner for directory/inbox lookups
CREATE INDEX IF NOT EXISTS idx_vendors_slug ON public.vendors(slug);
CREATE INDEX IF NOT EXISTS idx_vendors_owner_ces ON public.vendors(owner_ces);
CREATE INDEX IF NOT EXISTS idx_offerings_vendor_id ON public.offerings(vendor_id);
