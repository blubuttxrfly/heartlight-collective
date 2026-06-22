-- ═══════════════════════════════════════════════════════════════
-- Heartlight Collective — Master Consolidated Migration
-- Waves 7.5 through 8.3 + June 2026 patches
-- Idempotent: safe to re-run multiple times.
-- Co-created with Atlas Morphoenix for the Greatest & Highest Good.
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- 1. PROFILES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ces_number text UNIQUE NOT NULL,
  name text NOT NULL,
  pronouns text DEFAULT '',
  title text DEFAULT '',
  location text DEFAULT '',
  emoji text DEFAULT '✨',
  photo_url text DEFAULT '',
  bio text DEFAULT '',
  sun_placement text DEFAULT '',
  moon_placement text DEFAULT '',
  ces_passphrase_hash text NOT NULL,
  wish_availability text DEFAULT 'accepting',
  directory_wish_status text DEFAULT 'accepting',
  stewardship text DEFAULT 'pending',
  stewardship_note text DEFAULT '',
  guide_guardian_status text DEFAULT 'not_opted_in',
  guide_guardian_opted_in_at timestamptz DEFAULT NULL,
  contact_methods jsonb DEFAULT '{}',
  contact_visibility jsonb DEFAULT '{}',
  public_contact_visibility boolean DEFAULT false,
  portfolio_items jsonb DEFAULT '[]',
  portfolio_link text DEFAULT '',
  accessibility jsonb DEFAULT '[]',
  consent text DEFAULT '',
  numerology jsonb DEFAULT '[]',
  peer_payment_methods jsonb DEFAULT '[]',
  location_data jsonb,
  tags text[] DEFAULT '{}',
  is_private boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Idempotent column additions (safe re-run)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS guide_guardian_status text DEFAULT 'not_opted_in',
  ADD COLUMN IF NOT EXISTS guide_guardian_opted_in_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS peer_payment_methods jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS location_data jsonb,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false;

UPDATE public.profiles
SET guide_guardian_status = COALESCE(guide_guardian_status, 'not_opted_in'),
    is_private = COALESCE(is_private, false)
WHERE guide_guardian_status IS NULL OR is_private IS NULL;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read access" ON public.profiles;
DROP POLICY IF EXISTS "Allow anon insert" ON public.profiles;
DROP POLICY IF EXISTS "Allow anon update" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated own profile update" ON public.profiles;

CREATE POLICY "Allow anon read access" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow anon insert" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.profiles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_profiles_ces_number ON public.profiles(ces_number);
CREATE INDEX IF NOT EXISTS idx_profiles_guide_guardian_status ON public.profiles(guide_guardian_status);

-- ═══════════════════════════════════════════════════════════════
-- 2. WISHES / GIFTS (Exchange)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.wishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  author_ces text NOT NULL,
  author_name text NOT NULL,
  scope text DEFAULT 'local',
  category text,
  tags text[] DEFAULT '{}',
  location text,
  lat double precision,
  lng double precision,
  price_cents integer,
  price_type text,
  payment_method text,
  images text[] DEFAULT '{}',
  status text DEFAULT 'active',
  claimed_by_ces text,
  claimed_by_name text,
  collective_funding_requested boolean DEFAULT false,
  exchange_policy jsonb DEFAULT '[]'::jsonb,
  urgency text DEFAULT 'low',
  resources text[] DEFAULT '{}',
  roles text[] DEFAULT '{}',
  time_commitment text,
  is_continual_offering boolean DEFAULT false,
  location_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.wishes
  ADD COLUMN IF NOT EXISTS exchange_policy jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS urgency text DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS resources text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS roles text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS time_commitment text,
  ADD COLUMN IF NOT EXISTS is_continual_offering boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS location_data jsonb;

UPDATE public.wishes
SET exchange_policy = COALESCE(exchange_policy, '[]'::jsonb),
    urgency = COALESCE(urgency, 'low'),
    resources = COALESCE(resources, '{}'),
    roles = COALESCE(roles, '{}'),
    is_continual_offering = COALESCE(is_continual_offering, false)
WHERE exchange_policy IS NULL OR urgency IS NULL OR resources IS NULL OR roles IS NULL OR is_continual_offering IS NULL;

ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read" ON public.wishes;
DROP POLICY IF EXISTS "Allow anon insert" ON public.wishes;
DROP POLICY IF EXISTS "Allow anon update" ON public.wishes;
DROP POLICY IF EXISTS "Allow anon delete" ON public.wishes;

CREATE POLICY "Allow anon read" ON public.wishes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow anon insert" ON public.wishes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.wishes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete" ON public.wishes FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_wishes_author_ces ON public.wishes(author_ces);
CREATE INDEX IF NOT EXISTS idx_wishes_status ON public.wishes(status);
CREATE INDEX IF NOT EXISTS idx_wishes_type ON public.wishes(type);
CREATE INDEX IF NOT EXISTS idx_wishes_scope ON public.wishes(scope);
CREATE INDEX IF NOT EXISTS idx_wishes_urgency ON public.wishes(urgency);
CREATE INDEX IF NOT EXISTS idx_wishes_category_status ON public.wishes(category, status);

-- ═══════════════════════════════════════════════════════════════
-- 3. VENDORS (Storefronts)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.vendors (
  id TEXT PRIMARY KEY DEFAULT 'vendor_' || substr(md5(random()::text), 1, 8),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
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
  discovery_eligible BOOLEAN DEFAULT true,
  links JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS core_directive TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS exchange_policy JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS location_data JSONB,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS discovery_eligible BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS links JSONB;

UPDATE public.vendors
SET core_directive = COALESCE(core_directive, ''),
    exchange_policy = COALESCE(exchange_policy, '[]'::jsonb),
    tags = COALESCE(tags, '{}'),
    payment_methods = COALESCE(payment_methods, '[]'::jsonb),
    discovery_eligible = COALESCE(discovery_eligible, true)
WHERE core_directive IS NULL OR exchange_policy IS NULL OR tags IS NULL OR payment_methods IS NULL OR discovery_eligible IS NULL;

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vendors_public_select" ON public.vendors;
DROP POLICY IF EXISTS "vendors_authenticated_insert" ON public.vendors;
DROP POLICY IF EXISTS "vendors_owner_all" ON public.vendors;

-- Open collective read/write (application layer validates ownership/CES)
CREATE POLICY "vendors_public_select"
  ON public.vendors FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "vendors_authenticated_insert"
  ON public.vendors FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "vendors_owner_all"
  ON public.vendors FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_vendors_slug ON public.vendors(slug);
CREATE INDEX IF NOT EXISTS idx_vendors_owner_ces ON public.vendors(owner_ces);
CREATE INDEX IF NOT EXISTS idx_vendors_status_discovery ON public.vendors(status, discovery_eligible)
  WHERE status = 'active' AND discovery_eligible = true;

-- ═══════════════════════════════════════════════════════════════
-- 4. OFFERINGS (Products / Services within a Storefront)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.offerings (
  id TEXT PRIMARY KEY DEFAULT 'offering_' || substr(md5(random()::text), 1, 8),
  vendor_id TEXT NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL,
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
  offering_type TEXT DEFAULT 'service' CHECK (offering_type IN ('product', 'service', 'virtual_session', 'work_study_exchange')),
  virtual_session JSONB,
  work_study_exchange JSONB,
  location JSONB,
  requires_scheduling BOOLEAN DEFAULT false,
  fulfillers JSONB DEFAULT NULL,
  gallery JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.offerings
  ADD COLUMN IF NOT EXISTS exchange_policy JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS offering_type TEXT DEFAULT 'service' CHECK (offering_type IN ('product', 'service', 'virtual_session', 'work_study_exchange')),
  ADD COLUMN IF NOT EXISTS virtual_session JSONB,
  ADD COLUMN IF NOT EXISTS work_study_exchange JSONB,
  ADD COLUMN IF NOT EXISTS location JSONB,
  ADD COLUMN IF NOT EXISTS requires_scheduling BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS fulfillers JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT NULL;

UPDATE public.offerings
SET exchange_policy = COALESCE(exchange_policy, '[]'::jsonb),
    tags = COALESCE(tags, '{}'),
    offering_type = COALESCE(offering_type, 'service'),
    requires_scheduling = COALESCE(requires_scheduling, false)
WHERE exchange_policy IS NULL OR tags IS NULL OR offering_type IS NULL OR requires_scheduling IS NULL;

ALTER TABLE public.offerings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "offerings_public_select" ON public.offerings;
DROP POLICY IF EXISTS "offerings_authenticated_insert" ON public.offerings;
DROP POLICY IF EXISTS "offerings_vendor_owner_all" ON public.offerings;

-- Open collective read/write (application layer validates ownership/CES)
CREATE POLICY "offerings_public_select"
  ON public.offerings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "offerings_authenticated_insert"
  ON public.offerings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "offerings_vendor_owner_all"
  ON public.offerings FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_offerings_vendor_id ON public.offerings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_offerings_category ON public.offerings(category);
CREATE INDEX IF NOT EXISTS idx_offerings_availability ON public.offerings(availability);
CREATE INDEX IF NOT EXISTS idx_offerings_offering_type ON public.offerings(offering_type);
CREATE INDEX IF NOT EXISTS idx_offerings_requires_scheduling ON public.offerings(requires_scheduling);
CREATE INDEX IF NOT EXISTS idx_offerings_location_gin ON public.offerings USING GIN (location jsonb_path_ops);

-- ═══════════════════════════════════════════════════════════════
-- 5. EXCHANGE AGREEMENTS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.exchange_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id uuid,
  vendor_id uuid,
  wish_id uuid,
  requester_ces text NOT NULL,
  requester_name text NOT NULL,
  provider_ces text NOT NULL,
  provider_name text NOT NULL,
  message text DEFAULT '',
  requester_role text DEFAULT '',
  provider_role text DEFAULT '',
  parties jsonb DEFAULT '[]'::jsonb,
  main_quest jsonb DEFAULT '{}'::jsonb,
  main_quest_directive jsonb,
  main_quests jsonb,
  side_quests jsonb DEFAULT '[]'::jsonb,
  proposed_price_cents integer,
  agreed_price_cents integer,
  payment_method text,
  communication_prefs text DEFAULT '',
  dedication_of_profits jsonb,
  scheduled_meetings jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'draft',
  requester_consented boolean DEFAULT false,
  provider_consented boolean DEFAULT false,
  collective_funding_requested boolean DEFAULT false,
  collective_funding_approved boolean,
  safety_reports jsonb,
  versions jsonb DEFAULT '[]'::jsonb,
  pending_update jsonb,
  hybrid_payment jsonb,
  confirmed_meeting_slot jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.exchange_agreements
  ADD COLUMN IF NOT EXISTS hybrid_payment jsonb,
  ADD COLUMN IF NOT EXISTS confirmed_meeting_slot jsonb;

ALTER TABLE public.exchange_agreements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read" ON public.exchange_agreements;
DROP POLICY IF EXISTS "Allow anon insert" ON public.exchange_agreements;
DROP POLICY IF EXISTS "Allow anon update" ON public.exchange_agreements;
DROP POLICY IF EXISTS "Allow anon delete" ON public.exchange_agreements;

CREATE POLICY "Allow anon read" ON public.exchange_agreements FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow anon insert" ON public.exchange_agreements FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.exchange_agreements FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete" ON public.exchange_agreements FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_exchange_agreements_requester_ces ON public.exchange_agreements(requester_ces);
CREATE INDEX IF NOT EXISTS idx_exchange_agreements_provider_ces ON public.exchange_agreements(provider_ces);
CREATE INDEX IF NOT EXISTS idx_exchange_agreements_status ON public.exchange_agreements(status);
CREATE INDEX IF NOT EXISTS idx_exchange_agreements_vendor_id ON public.exchange_agreements(vendor_id);
CREATE INDEX IF NOT EXISTS idx_exchange_agreements_wish_id ON public.exchange_agreements(wish_id);

-- ═══════════════════════════════════════════════════════════════
-- 6. EXCHANGE REQUESTS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.exchange_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_ces text NOT NULL,
  requester_name text NOT NULL,
  provider_ces text NOT NULL,
  provider_name text NOT NULL,
  offering_id text,
  vendor_id text,
  wish_id text,
  message text DEFAULT '',
  status text DEFAULT 'pending',
  hybrid_payment jsonb,
  proposed_meeting_slot jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.exchange_requests
  ADD COLUMN IF NOT EXISTS hybrid_payment jsonb,
  ADD COLUMN IF NOT EXISTS proposed_meeting_slot jsonb;

ALTER TABLE public.exchange_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exchange_requests_public_select" ON public.exchange_requests;
DROP POLICY IF EXISTS "exchange_requests_authenticated_insert" ON public.exchange_requests;
DROP POLICY IF EXISTS "exchange_requests_parties_all" ON public.exchange_requests;

CREATE POLICY "exchange_requests_public_select" ON public.exchange_requests FOR SELECT USING (true);
CREATE POLICY "exchange_requests_authenticated_insert" ON public.exchange_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "exchange_requests_parties_all" ON public.exchange_requests FOR ALL TO authenticated USING (
  requester_ces = current_setting('app.current_ces', true)
  OR provider_ces = current_setting('app.current_ces', true)
);

-- ═══════════════════════════════════════════════════════════════
-- 7. EXCHANGE CALENDARS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.exchange_calendars (
  ces text PRIMARY KEY,
  availability_blocks jsonb DEFAULT '[]'::jsonb,
  scheduled_meetings jsonb DEFAULT '[]'::jsonb,
  scheduling_enabled boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.exchange_calendars
  ADD COLUMN IF NOT EXISTS scheduling_enabled boolean DEFAULT false;

UPDATE public.exchange_calendars
SET scheduling_enabled = COALESCE(scheduling_enabled, false)
WHERE scheduling_enabled IS NULL;

ALTER TABLE public.exchange_calendars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exchange_calendars_public_select" ON public.exchange_calendars;
DROP POLICY IF EXISTS "exchange_calendars_owner_all" ON public.exchange_calendars;

CREATE POLICY "exchange_calendars_public_select" ON public.exchange_calendars FOR SELECT USING (true);
CREATE POLICY "exchange_calendars_owner_all" ON public.exchange_calendars FOR ALL TO authenticated USING (ces = current_setting('app.current_ces', true));

CREATE INDEX IF NOT EXISTS idx_exchange_calendars_ces ON public.exchange_calendars(ces);

-- ═══════════════════════════════════════════════════════════════
-- 8. EXCHANGE ALERTS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.exchange_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_id uuid NOT NULL,
  exchange_title text DEFAULT '',
  type text NOT NULL,
  from_ces text NOT NULL,
  from_name text NOT NULL,
  to_ces text,
  message text DEFAULT '',
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  reviewed_by text,
  reviewed_at timestamptz,
  metadata jsonb
);

ALTER TABLE public.exchange_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read" ON public.exchange_alerts;
DROP POLICY IF EXISTS "Allow anon insert" ON public.exchange_alerts;
DROP POLICY IF EXISTS "Allow anon update" ON public.exchange_alerts;
DROP POLICY IF EXISTS "Allow anon delete" ON public.exchange_alerts;

CREATE POLICY "Allow anon read" ON public.exchange_alerts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow anon insert" ON public.exchange_alerts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.exchange_alerts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete" ON public.exchange_alerts FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_exchange_alerts_exchange_id ON public.exchange_alerts(exchange_id);
CREATE INDEX IF NOT EXISTS idx_exchange_alerts_from_ces ON public.exchange_alerts(from_ces);
CREATE INDEX IF NOT EXISTS idx_exchange_alerts_status ON public.exchange_alerts(status);

-- ═══════════════════════════════════════════════════════════════
-- 9. EXCHANGE JOURNEYS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.exchange_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid NOT NULL REFERENCES public.exchange_agreements(id) ON DELETE CASCADE,
  status text DEFAULT 'active',
  main_quest jsonb NOT NULL,
  side_quests jsonb DEFAULT '[]'::jsonb,
  logs jsonb DEFAULT '[]'::jsonb,
  party_ces text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.exchange_journeys
  ADD COLUMN IF NOT EXISTS party_ces text[] DEFAULT '{}';

ALTER TABLE public.exchange_journeys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read" ON public.exchange_journeys;
DROP POLICY IF EXISTS "Allow anon insert" ON public.exchange_journeys;
DROP POLICY IF EXISTS "Allow anon update" ON public.exchange_journeys;
DROP POLICY IF EXISTS "Allow anon delete" ON public.exchange_journeys;

CREATE POLICY "Allow anon read" ON public.exchange_journeys FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow anon insert" ON public.exchange_journeys FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.exchange_journeys FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete" ON public.exchange_journeys FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_exchange_journeys_agreement_id ON public.exchange_journeys(agreement_id);
CREATE INDEX IF NOT EXISTS idx_exchange_journeys_party_ces ON public.exchange_journeys USING GIN(party_ces);
CREATE INDEX IF NOT EXISTS idx_exchange_journeys_updated_at ON public.exchange_journeys(updated_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- 10. VENDOR INVITES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.vendor_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  vendor_name text NOT NULL,
  invited_by_ces text NOT NULL,
  invited_by_name text NOT NULL,
  invitee_ces text NOT NULL,
  invitee_name text NOT NULL,
  role text DEFAULT '',
  message text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  responded_at timestamptz
);

ALTER TABLE public.vendor_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read" ON public.vendor_invites;
DROP POLICY IF EXISTS "Allow anon insert" ON public.vendor_invites;
DROP POLICY IF EXISTS "Allow anon update" ON public.vendor_invites;
DROP POLICY IF EXISTS "Allow anon delete" ON public.vendor_invites;

CREATE POLICY "Allow anon read" ON public.vendor_invites FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow anon insert" ON public.vendor_invites FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.vendor_invites FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete" ON public.vendor_invites FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_vendor_invites_vendor_id ON public.vendor_invites(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_invites_invitee_ces ON public.vendor_invites(invitee_ces);
CREATE INDEX IF NOT EXISTS idx_vendor_invites_invited_by_ces ON public.vendor_invites(invited_by_ces);

-- ═══════════════════════════════════════════════════════════════
-- 11. VENDOR JOIN REQUESTS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.vendor_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  requester_ces text NOT NULL,
  requester_name text NOT NULL,
  message text,
  status text DEFAULT 'pending',
  requested_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  responded_by_ces text
);

ALTER TABLE public.vendor_join_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read" ON public.vendor_join_requests;
DROP POLICY IF EXISTS "Allow anon insert" ON public.vendor_join_requests;
DROP POLICY IF EXISTS "Allow anon update" ON public.vendor_join_requests;
DROP POLICY IF EXISTS "Allow anon delete" ON public.vendor_join_requests;

CREATE POLICY "Allow anon read" ON public.vendor_join_requests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow anon insert" ON public.vendor_join_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.vendor_join_requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete" ON public.vendor_join_requests FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_vendor_join_requests_vendor_id ON public.vendor_join_requests(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_join_requests_requester_ces ON public.vendor_join_requests(requester_ces);

-- ═══════════════════════════════════════════════════════════════
-- 12. COLLECTIVE PETITIONS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.collective_petitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_request_id uuid NOT NULL,
  requester_ces text NOT NULL,
  requester_name text NOT NULL,
  provider_ces text NOT NULL,
  provider_name text NOT NULL,
  offering_title text NOT NULL,
  amount_cents integer NOT NULL,
  message text DEFAULT '',
  status text DEFAULT 'pending',
  steward_notes text,
  reviewed_by_ces text,
  reviewed_by_name text,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  funded_at timestamptz
);

ALTER TABLE public.collective_petitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read" ON public.collective_petitions;
DROP POLICY IF EXISTS "Allow anon insert" ON public.collective_petitions;
DROP POLICY IF EXISTS "Allow anon update" ON public.collective_petitions;
DROP POLICY IF EXISTS "Allow anon delete" ON public.collective_petitions;

CREATE POLICY "Allow anon read" ON public.collective_petitions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow anon insert" ON public.collective_petitions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.collective_petitions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete" ON public.collective_petitions FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_collective_petitions_requester_ces ON public.collective_petitions(requester_ces);
CREATE INDEX IF NOT EXISTS idx_collective_petitions_provider_ces ON public.collective_petitions(provider_ces);
CREATE INDEX IF NOT EXISTS idx_collective_petitions_status ON public.collective_petitions(status);

-- ═══════════════════════════════════════════════════════════════
-- 13. HELPER FUNCTION + GRANTS
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_app_current_ces()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(current_setting('app.current_ces', true), '');
$$;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- 14. SANITY CHECKS — verify row counts after migration
-- ═══════════════════════════════════════════════════════════════

SELECT 'profiles' AS table_name, count(*) AS rows FROM public.profiles
UNION ALL SELECT 'wishes', count(*) FROM public.wishes
UNION ALL SELECT 'vendors', count(*) FROM public.vendors
UNION ALL SELECT 'offerings', count(*) FROM public.offerings
UNION ALL SELECT 'exchange_agreements', count(*) FROM public.exchange_agreements
UNION ALL SELECT 'exchange_requests', count(*) FROM public.exchange_requests
UNION ALL SELECT 'exchange_calendars', count(*) FROM public.exchange_calendars
UNION ALL SELECT 'exchange_alerts', count(*) FROM public.exchange_alerts
UNION ALL SELECT 'exchange_journeys', count(*) FROM public.exchange_journeys
UNION ALL SELECT 'vendor_invites', count(*) FROM public.vendor_invites
UNION ALL SELECT 'vendor_join_requests', count(*) FROM public.vendor_join_requests
UNION ALL SELECT 'collective_petitions', count(*) FROM public.collective_petitions;

-- Verify key columns exist
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'wishes', 'vendors', 'offerings')
  AND column_name IN ('is_private', 'exchange_policy', 'fulfillers', 'discovery_eligible')
ORDER BY table_name, column_name;
