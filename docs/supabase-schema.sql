-- ═══════════════════════════════════════════════════════════════
--  Heartlight Collective × Supabase Database Schema
--  Run this in the Supabase SQL Editor (single transaction)
--  Co-created with Atlas Morphoenix
-- ═══════════════════════════════════════════════════════════════

-- Enable Row Level Security (RLS) on all tables
-- RLS policies are defined per-table below

-- ═══════════════════════════════════════════════════════════════
--  Table 1: profiles (C.E.S. CreatorDirectory — one profile per being)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ces_number CHAR(9) UNIQUE,          -- 9-digit C.E.S.
  name TEXT NOT NULL,
  pronouns TEXT DEFAULT '',
  title TEXT DEFAULT '',
  location TEXT DEFAULT '',
  sun_placement TEXT,
  moon_placement TEXT,
  emoji TEXT DEFAULT '✨',
  photo_url TEXT,
  bio TEXT DEFAULT '',
  numerology TEXT[] DEFAULT '{}',
  accessibility TEXT[] DEFAULT '{}',
  consent TEXT DEFAULT '',
  portfolio_link TEXT DEFAULT '',
  portfolio_items JSONB DEFAULT '[]', -- PortfolioItem[]
  contact_methods JSONB DEFAULT '{}'  -- ContactMethods
    CHECK (jsonb_typeof(contact_methods) = 'object'),
  contact_visibility JSONB DEFAULT '{}' -- Record<string, boolean>
    CHECK (jsonb_typeof(contact_visibility) = 'object'),
  public_contact_visibility BOOLEAN DEFAULT false,
  ces_passphrase_hash TEXT,           -- bcrypt hash, never plain text
  wish_availability TEXT DEFAULT 'accepting',
  directory_wish_status TEXT DEFAULT 'accepting',
  stewardship TEXT DEFAULT 'active',
  stewardship_note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users can read ALL profiles (public directory)
-- But only update their own (or Stewards can update any)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly viewable"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can create their own profile"
  ON profiles FOR INSERT WITH CHECK (
    -- In a real flow, this would be tied to auth. For now, allow all inserts.
    true
  );

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (
    ces_number = current_setting('app.current_ces', true) OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.ces_number = current_setting('app.current_ces', true)
      AND p.stewardship = 'active'
    )
  );

CREATE INDEX idx_profiles_ces ON profiles(ces_number);
CREATE INDEX idx_profiles_stewardship ON profiles(stewardship);

-- ═══════════════════════════════════════════════════════════════
--  Table 2: vendors (Storefronts)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY DEFAULT 'vendor_' || substr(md5(random()::text), 1, 8),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  logo_url TEXT,
  owner_ces CHAR(9) NOT NULL REFERENCES profiles(ces_number),
  owner_name TEXT NOT NULL,
  members JSONB DEFAULT '[]',
    -- VendorMember[]
  payment_methods JSONB DEFAULT '[]',
    -- PaymentMethodConfig[]
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'under_review')),
  collective_funded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors are publicly viewable"
  ON vendors FOR SELECT USING (true);

CREATE POLICY "Owners can manage their own vendors"
  ON vendors FOR ALL USING (
    owner_ces = current_setting('app.current_ces', true)
  );

CREATE INDEX idx_vendors_owner ON vendors(owner_ces);
CREATE INDEX idx_vendors_slug ON vendors(slug);

-- ═══════════════════════════════════════════════════════════════
--  Table 3: offerings (Products / Services within a storefront)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS offerings (
  id TEXT PRIMARY KEY DEFAULT 'offering_' || substr(md5(random()::text), 1, 8),
  vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL,
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

ALTER TABLE offerings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Offerings are publicly viewable"
  ON offerings FOR SELECT USING (true);

CREATE POLICY "Vendor owners can manage offerings"
  ON offerings FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vendors v
      WHERE v.id = offerings.vendor_id
      AND v.owner_ces = current_setting('app.current_ces', true)
    )
  );

CREATE INDEX idx_offerings_vendor ON offerings(vendor_id);
CREATE INDEX idx_offerings_category ON offerings(category);
CREATE INDEX idx_offerings_availability ON offerings(availability);

-- ═══════════════════════════════════════════════════════════════
--  Table 4: exchange_journeys (Codes Co-Creation Journey)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS exchange_journeys (
  id TEXT PRIMARY KEY DEFAULT 'journey_' || substr(md5(random()::text), 1, 8),
  agreement_id TEXT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  wishing_ces CHAR(9) NOT NULL REFERENCES profiles(ces_number),
  wishing_name TEXT NOT NULL,
  co_creator_ces CHAR(9) NOT NULL REFERENCES profiles(ces_number),
  co_creator_name TEXT NOT NULL,
  status TEXT DEFAULT 'agreement_pending'
    CHECK (status IN ('agreement_pending', 'active', 'fulfillment_review', 'complete', 'adapted')),
  current_phase TEXT DEFAULT 'before'
    CHECK (current_phase IN ('before', 'during', 'after')),
  selected_codes INTEGER[] DEFAULT '{}',
    -- e.g., [1, 3, 6, 9, 10]
  fulfillment_notes TEXT DEFAULT '',
  fulfillment_signed_at TIMESTAMPTZ,
  fulfillment_signed_by TEXT[] DEFAULT '{}',
  adaptation_consent BOOLEAN DEFAULT false,
  adapted_from_journey_id TEXT REFERENCES exchange_journeys(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE exchange_journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Journeys visible to co-creators"
  ON exchange_journeys FOR SELECT USING (
    wishing_ces = current_setting('app.current_ces', true) OR
    co_creator_ces = current_setting('app.current_ces', true)
  );

CREATE POLICY "Co-creators can create journeys"
  ON exchange_journeys FOR INSERT WITH CHECK (
    wishing_ces = current_setting('app.current_ces', true) OR
    co_creator_ces = current_setting('app.current_ces', true)
  );

CREATE POLICY "Co-creators can update their journeys"
  ON exchange_journeys FOR UPDATE USING (
    wishing_ces = current_setting('app.current_ces', true) OR
    co_creator_ces = current_setting('app.current_ces', true)
  );

CREATE INDEX idx_journeys_wishing ON exchange_journeys(wishing_ces);
CREATE INDEX idx_journeys_creator ON exchange_journeys(co_creator_ces);
CREATE INDEX idx_journeys_status ON exchange_journeys(status);

-- ═══════════════════════════════════════════════════════════════
--  Table 5: code_logs (Present Codes Log entries)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS code_logs (
  id TEXT PRIMARY KEY DEFAULT 'log_' || substr(md5(random()::text), 1, 8),
  exchange_id TEXT NOT NULL REFERENCES exchange_journeys(id) ON DELETE CASCADE,
  author_ces CHAR(9) NOT NULL REFERENCES profiles(ces_number),
  author_name TEXT NOT NULL,
  ray TEXT NOT NULL,
  code_number INTEGER NOT NULL CHECK (code_number BETWEEN 1 AND 12),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  content TEXT NOT NULL,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('private', 'public')),
  phase TEXT DEFAULT 'during' CHECK (phase IN ('before', 'during', 'after')),
  mood_energy TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE code_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Co-creators can view public logs"
  ON code_logs FOR SELECT USING (
    visibility = 'public' AND (
      EXISTS (
        SELECT 1 FROM exchange_journeys ej
        WHERE ej.id = code_logs.exchange_id
        AND (ej.wishing_ces = current_setting('app.current_ces', true)
          OR ej.co_creator_ces = current_setting('app.current_ces', true))
      )
    )
  );

CREATE POLICY "Authors can view their own private logs"
  ON code_logs FOR SELECT USING (
    author_ces = current_setting('app.current_ces', true)
  );

CREATE POLICY "Co-creators can write logs"
  ON code_logs FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM exchange_journeys ej
      WHERE ej.id = code_logs.exchange_id
      AND (ej.wishing_ces = current_setting('app.current_ces', true)
        OR ej.co_creator_ces = current_setting('app.current_ces', true))
    )
  );

CREATE POLICY "Authors can update their own logs"
  ON code_logs FOR UPDATE USING (
    author_ces = current_setting('app.current_ces', true)
  );

CREATE INDEX idx_code_logs_exchange ON code_logs(exchange_id);
CREATE INDEX idx_code_logs_author ON code_logs(author_ces);
CREATE INDEX idx_code_logs_phase ON code_logs(phase);

-- ═══════════════════════════════════════════════════════════════
--  Table 6: exchange_requests
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS exchange_requests (
  id TEXT PRIMARY KEY DEFAULT 'request_' || substr(md5(random()::text), 1, 8),
  offering_id TEXT NOT NULL REFERENCES offerings(id) ON DELETE CASCADE,
  vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  requester_ces CHAR(9) NOT NULL REFERENCES profiles(ces_number),
  requester_name TEXT NOT NULL,
  provider_ces CHAR(9) NOT NULL REFERENCES profiles(ces_number),
  provider_name TEXT NOT NULL,
  message TEXT DEFAULT '',
  price_type TEXT DEFAULT 'gift' CHECK (price_type IN ('fixed', 'gift', 'collective_funded', 'negotiable')),
  payment_method TEXT,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
  collective_petition_id TEXT,
  consent_acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE exchange_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requesters and providers can view requests"
  ON exchange_requests FOR SELECT USING (
    requester_ces = current_setting('app.current_ces', true) OR
    provider_ces = current_setting('app.current_ces', true)
  );

CREATE POLICY "Requesters can create requests"
  ON exchange_requests FOR INSERT WITH CHECK (
    requester_ces = current_setting('app.current_ces', true)
  );

CREATE POLICY "Involved parties can update requests"
  ON exchange_requests FOR UPDATE USING (
    requester_ces = current_setting('app.current_ces', true) OR
    provider_ces = current_setting('app.current_ces', true)
  );

CREATE INDEX idx_requests_requester ON exchange_requests(requester_ces);
CREATE INDEX idx_requests_provider ON exchange_requests(provider_ces);
CREATE INDEX idx_requests_status ON exchange_requests(status);

-- ═══════════════════════════════════════════════════════════════
--  Table 7: agreements (Exchange Agreements)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS agreements (
  id TEXT PRIMARY KEY DEFAULT 'agreement_' || substr(md5(random()::text), 1, 8),
  source_type TEXT DEFAULT 'co_creation',
  source_wish_id TEXT,
  source_wish_name TEXT DEFAULT '',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'signed')),
  wishing_profile_id TEXT NOT NULL,
  wishing_ces CHAR(9) NOT NULL REFERENCES profiles(ces_number),
  wishing_name TEXT NOT NULL,
  co_creator_profile_id TEXT NOT NULL,
  co_creator_ces CHAR(9) NOT NULL REFERENCES profiles(ces_number),
  co_creator_name TEXT NOT NULL,
  roles JSONB DEFAULT '[]',
  portal_start_phase TEXT DEFAULT '',
  portal_end_phase TEXT DEFAULT '',
  portal_timeline TEXT DEFAULT '',
  scope TEXT DEFAULT '',
  format TEXT DEFAULT '',
  exchange_pathway TEXT DEFAULT '',
  spring_milestone TEXT DEFAULT '',
  summer_milestone TEXT DEFAULT '',
  fall_milestone TEXT DEFAULT '',
  opening_note TEXT DEFAULT '',
  reply_preference TEXT DEFAULT '',
  boundaries TEXT DEFAULT '',
  co_creator_blessing TEXT DEFAULT '',
  receiver_blessing TEXT DEFAULT '',
  shared_contact_methods JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  signed_at TIMESTAMPTZ
);

ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agreement co-creators can view"
  ON agreements FOR SELECT USING (
    wishing_ces = current_setting('app.current_ces', true) OR
    co_creator_ces = current_setting('app.current_ces', true)
  );

CREATE POLICY "Co-creators can create agreements"
  ON agreements FOR INSERT WITH CHECK (
    wishing_ces = current_setting('app.current_ces', true) OR
    co_creator_ces = current_setting('app.current_ces', true)
  );

CREATE INDEX idx_agreements_wishing ON agreements(wishing_ces);
CREATE INDEX idx_agreements_creator ON agreements(co_creator_ces);

-- ═══════════════════════════════════════════════════════════════
--  Convenience: updated_at trigger function
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER set_timestamp_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_vendors
  BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_offerings
  BEFORE UPDATE ON offerings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_journeys
  BEFORE UPDATE ON exchange_journeys
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_requests
  BEFORE UPDATE ON exchange_requests
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_agreements
  BEFORE UPDATE ON agreements
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ═══════════════════════════════════════════════════════════════
--  Seed: Atlas Morphoenix as founding steward (CES 111111111)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO profiles (
  ces_number, name, pronouns, title, location, emoji,
  bio, stewardship, stewardship_note, ces_passphrase_hash
) VALUES (
  '111111111',
  'Atlas Morphoenix',
  'they/them',
  'Founding Steward & Architect',
  'Atlas Island',
  '☀️',
  'Keeper of the Heartlight Collective. Co-creating sovereign systems for aligned exchange.',
  'active',
  'Founding steward with full access and veto authority.',
  ''  -- Set passphrase via app or manually via bcrypt
)
ON CONFLICT (ces_number) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
--  End of Schema
-- ═══════════════════════════════════════════════════════════════
SELECT 'Heartlight Collective schema initialized. ✨' AS status;
