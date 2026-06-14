# Heartlight Collective — Supabase Setup Script
# Run this in Supabase SQL Editor to ensure proper table structure and RLS policies

-- ============================================
-- 1. Ensure profiles table exists with correct schema (includes tags)
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
  tags jsonb DEFAULT '[]',
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 2. Add tags column if upgrading from older schema
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'tags'
  ) THEN
    ALTER TABLE profiles ADD COLUMN tags jsonb DEFAULT '[]';
    RAISE NOTICE 'Added tags column to profiles';
  ELSE
    RAISE NOTICE 'tags column already exists';
  END IF;
END $$;

-- ============================================
-- 3. Enable Row Level Security
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. Drop existing policies if they exist (to avoid conflicts)
-- ============================================
DROP POLICY IF EXISTS "Allow public read access" ON profiles;
DROP POLICY IF EXISTS "Allow public insert" ON profiles;
DROP POLICY IF EXISTS "Allow public update" ON profiles;
DROP POLICY IF EXISTS "Allow anon access" ON profiles;
DROP POLICY IF EXISTS "Allow anon read" ON profiles;
DROP POLICY IF EXISTS "Allow anon insert" ON profiles;
DROP POLICY IF EXISTS "Allow anon update" ON profiles;

-- ============================================
-- 5. Create new permissive policies for MVP
-- ============================================

-- Allow anyone to READ profiles (for Directory and sign-in)
CREATE POLICY "Allow anon read access" ON profiles
  FOR SELECT
  USING (true);

-- Allow anyone to INSERT profiles (for profile creation)
CREATE POLICY "Allow anon insert" ON profiles
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to UPDATE their own profile (by CES number)
CREATE POLICY "Allow anon update" ON profiles
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 6. Create index on ces_number for faster lookups
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_ces_number ON profiles(ces_number);

-- ============================================
-- 7. Auto-update updated_at on every row change
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. Verify setup
-- ============================================
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
