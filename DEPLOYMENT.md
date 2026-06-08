# Cross-Browser Sync Setup Guide ✦

## Problem
Profiles are stored in browser localStorage only — they don't sync across browsers because Supabase credentials are in `.env.local` (gitignored) and not deployed to Vercel.

## Solution: Add Supabase Env Vars to Vercel

### Option 1: Vercel Dashboard (Recommended — 2 minutes)

1. Go to https://vercel.com/dashboard
2. Select the **heartlight-collective** project
3. Click **Settings** → **Environment Variables**
4. Add these two variables from your `.env.local`:

   ```
   VITE_SUPABASE_URL = https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY = your-anon-key-here
   ```

5. Click **Save**
6. Redeploy: Go to **Deployments** → click latest deployment → **Redeploy**

### Option 2: Vercel CLI (If you have auth)

```bash
cd /Users/atlasmorphoenix/workspace/heartlight-collective
vercel env pull .env.production.local  # Pull existing env vars
# Edit .env.production.local with your Supabase credentials
vercel env push  # Push to Vercel
```

### Option 3: GitHub Actions (Automated)

A workflow file can be added to inject env vars during deploy. This requires setting up GitHub repository secrets first.

## Verify It Works

After redeploying:

1. Open Chrome → Create a profile
2. Open Safari (incognito) → Go to `/steward`
3. Sign in with your steward credentials (C.E.S. `111111111`, passphrase `sovereign42`)
4. You should see the profile in the **Pending** tab ✦

## Steward Credentials

Default founding steward (seeded on first load):
- **C.E.S.:** `111111111`
- **Passphrase:** `sovereign42`

## What Changed

- `useUnifiedStorage` now queries Supabase for profiles by stewardship status
- Steward panel reads from Supabase first, falls back to localStorage
- Profile moves (approve/return) sync to Supabase
- New profiles are created with `stewardship: 'pending'` (not `'active'`)

## Database Schema Required

Your Supabase `profiles` table needs these columns:
- `stewardship` (text) — values: `'pending'`, `'active'`, `'suspended'`, `'banned'`, `'returned'`
- `ces_number` (text, unique)
- `ces_passphrase_hash` (text)
- `guide_guardian_status` (text) — values: `'not_opted_in'`, `'opted_in'`, `'companion'`, `'active'`, `'inactive'`, `'declined'`
- `guide_guardian_opted_in_at` (timestamptz) — timestamp when being opted in
- All existing columns from the schema

If the table doesn't exist yet, create it via Supabase SQL Editor:

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ces_number text UNIQUE NOT NULL,
  name text NOT NULL,
  pronouns text DEFAULT '',
  title text DEFAULT '',
  location text DEFAULT '',
  sun_placement text,
  moon_placement text,
  emoji text DEFAULT '✨',
  photo_url text,
  bio text DEFAULT '',
  numerology jsonb DEFAULT '[]',
  accessibility jsonb DEFAULT '[]',
  consent text DEFAULT '',
  portfolio_link text DEFAULT '',
  portfolio_items jsonb DEFAULT '[]',
  contact_methods jsonb DEFAULT '{}',
  contact_visibility jsonb DEFAULT '{}',
  public_contact_visibility boolean DEFAULT false,
  ces_passphrase_hash text,
  wish_availability text DEFAULT 'accepting',
  directory_wish_status text DEFAULT 'accepting',
  stewardship text DEFAULT 'pending',
  stewardship_note text DEFAULT '',
  guide_guardian_status text DEFAULT 'not_opted_in',
  guide_guardian_opted_in_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS (optional for now, since anon key has full access)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow anon read/write (for MVP — tighten later)
CREATE POLICY "Allow anon access" ON profiles
  FOR ALL USING (true) WITH CHECK (true);
```

## Phase 1 Migration (Run This After Deploying)

If you already have a `profiles` table from before Phase 1, run this migration to add the new Guide & Guardian columns:

```sql
-- Add Guide & Guardian status tracking
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS guide_guardian_status text DEFAULT 'not_opted_in',
  ADD COLUMN IF NOT EXISTS guide_guardian_opted_in_at timestamptz DEFAULT NULL;

-- Add index for faster filtering (optional)
CREATE INDEX IF NOT EXISTS idx_profiles_guide_guardian_status 
  ON profiles(guide_guardian_status);

-- Update existing profiles to default state
UPDATE profiles 
  SET guide_guardian_status = 'not_opted_in' 
  WHERE guide_guardian_status IS NULL;
```

**How to run:** Go to your Supabase project → SQL Editor → paste the migration → Run ✦
