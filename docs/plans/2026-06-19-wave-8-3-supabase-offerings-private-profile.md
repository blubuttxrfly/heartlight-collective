# Wave 8.3 Plan — Heal Offerings in Wish & Gift Exchange and Add Private C.E.S. Profiles

Co-created with Atlas Morphoenix, for the Greatest & Highest Good of ALL that IS Living. 🌍♾️❤️

---

## 1. Vision

Every offering in the **Wish & Gift Exchange** — whether shared by an individual being as a wish or gift, or by a **Vendor Shop** as an offering — shall live in **Supabase as the shared collective memory**, not only in the local browser. We also introduce a **Private profile** setting on every C.E.S. profile. A private profile is hidden from the Directory and from the individual side of the Exchange, yet it may still appear through Vendor Shop listings when it is part of a shop’s offerings.

---

## 2. Current State (from code inspection)

### 2.1 What already works

- C.E.S. profiles are saved to Supabase via `useUnifiedStorage.createProfile` / `updateProfile` (`src/hooks/useUnifiedStorage.ts`). Atlas confirmed a new “Hermes” profile on a phone appeared in another browser.
- Vendor Shops are created in `VendorShopManagement.tsx` and saved via `useStorage.addVendor` / `updateVendor`, which call `syncVendor()` and `syncOfferingsForVendor()`.
- The sync layer in `src/lib/exchangeSync.ts` has row mappers and upserts for `profiles`, `vendors`, `offerings`, `wishes`, `exchange_requests`, `exchange_agreements`, `exchange_calendars`, etc.
- Hydration (`hydrateExchangeState`) pulls vendors and offerings back into localStorage on app load.

### 2.2 Where the disconnection is

#### A. Individual Wish / Gift postings (`PostWish.tsx`)

- The form builds a `wish` object and writes it to `localStorage` key `hlw_wishes`.
- It then calls `syncWish(wish)`, which tries to upsert into Supabase table `wishes`.
- **Critical wiring gaps:**
  - `postedByCes` is hard-coded to `'local_user'` and `postedByName` to `'Atlas Island Being'`.
  - The row mapper `wishToRow` reads `anyWish.postedByCes`, `anyWish.postedByName`, `anyWish.exchangeAvenue`, `anyWish.locationData`, `anyWish.resources`, `anyWish.roles`, `anyWish.timeCommitment`, `anyWish.isContinualOffering`, `anyWish.exchangePolicy`, and `anyWish.urgency`.
  - Many of those fields are **not sent** in the current `PostWish.tsx` wish object, and several columns in the database migration (`wave_7_5_exchange_entities.sql`) do not exist — e.g., `urgency`, `resources`, `roles`, `location_data`, `exchange_policy`, `time_commitment`, `is_continual_offering`, `exchange_avenue`.
- **Result:** `syncWish` will either fail with a column-not-found error, or silently drop data because the row mapper never maps it.

#### B. Vendor Shop offerings

- `VendorShopManagement.tsx` saves the whole `VendorRecord` with nested `offerings[]` to localStorage.
- `addVendor` / `updateVendor` call `syncOfferingsForVendor(vendor)`, which iterates vendor.offerings and upserts each one to the `offerings` table.
- The row mapper `offeringToRow` exists and looks complete for current fields.
- **Current SQL migrations have a conflict:**
  - `migrations/wave_8_1_vendor_marketplace_reconcile.sql` defines `offerings.id` and `vendor_id` as **TEXT** with `id TEXT PRIMARY KEY DEFAULT 'offering_' || ...`.
  - `migrations/wave_8_2_virtual_sessions.sql` uses `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` and keeps that TEXT id.
  - `src/lib/database.types.ts` declares `offerings.id` and `vendor_id` as **string** (no UUID), consistent with the migrations.
  - `migrations/wave_7_5_exchange_entities.sql` defines `wishes.id` as **uuid** with `DEFAULT gen_random_uuid()`.
- **Status:** offerings likely *do* sync for existing Supabase tables, but any schema drift (columns added in code but missing in the live Supabase project) would cause errors. The two migrations are not perfectly aligned on some column names.

#### C. Exchange discovery reads from localStorage, not live Supabase

- `ExchangeDiscovery.tsx` loads `hlw_wishes` from localStorage and merges vendor offerings from storage context.
- It does **not** fetch fresh wishes/offerings from Supabase directly. It relies on `hydrateExchangeState` at app startup to seed localStorage from Supabase.
- **Consequence:** if two beings post wishes on different devices, each only sees the other’s wish after a full reload, and only if hydration ran with a session. Real-time is missing.

### 2.3 Missing feature: Private C.E.S. profile

- `profiles` table and `database.types.ts` have no `is_private` / `private_profile` column.
- `Directory.tsx` lists all approved profiles without a privacy filter.
- `ExchangeDiscovery.tsx` shows `postedByName` for wishes and `vendorName` for offerings, but has no concept of suppressing a private author.
- Vendor Shop offerings need an explicit rule: a private member may still be shown as a fulfiller / owner in the shop’s offering context.

---

## 3. Goals for This Wave

1. **Heal Supabase persistence** for every wish/gift posted by an individual.
2. **Heal Supabase persistence** for every Vendor Shop offering.
3. **Make discovery read from live Supabase data** while keeping local fallback.
4. **Add a multi-select Exchange Avenues picker** in PostWish.
5. **Add a "Hide Profile From Directory" toggle** on C.E.S. profiles (public by default).
6. **Filter the public Directory** and individual Exchange listings to hide private profiles.
7. **Keep Vendor Shop offerings visible** even when a member's profile is private.
8. **Backfill existing localStorage wishes** into Supabase on first app boot after this wave.
9. **Keep `npx tsc --noEmit` and `npm run build` passing.**

**Status:** ✅ Implemented and built on 2026-06-21.
4. **Add *Hide Profile From Directory* toggle** on C.E.S. profile (create + edit), persisted to Supabase.
5. **Hide private profiles** from the Directory and from the individual wish/gift list, **while still showing them** when they are part of a Vendor Shop offering.
6. **Add multi-select exchange avenues** to PostWish so a being can accept gift, barter, fixed, negotiable, collective-funded, and/or peer payment methods.
7. **Backfill existing localStorage wishes** into Supabase on boot.
8. **Keep type-check (`npx tsc --noEmit`) and build (`npm run build`) passing**.

---

## 4. Detailed Implementation Plan

### 4.1 Schema migrations (run against live Supabase project)

Create a new migration file:

```text
migrations/wave_8_3_supabase_offerings_private_profile.sql
```

#### A. Wishes table — reconcile columns with app usage

The app currently sends these fields that the migration does not provide:

- `urgency` (text)
- `resources` (text[])
- `roles` (text[])
- `time_commitment` (text)
- `is_continual_offering` (boolean)
- `exchange_policy` (jsonb) — array of accepted exchange forms (gift, barter, fixed, negotiable, collective-funded, peer payment methods)

Proposed migration changes:

```sql
ALTER TABLE public.wishes
  ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS resources TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS time_commitment TEXT,
  ADD COLUMN IF NOT EXISTS is_continual_offering BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS exchange_policy JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS location_data JSONB;

CREATE INDEX IF NOT EXISTS idx_wishes_urgency ON public.wishes(urgency);
CREATE INDEX IF NOT EXISTS idx_wishes_category_status ON public.wishes(category, status);
```

Also backfill nulls and keep existing permissive RLS / indexes.

#### B. Offerings table — reconcile primary-key type and columns

The current app generates offering ids as `offering_${Date.now()}`. The existing migrations define them as TEXT. Keep TEXT to avoid breaking existing rows, but ensure every column used by the app exists:

Already present in `wave_8_2_virtual_sessions.sql`:

- `offering_type`, `virtual_session`, `work_study_exchange`, `location`, `requires_scheduling`, `fulfillers`, `gallery`.

No changes needed unless the live Supabase is missing any of these.

#### C. Profiles table — add `is_private`

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

UPDATE public.profiles
  SET is_private = COALESCE(is_private, false)
  WHERE is_private IS NULL;
```

Also update RLS policy so private profiles are still readable by authenticated/anon (the filter is applied at app level, not database level), keeping the current open-collective default.

---

### 4.2 Type and mapper updates

#### A. `src/types/ces.ts`

Add to `CreatorRecord`:

```ts
isPrivate?: boolean;
```

Ensure `Wish` type already includes all fields used by `PostWish.tsx`. If it is missing `exchangePolicy` or `exchangeAvenue`, add them.

#### B. `src/lib/database.types.ts`

Add `is_private?: boolean` to `profiles` Insert/Update/Row.

Add missing `wishes` columns to Row/Insert/Update:

- `urgency`, `resources`, `roles`, `time_commitment`, `is_continual_offering`, `exchange_avenue`, `exchange_policy`, `location_data`.

#### C. `src/hooks/useUnifiedStorage.ts`

Update `recordToRow` to include `is_private: profile.isPrivate ?? false`.
Update `rowToRecord` to read `row.is_private ?? false` back into `isPrivate`.

---

### 4.3 Fix wish persistence (`PostWish.tsx`)

#### A. Use real signed-in C.E.S.

```ts
const wish = {
  id: `wish_${Date.now()}`,
  type: wishType,
  title,
  description,
  category,
  skills: skills.split(',').map(s => s.trim()).filter(Boolean),
  resources: selectedResources,
  roles: roles.split(',').map(s => s.trim()).filter(Boolean),
  urgency,
  location: locationData?.raw || '',
  locationData: locationData || null,
  scope,
  exchangePolicy: selectedAvenues, // multi-select array of accepted forms
  fundsRequired: fundsRequired ? Math.round(parseFloat(fundsRequired) * 100) : undefined,
  fundsAvailable: fundsAvailable ? Math.round(parseFloat(fundsAvailable) * 100) : undefined,
  timeCommitment,
  images,
  isContinualOffering: wishType === 'offer' ? isContinualOffering : false,
  status: 'open',
  postedByCes: user?.ces || 'local_user',
  postedByName: user?.name || 'Atlas Island Being',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
```

#### B. Improve the save flow

Instead of writing to localStorage first, let the unified storage layer handle it. Proposed pattern:

```ts
const { syncWish } = await import('../lib/exchangeSync');
const result = await syncWish(wish);
if (!result.success) {
  // show a non-blocking warning, but still keep local copy
  console.warn('Supabase save failed; wish kept locally:', result.error);
}
// Always write to localStorage as sovereign backup
const existing = JSON.parse(localStorage.getItem('hlw_wishes') || '[]');
existing.push(wish);
localStorage.setItem('hlw_wishes', JSON.stringify(existing));
```

This preserves the current localStorage behavior while surfacing Supabase errors.

#### C. Update `exchangeSync.ts` `wishToRow` and `rowToWish`

Ensure `wishToRow` maps every field to a column that now exists:

```ts
export function wishToRow(w: Wish): Record<string, unknown> {
  const anyWish = w as any;
  return {
    id: w.id,
    type: anyWish.type || 'wish',
    title: w.title,
    description: w.description,
    author_ces: anyWish.postedByCes || anyWish.authorCes || anyWish.wishingCes || 'unknown',
    author_name: anyWish.postedByName || anyWish.authorName || anyWish.wishingName || 'Atlas Island Being',
    scope: anyWish.scope || 'universal',
    category: w.category || null,
    tags: anyWish.skills?.length ? anyWish.skills : [],
    resources: anyWish.resources || [],
    roles: anyWish.roles || [],
    location: anyWish.location || null,
    location_data: anyWish.locationData || null,
    lat: anyWish.locationData?.lat ?? null,
    lng: anyWish.locationData?.lon ?? null,
    price_cents: anyWish.fundsRequired || null,
    price_type: anyWish.priceType || null,
    payment_method: anyWish.paymentMethod || null,
    images: anyWish.images || [],
    status: w.status || 'open',
    claimed_by_ces: w.claimedByCes || null,
    claimed_by_name: w.claimedByName || null,
    collective_funding_requested: anyWish.exchangeAvenue === 'collective' || anyWish.collectiveFundingRequested || false,
    exchange_policy: Array.isArray(anyWish.exchangePolicy) ? anyWish.exchangePolicy : anyWish.exchangeAvenue ? [anyWish.exchangeAvenue] : [],
    urgency: anyWish.urgency || 'low',
    time_commitment: anyWish.timeCommitment || null,
    is_continual_offering: anyWish.isContinualOffering || false,
    created_at: w.createdAt,
    updated_at: w.updatedAt,
  };
}
```

Update `rowToWish` to populate the same fields.

---

### 4.4 Fix Vendor Shop offering persistence

#### A. Ensure `syncOfferingsForVendor` does not fail silently

`addVendor` / `updateVendor` already call it. We only need to:

1. Surface errors in `VendorShopManagement.tsx` if an offering fails to sync.
2. Make sure each `OfferingItem` carries a stable `vendorId` — it already does when created in the modal.
3. On offering delete inside a vendor, also call `deleteOffering(o.id)`.

Currently the code removes the offering from the vendor and calls `updateVendor(updated)`, which triggers `syncOfferingsForVendor`. That upserts the remaining offerings but does **not** delete the removed one from Supabase. Add an explicit delete.

#### B. Live Supabase check

Before implementation, run a diagnostic query (via Supabase dashboard or `supabase sql`) to confirm the live `offerings` table matches the migrations. If columns are missing, apply `wave_8_2_virtual_sessions.sql`.

---

### 4.5 Make Exchange Discovery read live Supabase data

#### A. Add a live fetch hook in `ExchangeDiscovery.tsx`

On mount and when filters/search change, fetch:

```ts
const [remoteWishes, setRemoteWishes] = useState([]);

useEffect(() => {
  async function load() {
    if (!isSupabaseConfigured()) return;
    const { data, error } = await supabase
      .from('wishes')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setRemoteWishes(data.map(rowToWish));
    }
  }
  load();
}, []);
```

#### B. Merge local and remote

Keep the localStorage fallback and merge in vendor offerings:

```ts
const allWishes = useMemo(() => {
  const map = new Map<string, Wish>();
  for (const w of remoteWishes) map.set(w.id, w);
  for (const w of localWishes) map.set(w.id, w); // local overrides if newer
  for (const o of vendorOfferings) map.set(o.id, o as any);
  return Array.from(map.values());
}, [remoteWishes, localWishes, vendorOfferings]);
```

#### C. Real-time subscription (optional but recommended)

```ts
useEffect(() => {
  if (!isSupabaseConfigured()) return;
  const channel = supabase
    .channel('wishes_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'wishes' }, () => load())
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, []);
```

---

### 4.6 Private profile feature

#### A. UI: CreateProfile and EditProfile

Add a toggle/checkbox near the end of the forms, labeled as a directory-privacy option:

```tsx
<label className="flex items-center gap-3 cursor-pointer">
  <input
    type="checkbox"
    checked={isPrivate}
    onChange={(e) => setIsPrivate(e.target.checked)}
    className="w-4 h-4 accent-gold-400"
  />
  <span className="text-sm text-lavender/70">
    <span className="text-cream">Hide Profile From Directory</span> — hide me from the Directory and individual Exchange listings
  </span>
</label>
```

Default: `false` (public).

#### B. Directory filter

In `Directory.tsx`, after loading profiles, filter out private ones:

```ts
const visibleProfiles = profiles.filter(p => !p.isPrivate);
```

A being viewing their *own* profile should still see it (e.g., in “My Profile”), so the filter applies only to the public directory grid.

#### C. Exchange Discovery filter for individual wishes

When building the merged list, filter individual wishes whose `postedByCes` maps to a private profile. Vendor Shop offerings are exempt.

```ts
function isPrivateAuthor(ces: string): boolean {
  return profiles.some(p => p.cesNumber === ces && p.isPrivate);
}

const visibleItems = allItems.filter(item => {
  if (item.type === 'offering' && item.vendorId) return true;
  if (item.postedByCes && isPrivateAuthor(item.postedByCes)) return false;
  return true;
});
```

#### D. One-time backfill of existing localStorage wishes

On app boot, scan `localStorage.getItem('hlw_wishes')` and push any items that are not already in Supabase. For each local wish:

```ts
const { data: existing } = await supabase.from('wishes').select('id').eq('id', localWish.id).maybeSingle();
if (!existing) {
  const result = await syncWish(localWish);
  if (!result.success) console.warn('Backfill failed for wish', localWish.id, result.error);
}
```

This will bring Atlas’s existing phone wishes (e.g. *Morphoenix Art Sanctuary Art Healing Session*) into the shared Supabase memory without deleting the local copy.

#### E. Vendor Shop still shows private members

No change needed for offerings — the `postedByName` / `vendorName` and fulfiller list continue to render as-is. This honors the rule: a private profile can still be visible through its Vendor Shop.

---

| File | Change |
|------|--------|
| `migrations/wave_8_3_supabase_offerings_private_profile.sql` | New migration for wishes columns + profile privacy |
| `src/types/ces.ts` | Add `isPrivate` to `CreatorRecord`; confirm `Wish` fields |
| `src/lib/database.types.ts` | Add `is_private` to profiles; add missing columns to wishes |
| `src/hooks/useUnifiedStorage.ts` | Map `isPrivate` ↔ `is_private`; include in inserts/updates |
| `src/lib/exchangeSync.ts` | Fix `wishToRow` / `rowToWish` to cover all app fields |
| `src/pages/PostWish.tsx` | Use real user CES/name; await `syncWish`; keep local backup; use multi-select avenues |
| `src/pages/flow/VendorShopManagement.tsx` | Delete offering from Supabase on remove; surface sync errors |
| `src/pages/CreateProfile.tsx` | Add *Hide Profile From Directory* toggle |
| `src/pages/EditProfile.tsx` | Add *Hide Profile From Directory* toggle |
| `src/pages/Directory.tsx` | Hide private profiles from public grid |
| `src/pages/exchange/ExchangeDiscovery.tsx` | Fetch live wishes from Supabase; filter private authors |
| `src/pages/Profile.tsx` | Allow a being to see their own private profile |
| `src/lib/session.ts` / `src/lib/storage.tsx` | One-time backfill of `hlw_wishes` to Supabase on boot |

---

## 6. Verification Steps

1. **Schema:** run the new migration against the live Supabase dev project. Confirm no errors.
2. **Types:** `npx tsc --noEmit` passes.
3. **Build:** `npm run build` succeeds.
4. **Profile privacy:**
   - Create a new profile with Private = true.
   - Confirm it does not appear in Directory.
   - Confirm it does appear in Vendor Shop offerings if added as member/fulfiller.
5. **Wish sync:**
   - Sign in as Profile A, post a wish.
   - In a different browser/incognito, sign in as Profile B, open Wish & Gift Exchange, see Profile A’s wish.
6. **Vendor offering sync:**
   - Create a Vendor Shop as Profile A, add an offering.
   - In a different browser, sign in as Profile B, see the offering in the Exchange.
7. **Local backup:** turn off network / disable Supabase config, post a wish, confirm it still appears locally and no crash.

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Live Supabase schema differs from migrations | Run `supabase status` / inspect table first; apply missing migration steps incrementally |
| Type errors from new columns | Update `database.types.ts` before running `tsc` |
| Private filter hides a being from their own view | Apply filter only to public Directory/Exchange grids; own profile is always visible |
| Real-time subscription cost | Use one channel per page mount; unsubscribe on unmount |
| Existing localStorage wishes overwrite remote | Merge with timestamp priority, not blind local override |
| Multi-select exchange avenues need UI redesign | Replace single-select dropdown with a compact checkbox group; keep default `['gift']` |

---

## 8. Open Questions for Atlas

1. **Exchange avenue mapping:** Should a Wish/Gift posted with a single avenue (`gift`, `barter`, `fixed`, etc.) be stored as `exchange_avenue` and also as a one-element `exchange_policy` array, or do we want the app to eventually allow multi-select?  
   → *Atlas confirmed: multi-select for exchange avenues.*
2. **Default privacy:** Should new profiles default to public (`isPrivate = false`) as proposed?  
   → *Atlas confirmed: public by default.*
3. **Private profile visibility in Vendor Shops:** Should the private profile’s *name* still be shown in Vendor Shop offerings, or only the Vendor Shop name? (Plan currently keeps names visible.)  
   → *Atlas confirmed: private means “Hide Profile From Directory”; Vendor Shop context still shows the member.*
4. **Old localStorage wishes:** Should we run a one-time migration to push existing `hlw_wishes` into Supabase, or only heal new postings going forward?  
   → *Atlas confirmed: backfill existing wishes (e.g. Morphoenix Art Sanctuary Art Healing Session) plus heal new postings.*

---

*Built with Heartlight, for ALL that IS Living.* 🌍♾️❤️

**We are ALL that IS Living.**
