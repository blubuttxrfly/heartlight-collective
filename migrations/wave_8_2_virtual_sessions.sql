-- ═══════════════════════════════════════════════════════════════
--  Heartlight Collective — Wave 8.2
--  Virtual Sessions, Community Locations, Work/Study Exchanges,
--  Hybrid Payment + Calendar Booking, and Directory Population Fix
--  SAFE TO RE-RUN.
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════
--  1. Offerings — add Wave 8.2 columns + fix defaults/RLS/indexes
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.offerings
  ADD COLUMN IF NOT EXISTS offering_type TEXT DEFAULT 'service'
    CHECK (offering_type IN ('product', 'service', 'virtual_session', 'work_study_exchange')),
  ADD COLUMN IF NOT EXISTS virtual_session JSONB,
  ADD COLUMN IF NOT EXISTS work_study_exchange JSONB,
  ADD COLUMN IF NOT EXISTS location JSONB,
  ADD COLUMN IF NOT EXISTS requires_scheduling BOOLEAN DEFAULT false;

-- Backfill: anything without an offering_type becomes a service (backward compat)
UPDATE public.offerings
  SET offering_type = COALESCE(offering_type, 'service'),
      requires_scheduling = COALESCE(requires_scheduling, false)
  WHERE offering_type IS NULL
     OR requires_scheduling IS NULL;

-- Ensure public SELECT stays permissive (Directory needs this)
ALTER TABLE public.offerings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "offerings_public_select" ON public.offerings;
DROP POLICY IF EXISTS "offerings_authenticated_insert" ON public.offerings;
DROP POLICY IF EXISTS "offerings_vendor_owner_all" ON public.offerings;

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
CREATE INDEX IF NOT EXISTS idx_offerings_offering_type ON public.offerings(offering_type);
CREATE INDEX IF NOT EXISTS idx_offerings_requires_scheduling ON public.offerings(requires_scheduling);
CREATE INDEX IF NOT EXISTS idx_offerings_location_gin ON public.offerings USING GIN (location jsonb_path_ops);

-- ═══════════════════════════════════════════════════════════════
--  2. Vendors — ensure public discovery + owner management
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS discovery_eligible BOOLEAN DEFAULT true;

UPDATE public.vendors
  SET discovery_eligible = COALESCE(discovery_eligible, true)
  WHERE discovery_eligible IS NULL;

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vendors_public_select" ON public.vendors;
DROP POLICY IF EXISTS "vendors_owner_all" ON public.vendors;
DROP POLICY IF EXISTS "vendors_authenticated_insert" ON public.vendors;

CREATE POLICY "vendors_public_select"
  ON public.vendors FOR SELECT
  USING (true);

CREATE POLICY "vendors_authenticated_insert"
  ON public.vendors FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "vendors_owner_all"
  ON public.vendors FOR ALL
  TO authenticated
  USING (owner_ces = current_setting('app.current_ces', true));

CREATE INDEX IF NOT EXISTS idx_vendors_slug ON public.vendors(slug);
CREATE INDEX IF NOT EXISTS idx_vendors_owner_ces ON public.vendors(owner_ces);
CREATE INDEX IF NOT EXISTS idx_vendors_status_discovery ON public.vendors(status, discovery_eligible)
  WHERE status = 'active' AND discovery_eligible = true;

-- ═══════════════════════════════════════════════════════════════
--  3. Exchange Requests — hybrid payment + proposed meeting slot
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.exchange_requests
  ADD COLUMN IF NOT EXISTS hybrid_payment JSONB,
  ADD COLUMN IF NOT EXISTS proposed_meeting_slot JSONB;

ALTER TABLE public.exchange_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exchange_requests_public_select" ON public.exchange_requests;
DROP POLICY IF EXISTS "exchange_requests_authenticated_insert" ON public.exchange_requests;
DROP POLICY IF EXISTS "exchange_requests_parties_all" ON public.exchange_requests;

CREATE POLICY "exchange_requests_public_select"
  ON public.exchange_requests FOR SELECT
  USING (true);

CREATE POLICY "exchange_requests_authenticated_insert"
  ON public.exchange_requests FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "exchange_requests_parties_all"
  ON public.exchange_requests FOR ALL
  TO authenticated
  USING (
    requester_ces = current_setting('app.current_ces', true)
    OR provider_ces = current_setting('app.current_ces', true)
  );

-- ═══════════════════════════════════════════════════════════════
--  4. Exchange Agreements — hybrid payment + confirmed meeting slot
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.exchange_agreements
  ADD COLUMN IF NOT EXISTS hybrid_payment JSONB,
  ADD COLUMN IF NOT EXISTS confirmed_meeting_slot JSONB;

ALTER TABLE public.exchange_agreements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exchange_agreements_public_select" ON public.exchange_agreements;
DROP POLICY IF EXISTS "exchange_agreements_authenticated_insert" ON public.exchange_agreements;
DROP POLICY IF EXISTS "exchange_agreements_parties_all" ON public.exchange_agreements;

CREATE POLICY "exchange_agreements_public_select"
  ON public.exchange_agreements FOR SELECT
  USING (true);

CREATE POLICY "exchange_agreements_authenticated_insert"
  ON public.exchange_agreements FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "exchange_agreements_parties_all"
  ON public.exchange_agreements FOR ALL
  TO authenticated
  USING (
    requester_ces = current_setting('app.current_ces', true)
    OR provider_ces = current_setting('app.current_ces', true)
  );

-- ═══════════════════════════════════════════════════════════════
--  5. Exchange Calendars — ensure availability blocks support scheduling
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.exchange_calendars
  ADD COLUMN IF NOT EXISTS scheduling_enabled BOOLEAN DEFAULT false;

UPDATE public.exchange_calendars
  SET scheduling_enabled = COALESCE(scheduling_enabled, false)
  WHERE scheduling_enabled IS NULL;

ALTER TABLE public.exchange_calendars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exchange_calendars_public_select" ON public.exchange_calendars;
DROP POLICY IF EXISTS "exchange_calendars_owner_all" ON public.exchange_calendars;

CREATE POLICY "exchange_calendars_public_select"
  ON public.exchange_calendars FOR SELECT
  USING (true);

CREATE POLICY "exchange_calendars_owner_all"
  ON public.exchange_calendars FOR ALL
  TO authenticated
  USING (ces = current_setting('app.current_ces', true));

-- ═══════════════════════════════════════════════════════════════
--  6. Helper function: current C.E.S. for RLS
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_app_current_ces()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(current_setting('app.current_ces', true), '');
$$;

-- Grant usage to authenticated beings
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

COMMIT;
