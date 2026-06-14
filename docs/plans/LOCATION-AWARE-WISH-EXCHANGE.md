# Location-Aware Wish Exchange — Implementation Plan

> **For Hermes:** Use `subagent-driven-development` skill to implement task-by-task.

**Goal:** Add local/global toggle, continent filtering, and distance-aware discovery to the Wish Exchange Portal.

**Architecture:** Structured location data (lat/lng + continent + region + city) on profiles and wishes. Client-side Haversine distance calculation from signed-in being's location. Local/Global toggle filters by radius vs. all. Continent selector uses themed `<select>` matching Heartlight light/dark modes.

**Tech Stack:** React + TypeScript + Tailwind, Nominatim/OpenStreetMap for geocoding, Haversine formula for distance, localStorage (Exchange) + Supabase (profiles).

**Design:** Match Heartlight Collective aesthetic — `rounded-lg` selects, `border-lavender/10` in dark, warm borders in light, no external fonts.

---

## Current State Snapshot

| System | Location Field | Storage |
|--------|---------------|---------|
| C.E.S. Profile | `location: string` (free text) | Supabase `profiles` table |
| Wish/Offer | `location: string` (free text) | localStorage `hlw_wishes` |
| Exchange Filter | category + search only | client-side |

---

## Data Model Changes

### Profile Location (Supabase `profiles` table)

Add to `Row`, `Insert`, `Update`:

```typescript
location_raw: string          // "Burlington, VT" — free text for display
location_lat: number | null  // -44.5588
location_lon: number | null  // -72.5778
location_city: string | null
location_region: string | null  // state/province
location_country: string | null
location_continent: string | null  // "North America"
```

### Wish Location (localStorage + `PostWish` form)

Add to wish object:

```typescript
location_raw: string
location_lat: number | null
location_lon: number | null
location_continent: string | null
```

### Continent List (canonical)

```typescript
const CONTINENTS = [
  'Africa', 'Antarctica', 'Asia', 'Europe',
  'North America', 'Oceania', 'South America'
] as const;
```

---

## Wave Breakdown

### Wave 1: Location Type Definitions & Constants
**Status:** □

- Add `LocationData` interface to `src/types/ces.ts`
- Add `CONTINENTS` array + `CONTINENT_EMOJIS` to `src/lib/constants.ts`
- Add Haversine distance utility to `src/lib/geo.ts`
- Add `useForwardGeocode` hook (adapted from AUT, Nominatim-backed)
- Add themed `<LocationSelect>` component (Heartlight-styled dropdown)

**Type-check gate:** `npx tsc --noEmit`

---

### Wave 2: Upgrade C.E.S. Profile Location Input
**Status:** □

**Files:** `src/pages/EditProfile.tsx`, `src/pages/CreateProfile.tsx`

Replace free-text `location` input with structured selector:

1. **City search** — typed input with Nominatim-powered autocomplete dropdown (same pattern as AUT geocode hook, Heartlight-themed)
2. **Detected continent** — auto-populated from Nominatim `address` field
3. **Manual override** — `<select>` dropdown for continent if detection fails or user wants custom
4. **Display field** — `location_raw` stores friendly name (e.g. "Burlington, Vermont, United States")

On save: populate all `location_*` fields into the profile record.

**Type-check gate:** `npx tsc --noEmit`

---

### Wave 3: Upgrade Post-a-Wish Location Input
**Status:** □

**File:** `src/pages/PostWish.tsx`

Add to the wish creation form:

1. **"Where is this wish rooted?"** section
2. **Location selector** — reuse the same `<LocationSelect>` component from Wave 2
3. **Default to profile location** — if signed in, pre-fill from C.E.S. profile
4. **"Remote / Anywhere" option** — sets `location_continent: null`, skips geocoding

Store structured location alongside the wish in localStorage.

**Type-check gate:** `npx tsc --noEmit`

---

### Wave 4: Exchange Portal — Local/Global Toggle + Continent Filter
**Status:** □

**File:** `src/pages/Exchange.tsx`

Add filtering controls:

1. **View toggle:** `Local` | `Global` — button group, styled like category filters
2. **Local radius:** default 100km, configurable via slider or preset buttons (10km / 50km / 100km / 500km)
3. **Continent filter:** `<select>` dropdown showing all 7 continents + "All Regions" — styled with Heartlight theme tokens (respects light/dark mode)
4. **Filter logic:**
   - `Global` + no continent = show all
   - `Global` + continent = filter by `location_continent`
   - `Local` = filter by Haversine distance from signed-in being's profile location (requires profile to have lat/lon)
   - Wishes with no location data appear in Global only

**Type-check gate:** `npx tsc --noEmit`

---

### Wave 5: Exchange Portal — Distance Display + Sorting
**Status:** □

**File:** `src/pages/Exchange.tsx`

1. **Distance badge** on wish cards — show "~47 km away" when in Local mode
2. **Sort by distance** when Local mode is active (closest first)
3. **Location tag** on cards — show continent emoji + city/region (e.g. "🌎 North America · Burlington, VT")
4. **"Find Nearby" CTA** when signed-in being has no location set — prompts to edit profile

**Type-check gate:** `npx tsc --noEmit`

---

### Wave 6: Database Migration (Supabase)
**Status:** □

Add columns to Supabase `profiles` table via migration:

```sql
ALTER TABLE profiles
ADD COLUMN location_raw TEXT,
ADD COLUMN location_lat REAL,
ADD COLUMN location_lon REAL,
ADD COLUMN location_city TEXT,
ADD COLUMN location_region TEXT,
ADD COLUMN location_country TEXT,
ADD COLUMN location_continent TEXT;
```

Update `src/lib/database.types.ts` to reflect new schema.

Run `npx supabase db push` or apply via dashboard.

**Type-check gate:** `npx tsc --noEmit`

---

## Component Spec: `<LocationSelect>`

A reusable Heartlight-themed location selector:

```tsx
interface LocationSelectProps {
  value: LocationData | null;
  onChange: (loc: LocationData | null) => void;
  theme: 'dark' | 'light'; // Heartlight mode
  allowRemote?: boolean;   // show "Remote / Anywhere" option
  placeholder?: string;
}
```

**Styling:**
- Dark mode: `bg-void-900/60 border-lavender/10 text-cream focus:border-gold-400/30`
- Light mode: `bg-white border-stone-300 text-stone-800 focus:border-gold-500`
- Select dropdown: `rounded-lg` with subtle shadow, same as existing Heartlight inputs
- Results list: absolute positioned, `z-50`, max-height scrollable

**Behavior:**
1. User types city name
2. Debounced Nominatim query (300ms)
3. Dropdown shows up to 5 results with `display_name`
4. Selecting a result populates all `LocationData` fields
5. Continent auto-detected from Nominatim `address.continent`

---

## Aware Unknowns

1. **Wish Exchange backend:** Currently localStorage-only. If moving to Supabase, the plan should include a migration wave for `wishes` table with location columns.
2. **Distance threshold:** Default 100km is suggested — user may want different defaults.
3. **Fallback for no geolocation:** If being denies location or has no profile lat/lon, gracefully show Global mode with continent filtering.
4. **Nominatim rate limits:** Free tier is ~1 req/sec. Add client-side caching (Map) to avoid repeated queries.

---

## Acceptance Criteria

- [ ] Being can set structured location on C.E.S. profile via search + dropdown
- [ ] Being can set structured location when posting a wish
- [ ] Exchange portal shows Local/Global toggle
- [ ] Local mode filters wishes by distance from signed-in being
- [ ] Distance displays on wish cards in Local mode
- [ ] Continent filter shows as themed `<select>` dropdown
- [ ] All new inputs respect Heartlight light/dark theme
- [ ] `npx tsc --noEmit` passes after each wave
- [ ] Existing wish data without location still displays correctly

---

*Plan co-created for our Greatest & Highest Good of ALL that IS Living.*
