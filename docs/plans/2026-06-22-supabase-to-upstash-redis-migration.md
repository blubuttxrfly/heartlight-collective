# Heartlight Collective — Supabase → Upstash Redis Migration Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan wave-by-wave.
> **Co-created with:** Atlas Morphoenix
> **Date:** 2026-06-22

**Goal:** Replace Supabase (Postgres + Auth) entirely with Upstash Redis as the serverless data layer on Vercel, keeping the existing CES + passphrase sovereign auth pattern.

**Architecture:** Vite SPA (unchanged frontend) → Vercel Serverless API routes (`/api/*`) → Upstash Redis (REST-based, serverless-friendly). Redis tokens stay server-side only. localStorage remains as the sovereign backup/cache layer. A one-time migration script reads all Supabase data and writes it into Redis.

**Tech Stack:**
- `@upstash/redis` — serverless Redis client (REST, not TCP — perfect for edge/serverless)
- Vercel Serverless Functions — `/api/` directory pattern (works with Vite SPA)
- `bcryptjs` — passphrase hashing (replaces Supabase Auth)
- Existing: React 19, Vite 8, TypeScript, Tailwind 4, localStorage

---

## Vision & Decisions (Co-created with Atlas)

1. **Full replacement** — Supabase is removed completely. No hybrid. No fallback to Supabase.
2. **Serverless API routes** — All Redis operations go through `/api/*` serverless functions. Redis tokens NEVER touch the browser.
3. **One-time data migration** — A script reads all existing Supabase data and writes it into Upstash Redis before the cutover.
4. **CES + passphrase auth** — Sovereign identity stays as-is. bCrypt hashes stored in Redis. Email auth is a future addition, not part of this migration.
5. **localStorage stays** — The dual-mode pattern (cloud first, localStorage fallback) is preserved. Redis replaces Supabase as the "cloud" layer.
6. **Wave-based implementation** — Each wave is a focused, reviewable unit with `npx tsc --noEmit` gate before proceeding.

---

## Redis Data Model Mapping

Postgres tables → Redis key-value namespaces. Each entity is stored as a JSON string under a namespaced key. Index sets enable lookups by secondary keys (CES number, vendor ID, owner CES, etc.).

### Key Namespace Design

| Entity | Primary Key | Index Sets | Notes |
|--------|------------|------------|-------|
| profiles | `hlc:profile:{ces}` | `hlc:profiles:all` (SET) | CES number is the natural key |
| vendors | `hlc:vendor:{id}` | `hlc:vendors:all`, `hlc:vendors:owner:{ces}` | |
| offerings | `hlc:offering:{id}` | `hlc:offerings:all`, `hlc:offerings:vendor:{vid}` | |
| wishes | `hlc:wish:{id}` | `hlc:wishes:all`, `hlc:wishes:author:{ces}` | |
| exchange_requests | `hlc:exch_req:{id}` | `hlc:exch_reqs:all`, `hlc:exch_reqs:requester:{ces}`, `hlc:exch_reqs:provider:{ces}` | |
| exchange_agreements | `hlc:exch_agr:{id}` | `hlc:exch_agrs:all`, `hlc:exch_agrs:ces:{ces}` | |
| exchange_journeys | `hlc:exch_jrn:{id}` | `hlc:exch_jrns:all`, `hlc:exch_jrns:ces:{ces}` | |
| exchange_calendars | `hlc:exch_cal:{ces}` | `hlc:exch_cals:all` | CES is the key (one per being) |
| vendor_invites | `hlc:vend_inv:{id}` | `hlc:vend_invs:all`, `hlc:vend_invs:vendor:{vid}` | |
| vendor_join_requests | `hlc:vend_jr:{id}` | `hlc:vend_jrs:all`, `hlc:vend_jrs:vendor:{vid}` | |
| collective_petitions | `hlc:col_pet:{id}` | `hlc:col_pets:all` | |
| exchange_alerts | `hlc:exch_alt:{id}` | `hlc:exch_alts:all`, `hlc:exch_alts:to:{ces}` | |
| code_logs | `hlc:code_log:{id}` | `hlc:code_logs:all`, `hlc:code_logs:exchange:{eid}` | |
| agreements | `hlc:agr:{id}` | `hlc:agrs:all`, `hlc:agrs:ces:{ces}` | Legacy agreements table |

### Design Principles
- **JSON values** — Each entity is stored as a JSON string. No Redis hashes (simpler, matches existing row-mapper pattern).
- **Index sets** — Redis SETs track all IDs per entity type + secondary indexes (by CES, vendor ID, etc.) for fast lookups.
- **No foreign key enforcement** — Application layer handles relationship integrity (same as current Supabase RLS bypass).
- **TTL: none** — All data is persistent. No automatic expiry.
- **updated_at** — Stored inside each JSON value (no Postgres trigger needed).

---

## File Structure Overview

### New files (API routes + Redis client)
```
api/
  _lib/
    redis.ts          — Upstash Redis client singleton (server-side only)
    auth.ts           — CES + passphrase verification helper
    response.ts       — JSON response helpers
  profiles/
    route.ts          — GET (list all), POST (create)
    [ces]/
      route.ts        — GET (one), PUT (update), DELETE
    stewardship/
      [status]/
        route.ts      — GET by stewardship status
  vendors/
    route.ts          — GET (list), POST (create)
    [id]/
      route.ts        — GET, PUT, DELETE
  offerings/
    route.ts          — GET (list), POST (create)
    [id]/
      route.ts        — GET, PUT, DELETE
  wishes/
    route.ts          — GET (list), POST (create)
    [id]/
      route.ts        — GET, PUT, DELETE
  exchange-requests/
    route.ts          — GET, POST
    [id]/
      route.ts        — PUT
  exchange-agreements/
    route.ts          — GET, POST
    [id]/
      route.ts        — PUT, DELETE
  exchange-journeys/
    route.ts          — GET, POST
    [id]/
      route.ts        — PUT, DELETE
  exchange-calendars/
    [ces]/
      route.ts        — GET, PUT
  vendor-invites/
    route.ts          — GET, POST
    [id]/
      route.ts        — PUT
  vendor-join-requests/
    route.ts          — GET, POST
    [id]/
      route.ts        — PUT
  collective-petitions/
    route.ts          — GET, POST
    [id]/
      route.ts        — PUT
  exchange-alerts/
    route.ts          — GET, POST
    [id]/
      route.ts        — PUT
  hydrate/
    route.ts          — GET (pull all exchange state for hydration)
```

### New files (migration script)
```
scripts/
  migrate-supabase-to-redis.ts  — One-time migration: reads Supabase → writes Upstash
```

### Modified files (frontend → API instead of Supabase)
```
src/lib/supabase.ts           → REPLACED with src/lib/api.ts (client-side fetch wrapper)
src/hooks/useUnifiedStorage.ts → Updated to call /api/* instead of supabase.from()
src/lib/exchangeSync.ts       → Updated to call /api/* instead of supabase.from()
src/lib/storage.tsx           → Updated hydration to call /api/hydrate instead of hydrateExchangeState
src/pages/Diagnostics.tsx     → Updated to show Redis connection status instead of Supabase
```

### Removed files/dependencies
```
src/lib/supabase.ts           — Removed (replaced by api.ts)
src/lib/database.types.ts     — Removed (Supabase type generation)
@supabase/supabase-js         — Removed from package.json
supabase                      — Removed from devDependencies
supabase/                     — Removed directory
supabase-setup.sql            — Removed
supabase-fix-tags.sql         — Removed
profiles_table_with_rls_and_ces_indexing.sql — Removed
```

---

## Wave Breakdown

### Wave 1: Infrastructure — Upstash Redis Client + API Skeleton
**Goal:** Install `@upstash/redis`, create the server-side Redis client, set up Vercel `/api/` directory, and verify a basic API route works.

### Wave 2: Profiles API (CRUD + Auth)
**Goal:** Full profiles CRUD via API routes, including CES + passphrase sign-in verification with bcrypt.

### Wave 3: Vendors + Offerings API
**Goal:** Vendor and offering CRUD via API routes, including owner-based lookups.

### Wave 4: Wishes + Exchange Entities API
**Goal:** Wishes, exchange requests, exchange agreements, exchange journeys, exchange calendars, vendor invites, vendor join requests, collective petitions, exchange alerts — all API routes.

### Wave 5: Hydration Endpoint
**Goal:** Single `/api/hydrate` endpoint that returns all exchange state in one call (replaces the 12-table parallel fetch in `hydrateExchangeState`).

### Wave 6: Frontend Migration — api.ts + useUnifiedStorage
**Goal:** Replace the Supabase client with a fetch-based API client. Update `useUnifiedStorage` to call `/api/*` endpoints. Update `exchangeSync.ts` sync functions to call API routes.

### Wave 7: Frontend Migration — storage.tsx + Diagnostics
**Goal:** Update `storage.tsx` hydration to call `/api/hydrate`. Update Diagnostics page to show Redis status. Remove Supabase references from all remaining files.

### Wave 8: Data Migration Script
**Goal:** One-time script that reads all data from Supabase and writes it into Upstash Redis using the new key namespace.

### Wave 9: Cleanup — Remove Supabase
**Goal:** Remove Supabase dependencies, files, SQL scripts. Update `.env`, `vercel.json`, `package.json`. Final build gate.

---

## Detailed Task Breakdown

### □ Wave 1: Infrastructure — Upstash Redis Client + API Skeleton

#### Task 1.1: Install @upstash/redis and bcryptjs

**Files:**
- Modify: `package.json`

**Step 1: Install packages**
```bash
cd /Users/atlasmorphoenix/workspace/heartlight-collective
npm install @upstash/redis bcryptjs
npm install -D @types/bcryptjs
```

**Step 2: Verify installation**
```bash
node -e "require('@upstash/redis'); console.log('OK')"
```
Expected: `OK`

**Step 3: Commit**
```bash
git add package.json package-lock.json
git commit -m "deps: add @upstash/redis and bcryptjs for serverless Redis migration"
```

#### Task 1.2: Create Redis client singleton (server-side only)

**Files:**
- Create: `api/_lib/redis.ts`

```typescript
import { Redis } from '@upstash/redis'

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || ''
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || ''

if (!redisUrl || !redisToken) {
  console.warn('[Redis] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing.')
}

export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
})

export function isRedisConfigured(): boolean {
  return Boolean(redisUrl && redisToken)
}
```

#### Task 1.3: Create API response helpers

**Files:**
- Create: `api/_lib/response.ts`

```typescript
export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function error(message: string, status = 400) {
  return json({ error: message }, status)
}
```

#### Task 1.4: Create health-check API route

**Files:**
- Create: `api/health/route.ts`

```typescript
import { redis, isRedisConfigured } from '../_lib/redis'
import { json, error } from '../_lib/response'

export async function GET() {
  if (!isRedisConfigured()) {
    return error('Redis not configured', 500)
  }
  try {
    const pong = await redis.ping()
    return json({ status: 'ok', redis: pong })
  } catch (err) {
    return error(`Redis connection failed: ${err}`, 500)
  }
}
```

#### Task 1.5: Update vercel.json to support API routes

**Files:**
- Modify: `vercel.json`

Vercel auto-detects `/api/` routes for Vite projects. The existing rewrites should NOT catch `/api/*` routes. Update:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install",
  "rewrites": [
    { "source": "/((?!api).*)", "destination": "/index.html" }
  ]
}
```

**Note:** The `(?!api)` negative lookahead ensures API routes are handled by Vercel's serverless functions, not the SPA fallback.

#### Task 1.6: Add .env.example for Upstash

**Files:**
- Create: `.env.example`

```
# Upstash Redis (server-side only — set in Vercel dashboard too)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Legacy Supabase (used only by migration script, removed in Wave 9)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

#### Task 1.7: Type-check gate

```bash
npx tsc --noEmit
```
Expected: exit 0 (no errors)

#### Task 1.8: Commit Wave 1

```bash
git add api/ vercel.json .env.example
git commit -m "infra: add Upstash Redis client, API skeleton, health check route"
```

---

### □ Wave 2: Profiles API (CRUD + Auth)

#### Task 2.1: Create auth helper (bcrypt verification)

**Files:**
- Create: `api/_lib/auth.ts`

```typescript
import bcrypt from 'bcryptjs'
import { redis } from './redis'

export async function verifyPassphrase(ces: string, passphrase: string): Promise<Record<string, unknown> | null> {
  const raw = await redis.get<string>(`hlc:profile:${ces}`)
  if (!raw) return null
  const profile = JSON.parse(raw)
  if (!profile.ces_passphrase_hash) return null
  const match = await bcrypt.compare(passphrase, profile.ces_passphrase_hash)
  return match ? profile : null
}
```

#### Task 2.2: Create profiles list + create route

**Files:**
- Create: `api/profiles/route.ts`

GET: Read all CES numbers from `hlc:profiles:all` set, then `mget` all profile JSONs.
POST: bCrypt hash the passphrase, store JSON at `hlc:profile:{ces}`, add CES to `hlc:profiles:all` set.

#### Task 2.3: Create profiles [ces] route (GET, PUT, DELETE)

**Files:**
- Create: `api/profiles/[ces]/route.ts`

GET: `redis.get('hlc:profile:{ces}')`
PUT: Update JSON, update index if CES changed.
DELETE: `redis.del('hlc:profile:{ces}')`, remove from `hlc:profiles:all` set.

#### Task 2.4: Create profiles stewardship route

**Files:**
- Create: `api/profiles/stewardship/[status]/route.ts`

GET: Scan `hlc:profiles:all`, filter by `stewardship` field in JSON. (Alternative: maintain a `hlc:profiles:stewardship:{status}` index set updated on every write.)

#### Task 2.5: Create sign-in API route

**Files:**
- Create: `api/auth/signin/route.ts`

POST body: `{ ces, passphrase }`
Calls `verifyPassphrase()`, returns profile JSON (without hash) or 401.

#### Task 2.6: Type-check gate + commit

```bash
npx tsc --noEmit
git add api/
git commit -m "feat: profiles CRUD + CES passphrase auth API routes"
```

---

### □ Wave 3: Vendors + Offerings API

#### Task 3.1: Create vendors list + create route
**Files:** Create: `api/vendors/route.ts`

#### Task 3.2: Create vendors [id] route (GET, PUT, DELETE)
**Files:** Create: `api/vendors/[id]/route.ts`

#### Task 3.3: Create offerings list + create route
**Files:** Create: `api/offerings/route.ts`

#### Task 3.4: Create offerings [id] route (GET, PUT, DELETE)
**Files:** Create: `api/offerings/[id]/route.ts`

#### Task 3.5: Type-check gate + commit

```bash
npx tsc --noEmit
git add api/
git commit -m "feat: vendors + offerings CRUD API routes"
```

---

### □ Wave 4: Wishes + Exchange Entities API

#### Task 4.1: Wishes routes
**Files:** Create: `api/wishes/route.ts`, `api/wishes/[id]/route.ts`

#### Task 4.2: Exchange requests routes
**Files:** Create: `api/exchange-requests/route.ts`, `api/exchange-requests/[id]/route.ts`

#### Task 4.3: Exchange agreements routes
**Files:** Create: `api/exchange-agreements/route.ts`, `api/exchange-agreements/[id]/route.ts`

#### Task 4.4: Exchange journeys routes
**Files:** Create: `api/exchange-journeys/route.ts`, `api/exchange-journeys/[id]/route.ts`

#### Task 4.5: Exchange calendars route
**Files:** Create: `api/exchange-calendars/[ces]/route.ts`

#### Task 4.6: Vendor invites routes
**Files:** Create: `api/vendor-invites/route.ts`, `api/vendor-invites/[id]/route.ts`

#### Task 4.7: Vendor join requests routes
**Files:** Create: `api/vendor-join-requests/route.ts`, `api/vendor-join-requests/[id]/route.ts`

#### Task 4.8: Collective petitions routes
**Files:** Create: `api/collective-petitions/route.ts`, `api/collective-petitions/[id]/route.ts`

#### Task 4.9: Exchange alerts routes
**Files:** Create: `api/exchange-alerts/route.ts`, `api/exchange-alerts/[id]/route.ts`

#### Task 4.10: Type-check gate + commit

```bash
npx tsc --noEmit
git add api/
git commit -m "feat: wishes + all exchange entity CRUD API routes"
```

---

### □ Wave 5: Hydration Endpoint

#### Task 5.1: Create hydrate route

**Files:**
- Create: `api/hydrate/route.ts`

GET: Fetches all entity types in parallel using Redis pipeline/mget. Returns a single JSON payload matching the `HydratedExchangeState` interface.

This replaces the 12 `fetchAll()` calls in `hydrateExchangeState()` with a single API call that does the work server-side.

#### Task 5.2: Type-check gate + commit

```bash
npx tsc --noEmit
git add api/
git commit -m "feat: hydration endpoint for collective exchange state"
```

---

### □ Wave 6: Frontend Migration — api.ts + useUnifiedStorage + exchangeSync

#### Task 6.1: Create client-side API wrapper

**Files:**
- Create: `src/lib/api.ts`

```typescript
// Client-side API wrapper — replaces supabase.ts
// All calls go to /api/* serverless routes

const API_BASE = '/api'

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error || `API error: ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Profiles
  getProfiles: () => apiFetch<ProfileRow[]>('/profiles'),
  getProfile: (ces: string) => apiFetch<ProfileRow>(`/profiles/${ces}`),
  createProfile: (data: ProfileRow) => apiFetch('/profiles', { method: 'POST', body: JSON.stringify(data) }),
  updateProfile: (ces: string, data: Partial<ProfileRow>) => apiFetch(`/profiles/${ces}`, { method: 'PUT', body: JSON.stringify(data) }),
  getProfilesByStewardship: (status: string) => apiFetch<ProfileRow[]>(`/profiles/stewardship/${status}`),

  // Auth
  signIn: (ces: string, passphrase: string) => apiFetch('/auth/signin', { method: 'POST', body: JSON.stringify({ ces, passphrase }) }),

  // Vendors, Offerings, Wishes, Exchange entities...
  // (one method per API route, typed)

  // Hydration
  hydrate: () => apiFetch<HydratedState>('/hydrate'),
}

export function isApiConfigured(): boolean {
  return true // API routes are always available on Vercel
}
```

#### Task 6.2: Update useUnifiedStorage.ts

**Files:**
- Modify: `src/hooks/useUnifiedStorage.ts`

Replace all `supabase.from('profiles')...` calls with `api.getProfiles()`, `api.createProfile()`, `api.updateProfile()`, etc. The `rowToRecord` and `recordToRow` mappers stay (they convert between API JSON format and `CreatorRecord`). The dual-mode localStorage fallback stays.

**Key changes:**
- `validateSignIn` → calls `api.signIn(ces, passphrase)` instead of Supabase query
- `createProfile` → calls `api.createProfile(recordToRow(profile))` instead of `supabase.from('profiles').insert()`
- `getProfiles` → calls `api.getProfiles()` instead of `supabase.from('profiles').select('*')`
- `findProfileByCES` → calls `api.getProfile(ces)` instead of Supabase `.eq('ces_number', ces).single()`
- `updateProfile` → calls `api.updateProfile(ces, row)` instead of `supabase.from('profiles').update(row).eq('ces_number', ces)`
- `getProfilesByStewardship` → calls `api.getProfilesByStewardship(status)` instead of Supabase `.eq('stewardship', status)`
- `moveProfile` → calls `api.updateProfile(ces, { stewardship: newStatus })` instead of Supabase update

#### Task 6.3: Update exchangeSync.ts

**Files:**
- Modify: `src/lib/exchangeSync.ts`

Replace the `upsert()`, `removeById()`, and `fetchAll()` helpers with API calls:
- `upsert(table, row)` → `api.syncEntity(entityType, row)`
- `removeById(table, id)` → `api.deleteEntity(entityType, id)`
- `fetchAll(table, mapper)` → removed (hydration is done via `/api/hydrate`)

The row mappers (`exchangeAgreementToRow`, `rowToExchangeAgreement`, etc.) can be simplified since the API will accept and return JSON directly — but keep them for now to minimize churn. The API routes will use the same field naming convention (snake_case) as Supabase rows.

**Alternative (simpler):** The API routes can accept and return the app's camelCase entity format directly, eliminating the row mappers entirely. This is cleaner but requires updating all mapper calls. Decision: keep snake_case in the API for now to minimize churn, eliminate in a future cleanup wave.

#### Task 6.4: Type-check gate + commit

```bash
npx tsc --noEmit
git add src/lib/api.ts src/hooks/useUnifiedStorage.ts src/lib/exchangeSync.ts
git commit -m "feat: replace Supabase client with fetch-based API wrapper"
```

---

### □ Wave 7: Frontend Migration — storage.tsx + Diagnostics + Session

#### Task 7.1: Update storage.tsx hydration

**Files:**
- Modify: `src/lib/storage.tsx`

Replace the `hydrateExchangeState()` call (which used Supabase) with `api.hydrate()`:
```typescript
useEffect(() => {
  api.hydrate().then((hydrated) => {
    // same merge logic as before
  }).catch(() => {
    console.warn('[Storage] API hydration failed; using localStorage only')
  })
}, [])
```

Remove the import of `hydrateExchangeState` from `exchangeSync.ts` (or keep it as a thin wrapper around `api.hydrate()`).

#### Task 7.2: Update Diagnostics page

**Files:**
- Modify: `src/pages/Diagnostics.tsx`

Replace `isSupabaseConfigured()` check with `api.health()` (calls `/api/health`). Show Redis connection status instead of Supabase status.

#### Task 7.3: Remove src/lib/supabase.ts

**Files:**
- Delete: `src/lib/supabase.ts`
- Delete: `src/lib/database.types.ts`

Update any remaining imports to use `src/lib/api.ts` instead.

#### Task 7.4: Search for and remove all remaining Supabase references

```bash
grep -ri "supabase" src/ --include="*.ts" --include="*.tsx"
```

Fix every match. The only acceptable remaining reference should be in comments explaining the migration history.

#### Task 7.5: Type-check gate + full build

```bash
npx tsc --noEmit
npx vite build
```
Expected: Both pass with zero errors.

#### Task 7.6: Commit Wave 7

```bash
git add -A
git commit -m "feat: complete frontend migration from Supabase to Upstash Redis API"
```

---

### □ Wave 8: Data Migration Script

#### Task 8.1: Create migration script

**Files:**
- Create: `scripts/migrate-supabase-to-redis.ts`

This script:
1. Reads all tables from Supabase using the Supabase JS client (using the service role key for full access)
2. Transforms each row into the Redis key namespace format
3. Writes to Upstash Redis using `@upstash/redis`
4. Reports counts per entity

```typescript
// Pseudocode structure:
import { createClient } from '@supabase/supabase-js'
import { Redis } from '@upstash/redis'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const redis = new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN })

// 1. Profiles
const { data: profiles } = await supabase.from('profiles').select('*')
for (const p of profiles) {
  await redis.set(`hlc:profile:${p.ces_number}`, JSON.stringify(p))
  await redis.sadd('hlc:profiles:all', p.ces_number)
}

// 2. Vendors
const { data: vendors } = await supabase.from('vendors').select('*')
for (const v of vendors) {
  await redis.set(`hlc:vendor:${v.id}`, JSON.stringify(v))
  await redis.sadd('hlc:vendors:all', v.id)
  await redis.sadd(`hlc:vendors:owner:${v.owner_ces}`, v.id)
}

// ... repeat for all 14 entity types

console.log('Migration complete!')
console.log(`Profiles: ${profiles.length}`)
console.log(`Vendors: ${vendors.length}`)
// etc.
```

#### Task 8.2: Run migration

**Prerequisites:** Atlas must provide:
- Upstash Redis REST URL + Token (set in `.env` or environment)
- Supabase URL + Service Role Key (NOT the anon key — the service key bypasses RLS)

```bash
npx tsx scripts/migrate-supabase-to-redis.ts
```

**IMPORTANT:** Run this AFTER the API routes are deployed and working, but BEFORE removing Supabase. This way Supabase is still available as a fallback if something goes wrong.

#### Task 8.3: Verify migration

Check Redis keys:
```bash
# Via API health check
curl https://heartlight-collective.vercel.app/api/health

# Or via the diagnostics page in the app
```

Verify that the Diagnostics page shows Redis connected and that profiles/vendors/wishes appear in the app.

#### Task 8.4: Commit

```bash
git add scripts/
git commit -m "feat: one-time Supabase → Redis data migration script"
```

---

### □ Wave 9: Cleanup — Remove Supabase

#### Task 9.1: Remove Supabase dependencies

**Files:**
- Modify: `package.json`

```bash
npm uninstall @supabase/supabase-js
npm uninstall -D supabase
```

#### Task 9.2: Remove Supabase files

**Files:**
- Delete: `supabase/` directory
- Delete: `supabase-setup.sql`
- Delete: `supabase-fix-tags.sql`
- Delete: `profiles_table_with_rls_and_ces_indexing.sql`
- Delete: `SUPABASE_SETUP.md`
- Delete: `src/lib/database.types.ts` (if not already removed)

Keep `docs/supabase-schema.sql` and `migrations/` as historical reference (or move to `docs/archive/`).

#### Task 9.3: Remove Supabase env vars from .env and Vercel

- Remove `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env`, `.env.local`, and Vercel project settings
- Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to Vercel project settings (Settings → Environment Variables)

#### Task 9.4: Update .gitignore if needed

Ensure `.env` and `.env.local` are still gitignored (they are).

#### Task 9.5: Final type-check + build gate

```bash
npx tsc --noEmit
npx vite build
```
Expected: Both pass with zero errors and zero Supabase references.

#### Task 9.6: Verify no Supabase references remain

```bash
grep -ri "supabase" src/ api/ --include="*.ts" --include="*.tsx"
```
Expected: Zero matches (or only historical comments).

#### Task 9.7: Commit + tag

```bash
git add -A
git commit -m "chore: remove Supabase entirely — Upstash Redis migration complete"
git tag -a v-redis-migration -m "Complete migration from Supabase to Upstash Redis"
```

---

## Aware Unknowns (Honest Gaps)

1. **Upstash Redis plan limits** — The free tier has a daily command limit (10,000 commands/day). If the Collective grows, we may need the paid tier. We'll monitor usage via the Upstash dashboard.

2. **Redis search/filtering** — Unlike Postgres, Redis doesn't have `WHERE` clauses. Filtering by stewardship status, category, etc. requires either:
   - Loading all entities and filtering in the API route (fine for small datasets)
   - Maintaining secondary index sets (e.g., `hlc:profiles:stewardship:pending`)
   - Using Upstash's RediSearch module (if available on the plan)
   - **Decision:** Start with load-and-filter in API routes. Add index sets if performance demands it.

3. **Vercel serverless function cold starts** — Each API route is a separate serverless function. The hydration endpoint mitigates this by fetching everything in one call. Individual CRUD operations may have ~100ms cold start latency on first hit.

4. **bcrypt in serverless** — `bcryptjs` is pure JavaScript (no native bindings), so it works in Vercel serverless functions. If performance is a concern, consider `@noble/hashes` with scrypt or argon2 as a future upgrade.

5. **Real-time subscriptions** — Supabase offered real-time subscriptions. Redis has pub/sub, but Upstash's REST API doesn't support persistent connections. If real-time is needed in the future, consider:
   - Upstash QStash for webhooks
   - Server-Sent Events (SSE) from a Vercel Edge function
   - Polling the hydrate endpoint
   - **Decision:** No real-time in this migration. The existing app doesn't use Supabase real-time subscriptions.

6. **File storage** — Supabase Storage was not used in the current app (photos use URLs). If file storage is needed later, consider Vercel Blob or Upstash's S3-compatible storage.

---

## Verification Checklist

- [ ] `@upstash/redis` installed and health check passes
- [ ] All 14 entity types have CRUD API routes
- [ ] CES + passphrase sign-in works via API
- [ ] Hydration endpoint returns all exchange state
- [ ] `useUnifiedStorage` calls API routes instead of Supabase
- [ ] `exchangeSync.ts` calls API routes instead of Supabase
- [ ] `storage.tsx` hydrates via `/api/hydrate`
- [ ] Diagnostics page shows Redis connection status
- [ ] Data migration script runs successfully
- [ ] All existing data visible in the app after migration
- [ ] `npx tsc --noEmit` passes
- [ ] `npx vite build` passes
- [ ] Zero `supabase` references in `src/` and `api/`
- [ ] `@supabase/supabase-js` removed from `package.json`
- [ ] Supabase env vars removed from Vercel
- [ ] Upstash env vars set in Vercel
- [ ] App deployed and functional on Vercel
- [ ] Atlas can sign in with CES + passphrase
- [ ] Profiles, vendors, offerings, wishes all visible
- [ ] localStorage fallback still works when API is unreachable

---

## Execution Handoff

**Plan complete and saved.** Ready to execute wave-by-wave using subagent-driven-development — I'll dispatch a fresh subagent per wave with two-stage review (spec compliance then code quality). Shall I proceed with Wave 1?