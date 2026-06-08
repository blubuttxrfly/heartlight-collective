# Supabase Cross-Browser Sync Setup ✦

## Current Issue
Diagnostics show: "Connection failed: TypeError: Load failed"

This means Vercel can't reach Supabase. Here's how to fix it:

---

## Step 1: Verify Supabase Table Exists

1. Go to your Supabase project: **https://supabase.com/dashboard/project/rvxogihtwztdzxbwktzr**
2. Click **Table Editor** in the left sidebar
3. Look for a table named `profiles`

**If the table DOESN'T exist:**
- Click **New Table** → **Create a new table**
- Or run this SQL in **SQL Editor**:

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
```

---

## Step 2: Configure CORS (Request Origins)

1. In Supabase dashboard, click **Settings** (gear icon) in left sidebar
2. Click **API**
3. Scroll down to **Request Origin** (or **CORS**) section
4. You should see a text field for allowed origins
5. Add these URLs (one per line or comma-separated):

```
https://heartlight-collective.vercel.app
https://heartlight-collective-git-main.vercel.app
http://localhost:5173
```

6. Or use `*` to allow all origins (for testing only)
7. Click **Save**

---

## Step 3: Verify Environment Variables in Vercel

1. Go to **https://vercel.com/dashboard**
2. Click on **heartlight-collective** project
3. Click **Settings** tab
4. Click **Environment Variables** in left sidebar
5. Verify these two exist:

```
VITE_SUPABASE_URL = https://rvxogihtwztdzxbwktzr.supabase.co
VITE_SUPABASE_ANON_KEY = sb_publishable_... (your full key)
```

**If they don't exist:**
- Click **Add New**
- Add each variable
- Copy values from your `.env.local` file
- Make sure they're enabled for **Production** environment
- Click **Save**

6. **Redeploy** after adding env vars:
   - Go to **Deployments** tab
   - Click the three dots (⋮) on the latest deployment
   - Click **Redeploy**

---

## Step 4: Test the Connection

After completing steps 1-3:

1. Wait 2-3 minutes for Vercel redeploy to finish
2. Visit: **https://heartlight-collective.vercel.app/diagnostics**
3. Check if it now shows "✓ Supabase is reachable"

---

## Step 5: Alternative - Direct Connection Test

If still failing, try this direct test:

1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to **Console** tab
3. Paste this and press Enter:

```javascript
fetch('https://rvxogihtwztdzxbwktzr.supabase.co/rest/v1/profiles?limit=1', {
  headers: {
    'apikey': 'YOUR_ANON_KEY_HERE',
    'Authorization': 'Bearer YOUR_ANON_KEY_HERE',
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log).catch(console.error)
```

Replace `YOUR_ANON_KEY_HERE` with your actual anon key from `.env.local`

**Expected results:**
- ✓ Success: Returns `[]` (empty array) or profile data
- ✗ Error: Shows specific error message (CORS, auth, table not found, etc.)

---

## Common Issues & Fixes

### "Table 'profiles' does not exist"
→ Run the CREATE TABLE SQL from Step 1

### "CORS policy" or "Network Error"
→ Add Vercel URLs to Request Origin in Supabase API settings

### "Invalid API key"
→ Double-check VITE_SUPABASE_ANON_KEY in Vercel matches your Supabase dashboard

### "TypeError: Load failed" (generic)
→ Usually CORS or wrong URL. Check Steps 2 & 3 carefully

---

## Need Help?

If none of this works, share:
1. Screenshot of Supabase Table Editor (showing tables list)
2. Screenshot of Supabase API settings (Request Origin section)
3. Screenshot of Vercel Environment Variables (just the names, not values)
4. Full error message from DevTools Console test (Step 5)

This will help diagnose the exact issue! 💗✨
