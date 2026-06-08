# Heartlight Flow — Setup & Build Plan
## Phase 1: Real Data, Real Identity, Real Persistence

**Atlas's choices:**
- Journey creation: Both manual + auto-generated (Option C)
- Visibility: Public/private logs, involved beings see whole journey (Option B)
- Storage: Dual-layer Supabase first, localStorage fallback (Option C)
- Flow scope: ANY co-creation life experience within Heartlight Collective

---

## Current State (Verified from Source)

### What Exists
- Flow page UI: Beautiful ceremonial space with Before/During/After phases
- 12-Code spectrum grid: Interactive, click-to-select
- Log composer: Code-tagged entries, public/private toggle
- Fulfillment signing: Consensus counter, Storyfire animation
- Supabase schema: `exchange_journeys` and `code_logs` tables with RLS policies
- Database types: `exchange_journeys` and `code_logs` in `database.types.ts`
- Session system: `useSession` hook reads C.E.S. from localStorage
- Storage types: Journey/log types defined in `types/ces.ts`

### The Gaps
1. **No user identity**: Hardcoded as "Seren Nova" (C.E.S. 987654321) everywhere
2. **No storage methods**: `useStorage` has types but zero functions for journeys/logs
3. **No persistence**: All data is `MOCK_JOURNEYS`, resets on refresh
4. **No creation flow**: "Begin New Journey" is `alert('Coming in Wave I')`
5. **Supabase tables may need migration**: Schema exists but not confirmed deployed

---

## Phase 1 Scope

### Goal
Replace mock data with real identity and real persistence. Flow becomes a functional, personal journaling space for co-creation.

### Out of Scope (Phase 2+)
- Integration with Exchange/Storefronts (auto-generation)
- Real-time sync between co-creators
- Multi-being journeys (only solo or two-being)
- Open Collective bridge

---

## Sub-Task 1: Upgrade Storage Layer

### 1.1 Add journey/log methods to `useStorage`

New localStorage keys: `hlc_journeys`, `hlc_code_logs`

Functions needed:
- `getJourneys(): ExchangeJourney[]`
- `addJourney(journey: ExchangeJourney): void`
- `updateJourney(journey: ExchangeJourney): void`
- `findJourneyById(id: string): ExchangeJourney | undefined`
- `getCodeLogs(exchangeId: string): CodeLogEntry[]`
- `addCodeLog(log: CodeLogEntry): void`
- `updateCodeLog(log: CodeLogEntry): void`
- `removeCodeLog(id: string): void`

### 1.2 Add journey/log methods to `useUnifiedStorage`

Mirror functions with Supabase writes:
- `getJourneys()` → queries `exchange_journeys`
- `addJourney(journey)` → inserts to Supabase + localStorage
- `addCodeLog(log)` → inserts to `code_logs` + localStorage
- RLS policies: Only co-creators read/write (already defined in schema)

---

## Sub-Task 2: Replace Mock User with Real User

### 2.1 Flow page reads current user from `useSession`

Replace (in Flow.tsx):
```ts
// MOCK — remove these
const CURRENT_CES = '987654321'
const CURRENT_NAME = 'Seren Nova'
```

With:
```ts
const { user, signedIn } = useSession()
const currentCes = user?.ces || ''
const currentName = user?.name || 'Guest'
```

### 2.2 Update log filtering

Visible logs = all public logs + current user's private logs
```ts
const visibleLogs = journey.logs.filter(l => 
  l.visibility === 'public' || l.authorCes === currentCes
)
```

### 2.3 Update `isAuthor` checks in LogEntry
```ts
const isAuthor = entry.authorCes === currentCes
```

---

## Sub-Task 3: Implement Journey Creation

### 3.1 Wire "Begin New Journey" button

Replace `alert('Coming in Wave I')` with:
1. Modal opens: "Who are you co-creating with?"
2. Input: Co-creator's C.E.S. number (9 digits)
3. Optional: Title, description, initial Codes
4. Create journey via `addJourney()`
5. Re-render journey list

### 3.2 Minimum viable journey creation

Required fields:
- Title (e.g., "Natal Chart Reading")
- Co-creator C.E.S. (text input)
- Co-creator name (text input — will be resolved from Exchange later)
- Selected Codes (multiselect from 12)

Auto-populated:
- `wishingCes` = current user's C.E.S.
- `wishingName` = current user's name
- `status` = 'active'
- `currentPhase` = 'before'

### 3.3 Handle unsaved journeys in localStorage

If user not signed in, journeys save to `hlc_journeys` (localStorage) only.
When user signs in with C.E.S., migrate unsaved journeys to Supabase.

---

## Sub-Task 4: Make Log Entries Persist

### 4.1 `addLogEntry` saves to storage

Replace:
```ts
journey.logs.push(newLog)  // mutates local array only
```

With:
```ts
await unifiedStorage.addCodeLog(newLog)
// then refetch journey/logs from storage
```

### 4.2 Load journeys from storage on mount

```ts
const [journeys, setJourneys] = useState<ExchangeJourney[]>([])
useEffect(() => {
  unifiedStorage.getJourneys().then(data => setJourneys(data))
}, [])
```

### 4.3 Migrate mock journeys to storage

On first load (empty storage), seed with mock journeys so existing users don't see empty state.

---

## Sub-Task 5: Test Cross-Device with Real Profile

### 5.1 C.E.S. Profile creation flow

Atlas creates a profile via `/create-profile`:
- Name: Atlas Morphoenix
- C.E.S.: [auto-generated 9-digit]
- Passphrase: [set by Atlas]
- Upload photo, fill bio, etc.
- Submit → queue goes to steward (or pending)

### 5.2 Sign in on multiple devices

- Device 1: Create profile
- Device 2: Sign in with C.E.S. + passphrase
- Verify: Profile loads, journeys/listings visible

### 5.3 Verify Supabase sync

- Check Supabase dashboard: `profiles` table has Atlas's record
- Check `exchange_journeys` table: journeys created on Device 1 appear on Device 2

---

## Implementation Order

1. **Sub-Task 2** (real user in Flow) — 30 min, no dependencies
2. **Sub-Task 1.1** (localStorage methods) — 60 min
3. **Sub-Task 1.2** (Supabase methods in UnifiedStorage) — 90 min
4. **Sub-Task 3** (journey creation) — 90 min
5. **Sub-Task 4** (log persistence) — 60 min
6. **Sub-Task 5** (Atlas tests profile + cross-device) — user time

**Total dev time:** ~5.5 hours of focused work

---

## Open Questions

1. **Steward auto-approval**: Should Atlas's profile auto-approve for test purposes?
2. **Journey participant lookup**: When creating a journey and entering another being's C.E.S., should the app fetch their name/photo from the directory?
3. **Agreement table**: Is there an existing agreement UI, or should the "Agreement" tab in Flow show a prompt to create one?

---

## Acceptance Criteria — Phase 1 Complete

- [ ] Flow page shows "Signed in as Atlas Morphoenix" instead of "Seren Nova"
- [ ] Can create a new journey with title + co-creator C.E.S. + Codes
- [ ] Journey list persists after page refresh
- [ ] Log entries persist after page refresh
- [ ] Private logs are only visible to their author
- [ ] Public logs are visible to anyone who shares the journey
- [ ] Same C.E.S. + passphrase works on two different devices
- [ ] Supabase dashboard shows Atlas's profile data

---

*Co-created with Atlas Morphoenix for Heartlight Collective*
