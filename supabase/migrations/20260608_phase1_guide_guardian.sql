-- ═══════════════════════════════════════════════════════════════
--  Heartlight Collective — Phase 1 Migration
--  Add Guide & Guardian journey tracking columns
--  Run this in Supabase SQL Editor after deploying Phase 1
-- ═══════════════════════════════════════════════════════════════

-- Add Guide & Guardian status tracking
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS guide_guardian_status text DEFAULT 'not_opted_in',
  ADD COLUMN IF NOT EXISTS guide_guardian_opted_in_at timestamptz DEFAULT NULL;

-- Add index for faster filtering by Guide & Guardian status (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_profiles_guide_guardian_status 
  ON profiles(guide_guardian_status);

-- Update existing profiles to 'not_opted_in' (default for beings who haven't opted in)
UPDATE profiles 
  SET guide_guardian_status = 'not_opted_in' 
  WHERE guide_guardian_status IS NULL;

-- Verify the columns were added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('guide_guardian_status', 'guide_guardian_opted_in_at')
ORDER BY ordinal_position;
