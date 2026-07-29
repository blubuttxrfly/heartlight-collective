-- ============================================
-- Heartlight Collective — Fix Missing Function + Add Tags
-- Run these THREE blocks in order in Supabase SQL Editor
-- ============================================

-- ─── BLOCK 1: Create the function FIRST (this was missing!) ───
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── BLOCK 2: Add tags column if it doesn't exist ───
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'tags'
  ) THEN
    ALTER TABLE profiles ADD COLUMN tags jsonb DEFAULT '[]';
    RAISE NOTICE 'Added tags column to profiles';
  ELSE
    RAISE NOTICE 'tags column already exists — no changes needed';
  END IF;
END $$;

-- ─── BLOCK 3: Create the trigger (only after function exists) ───
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─── Verify everything worked ───
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name IN ('tags', 'updated_at')
ORDER BY ordinal_position;
