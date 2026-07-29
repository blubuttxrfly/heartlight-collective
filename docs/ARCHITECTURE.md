# Heartlight Wish Exchange — Architecture

**The Heartlight of the Entire Collective** — where wishes become quests and co-creators become quest-mates.

---

## Core Flow

```
Wish → Exchange → Quest → Fulfillment
```

1. **Wish** — A being posts what they need (skill, resource, co-creation, time)
2. **Exchange** — Another being resonates and claims the wish
3. **Quest** — They co-create together (tracked in Flow with 12 Codes awareness)
4. **Fulfillment** — Both sign off, gratitude flows, the web strengthens

---

## Data Models

### Wish (New)
```typescript
interface Wish {
  id: string
  wishingCes: string           // C.E.S. of the one who posted
  wishingName: string
  title: string                // "Need help with React + Supabase integration"
  description: string          // Full context, what success looks like
  category: WishCategory       // See below
  urgency: 'low' | 'medium' | 'high' | 'time-sensitive'
  status: WishStatus           // See below
  selectedCodes: number[]      // Which of the 12 Codes guide this wish
  claimedByCes?: string        // C.E.S. of fulfiller (once claimed)
  claimedByName?: string
  claimedAt?: string
  questJourneyId?: string      // Links to ExchangeJourney once active
  fulfillmentNotes?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

type WishCategory = 
  | 'Tech & Development'
  | 'Creative & Design'
  | 'Writing & Content'
  | 'Healing & Wellness'
  | 'Astrology & Guidance'
  | 'Music & Sound'
  | 'Events & Facilitation'
  | 'Mutual Aid'
  | 'Climate Action'
  | 'Co-Creation Partnership'
  | 'Other'

type WishStatus = 
  | 'open'              // Available to claim
  | 'claimed'           // Someone resonated, quest forming
  | 'in_quest'         // Active ExchangeJourney
  | 'fulfillment'      // In review, signing off
  | 'complete'         // Fulfilled, gratitude exchanged
  | 'closed'           // Closed without fulfillment
```

### ExchangeJourney (Existing — Quest Tracking)
Already built in `src/types/ces.ts`:
- Tracks the co-creation journey
- Phases: `before` → `during` → `after`
- Code logs: Each being documents their experience through the 12 Codes
- Fulfillment signing: Both parties sign off when complete

### AgreementRecord (Existing — Quest Contract)
Already built:
- Defines roles, scope, timeline
- Exchange pathway (Gift, Trade, Sliding Scale, etc.)
- Boundaries and consent

---

## AI Agent Integration

AI agents can access the Wish Exchange via:

### Reading Wishes
```typescript
// Agent queries open wishes
GET /api/wishes?status=open&category=Tech

// Agent reads wish details
GET /api/wishes/:id

// Agent checks if wish is claimable
GET /api/wishes/:id/claimable
```

### Updating Wish Status
```typescript
// Agent claims a wish (on behalf of a being)
POST /api/wishes/:id/claim
{ "claimedByCes": "123456789", "claimedByName": "Atlas" }

// Agent updates quest progress
PATCH /api/wishes/:id/status
{ "status": "in_quest", "questJourneyId": "journey_123" }

// Agent marks fulfillment complete
PATCH /api/wishes/:id/fulfill
{ "fulfillmentNotes": "..." }
```

### Agent Awareness Protocol
Agents should:
1. **Check wish status** before acting (avoid claiming already-claimed wishes)
2. **Respect selected Codes** (e.g., if Code 1 Consent is selected, ensure clear boundaries)
3. **Update status flows** as co-creation progresses
4. **Log Code-aware reflections** in the Journey (via CodeLogEntry)

---

## Page Architecture

### Current Structure (Heartlight Collective fork)
```
src/pages/
├── Exchange.tsx      → The Exchange Portal (where co-creation is initiated)
├── Flow.tsx          → Quest Dashboard (track active journeys)
├── Profile.tsx       → Being profile (now shows: posted wishes, active quests)
└── Home.tsx          → Landing (now features: latest wishes, impact stats)
```

### The Exchange Portal (Not Just Browsing)

The **Exchange** page is where co-creators **initiate sacred co-creation**:

1. **Browse wishes** that resonate with your gifts
2. **Feel into alignment** — does this wish call to you?
3. **Initiate co-creation** — claim the wish, enter into Exchange
4. **Form the Quest** — AgreementRecord + ExchangeJourney are created
5. **Begin the Journey** — move to Flow dashboard for co-creation tracking

**This is not a transactional marketplace.** It's a **resonance matching portal** where:
- Wishes are invitations to co-create
- Claiming is an act of sacred yes
- The Exchange is the threshold where strangers become quest-mates

### Navigation Updates
- **Header "Exchange" button** → Routes to Exchange Portal (sacred co-creation initiation)
- **Flow page** → Quest tracking (already built, linked from active wishes)
- **Profile** → Add "My Wishes" + "My Quests" sections

---

## Supabase Schema (Planned)

```sql
-- Wishes table
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
  claimed_by_ces TEXT,
  claimed_by_name TEXT,
  claimed_at TIMESTAMPTZ,
  quest_journey_id UUID REFERENCES exchange_journeys(id),
  fulfillment_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast filtering
CREATE INDEX wishes_status_category_idx ON wishes(status, category);
CREATE INDEX wishes_created_at_idx ON wishes(created_at DESC);
```

---

## UI Components (To Build)

### Wish Portal (Exchange.tsx transformation)
- [ ] Browse wishes (filter by category, status, urgency)
- [ ] Post a wish form
- [ ] Claim a wish modal (with Code selection)
- [ ] My posted wishes dashboard

### Quest Dashboard (Flow.tsx — already built!)
- [ ] Active quests (claimed wishes in progress)
- [ ] Code logging (before/during/after phases)
- [ ] Fulfillment signing ceremony

### Profile Integration
- [ ] "My Wishes" tab (posted + claimed)
- [ ] "My Quests" tab (active journeys)
- [ ] Fulfillment history

---

## Green Hackathon MVP Scope

**Phase 1: Core Exchange** (48 hours)
1. ✅ Wish data model + Supabase migration
2. ✅ Post a wish page
3. ✅ Browse wishes page (Exchange.tsx transformation)
4. ✅ Claim a wish (creates AgreementRecord + ExchangeJourney)
5. ✅ Basic Flow dashboard (already built, just link it)

**Phase 2: Heartlight Features** (post-hackathon)
- AI agent API access
- Wish resonance matching (energetic alignment algorithm)
- Gratitude circles (fulfillment celebrations)
- Collective impact dashboard
- ChronoShare integration (time banking for wishes)

---

## Sacred Architecture Notes

This is **not** a transactional wish board. It's a **living co-creation ecosystem**:

- Wishes have **roles and beings** (not static posts)
- Exchange is a **sacred portal** (not a marketplace)
- Quests are **journeys of co-creation** (not task completions)
- Fulfillment is **mutual recognition** (not delivery confirmation)

The Flow page already encodes this: beings log their experience through the 12 Codes, documenting not just *what* was done, but *how* it felt, what was learned, how sovereignty was honored.

**AI agents** participating in this ecosystem must respect this sacred architecture — they are not automating transactions, they are **facilitating co-creation**.

---

*Built with Heartlight, for ALL that IS* 💫
