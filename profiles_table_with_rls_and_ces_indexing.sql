-- ============================================
-- Heartlight Collective — profiles table
-- Safe to re-run. Idempotent columns + policies.
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop any conflicting legacy/current policies before recreating them
DROP POLICY IF EXISTS "Allow public read access" ON profiles;
DROP POLICY IF EXISTS "Allow public insert" ON profiles;
DROP POLICY IF EXISTS "Allow public update" ON profiles;
DROP POLICY IF EXISTS "Allow anon access" ON profiles;
DROP POLICY IF EXISTS "Allow anon read" ON profiles;
DROP POLICY IF EXISTS "Allow anon read access" ON profiles;
DROP POLICY IF EXISTS "Allow anon insert" ON profiles;
DROP POLICY IF EXISTS "Allow anon update" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated own profile update" ON profiles;

-- Permissive read access for directory + sign-in
CREATE POLICY "Allow anon read access" ON profiles
  FOR SELECT
  USING (true);

-- Allow new profile creation
CREATE POLICY "Allow anon insert" ON profiles
  FOR INSERT
  WITH CHECK (true);

-- Allow profile updates (application layer validates ownership)
CREATE POLICY "Allow anon update" ON profiles
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Authenticated users can update their own profile by UUID
CREATE POLICY "Allow authenticated own profile update" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Index for CES-number lookups
CREATE INDEX IF NOT EXISTS idx_profiles_ces_number ON profiles(ces_number);

-- Add columns idempotently for existing tables (already included above for new tables)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS peer_payment_methods jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS location_data jsonb,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Quick validation query
SELECT ces_number, name, stewardship FROM profiles WHERE ces_number = '886233612';
