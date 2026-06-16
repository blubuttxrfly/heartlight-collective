-- ============================================
-- Heartlight Collective — Wave 7.5 Exchange Entity Tables
-- Idempotent migration. Safe to re-run.
-- Open collective transparency by default.
-- ============================================

-- ── Exchange Agreements (multi-party, Wave 6.9+) ──
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for agreement lookups
CREATE INDEX IF NOT EXISTS idx_exchange_agreements_requester_ces ON public.exchange_agreements(requester_ces);
CREATE INDEX IF NOT EXISTS idx_exchange_agreements_provider_ces ON public.exchange_agreements(provider_ces);
CREATE INDEX IF NOT EXISTS idx_exchange_agreements_status ON public.exchange_agreements(status);
CREATE INDEX IF NOT EXISTS idx_exchange_agreements_vendor_id ON public.exchange_agreements(vendor_id);
CREATE INDEX IF NOT EXISTS idx_exchange_agreements_wish_id ON public.exchange_agreements(wish_id);

-- ── Exchange Calendars (per-being availability + meetings) ──
CREATE TABLE IF NOT EXISTS public.exchange_calendars (
  ces text PRIMARY KEY,
  availability_blocks jsonb DEFAULT '[]'::jsonb,
  scheduled_meetings jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exchange_calendars_ces ON public.exchange_calendars(ces);

-- ── Exchange Alerts (Steward Gate) ──
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

CREATE INDEX IF NOT EXISTS idx_exchange_alerts_exchange_id ON public.exchange_alerts(exchange_id);
CREATE INDEX IF NOT EXISTS idx_exchange_alerts_from_ces ON public.exchange_alerts(from_ces);
CREATE INDEX IF NOT EXISTS idx_exchange_alerts_status ON public.exchange_alerts(status);

-- ── Vendor Invites ──
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

CREATE INDEX IF NOT EXISTS idx_vendor_invites_vendor_id ON public.vendor_invites(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_invites_invitee_ces ON public.vendor_invites(invitee_ces);
CREATE INDEX IF NOT EXISTS idx_vendor_invites_invited_by_ces ON public.vendor_invites(invited_by_ces);

-- ── Vendor Join Requests ──
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

CREATE INDEX IF NOT EXISTS idx_vendor_join_requests_vendor_id ON public.vendor_join_requests(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_join_requests_requester_ces ON public.vendor_join_requests(requester_ces);

-- ── Collective Petitions ──
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

CREATE INDEX IF NOT EXISTS idx_collective_petitions_requester_ces ON public.collective_petitions(requester_ces);
CREATE INDEX IF NOT EXISTS idx_collective_petitions_provider_ces ON public.collective_petitions(provider_ces);
CREATE INDEX IF NOT EXISTS idx_collective_petitions_status ON public.collective_petitions(status);

-- ── Wishes / Gifts (Heartlight Exchange) ──
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wishes_author_ces ON public.wishes(author_ces);
CREATE INDEX IF NOT EXISTS idx_wishes_status ON public.wishes(status);
CREATE INDEX IF NOT EXISTS idx_wishes_type ON public.wishes(type);
CREATE INDEX IF NOT EXISTS idx_wishes_scope ON public.wishes(scope);

-- ============================================
-- Row Level Security — Open Collective Transparency
-- ============================================

ALTER TABLE public.exchange_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collective_petitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;

-- Helper: drop existing policies idempotently
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'exchange_agreements',
    'exchange_calendars',
    'exchange_alerts',
    'vendor_invites',
    'vendor_join_requests',
    'collective_petitions',
    'wishes'
  ];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow anon read" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow anon insert" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow anon update" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow anon delete" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated read" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated insert" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated update" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated delete" ON public.%I', t);
  END LOOP;
END $$;

-- Apply permissive policies to each exchange table
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'exchange_agreements',
    'exchange_calendars',
    'exchange_alerts',
    'vendor_invites',
    'vendor_join_requests',
    'collective_petitions',
    'wishes'
  ];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    -- Open collective read for all
    EXECUTE format(
      'CREATE POLICY "Allow anon read" ON public.%I FOR SELECT TO anon, authenticated USING (true)',
      t
    );
    -- Allow any client to insert (application validates ownership/CES)
    EXECUTE format(
      'CREATE POLICY "Allow anon insert" ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (true)',
      t
    );
    -- Allow any client to update (application validates ownership/CES)
    EXECUTE format(
      'CREATE POLICY "Allow anon update" ON public.%I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)',
      t
    );
    -- Allow any client to delete (application validates ownership/CES)
    EXECUTE format(
      'CREATE POLICY "Allow anon delete" ON public.%I FOR DELETE TO anon, authenticated USING (true)',
      t
    );
  END LOOP;
END $$;

-- Quick sanity checks
SELECT 'exchange_agreements' AS table_name, count(*) AS rows FROM public.exchange_agreements
UNION ALL SELECT 'exchange_calendars', count(*) FROM public.exchange_calendars
UNION ALL SELECT 'exchange_alerts', count(*) FROM public.exchange_alerts
UNION ALL SELECT 'vendor_invites', count(*) FROM public.vendor_invites
UNION ALL SELECT 'vendor_join_requests', count(*) FROM public.vendor_join_requests
UNION ALL SELECT 'collective_petitions', count(*) FROM public.collective_petitions
UNION ALL SELECT 'wishes', count(*) FROM public.wishes;
