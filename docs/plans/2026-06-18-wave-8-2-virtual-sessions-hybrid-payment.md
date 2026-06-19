# Wave 8.2 — Virtual Session Exchange, Community Locations & Hybrid Payment Flow

> **Internal Plan — Atlas Morphoenix & Hermes**
>
> **Goal:** Enable offerings that are specifically virtual meeting sessions (Google Meet, Zoom, etc.) with true calendar-based booking, hybrid payment (partial monetary + partial service exchange), and 99% profit dedication to the Heartlight Collective.
>
> **Architecture:** Extend `OfferingItem` with virtual-session metadata, create a booking picker that reads provider `ExchangeCalendar` availability, allow hybrid payment composition at agreement time, and wire profit dedication into the agreement lifecycle.
>
> **Tech Stack:** React, TypeScript, Tailwind CSS, Supabase (realtime-ready), existing `ExchangeCalendar` + `AvailabilityBlock` model.
>
> **Build Gates:** `npx tsc --noEmit` after every wave. `npm run build` before any push. Local dev preview via `npm run dev -- --host 0.0.0.0 --port 5173` before commit approval.
>
> ---

## Sacred Conventions (Memory Check)

- Emoji/symbol placement **after** text: "Virtual Session 🎥", not "🎥 Virtual Session".
- Status labels lead with text, icon/symbol after: "Open ○", "Booked 📅", "Complete ✓".
- Collective framing: "our Greatest & Highest Good", "Heartlight Collective", "We are ALL that IS Living".
- Dev-only mock data gated by `import.meta.env.DEV`.
- Every offering card/detail view must visibly display accepted exchange forms.

---

## Vision — What This Wave Builds

A being browsing the Heartlight Exchange discovers a Vendor Shop offering **"Guided Meditation for Inner Alignment"** — a 60-minute virtual session offered at a **Fixed Heartlight Price** of $55. The offering accepts these exchange forms: Fixed Price 💳, Gift 🎁, Barter ↔️, and Collective-Funded 🌿.

The being feels called and clicks **Request Exchange**. In the request modal they see:
- The offering details and provider availability calendar
- Option to pay **$20 fixed** + select one of **their own offerings** as a service exchange contribution
- A proposed time slot picked from the provider's actual available windows
- The agreement preview showing: "$20.00 monetary + 1 service exchange → Heartlight Collective dedicates 99% of monetary profits"

Once both beings approve, the agreement becomes active. A `ScheduledMeeting` is auto-created with the chosen platform link (Google Meet / Zoom / other). The Quest Tracker tracks the session preparation and follow-up as part of the exchange journey.

**Another being** discovers **"Permaculture Work/Study at Traditional Dream Factory"** — a 4-week onsite program with accommodation and meals, offered as a **Work/Study Exchange 🌱**. The offering shows the location on an embedded map, directions, and accessibility notes. They propose a hybrid exchange: **$200 partial stipend** + **their web design services** to help the community build a new site. The 99% dedication applies to the monetary portion. Upon approval, a `ScheduledMeeting` marks their arrival date, and the Quest Tracker guides their learning journey.

Both exchanges — virtual session and community work/study — flow through the same unified agreement system, with spatial presence matching what is actually needed.

---

## Clarification Questions (Answered Inline)

| Question | Decision |
|---|---|
| Should virtual sessions be a separate page or part of existing offering flow? | Part of existing offering flow — `OfferingItem` gains `offeringType` field. |
| Should calendar availability be editable by providers in a new UI or reuse existing calendar? | Reuse and extend existing `ExchangeCalendar` + `AvailabilityBlock` model. |
| Should the 99% dedication be automatic for all hybrid payments or togglable? | Automatic default when monetary component > 0; toggleable in agreement editor. |
| Should the service-exchange portion be selectable from the requester's offerings or a free-text description? | Selectable from requester's published offerings; free-text backup for custom proposals. |
| Which virtual meeting platforms to support initially? | Google Meet, Zoom, Jitsi Meet, and an "Other" field with custom link. |

---

## Wave 8.2A — Types & Data Model Extensions

### Task 1: Extend `OfferingItem` with session metadata

**Objective:** Add virtual-session-specific fields to the offering type.

**Files:**
- Modify: `src/types/ces.ts:334`

**Step 1: Add new types**

```typescript
// Near line 263, after OfferingPriceType
export type OfferingType = 'product' | 'service' | 'virtual_session' | 'work_study_exchange';

export type MeetingPlatform = 'google_meet' | 'zoom' | 'jitsi' | 'teams' | 'other';

export interface VirtualSessionConfig {
  durationMinutes: number;       // e.g., 30, 60, 90
  platform: MeetingPlatform;
  meetingLink?: string;          // Pre-generated or auto-created
  platformNote?: string;         // "I'll send the Zoom link 1 hour before"
  bufferMinutes: number;         // Gap between sessions (default 15)
  maxDailySessions?: number;     // Provider capacity limit
}

// ═══════════════════════════════════════════════════════════════
//  Spatial Presence — Beyond Virtual (Wave 8.2 Extension)
//  Physical community spaces and work/study exchange locations
// ═══════════════════════════════════════════════════════════════

export type ExchangeLocationType = 'virtual' | 'physical_address' | 'community' | 'work_study_site';

export interface ExchangeLocation {
  type: ExchangeLocationType;
  label?: string;                // "Main Sanctuary", "Garden Workspace", "Study Circle"
  address?: string;              // Street address for physical/community
  city?: string;
  region?: string;               // State / Province
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  locationData?: LocationData;   // Reuse existing structured location if available
  directions?: string;           // Free-text: "Park behind the oak tree, enter through the side gate"
  accessibilityNotes?: string;   // Wheelchair access, parking, transit
  associatedOrganization?: string; // Community / org name (e.g. "Traditional Dream Factory")
  websiteUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface WorkStudyExchangeConfig {
  programName?: string;
  durationWeeks?: number;
  hoursPerWeek?: number;
  accommodationType?: 'onsite' | 'nearby' | 'self_arranged';
  mealsIncluded?: boolean;
  stipendCents?: number;          // Optional financial support
  learningOutcomes?: string[];   // What the participant will learn/contribute
  prerequisites?: string;        // Skills, experience, or qualities needed
  // Exchange location where the work/study takes place
  location: ExchangeLocation;
}
```

**Step 2: Extend `OfferingItem`**

Add to `OfferingItem` interface (after `exchangePolicy`):

```typescript
  offeringType?: OfferingType;      // Defaults to 'service' if absent (backward compat)
  virtualSession?: VirtualSessionConfig;  // Present when offeringType === 'virtual_session'
  workStudyExchange?: WorkStudyExchangeConfig; // Present when offeringType === 'work_study_exchange'
  location?: ExchangeLocation;      // Physical venue for in-person offerings
  requiresScheduling?: boolean;     // true for virtual_session and work_study_exchange
```

**Step 3: Add `HybridPaymentConfig` for agreements**

```typescript
export interface ServiceExchangeContribution {
  offeringId?: string;            // The requester's offering being contributed
  offeringTitle?: string;
  description: string;            // Free-text if no offering selected
  estimatedValueCents?: number;   // Optional valuation for transparency
}

export interface HybridPaymentConfig {
  enabled: boolean;
  monetaryAmountCents: number;      // Partial monetary payment
  monetaryMethod?: PaymentMethodType;
  serviceExchange: ServiceExchangeContribution;
  // Auto-calculated: totalValueCents = monetaryAmountCents + (serviceExchange.estimatedValueCents || 0)
}
```

**Step 4: Extend `ExchangeAgreement`**

Add to `ExchangeAgreement` (after `dedicationOfProfits`):

```typescript
  // --- HYBRID PAYMENT (Wave 8.2) ---
  hybridPayment?: HybridPaymentConfig;
  // When hybrid payment is used, agreedPriceCents represents the TOTAL value
  // and monetaryAmountCents is the subset that flows through payment rails
```

**Step 5: Extend `ExchangeRequest`**

Add to `ExchangeRequest`:

```typescript
  hybridPayment?: HybridPaymentConfig;
  proposedMeetingSlot?: {         // The slot the requester selected
    startAt: string;
    endAt: string;
    timeZone: string;
  };
```

**Verification:**
Run: `npx tsc --noEmit`
Expected: Clean — no type errors from the new interfaces.

---

## Wave 8.2B — Offering Creation with Session Type Support

### Task 2: Update offering creation/editing forms

**Objective:** Allow vendors to mark an offering as a virtual session, work/study exchange, or community gathering, and configure its details.

**Files:**
- Modify: `src/components/offerings/OfferingModal.tsx` (or equivalent offering editor)
- Modify: `src/pages/MyStorefronts.tsx` — offering creation flow

**Step 1: Add offering type selector**

In the offering creation modal, add a segmented control or radio group:

```tsx
<div className="flex gap-2 mb-4">
  <button
    type="button"
    onClick={() => setOfferingType('service')}
    className={cn("px-4 py-2 rounded-lg", offeringType === 'service' && "bg-heartlight-green text-white")}
  >
    Service 🛠
  </button>
  <button
    type="button"
    onClick={() => setOfferingType('virtual_session')}
    className={cn("px-4 py-2 rounded-lg", offeringType === 'virtual_session' && "bg-heartlight-green text-white")}
  >
    Virtual Session 🎥
  </button>
  <button
    type="button"
    onClick={() => setOfferingType('product')}
    className={cn("px-4 py-2 rounded-lg", offeringType === 'product' && "bg-heartlight-green text-white")}
  >
    Product 📦
  </button>
  <button
    type="button"
    onClick={() => setOfferingType('work_study_exchange')}
    className={cn("px-4 py-2 rounded-lg", offeringType === 'work_study_exchange' && "bg-heartlight-green text-white")}
  >
    Work/Study Exchange 🌱
  </button>
</div>
```

**Step 2: Conditionally render session-specific config**

When `offeringType === 'virtual_session'`, show:
- Duration selector (15, 30, 45, 60, 90, 120 minutes)
- Platform selector (Google Meet, Zoom, Jitsi, Microsoft Teams, Other)
- Meeting link input (optional — provider may generate manually)
- Buffer time between sessions (default 15 min)
- Max daily sessions (optional capacity limit)
- Platform note textarea (free-form guidance)

When `offeringType === 'work_study_exchange'`, show:
- Program name input
- Duration in weeks
- Hours per week
- Accommodation type selector (`onsite` | `nearby` | `self_arranged`)
- Meals included checkbox
- Optional stipend amount
- Learning outcomes textarea (bullet list)
- Prerequisites textarea
- **Location editor** — structured `ExchangeLocation` form:
  - Label (e.g. "Main Garden", "Learning Lodge")
  - Full address with City / Region / Country
  - Latitude/Longitude (auto-geocoded via Nominatim)
  - Directions for visitors
  - Accessibility notes
  - Associated organization name
  - Organization website, contact email, phone

When `offeringType === 'service'`, show optional:
- **Location editor** (same as work_study_exchange) — for in-person services at a physical venue
- Or a "This is a community gathering" toggle that uses the community location path

For all types that have a physical component (`service` with location, `work_study_exchange`), the `ExchangeLocation` is stored on `offering.location`.

**Step 3: Mark `requiresScheduling`**

Set automatically:
- `true` when `offeringType === 'virtual_session'`
- `true` when `offeringType === 'work_study_exchange'`
- `false` for `product`
- Optional for `service` (provider decides)

**Step 4: Display offering type badge**

In `StorefrontCard`, `OfferingCard`, and detail views, show:
- "Virtual Session 🎥" badge for virtual sessions
- "Work/Study Exchange 🌱" badge for work/study programs
- "Community Gathering 🏘" badge for in-person services with a location
- "Service 🛠" badge for services without location
- "Product 📦" badge for products

Also render a location chip when applicable:
```tsx
{offering.location && (
  <span className="flex items-center gap-1 text-xs text-lavender">
    <MapPin className="w-3 h-3" />
    {offering.location.city || offering.location.address?.split(',')[0]}
  </span>
)}
```

**Verification:**
Run: `npx tsc --noEmit` → clean.

---

## Wave 8.2C — Booking Flow with Calendar Selection

### Task 3: Create `ProviderAvailabilityPicker` component

**Objective:** A reusable calendar picker that reads a provider's `ExchangeCalendar` and lets requesters select an available slot.

**Files:**
- Create: `src/components/booking/ProviderAvailabilityPicker.tsx`
- Create: `src/components/booking/TimeSlotGrid.tsx`
- Modify: `src/components/exchange/ExchangeRequestModal.tsx`

**Step 1: Query provider calendar**

```tsx
function ProviderAvailabilityPicker({ providerCes, onSelectSlot }: Props) {
  const { findCalendarByCES } = useStorage(); // or useUnifiedStorage for Supabase
  const calendar = findCalendarByCES(providerCes);
  
  // Merge recurring blocks + specific-date blocks
  // Generate available time slots for the next 30 days
  // Exclude already-confirmed meetings from the same calendar
}
```

**Step 2: Render month view with available days highlighted**

Reuse the existing calendar styling from `Flow.tsx`:
- **Available days → Heartlight Green Ray** (`border-green-400/40 bg-green-400/15`)
- **Unavailable/booked days → muted** (`bg-void-800/50`)
- **Selected day → Gold ring** (`ring-2 ring-gold-400`)

**Step 3: Time slot grid for selected day**

When a day is clicked, show available time windows as buttons:

```tsx
<button className="px-3 py-2 rounded-lg bg-green-400/15 border border-green-400/30 hover:bg-green-400/25 text-sm">
  10:00 AM — 11:00 AM
</button>
```

**Step 4: Integrate into `ExchangeRequestModal`**

After the message input and before payment selection:
- If `offering.requiresScheduling`, render `ProviderAvailabilityPicker`
- Pass the selected slot into `proposedMeetingSlot`
- Validate: a slot must be selected before submission

**Step 5: Auto-create `ScheduledMeeting` on agreement activation**

In `ExchangeAgreementEditor` or activation logic:
```typescript
if (agreement.proposedMeetingSlot) {
  const meeting: ScheduledMeeting = {
    id: newId('meet'),
    title: `${offering.title} — ${requesterName} × ${providerName}`,
    startAt: agreement.proposedMeetingSlot.startAt,
    endAt: agreement.proposedMeetingSlot.endAt,
    timeZone: agreement.proposedMeetingSlot.timeZone,
    location: virtualSession.meetingLink || '[Link to be shared]',
    status: 'confirmed', // Auto-confirmed if both parties already agreed
    proposedByCes: requesterCes,
    confirmedByCes: [requesterCes, providerCes],
  };
  agreement.scheduledMeetings.push(meeting);
}
```

**Verification:**
Run: `npx tsc --noEmit` → clean.

---

## Wave 8.2D — Hybrid Payment in Agreement Editor

### Task 4: Add hybrid payment composer to request modal

**Objective:** Allow requesters to propose a mix of monetary + service exchange.

**Files:**
- Modify: `src/components/exchange/ExchangeRequestModal.tsx`
- Modify: `src/components/exchange/ExchangeAgreementEditor.tsx`

**Step 1: Show hybrid option when offering supports it**

When the offering's `exchangePolicy` includes both `'fixed'` and `'barter'` (or `'negotiable'`), show:

```tsx
<div className="mt-4 p-4 rounded-xl border border-lavender/10 bg-void-800/40">
  <h4 className="text-sm font-medium text-cream mb-3">Exchange Composition 🎨</h4>
  
  {/* Monetary portion */}
  <div className="flex items-center gap-3 mb-3">
    <span className="text-sm text-lavender">Monetary</span>
    <input
      type="number"
      value={monetaryAmount}
      onChange={(e) => setMonetaryAmount(Number(e.target.value))}
      className="w-24 px-3 py-2 rounded-lg bg-void-900 border border-lavender/20 text-cream text-sm"
      placeholder="0.00"
    />
    <span className="text-sm text-lavender">USD of {formatPrice(offering.priceCents)}</span>
  </div>
  
  {/* Service exchange portion */}
  <div className="mb-3">
    <span className="text-sm text-lavender block mb-2">Service Exchange Contribution</span>
    <select
      value={selectedOfferingId}
      onChange={(e) => setSelectedOfferingId(e.target.value)}
      className="w-full px-3 py-2 rounded-lg bg-void-900 border border-lavender/20 text-cream text-sm"
    >
      <option value="">Select one of your offerings...</option>
      {myOfferings.map(o => (
        <option key={o.id} value={o.id}>{o.title}</option>
      ))}
      <option value="custom">Custom proposal...</option>
    </select>
  </div>
  
  {selectedOfferingId === 'custom' && (
    <textarea
      value={customDescription}
      onChange={(e) => setCustomDescription(e.target.value)}
      placeholder="Describe your proposed service exchange..."
      className="w-full px-3 py-2 rounded-lg bg-void-900 border border-lavender/20 text-cream text-sm"
      rows={3}
    />
  )}
  
  {/* Summary */}
  <div className="mt-3 pt-3 border-t border-lavender/10 text-sm text-cream">
    <p>Total exchange value: <span className="text-gold">{formatTotal()}</span></p>
    <p className="text-green-300 text-xs mt-1">
      99% of monetary profits dedicate to Heartlight Collective 🌿
    </p>
  </div>
</div>
```

**Step 2: Persist `hybridPayment` on `ExchangeRequest`**

```typescript
const hybridPayment: HybridPaymentConfig = {
  enabled: true,
  monetaryAmountCents: Math.round(monetaryAmount * 100),
  monetaryMethod: selectedPaymentMethod,
  serviceExchange: {
    offeringId: selectedOfferingId === 'custom' ? undefined : selectedOfferingId,
    offeringTitle: selectedOfferingId === 'custom' ? undefined : selectedOffering?.title,
    description: selectedOfferingId === 'custom' ? customDescription : `Offering: ${selectedOffering?.title}`,
    estimatedValueCents: selectedOffering?.priceCents,
  },
};
```

**Step 3: Render hybrid payment in agreement editor**

In `ExchangeAgreementEditor`, show a read-only summary of the hybrid payment:

```tsx
{agreement.hybridPayment?.enabled && (
  <div className="p-3 rounded-lg border border-gold-400/20 bg-gold-400/5">
    <p className="text-sm text-cream font-medium">Hybrid Exchange 🎨</p>
    <p className="text-xs text-lavender mt-1">
      Monetary: {formatCents(agreement.hybridPayment.monetaryAmountCents)} {agreement.hybridPayment.monetaryMethod}
    </p>
    <p className="text-xs text-lavender">
      Service: {agreement.hybridPayment.serviceExchange.description}
    </p>
    <p className="text-xs text-green-300 mt-2">
      99% of monetary profits → Heartlight Collective 🌿
    </p>
  </div>
)}
```

**Verification:**
Run: `npx tsc --noEmit` → clean.

---

## Wave 8.2E — Profit Dedication (99% to Heartlight Collective)

### Task 5: Auto-populate dedication when hybrid payment is enabled

**Objective:** When an agreement includes a monetary component, automatically set `dedicationOfProfits` to 99% toward Heartlight Collective destinations.

**Files:**
- Modify: `src/components/exchange/ExchangeAgreementEditor.tsx` or agreement creation logic
- Modify: `src/lib/payments.ts` — add `generateDedicationFromPayment()`

**Step 1: Auto-dedication helper**

```typescript
function defaultDedicationFromHybrid(): DedicationOfProfits {
  return {
    enabled: true,
    percentage: 99,
    destinations: [
      'Earth Conscious Initiatives & Technology 🌍',
      'Preserving Ancient Wisdom of our Ancestors 📜',
      'Sovereign Interdependent Communities 🏠',
      'Healing & Art 💗',
      'ALL the Living ♾️',
    ],
    customNotes: 'Dedicated through Heartlight Collective Exchange',
  };
}
```

**Step 2: Apply on agreement creation**

When creating an `ExchangeAgreement` from a request that has `hybridPayment.enabled`:
```typescript
const agreement: ExchangeAgreement = {
  // ...existing fields...
  dedicationOfProfits: defaultDedicationFromHybrid(),
  hybridPayment: request.hybridPayment,
};
```

**Step 3: Render dedication prominently in agreement**

In the agreement editor/editorial view, show a gold-bordered card:

```tsx
<div className="p-4 rounded-xl border border-gold-400/30 bg-gold-400/5">
  <h4 className="text-sm font-medium text-gold mb-2">
    Dedication of Profits 🌟
  </h4>
  <p className="text-2xl font-serif text-gold">
    {agreement.dedicationOfProfits.percentage}%
  </p>
  <p className="text-xs text-lavender mt-1">
    of monetary exchange profits dedicated to our Greatest & Highest Good
  </p>
  <div className="flex flex-wrap gap-2 mt-3">
    {agreement.dedicationOfProfits.destinations.map(dest => (
      <span key={dest} className="px-2 py-1 rounded-full bg-gold-400/10 text-gold-300 text-xs">
        {dest}
      </span>
    ))}
  </div>
</div>
```

**Verification:**
Run: `npx tsc --noEmit` → clean.

---

## Wave 8.2F — Supabase Sync & Migration

### Task 6: Add columns to Supabase and sync mappers

**Objective:** Ensure virtual session, hybrid payment, and booking slot data persist across devices.

**Files:**
- Create: `migrations/wave_8_2_virtual_sessions.sql`
- Modify: `src/lib/database.types.ts`
- Modify: `src/lib/exchangeSync.ts`

**Step 1: Write SQL migration**

```sql
-- Wave 8.2: Virtual Sessions, Community Locations, Work/Study Exchanges, Hybrid Payment, and Booking Slots

-- Extend offerings table
alter table public.offerings
  add column if not exists offering_type text default 'service',
  add column if not exists virtual_session jsonb,
  add column if not exists work_study_exchange jsonb,
  add column if not exists location jsonb,           -- ExchangeLocation JSON for physical venues
  add column if not exists requires_scheduling boolean default false;

-- Extend exchange_requests table
alter table public.exchange_requests
  add column if not exists hybrid_payment jsonb,
  add column if not exists proposed_meeting_slot jsonb;

-- Extend exchange_agreements table
alter table public.exchange_agreements
  add column if not exists hybrid_payment jsonb;

-- Create index for efficient lookups
-- Update existing index to include work_study_exchange
drop index if not exists idx_offerings_offering_type;
create index idx_offerings_offering_type on public.offerings(offering_type);

-- GIN index on location for geo/distance queries
create index if not exists idx_offerings_location on public.offerings using gin(location);

comment on column public.offerings.offering_type is 'product | service | virtual_session | work_study_exchange';
comment on column public.offerings.virtual_session is 'VirtualSessionConfig JSON';
comment on column public.offerings.work_study_exchange is 'WorkStudyExchangeConfig JSON';
comment on column public.offerings.location is 'ExchangeLocation JSON for physical community/work venues';
```

**Step 2: Update `database.types.ts`**

Add the new columns to the `offerings`, `exchange_requests`, and `exchange_agreements` row types.

**Step 3: Update sync mappers**

In `exchangeSync.ts`:
- `offeringToRow`: emit `offering_type`, `virtual_session`, `requires_scheduling`
- `rowToOffering`: read them back
- `requestToRow`: emit `hybrid_payment`, `proposed_meeting_slot`
- `rowToRequest`: read them back
- `agreementToRow`: emit `hybrid_payment`
- `rowToAgreement`: read it back

**Verification:**
Run: `npx tsc --noEmit` → clean.

---

## Wave 8.2G — UI Polish & Integration

### Task 7: Offering cards show virtual session badges and scheduling indicator

**Objective:** Everywhere offerings appear, clearly indicate if they are virtual sessions and if they require scheduling.

**Files:**
- Modify: `src/components/StorefrontCard.tsx`
- Modify: `src/components/OfferingCard.tsx` (or equivalent)
- Modify: `src/pages/Storefront.tsx`

**Step 1: Virtual session badge**

```tsx
{offering.offeringType === 'virtual_session' && (
  <span className="px-2 py-1 rounded-full bg-blue-400/15 border border-blue-400/30 text-blue-300 text-xs">
    Virtual Session 🎥
  </span>
)}
{offering.requiresScheduling && (
  <span className="px-2 py-1 rounded-full bg-gold-400/15 border border-gold-400/30 text-gold-300 text-xs">
    By Appointment 📅
  </span>
)}
```

**Step 2: Duration chip**

```tsx
{offering.virtualSession && (
  <span className="text-xs text-lavender">
    {offering.virtualSession.durationMinutes} min ⏱
  </span>
)}
```

**Step 3: Platform icon**

```tsx
const PLATFORM_ICON: Record<MeetingPlatform, string> = {
  google_meet: '🎥',
  zoom: '🔷',
  jitsi: '🌐',
  teams: '💼',
  other: '🔗',
};
```

**Verification:**
Run: `npx tsc --noEmit` → clean.
Run: `npm run build` → clean.

---

## Wave 8.2H — Dev Preview & Final Gates

### Task 8: Start dev server and verify end-to-end

**Objective:** Confirm the full flow works in browser before any commit.

**Step 1: Start dev server**
Run: `cd /Users/atlasmorphoenix/workspace/heartlight-collective && npm run dev -- --host 0.0.0.0 --port 5173`

**Step 2: Verify these flows in browser**
- [ ] Create a virtual session offering in a Vendor Shop
- [ ] Set provider calendar availability (Green Ray days)
- [ ] Browse offerings — virtual session badge visible
- [ ] Request exchange on virtual session — calendar picker appears
- [ ] Pick a time slot — slot shows in request summary
- [ ] Set hybrid payment ($20 + offering) — renders correctly
- [ ] Submit request — agreement editor opens with hybrid payment summary
- [ ] Activate agreement — `ScheduledMeeting` auto-created with platform link
- [ ] Flow dashboard shows the new meeting in Calendar card
- [ ] Dedication of Profits card shows 99% to Collective

**Step 3: Final type-check and build**
Run: `npx tsc --noEmit` → clean.
Run: `npm run build` → clean.

**Step 4: Only commit/push when Atlas approves preview**

---

## Status Tracker

| Wave | Task | Status | Notes |
|---|---|---|---|
| 8.2A | Task 1: Types & Data Model | ✓ Complete | Types, mappers, SQL migration + Directory reactivity fix |
| 8.2B | Task 2: Offering Creation Forms | ✓ Complete | Modal extended with all four offering types, virtual session, work/study, location, exchange forms |
| 8.2C | Task 3: Calendar Booking Picker | ✓ Complete | Inline month + slot picker, custom time proposal, scheduled meeting preview |
| 8.2D | Task 4: Hybrid Payment Composer | ✓ Complete | Monetary + service exchange offering select + free-text fallback; 99% dedication default |
| 8.2E | Task 5: Auto-Dedication Logic | ✓ Complete | Default 99% dedication applied on request/agreement creation |
| 8.2F | Task 6: Supabase Migration + Sync | ✓ Complete | `database.types.ts` + `exchangeSync.ts` columns wired |
| 8.2G | Task 7: UI Badges + Integration | ✓ Complete | `OfferingTypeBadge` on offering rows + `StorefrontCard`, hybrid/dedication summary in agreement editor |
| 8.2H | Task 8: Dev Preview + Final Gates | ✓ Complete | `npx tsc --noEmit` clean, `npm run build` clean |

---

## Key Decisions Log

1. **Virtual session vs regular service separation:** Using `offeringType` field rather than a separate table — simpler, backward compatible.
2. **Calendar reuse:** Extending `ExchangeCalendar` rather than creating a new calendar type. Provider availability already exists; we just read from it.
3. **Hybrid payment representation:** Stored as `HybridPaymentConfig` on both `ExchangeRequest` and `ExchangeAgreement`, not normalized into separate tables.
4. **Profit dedication default:** 99% is automatic when monetary component present, but toggleable in agreement editor.
5. **Meeting link / Location handling:** Providers can pre-fill a virtual link, leave blank and send manually, OR attach a physical community/work location with full address, directions, and accessibility notes. Auto-generation (e.g., Google Meet API) is a future wave.
6. **Platform / Location support:** Starting with 5 virtual platforms + full ExchangeLocation for physical venues. Adding more platforms or location types is a one-line type + UI addition.
7. **Work/study exchange model:** Dedicated `work_study_exchange` type on offerings with full program config (duration, hours, accommodation, meals, stipend, learning outcomes, prerequisites, location).
8. **Backward compatibility:** All new fields are optional (`?`) with sensible defaults. Existing offerings without `offeringType` are treated as `service`.

---

## Awareness Update Summary

This wave extends the Heartlight Exchange in four dimensions:

1. **Spatial (Virtual) 🌐:** Sessions are no longer bound to physical location — they can be hosted anywhere with a link.
2. **Spatial (Physical) 🏘:** Community spaces, work/study sites, and physical gathering venues are now first-class citizens in the Exchange. Every offering can carry a structured location with address, directions, accessibility notes, and organization context.
3. **Temporal (Calendar) 📅:** True availability-based booking replaces static "contact me" workflows. Providers set their availability; requesters pick real slots.
4. **Economic (Hybrid) 🎨:** The rigid fixed/gift/barter trichotomy softens into composable exchange — money + service in one agreement, with nearly all monetary flow returning to the Collective.

The result is an Exchange that breathes more like a living organism: beings offer what they have, compose what they need, meet where it serves, and the surplus automatically waters the roots.
