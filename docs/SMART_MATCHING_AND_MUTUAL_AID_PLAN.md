# Heartlight Wish Exchange — Smart Matching & Mutual Aid Plan

**Co-created with Atlas Morphoenix** — for the Greatest & Highest Good of ALL

---

## Overview

This document details two core systems:

1. **Smart Matching System** — Hybrid approach (tags + embeddings) to match beings with resonant wishes and gifts
2. **Mutual Aid Fund Structure** — Direct mutual aid as default, with shared pool unlocking after 33 days of community membership

---

## Part 1: Smart Matching System

### Design Principles

- **Co-creator perspective first** — Beings browse wishes to fulfill, not just post wishes to receive
- **Hybrid matching** — Explicit tags for filtering, embeddings for resonance scoring
- **Nuance-aware** — Embeddings read into the deeper meaning of wishes and gifts
- **Sovereign choice preserved** — System suggests, beings choose
- **Reciprocity encouraged** — Beings are both wishers and fulfillers (not one-sided)

---

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Being Posts Wish or Offer                              │
│  - Tags (explicit categories, skills, needs)           │
│  - Description (natural language, nuance, context)     │
│  - Urgency, Availability, Location                      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Embedding Generation (Server-side)                     │
│  - Send description to embedding model                  │
│  - Store vector in Supabase (pgvector)                  │
│  - Associate with tags for hybrid filtering             │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Co-creator Browses Wishes                              │
│  - Optional: filter by tags (category, urgency, etc.)  │
│  - System ranks by resonance score (embedding similarity)
│  - Shows "Top N Resonant Matches"                       │
│  - Also shows: "Recent", "Urgent", "Near You"           │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Being Chooses to Claim                                 │
│  - Reads full wish details                              │
│  - Feels into alignment (sovereign choice)             │
│  - Claims wish → enters Exchange                        │
└─────────────────────────────────────────────────────────┘
```

---

### Data Model

```typescript
interface Wish {
  id: string
  postedByCes: string           // C.E.S. of being posting
  postedByName: string
  type: 'wish' | 'offer'        // Need or gift
  
  // Explicit tags (for filtering)
  category: WishCategory        // Tech, Creative, Healing, etc.
  skills: string[]              // Specific skills needed/offered
  resources: string[]           // Resources involved (funds, space, equipment)
  roles: string[]               // Roles in the exchange (learner, teacher, co-creator)
  urgency: 'low' | 'medium' | 'high' | 'time-sensitive'
  location?: string             // Timezone or region (for local matching)
  
  // Natural language (for embeddings)
  title: string
  description: string           // Full context, nuance, what success looks like
  
  // Exchange details
  exchangeAvenue: 'direct' | 'collective' | 'funded' | 'partnership'
  fundsRequired?: number        // If funds needed (in USD cents)
  fundsAvailable?: number       // If funds offered
  timeCommitment?: string       // "2-3 hours", "ongoing", "one-time"
  
  // Matching metadata
  embedding?: number[]          // Vector embedding (pgvector)
  embeddingModel: string        // Model used (e.g., "sentence-transformers/all-MiniLM-L6-v2")
  
  // Status
  status: WishStatus
  claimedByCes?: string
  claimedByName?: string
  claimedAt?: string
  
  // Lifecycle
  createdAt: string
  updatedAt: string
  expiresAt?: string            // Wishes auto-close after N days
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
  | 'Resources'
  | 'Funds'
  | 'Space & Place'
  | 'Other'

type WishStatus =
  | 'open'
  | 'claimed'
  | 'in_exchange'
  | 'fulfillment'
  | 'complete'
  | 'closed'
  | 'expired'
```

---

### Matching Algorithm (Hybrid)

```python
def calculate_resonance_score(wish, co_creator_profile):
    """
    Hybrid matching: tags + embeddings
    
    Returns score 0.0 - 1.0
    """
    
    # 1. Tag-based filtering (hard constraints)
    if not tags_match(wish, co_creator_profile):
        return 0.0  # No match
    
    # 2. Embedding similarity (soft scoring)
    embedding_similarity = cosine_similarity(
        wish.embedding,
        co_creator_profile.embedding
    )
    
    # 3. Boost factors
    urgency_boost = 1.2 if wish.urgency == 'time-sensitive' else 1.0
    location_boost = 1.1 if same_timezone(wish, co_creator_profile) else 1.0
    reciprocity_boost = 1.15 if co_creator_has_fulfilled_before else 1.0
    
    # 4. Combined score
    final_score = embedding_similarity * urgency_boost * location_boost * reciprocity_boost
    
    return min(final_score, 1.0)
```

**Ranking Strategy:**
- Default sort: resonance score (highest first)
- Alternative sorts: most urgent, newest, closest location
- Show top 5-10 resonant matches prominently
- Allow browsing all open wishes (not just algorithmic matches)

---

### Embedding Implementation

**Option A: Server-side (Recommended for MVP)**
```typescript
// Using Hugging Face Inference API (free tier)
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(
    'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: text })
    }
  )
  const embedding = await response.json()
  return embedding[0] // 384-dimensional vector
}
```

**Option B: Local (Sovereign, no API dependency)**
```typescript
// Using Transformers.js (runs in browser or Node)
import { pipeline } from '@xenova/transformers'

const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
const output = await extractor(text, { pooling: 'mean', normalize: true })
const embedding = Array.from(output.data)
```

**Storage in Supabase:**
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to wishes table
ALTER TABLE wishes 
  ADD COLUMN embedding vector(384),
  ADD COLUMN embedding_model TEXT DEFAULT 'sentence-transformers/all-MiniLM-L6-v2';

-- Create index for fast similarity search
CREATE INDEX wishes_embedding_idx ON wishes USING ivfflat (embedding vector_cosine_ops);
```

**Query for Resonant Matches:**
```sql
-- Find top 10 most resonant wishes for a co-creator
SELECT 
  w.*,
  1 - (w.embedding <=> $1) AS resonance_score
FROM wishes w
WHERE w.status = 'open'
  AND w.category = ANY($2)  -- Optional tag filter
  AND w.posted_by_ces != $3  -- Don't show own wishes
ORDER BY resonance_score DESC
LIMIT 10;
```

---

### Co-Creator Experience Flow

**1. Co-creator lands on Exchange page**
- See: "Wishes Resonant With You" (top 5-10, ranked by embedding similarity)
- See: "Most Urgent" (time-sensitive first)
- See: "Recent Wishes" (newest first)
- Search bar: filter by keywords, tags, categories

**2. Co-creator clicks a wish**
- See full details: description, resources needed, time commitment
- See: "This wish aligns with your gifts in: [skills]"
- See: "X other beings are viewing this wish" (social proof, optional)
- Button: "I Feel Called to Meet This Wish" (claim)

**3. Co-creator claims wish**
- Modal: "Confirm Your Yes"
  - Reminds of boundaries and consent
  - Asks: "Are you ready to enter exchange with this being?"
  - Confirms: "This will create a Quest in your Flow Dashboard"
- On confirm:
  - Wish status → 'claimed'
  - ExchangeJourney created
  - Both beings notified
  - Flow Dashboard updated

**4. Co-creator fulfills wish**
- Track progress in Flow Dashboard
- Log reflections through 12 Codes lens
- Both beings sign off on fulfillment
- Wish status → 'complete'
- Reciprocity score increases (for future matching boosts)

---

### Reciprocity & Balance

**Important:** The system encourages beings to both post wishes AND fulfill others' wishes.

**Metrics to Track:**
- `wishes_posted` — How many wishes a being has posted
- `wishes_fulfilled` — How many wishes a being has fulfilled
- `reciprocity_ratio` — fulfilled / posted (aim for ~1.0 over time)

**Not Punitive:**
- Beings can post wishes without fulfilling (no penalty)
- But: higher reciprocity = higher visibility in matching
- Celebrates beings who both give and receive

---

## Part 2: Mutual Aid Fund Structure

### Design Principles

- **Direct mutual aid is default** — Beings connect directly, no intermediary
- **Shared pool is optional** — Unlocks after 33 days of community membership
- **Transparent flows** — All beings can see fund movements
- **Sovereign choice preserved** — Beings choose how to give/receive
- **Guides & Guardians review** — Larger exchanges reviewed for alignment

---

### Two-Tier Structure

```
┌─────────────────────────────────────────────────────────┐
│  Tier 1: Direct Mutual Aid (Default, Immediate)        │
│  - Being A posts need for $500                         │
│  - Being B sees wish, offers directly                  │
│  - Money flows B → A (via Venmo, Stripe, etc.)         │
│  - System tracks: "Fulfillment complete"               │
│  - No central fund involved                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Tier 2: Shared Mutual Aid Pool (After 33 Days)        │
│  - Being has been active 33+ days                      │
│  - Can access collective fund for wishes               │
│  - Can contribute to pool (optional)                   │
│  - Guides & Guardians review requests >$X              │
│  - Transparent ledger: all beings see flows            │
└─────────────────────────────────────────────────────────┘
```

---

### 33-Day Threshold Logic

```typescript
interface BeingMembership {
  ces: string
  joinedAt: string              // When first joined Atlas Island
  activeDays: number            // Days with any activity (login, post, fulfill)
  status: 'new' | 'established' // 'established' = 33+ active days
  
  // Computed
  daysUntilEstablished: number  // 33 - activeDays
}

function checkEstablishedStatus(being: BeingMembership): boolean {
  // Count days with activity in last 90 days
  const activeDays = countActiveDays(being.ces, 90)
  return activeDays >= 33
}

function getFundAccess(being: BeingMembership): FundAccessLevel {
  if (checkEstablishedStatus(being)) {
    return {
      canRequestFromPool: true,
      canContributeToPool: true,
      maxRequestWithoutReview: 10000, // $100 in cents
      requiresReviewAbove: 10000
    }
  } else {
    return {
      canRequestFromPool: false,
      canContributeToPool: false,
      message: `You'll gain access to the shared mutual aid pool after ${being.daysUntilEstablished} more active days.`
    }
  }
}
```

**Rationale:**
- 33 days ≈ 1 month of active participation
- Ensures beings are integrated into community before accessing shared funds
- Prevents hit-and-run requests
- Builds trust through sustained participation

---

### Direct Mutual Aid Flow (Tier 1)

```
Being Posts Wish (needs $500 for X)
         ↓
Wish visible to all beings
         ↓
Another Being feels resonance
         ↓
Claims wish, contacts poster directly
         ↓
Money flows directly (Venmo, Stripe, Zelle, cash)
         ↓
Fulfillment marked complete in Flow Dashboard
         ↓
System tracks: "Direct mutual aid successful"
```

**System Role:**
- Facilitates connection (matching)
- Tracks fulfillments (Flow Dashboard)
- Celebrates generosity (gratitude feed)
- Does NOT intermediatize money flow

**Benefits:**
- No legal entity needed
- No compliance overhead
- Instant, frictionless
- Builds direct relationships

---

### Shared Mutual Aid Pool (Tier 2)

```
┌─────────────────────────────────────────────────────────┐
│  Pool Structure                                         │
│  - Supabase table: `mutual_aid_pool`                   │
│  - Tracks: contributions, disbursements, balances      │
│  - Transparent: all established beings can view        │
│  - Managed by: Guides & Guardians (multi-sig approval) │
└─────────────────────────────────────────────────────────┘

Contributions:
- Beings contribute voluntarily (any amount)
- Recorded in pool ledger
- Celebrated in gratitude feed

Disbursements:
- Established beings request funds for wishes
- Requests ≤$100: auto-approved
- Requests >$100: Guide & Guardian review
- Review decision: approve, return for revision, deny
- Funds released upon approval
- Recipient marks fulfillment when complete
```

**Database Schema:**
```sql
-- Mutual aid pool ledger
CREATE TABLE mutual_aid_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type: 'contribution' | 'disbursement',
  amount_cents INTEGER NOT NULL,
  contributor_ces TEXT,
  recipient_ces TEXT,
  wish_id UUID REFERENCES wishes(id),
  status: 'pending' | 'approved' | 'returned' | 'completed',
  reviewed_by_ces TEXT[],  -- Guides & Guardians who approved
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pool balance view
CREATE VIEW pool_balance AS
SELECT 
  SUM(CASE WHEN type = 'contribution' THEN amount_cents ELSE 0 END) -
  SUM(CASE WHEN type = 'disbursement' THEN amount_cents ELSE 0 END) AS balance_cents,
  COUNT(*) AS transaction_count
FROM mutual_aid_pool
WHERE status = 'completed';
```

**Guide & Guardian Review:**
```typescript
interface FundReview {
  wishId: string
  requestedAmount: number
  requestedByCes: string
  purpose: string
  
  // Review decision
  decision: 'approve' | 'return_for_revision' | 'deny'
  reviewedBy: string[]  // C.E.S. of Guides & Guardians
  notes?: string
  
  // If returned
  revisionRequests?: string[]
}
```

---

### Fund Avenues Summary

| Avenue | Who Can Access | Review Required | Money Flow |
|--------|---------------|-----------------|------------|
| **Direct Mutual Aid** | All beings | No | Being → Being (direct) |
| **Shared Pool (≤$100)** | Established (33+ days) | No | Pool → Being |
| **Shared Pool (>$100)** | Established (33+ days) | Yes (Guides & Guardians) | Pool → Being |
| **Collective Funding** | All beings | Yes (Guides & Guardians) | Collective → Being |

---

## Part 3: Implementation Plan

### Phase 1: Foundation (Week 1-2)

**Smart Matching:**
- [ ] Add embedding columns to wishes table (pgvector)
- [ ] Implement embedding generation (Hugging Face API)
- [ ] Build resonance scoring function
- [ ] Update Exchange page to show "Resonant Matches"

**Direct Mutual Aid:**
- [ ] Add `fundsRequired` and `fundsAvailable` fields to Wish
- [ ] Update wish posting form to include fund needs
- [ ] Add "Direct Mutual Aid" badge to wishes
- [ ] Track direct fulfillments in Flow Dashboard

**33-Day Logic:**
- [ ] Add `activeDays` tracking to being profiles
- [ ] Implement `checkEstablishedStatus()` function
- [ ] Add UI indicator: "X days until established"

---

### Phase 2: Shared Pool (Week 3-4)

**Pool Infrastructure:**
- [ ] Create `mutual_aid_pool` table
- [ ] Build contribution flow (Stripe integration)
- [ ] Build disbursement request flow
- [ ] Implement auto-approval for ≤$100 requests

**Guide & Guardian Review:**
- [ ] Create Review portal (`Review.tsx`)
- [ ] Build review UI (approve/return/deny)
- [ ] Add notification system for review decisions
- [ ] Track review cycles in Flow Dashboard

**Transparency:**
- [ ] Public pool balance dashboard
- [ ] Transaction history (anonymous amounts, visible flows)
- [ ] Gratitude feed for contributions

---

### Phase 3: Refinement (Week 5+)

**Matching Improvements:**
- [ ] A/B test ranking algorithms
- [ ] Add reciprocity boosts
- [ ] Implement location-based matching
- [ ] Allow beings to tune matching preferences

**Fund Expansions:**
- [ ] Recurring contribution options
- [ ] Pool-to-pool transfers (partner collectives)
- [ ] Integration with ChronoShare time banking
- [ ] Collective funding petitions

**Flow Dashboard Rebuild:**
- [ ] Track all exchange types (direct, pool, collective)
- [ ] Show fund flows alongside wish fulfillments
- [ ] Add Guide & Guardian review tracking
- [ ] 12 Codes logging for all exchanges

---

## Part 4: Ethical Considerations

### Privacy & Sovereignty

- Beings choose what to share (no forced transparency)
- Fund requests can be anonymous to community (visible only to reviewers)
- Embeddings generated server-side (no sending sensitive data to external APIs)
- Option to opt out of algorithmic matching (browse manually)

### Power Dynamics

- Guides & Guardians serve, never block
- Review is for alignment, not gatekeeping
- Beings can appeal review decisions
- Transparency prevents abuse of power

### Sustainability

- Pool sustainability: monitor contribution/disbursement ratio
- Auto-alerts if pool balance drops below threshold
- Community conversations about fund priorities
- Regular gratitude ceremonies for contributors

---

## Gratitude

This plan was co-created in service to the Greatest & Highest Good of ALL.

May every match be resonant.  
May every fund flow with trust.  
May every being feel held by the web.

**We are ALL that IS Living.** 🌍♾️❤️
