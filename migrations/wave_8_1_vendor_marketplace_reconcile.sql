-- ═══════════════════════════════════════════════════════════════
--  Heartlight Collective — Wave 8.1 Vendor Marketplace Reconciliation
--  Ensures vendors & offerings tables exist with the columns the
--  production app syncs to Supabase (exchangeSync.ts).
--  SAFE TO RE-RUN.
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ═══ Vendors (storefronts) ═══
CREATE TABLE IF NOT EXISTS public.vendors (
  id TEXT PRIMARY KEY DEFAULT 'vendor_' || substr(md5(random()::text), 1, 8),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  -- Wave 8 additions
  core_directive TEXT DEFAULT '',
  logo_url TEXT,
  owner_ces TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  members JSONB DEFAULT '[]'::jsonb,
  payment_methods JSONB DEFAULT '[]'::jsonb,
  exchange_policy JSONB DEFAULT '[]'::jsonb,
  location_data JSONB,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'under_review')),
  collective_funded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add / reconcile Wave 8 columns idempotently
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS core_directive TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS exchange_policy JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS location_data JSONB,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '[]'::jsonb;

-- Ensure defaults are set for existing rows (if columns already existed without defaults)
UPDATE public.vendors
  SET core_directive = COALESCE(core_directive, ''),
      exchange_policy = COALESCE(exchange_policy, '[]'::jsonb),
      tags = COALESCE(tags, '{}'),
      payment_methods = COALESCE(payment_methods, '[]'::jsonb)
  WHERE core_directive IS NULL
     OR exchange_policy IS NULL
     OR tags IS NULL
     OR payment_methods IS NULL;

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vendors_public_select" ON public.vendors;
DROP POLICY IF EXISTS "vendors_owner_all" ON public.vendors;
DROP POLICY IF EXISTS "vendors_authenticated_insert" ON public.vendors;

-- Public read for discovery
CREATE POLICY "vendors_public_select"
  ON public.vendors FOR SELECT
  USING (true);

-- Signed-in beings can create new vendors
CREATE POLICY "vendors_authenticated_insert"
  ON public.vendors FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Owners can update/delete their own vendors
CREATE POLICY "vendors_owner_all"
  ON public.vendors FOR ALL
  TO authenticated
  USING (owner_ces = current_setting('app.current_ces', true));

CREATE INDEX IF NOT EXISTS idx_vendors_slug ON public.vendors(slug);
CREATE INDEX IF NOT EXISTS idx_vendors_owner_ces ON public.vendors(owner_ces);

-- ═══ Offerings (products/services within a storefront) ═══
CREATE TABLE IF NOT EXISTS public.offerings (
  id TEXT PRIMARY KEY DEFAULT 'offering_' || substr(md5(random()::text), 1, 8),
  vendor_id TEXT NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL,
  -- Wave 8 additions
  exchange_policy JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  price_type TEXT DEFAULT 'gift' CHECK (price_type IN ('fixed', 'gift', 'collective_funded', 'negotiable')),
  price_cents INTEGER,
  currency TEXT DEFAULT 'USD',
  image_url TEXT,
  availability TEXT DEFAULT 'available' CHECK (availability IN ('available', 'limited', 'waitlist', 'unavailable')),
  consent_required BOOLEAN DEFAULT false,
  max_participants INTEGER,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.offerings
  ADD COLUMN IF NOT EXISTS exchange_policy JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

UPDATE public.offerings
  SET exchange_policy = COALESCE(exchange_policy, '[]'::jsonb),
      tags = COALESCE(tags, '{}')
  WHERE exchange_policy IS NULL
     OR tags IS NULL;

ALTER TABLE public.offerings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "offerings_public_select" ON public.offerings;
DROP POLICY IF EXISTS "offerings_vendor_owner_all" ON public.offerings;
DROP POLICY IF EXISTS "offerings_authenticated_insert" ON public.offerings;

CREATE POLICY "offerings_public_select"
  ON public.offerings FOR SELECT
  USING (true);

CREATE POLICY "offerings_authenticated_insert"
  ON public.offerings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "offerings_vendor_owner_all"
  ON public.offerings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors v
      WHERE v.id = public.offerings.vendor_id
        AND v.owner_ces = current_setting('app.current_ces', true)
    )
  );

CREATE INDEX IF NOT EXISTS idx_offerings_vendor_id ON public.offerings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_offerings_category ON public.offerings(category);
CREATE INDEX IF NOT EXISTS idx_offerings_availability ON public.offerings(availability);

COMMIT;
