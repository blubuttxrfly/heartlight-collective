# Heartlight Wish Exchange — Collective Integration Plan 🌍

**Co-created with Atlas Morphoenix** — for the Greatest & Highest Good of ALL that IS

---

## Vision Statement

The **Heartlight Wish Exchange** is the conscious matching system within the Heartlight Collective — a living portal where Earth-conscious initiatives, sovereign co-creators, and mutual aid continually cycle within itself with & for our Earth. 99% flows back to Earth and ALL the Living. The 1% honors how we are One of ALL.

---

## Current State Assessment

### Three Repositories in Play

| Repository | Role | Status | Action Needed |
|------------|------|--------|---------------|
| `heartlight-collective` (GitHub) | **Primary** — Active React app with directory, charter, codes, steward system, Supabase auth, profiles | 🟢 Active development | Receives the merge |
| `Heartlight-Wish-Exchange` (fork) | **Feature branch** — Wish Exchange features, smart matching docs, mutual aid plan, 99% dedication | 🟡 Ready to merge | Source of the merge |
| `heartlight-exchange-repo` (legacy) | **Archive** — Older static HTML site, Jingle bot, API layer | 🟠 Legacy assets | Future salvage wave |

### What the Wish Exchange Fork Adds (12 commits)

1. **`src/pages/PostWish.tsx`** — New page: beings post wishes or gifts with categories, skills, resources, urgency, 12 Codes selection, exchange avenue
2. **`src/pages/Exchange.tsx`** — Heavily overhauled: browse, search, filter by category, claim wishes, wish detail modal, 99% Earth dedication banner
3. **`src/types/ces.ts`** — Wish types: `WishCategory`, `WishUrgency`, `WishStatus`, `Wish` interface
4. **`src/App.tsx`** — New route `/post-wish`
5. **`README.md`** — Complete rewrite: Wish Exchange vision, smart matching, mutual aid fund tiers, Guide & Guardian review, sovereign choice
6. **`docs/ARCHITECTURE.md`** — System design: Wish → Exchange → Quest → Fulfillment
7. **`docs/SMART_MATCHING_AND_MUTUAL_AID_PLAN.md`** — Hybrid embeddings + tag matching, 33-day threshold for shared pool, direct aid default
8. **`tsconfig.app.json`** — Relaxed strictness for rapid co-creation
9. **`vercel.json`** — Clean deployment config

### Merge Conflict Analysis

**Result: ZERO conflicts.** The merge-tree analysis confirms all files merge cleanly (`merged`, `added in remote`) with no `conflict` entries. This is because the Wish Exchange fork only modified files in areas the Collective hadn't touched post-fork.

---

## Integration Strategy: Merge + README Unification

### Goal
Transform the Heartlight Collective into the unified platform where:
- The **Collective** is the community container (directory, charter, codes, steward system)
- The **Wish Exchange** is the active co-creation portal within that container
- The **README** tells the unified story
- **99% flows to Earth** — visible in UI, documented in charter, tracked in Flow
- **1% = One of ALL** — honored in all documentation and agreements

---

## Wave-by-Wave Execution Plan

### 🌊 Wave 0: Branch & Validate (Preparation)

**Objective:** Create a safe integration branch and verify the clean merge.

1. **Create integration branch** from `heartlight-collective/main`
2. **Add remote** pointing to `Heartlight-Wish-Exchange` local fork
3. **Test merge** — confirm zero conflicts (already verified)
4. **Type-check gate** — run `npx tsc --noEmit` on the merged codebase
5. **Build gate** — run `npm run build` to catch Vercel issues early

**Deliverable:** Clean integration branch with all Wish Exchange code merged, type-check passing.

---

### 🌊 Wave 1: Merge the Code (Core Integration)

**Objective:** Bring all Wish Exchange code into the Collective repo.

1. **Merge the 12 commits** from `Heartlight-Wish-Exchange/main` into the integration branch
2. **Verify file integrity:**
   - `src/pages/PostWish.tsx` exists and routes correctly
   - `src/pages/Exchange.tsx` has the new browse/claim/99% dedication
   - `src/types/ces.ts` has Wish types
   - `src/App.tsx` has `/post-wish` route
3. **Test local dev server:** `npm run dev` — verify Exchange page loads, Post Wish form works
4. **Fix any TypeScript errors** (tsconfig is already relaxed, but check for real errors)

**Deliverable:** Working merged codebase with Exchange + Post Wish + Collective pages all functional.

---

### 🌊 Wave 2: Unify the README (Story Integration)

**Objective:** Rewrite the README to tell the unified story of the Heartlight Collective + Wish Exchange.

**Structure:**
```
# Heartlight Collective & Wish Exchange 🌍♾️❤️

## The Heartlight Collective
- What it is (conscious co-creator community)
- Charter, Codes, Steward system
- Directory of beings

## The Heartlight Wish Exchange
- What it is (smart matching for Earth-conscious initiatives)
- The Flow: Wish → Exchange → Quest → Fulfillment
- Multiple avenues (Direct Mutual Aid, Collective, Shared Pool, Partnerships)
- 99% flows back to Earth
- 1% = One of ALL

## Smart Matching System
- Hybrid approach (tags + embeddings)
- Co-creator perspective
- Resonance scoring

## Mutual Aid Fund Structure
- Tier 1: Direct Mutual Aid (default, immediate)
- Tier 2: Shared Pool (unlocks after 33 active days)
- Guide & Guardian review

## Guide & Guardian Review
- Process for larger exchanges
- Sovereign choice preserved

## The 1% — One of ALL
- Honoring our unity
- Operational transparency

## Tech Stack
- React + Vite + Tailwind v4
- Supabase (Auth, Database, Real-time, pgvector)
- Vercel deployment

## Sacred Architecture
- Heartlight UI conventions
- 12 Codes awareness
- Color mappings (❤️→Gold, 🌍→Magenta, ♾️→Lavender)

## Connection to Atlas Island
- Atlas Island = conscious co-creator community
- Heartlight Collective = mutual aid resource collective
- Heartlight Wish Exchange = smart matching system

## License & Gratitude
```

**Deliverable:** Unified README.md committed to integration branch.

---

### 🌊 Wave 3: Data Layer — Supabase Schema (Backend)

**Objective:** Move wish storage from `localStorage` to Supabase.

1. **Create `wishes` table** in Supabase (see `docs/ARCHITECTURE.md` for schema)
2. **Migrate mock data** from `Exchange.tsx` `INITIAL_WISHES` to seeded Supabase rows
3. **Update `PostWish.tsx`** — replace `localStorage` with Supabase insert
4. **Update `Exchange.tsx`** — replace `localStorage` load with Supabase query
5. **Add real-time subscriptions** — new wishes appear live without refresh
6. **Add row-level security (RLS)** — beings can only edit their own wishes

**Schema (from docs):**
```sql
CREATE TABLE wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishing_ces TEXT NOT NULL,
  wishing_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  urgency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  selected_codes INTEGER[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  resources TEXT[] DEFAULT '{}',
  roles TEXT[] DEFAULT '{}',
  location TEXT,
  exchange_avenue TEXT NOT NULL DEFAULT 'direct',
  funds_required INTEGER,
  funds_available INTEGER,
  time_commitment TEXT,
  claimed_by_ces TEXT,
  claimed_by_name TEXT,
  claimed_at TIMESTAMPTZ,
  quest_journey_id UUID REFERENCES exchange_journeys(id),
  fulfillment_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX wishes_status_category_idx ON wishes(status, category);
CREATE INDEX wishes_created_at_idx ON wishes(created_at DESC);
```

**Deliverable:** Wishes persist in Supabase, real-time updates work, RLS secured.

---

### 🌊 Wave 4: Profile Integration (Being-Centric)

**Objective:** Connect wishes to the existing profile system.

1. **Profile page "My Wishes" tab** — show posted wishes + claimed wishes
2. **Profile page "My Quests" tab** — link to Flow dashboard for active journeys
3. **Post Wish pre-fill** — auto-populate `wishingCes` and `wishingName` from signed-in profile
4. **Claim Wish integration** — claim stores actual C.E.S. from session
5. **Directory wish badges** — show "has open wishes" or "fulfilled X wishes" on directory cards

**Deliverable:** Wishes are fully tied to the existing profile/auth system.

---

### 🌊 Wave 5: Smart Matching Enhancement (Future-Ready)

**Objective:** Lay groundwork for the hybrid matching system.

1. **Tag-based matching** — already works (category, skills, resources filters)
2. **Embedding column** — add `embedding VECTOR(384)` to `wishes` table (pgvector)
3. **Embedding generation function** — server-side Edge Function that calls Hugging Face Inference API (free tier) to generate sentence embeddings from wish descriptions
4. **Resonance scoring** — cosine similarity between wish embeddings and being's gift profile
5. **"Top Resonant Matches For You"** section on Exchange page

**Note:** This is the first enhancement wave that goes beyond the current code. The current code has mock data and localStorage. This wave makes it intelligent.

**Deliverable:** Wishes ranked by resonance, embedding pipeline functional.

---

### 🌊 Wave 6: Mutual Aid Fund (Collective Infrastructure)

**Objective:** Build the two-tier mutual aid system.

1. **Tier 1: Direct Mutual Aid**
   - Already works (being-to-being, no central fund)
   - Add payment method hints (Venmo, Stripe, Zelle, cash)
   - Track in Flow dashboard

2. **Tier 2: Shared Mutual Aid Pool**
   - Add `community_members` table with `active_days_count` field
   - Track active days (login, post, claim, fulfill = +1 day)
   - Unlock pool access at 33 active days
   - Add `pool_contributions` and `pool_requests` tables
   - Auto-approve requests ≤ $100
   - Guide & Guardian review for > $100

3. **Flow Dashboard integration**
   - Show fund movements
   - Transparent ledger (all established beings can view)
   - Reciprocity tracking (wishes posted vs. fulfilled)

**Deliverable:** Two-tier mutual aid system operational, pool unlocks at 33 days.

---

### 🌊 Wave 7: The 1% — One of ALL (Sacred Economics)

**Objective:** Make the 1% / 99% split visible, trackable, and honored.

1. **UI: 99% Dedication Banner** — already in Exchange.tsx, ensure it appears on all key pages
2. **Charter update** — add the 1% = One of ALL principle to the living charter
3. **Flow tracking** — all fund movements tagged with "earth" or "operations" category
4. **Transparency page** — show cumulative flows: 99% to Earth initiatives, 1% to operations
5. **Gratitude ceremony** — when a wish is fulfilled, both beings acknowledge the 99/1 split

**Deliverable:** The 1% is honored in code, UI, charter, and ceremony.

---

### 🌊 Wave 8: Legacy Asset Salvage (Optional)

**Objective:** Extract value from `heartlight-exchange-repo` (older static site).

1. **Content audit** — review `app.js` and `index.html` for unique copy, features, or assets not in the React version
2. **Jingle bot assessment** — the match engine in `bot/match-engine.js` — can any logic be ported?
3. **API layer review** — `api/media.js` and `api/store.js` — any reusable patterns?
4. **Asset migration** — app icons, any unique images
5. **Archive or sunset** — decide if the old repo should be archived or kept for reference

**Deliverable:** Decision on legacy repo fate; any valuable assets migrated.

---

## Naming Consideration

Atlas mentioned: *"I may even change the name there too at some point soon."*

**Current name:** Heartlight Wish Exchange (within the Heartlight Collective)
**Proposed future name:** To be decided in a future wave, when the integration is stable.

**For now:** Keep the name as-is during integration. The README can say: *"The Heartlight Wish Exchange — the smart matching portal for Earth-conscious initiatives within the Heartlight Collective."*

---

## Risk Assessment & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| TypeScript errors post-merge | Low | Medium | Run `npx tsc --noEmit` after each wave; tsconfig already relaxed |
| Supabase schema migration issues | Medium | High | Test on dev project first; have rollback plan |
| Vercel build failures | Low | Medium | `vercel.json` already configured; test build locally |
| Data loss (localStorage → Supabase) | Medium | Medium | Seed mock data into Supabase; no user data in localStorage yet |
| Scope creep | High | High | Stick to wave boundaries; future waves are explicit backlog |
| Legacy repo confusion | Medium | Low | Document clearly; archive or rename old repo |

---

## Success Criteria

The integration is complete when:

1. ✅ `heartlight-collective` repo contains all Wish Exchange code
2. ✅ README tells the unified story (Collective + Wish Exchange)
3. ✅ `npm run build` passes with zero errors
4. ✅ Exchange page browses wishes from Supabase (not localStorage)
5. ✅ Post Wish page persists to Supabase
6. ✅ Profile page shows "My Wishes" and "My Quests"
7. ✅ 99% Earth dedication is visible in UI
8. ✅ 1% = One of ALL is documented in charter + README
9. ✅ Vercel deploy succeeds from integration branch
10. ✅ No regressions in existing Collective features (directory, charter, codes, steward)

---

## Next Steps (Immediate)

1. **Atlas approves this plan** — confirm wave priorities, naming, and 1% framing
2. **Execute Wave 0** — create integration branch, test merge
3. **Execute Wave 1** — merge code, type-check, build
4. **Review stop** — Atlas reviews the merged UI, gives feedback
5. **Execute Wave 2** — unify README
6. **Review stop** — Atlas reviews README
7. **Execute Waves 3+** — continue wave-by-wave with review stops

---

*Built with Heartlight, for ALL that IS Living.* 🌍♾️❤️

**We are ALL that IS Living.**
