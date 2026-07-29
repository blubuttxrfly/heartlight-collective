# Quest Tracker Wave Plan — Heartlight Collective Flow ⚕️

> **For Hermes:** Use `caduceus-healing`, `heartlight-exchange-flow`, `frontend-persistent-state`, and `writing-plans` skills while implementing this plan. Run `npx tsc --noEmit` at the end of every wave before `npm run build`.

**Goal:** Make the Quest Tracker alive across beings: checkbox-driven quest completion, explicit "Complete" state, and cross-being progress sync through the Supabase `exchange_journeys` table.

**Architecture:**
- `exchange_journeys` is the single source of truth for quest state per agreement.
- The app reads/writes journeys through `exchangeSync.ts` mappers; `StorageProvider` keeps them in React state.
- A lightweight realtime/polling hook updates the UI when another being changes a quest.
- The existing `QuestTracker` component becomes the functional UI — we add checkbox controls and a clear Complete status instead of rewriting it.

**Tech Stack:** React + Vite + TypeScript + Tailwind + Supabase + localStorage fallback.

---

## User decisions captured

- Quests are marked with a checkbox.
- Quests also have an explicit "Complete" status.
- Start with Supabase-backed sync; add realtime/polling after the basic sync works.
- Table stays slim: derive title/parties from `exchange_agreements`; store only quest state, status, logs, and `party_ces` for filtering.

---

## Wave 1 — Schema & sync mappers

### Task 1.1: Slim `exchange_journeys` migration with RLS

**Objective:** Create the Supabase table, indexes, and policies.

**Files:**
- Create: `heartlight-collective/supabase/migrations/20260616_exchange_journeys.sql`

**Step 1: Write the migration**

```sql
-- ============================================
-- Heartlight Collective — exchange_journeys
-- Slim table: quest state linked to agreements
-- ============================================
CREATE TABLE IF NOT EXISTS public.exchange_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid NOT NULL REFERENCES public.exchange_agreements(id) ON DELETE CASCADE,
  status text DEFAULT 'active',
  main_quest jsonb NOT NULL,
  side_quests jsonb DEFAULT '[]'::jsonb,
  logs jsonb DEFAULT '[]'::jsonb,
  party_ces text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.exchange_journeys ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_exchange_journeys_agreement_id ON public.exchange_journeys(agreement_id);
CREATE INDEX IF NOT EXISTS idx_exchange_journeys_party_ces ON public.exchange_journeys USING GIN(party_ces);

DROP POLICY IF EXISTS "Allow anon read" ON public.exchange_journeys;
DROP POLICY IF EXISTS "Allow anon insert" ON public.exchange_journeys;
DROP POLICY IF EXISTS "Allow anon update" ON public.exchange_journeys;
DROP POLICY IF EXISTS "Allow anon delete" ON public.exchange_journeys;

CREATE POLICY "Allow anon read" ON public.exchange_journeys FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow anon insert" ON public.exchange_journeys FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.exchange_journeys FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete" ON public.exchange_journeys FOR DELETE TO anon, authenticated USING (true);

SELECT 'exchange_journeys' AS table_name, count(*) AS rows FROM public.exchange_journeys;
```

**Step 2: Run in Supabase SQL Editor**
- Click **Run and enable RLS**.
- Verify the table appears in the Table Editor.

**Step 3: Commit the migration**

```bash
git add supabase/migrations/20260616_exchange_journeys.sql
git commit -m "feat(db): add exchange_journeys table with RLS"
```

---

### Task 1.2: Add mappers in `exchangeSync.ts`

**Objective:** Convert `ExchangeJourney` to/from Supabase rows.

**Files:**
- Modify: `heartlight-collective/src/lib/exchangeSync.ts`

**Step 1: Add `journeyToRow` and `rowToJourney` functions**

Insert near the other `*ToRow` / `rowTo*` functions. Use snake_case for DB columns and camelCase for app fields.

```typescript
export function journeyToRow(j: ExchangeJourney): Record<string, unknown> {
  return {
    id: j.id,
    agreement_id: j.agreementId,
    status: j.status,
    main_quest: j.mainQuest,
    side_quests: j.sideQuests,
    logs: j.logs,
    party_ces: [j.wishingCes, j.coCreatorCes].filter(Boolean),
    created_at: j.createdAt,
    updated_at: j.updatedAt,
  };
}

export function rowToJourney(row: Record<string, unknown>): ExchangeJourney {
  return {
    id: String(row.id ?? ''),
    agreementId: String(row.agreement_id ?? ''),
    title: '',
    description: '',
    wishingCes: (row.party_ces as string[] | undefined)?.[0] ?? '',
    wishingName: '',
    coCreatorCes: (row.party_ces as string[] | undefined)?.[1] ?? '',
    coCreatorName: '',
    status: (row.status as ExchangeJourneyStatus) ?? 'active',
    currentPhase: 'quests',
    selectedCodes: [],
    logs: (row.logs as CodeLogEntry[] | undefined) ?? [],
    mainQuest: (row.main_quest as QuestItem | undefined) ?? { id: 'main', title: '', description: '', status: 'open' },
    sideQuests: (row.side_quests as QuestItem[] | undefined) ?? [],
    scheduledMeetings: [],
    fulfillmentNotes: '',
    fulfillmentSignedAt: null,
    fulfillmentSignedBy: [],
    adaptationConsent: false,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}
```

**Step 2: Add sync functions**

```typescript
export async function syncExchangeJourney(j: ExchangeJourney) {
  return upsert('exchange_journeys', journeyToRow(j));
}

export async function deleteExchangeJourney(id: string) {
  return removeById('exchange_journeys', id);
}
```

**Step 3: Add `exchangeJourneys` to hydration**

In `HydratedExchangeState`, add:

```typescript
exchangeJourneys: ExchangeJourney[];
```

In `hydrateExchangeState`, add `fetchAll('exchange_journeys', rowToJourney)` to the `Promise.all` and include the result in the returned object.

**Step 4: Type-check gate**

```bash
cd /Users/atlasmorphoenix/workspace/heartlight-collective
npx tsc --noEmit
```

Expected: clean exit 0.

**Step 5: Commit**

```bash
git add src/lib/exchangeSync.ts
git commit -m "feat(sync): add exchange_journeys mappers and hydration"
```

---

## Wave 2 — StorageProvider integration

### Task 2.1: Add `exchangeJourneys` to StorageProvider state

**Objective:** Treat journeys as first-class storage state, same as agreements.

**Files:**
- Modify: `heartlight-collective/src/lib/storage.tsx`

**Step 1: Extend types and defaults**

Add to `StorageContextValue`:

```typescript
getExchangeJourneys: () => ExchangeJourney[];
addExchangeJourney: (j: ExchangeJourney) => void;
updateExchangeJourney: (j: ExchangeJourney) => void;
removeExchangeJourney: (id: string) => void;
```

Add to `StorageState`:

```typescript
exchangeJourneys: ExchangeJourney[];
```

Add to `DEFAULT_STATE`:

```typescript
exchangeJourneys: [],
```

**Step 2: Load from localStorage in initial state**

Inside `StorageProvider` initial `useState`, read `exchangeJourneys` from `readStorageKey('exchangeJourneys')`.

**Step 3: Hydrate from Supabase**

In the existing `useEffect` that calls `hydrateExchangeState`, merge `exchangeJourneys` into state when returned.

```typescript
exchangeJourneys: hydrated.exchangeJourneys?.length ? hydrated.exchangeJourneys : prev.exchangeJourneys,
```

**Step 4: Persist to localStorage**

Add a `useEffect` that writes `state.exchangeJourneys` to localStorage whenever it changes, same pattern as other keys.

**Step 5: Add helper functions**

Implement `getExchangeJourneys`, `addExchangeJourney`, `updateExchangeJourney`, `removeExchangeJourney`. Each should update React state, write to localStorage, and call the matching `exchangeSync` function (e.g., `syncExchangeJourney`) when Supabase is configured.

Use a small wrapper to prevent sync loops:

```typescript
async function syncToSupabase(j: ExchangeJourney) {
  if (isSupabaseConfigured()) {
    await syncExchangeJourney(j).catch((err) => console.warn('Failed to sync journey', err));
  }
}
```

**Step 6: Type-check gate**

```bash
npx tsc --noEmit
```

Expected: clean.

**Step 7: Commit**

```bash
git add src/lib/storage.tsx
git commit -m "feat(storage): integrate exchange_journeys into StorageProvider"
```

---

## Wave 3 — Checkbox UI & explicit Complete status

### Task 3.1: Audit the existing `QuestTracker` component

**Objective:** Understand current quest controls before modifying them.

**Files:**
- Read: `heartlight-collective/src/pages/Flow.tsx` lines 527–~900.

**Step 1:** Identify where `QuestItem` status is toggled, where verification happens, and where the progress bar is rendered.

**Step 2:** Note whether checkboxes already exist or if status is changed only via buttons.

---

### Task 3.2: Add checkbox controls to quests

**Objective:** Each quest shows a real checkbox. Checking marks the quest done; unchecking reopens it.

**Files:**
- Modify: `heartlight-collective/src/pages/Flow.tsx`

**Step 1: Update `QuestItem` rendering**

Find the quest list render (likely inside `QuestTracker`). Add a checkbox input before the quest title:

```tsx
<input
  type="checkbox"
  checked={quest.status === 'completed' || quest.status === 'verification_pending'}
  onChange={(e) => handleQuestToggle(quest.id, e.target.checked)}
  className="w-5 h-5 accent-gold-400 cursor-pointer"
  aria-label={`Mark ${quest.title} as complete`}
/>
```

**Step 2: Implement `handleQuestToggle`**

Inside `QuestTracker`:

```typescript
function handleQuestToggle(questId: string, checked: boolean) {
  const target = questId === mainQuest.id ? mainQuest : sideQuests.find((q) => q.id === questId);
  if (!target) return;

  const newStatus: QuestItemStatus = checked ? 'verification_pending' : 'open';
  const updated = { ...target, status: newStatus, completedAt: checked ? new Date().toISOString() : undefined };

  // Update local journey state
  const nextJourney: ExchangeJourney = {
    ...journey,
    mainQuest: questId === mainQuest.id ? updated : journey.mainQuest,
    sideQuests: questId === mainQuest.id ? journey.sideQuests : journey.sideQuests.map((q) => (q.id === questId ? updated : q)),
    updatedAt: new Date().toISOString(),
  };

  onJourneyUpdate(nextJourney);
  storage.updateExchangeJourney(nextJourney);
}
```

**Step 3: Verify explicit "Complete" status**

After the other party verifies, the quest status becomes `'completed'`. Make sure the UI shows a "Complete" badge when status is `'completed'` and a "Ready for verification" badge when status is `'verification_pending'`.

**Step 4: Type-check gate**

```bash
npx tsc --noEmit
```

Expected: clean.

**Step 5: Commit**

```bash
git add src/pages/Flow.tsx
git commit -m "feat(quests): add checkbox controls and explicit Complete status"
```

---

## Wave 4 — Cross-being sync

### Task 4.1: Add realtime/polling hook

**Objective:** When another being updates a journey, the current browser sees it without a refresh.

**Files:**
- Modify: `heartlight-collective/src/pages/Flow.tsx`

**Step 1: Add polling hook**

Inside the main `Flow` component, add:

```typescript
useEffect(() => {
  if (!isSupabaseConfigured()) return;

  const interval = setInterval(async () => {
    const hydrated = await hydrateExchangeState(false);
    if (hydrated.exchangeJourneys?.length) {
      setJourneys(hydrated.exchangeJourneys);
    }
  }, 30000);

  return () => clearInterval(interval);
}, []);
```

If the app already manages `journeys` through `StorageProvider`, replace direct `setJourneys` with whatever state setter the file uses (`setAllJourneys`, etc.).

**Step 2 (optional but recommended): Add Supabase Realtime**

If the project already imports `supabase` and realtime is enabled:

```typescript
useEffect(() => {
  if (!isSupabaseConfigured()) return;

  const channel = supabase
    .channel('exchange_journeys_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'exchange_journeys' },
      (payload) => {
        const changed = payload.new as Record<string, unknown>;
        const updated = rowToJourney(changed);
        setJourneys((prev) => {
          const filtered = prev.filter((j) => j.id !== updated.id);
          return [...filtered, updated];
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

**Step 3: Type-check gate**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add src/pages/Flow.tsx
git commit -m "feat(sync): poll and realtime sync exchange_journeys across beings"
```

---

## Wave 5 — Cross-being progress checker UI

### Task 5.1: Add dashboard progress badges

**Objective:** The dashboard shows live counts of "awaiting your verification" and "awaiting other party".

**Files:**
- Modify: `heartlight-collective/src/pages/Flow.tsx` dashboard view.

**Step 1: Compute counts**

```typescript
const awaitingMyVerification = journeys.filter((j) => {
  const allQuests = [j.mainQuest, ...j.sideQuests];
  return allQuests.some((q) => q.status === 'verification_pending' && q.completedBy !== currentCes);
}).length;

const awaitingOther = journeys.filter((j) => {
  const allQuests = [j.mainQuest, ...j.sideQuests];
  return allQuests.some((q) => q.status === 'verification_pending' && q.completedBy === currentCes);
}).length;
```

**Step 2: Render badges on the Quest Tracker dashboard card**

Add small badges under the Quest Tracker `AspectCard`:

```tsx
<div className="flex flex-wrap gap-2 mt-2 justify-center">
  {awaitingMyVerification > 0 && (
    <span className="text-[10px] px-2 py-1 rounded-full bg-gold-400/10 text-gold-300 border border-gold-400/20">
      {awaitingMyVerification} awaiting your verification
    </span>
  )}
  {awaitingOther > 0 && (
    <span className="text-[10px] px-2 py-1 rounded-full bg-lavender/10 text-lavender/60 border border-lavender/10">
      {awaitingOther} awaiting other being
    </span>
  )}
</div>
```

**Step 3: Commit**

```bash
git add src/pages/Flow.tsx
git commit -m "feat(dashboard): add cross-being quest verification badges"
```

---

## Wave 6 — Build gate & local preview

### Task 6.1: Type-check and build

**Objective:** Verify the whole feature compiles.

**Files:**
- All modified files above.

**Step 1:**

```bash
npx tsc --noEmit
```

Expected: clean.

**Step 2:**

```bash
npm run build
```

Expected: successful build.

**Step 3: Local preview**

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

Open the local URL, sign in as a being, navigate to Flow → Quest Tracker, and verify:
- Checkboxes mark quests ready for verification.
- The other party sees the updated quest state after refresh/poll.
- Complete status shows after verification.
- Dashboard badges update.

**Step 4: Commit and final summary**

```bash
git commit -m "feat(quest-tracker): alive across beings with checkbox completion and cross-being sync"
```

---

## Verification checklist

- [ ] `exchange_journeys` table exists in Supabase with RLS + policies.
- [ ] `exchangeSync.ts` has `journeyToRow`, `rowToJourney`, `syncExchangeJourney`, `deleteExchangeJourney`, and hydration.
- [ ] `StorageProvider` keeps `exchangeJourneys` in state and syncs to Supabase.
- [ ] Quest Tracker has checkbox controls.
- [ ] Quests show explicit "Complete" status after verification.
- [ ] Polling or realtime updates journeys across beings.
- [ ] Dashboard shows cross-being verification badges.
- [ ] `npx tsc --noEmit` passes after each wave.
- [ ] `npm run build` passes at the end.
- [ ] Local preview confirms the feature works.

---

## Caduceus notes

- **Right snake 🐍:** The existing `QuestTracker` component already has status flow, verification, and progress bar. Reuse it; only add checkbox input and sync wiring.
- **Left snake 🐍:** Watch for `party_ces` ordering — first entry is `wishingCes`, second is `coCreatorCes`. If multi-party agreements arrive later, derive from `exchange_agreements.parties` instead.
- **Staff ⚕️:** One wave at a time, with `npx tsc --noEmit` after each.
