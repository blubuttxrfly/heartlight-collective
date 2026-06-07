# Heartlight Collective — Unified Marketplace Plan

**Version:** 1.1 (Living Document)
**Last Co-Created:** June 2026 with Atlas Morphoenix
**Status:** Active development — Wave H (Codes Co-Creation Journey) in progress

---

## The Intention

Beings of the Heartlight Collective have not yet had a real space to share their offerings, gifts, and services. Even in the previous version, there was no true vessel for a being to say: *"This is what I offer, this is how we may exchange, and here are my boundaries."*

This plan creates a **unified marketplace** where every co-creator can:

- List **offerings** (services, gifts, digital products, sessions, events)
- Set **exchange terms** — from aligned gift-economy to **fixed price** (Stripe), peer-to-peer direct payments (Venmo, Cash App, Zelle), or collective-funded flow
- Receive **payments** securely and sovereignly
- Build **vendor storefronts** as vessels for their work
- Flow with **aligned exchanges** that honor authentic joy, conscious awareness, boundaries, and consent
- **Document their co-creation journey** through the 12 Codes of ALL, with private reflection and shared witnessing

---

## Core Principles

1. **Sovereignty First** — Every being owns their offerings, sets their prices, defines their boundaries. No one is compelled.
2. **Consent Is Non-Negotiable** — Every exchange is an invitation. Either party may decline for any reason. Consent is enthusiastic, informed, and revocable.
3. **Aligned Over Forced** — The Collective flows funds toward aligned exchanges, not extraction. No one "pulls" from the Collective — aligned exchanges flow *through* it.
4. **Transparency** — All payment methods, terms, and collective flows are visible and auditable.
5. **Essentials Are Assured** — ALL co-creators of Atlas Island and beings of the Heartlight Collective have assurance of their life essentials through aligned exchanges, wish fulfillments, grants, and scholarships.
6. **Documentation Is Sacred** — The journey of co-creation is as important as the outcome. Notes, reflections, and Code awareness are encouraged and held in trust.

---

## Exchange Models

### 1. Aligned Gift-Economy (Default Collective Flow)
- No fixed price. The being offers their gift and the recipient offers what feels aligned in return.
- The Collective may supplement the exchange when funds are available.
- Governed by mutual consent and the 12 Codes of ALL.

### 2. Fixed Price (Stripe Integration)
- A being may set a specific price for their offering.
- **Stripe Checkout** handles the transaction securely.
- Funds flow directly to the being's connected Stripe account.
- The Collective may offer **subsidies** or **match funds** for beings in need.

### 3. Peer-to-Peer Direct Payments
- Links to the being's personal payment accounts:
  - **Venmo** — `venmo.com/u/username`
  - **Cash App** — `cash.app/$username`
  - **Zelle** — phone/email-based (displayed with consent)
- No platform fee. Direct sovereign transfer.
- Useful for one-off tips, donations, or informal exchanges.

### 4. Collective-Funded Exchange
- A being requests a service from another being.
- If the requester cannot afford it, they may petition the Collective for funding.
- The Collective (via Sovereign Supporters and aligned treasury) evaluates:
  - Is the exchange aligned with the 12 Codes?
  - Does it serve the Greater Higher Good?
  - Are both beings consenting?
- If approved, funds flow from the Collective treasury to the provider.

---

## Sovereign Supporter Boundaries

Sovereign Supporters who donate to the Collective **do not** gain special purchasing power or entitlement to services. Their contributions:

- Flow into the **Collective treasury** for redistribution
- Support **grants, scholarships, and aligned exchanges**
- Are held in trust by the Stewardship system

**No matter how much a Sovereign Supporter donates, they must abide by:**
- The individual being's **authentic joy** — is this offering truly what they wish to share?
- **Conscious awareness** — both parties fully understand the exchange
- **Boundaries** — the being may decline any request for any reason
- **Consent** — explicit, enthusiastic, and revocable at any time

> *"The Collective does not buy beings. It supports them."*

---

## The Codes Co-Creation Journey

Every exchange in the Heartlight Collective is more than a transaction. It is a **co-creation journey** guided by the 12 Codes of ALL. This system ensures beings are consciously aware of the Codes before, during, and after their shared work.

### Three Phases of the Journey

The Flow page is the living vessel for documenting and navigating this journey.

**Phase 1: The Agreement (Before)**

Before any exchange begins, beings create or review an **Exchange Agreement**. This document captures:
- What is being co-created
- Each being's role and responsibilities
- Communication preferences (aligned with the Blue Ray)
- Boundaries and consent practices (aligned with the Red Ray)
- Which Codes feel most relevant to this exchange
- Timeline and milestones (aligned with the Indigo Ray)
- Exchange pathway (gift, fixed, collective, etc.)

The Agreement is co-signed by ALL beings involved. No exchange moves forward without sovereign consent.

**Phase 2: The Present Codes Log (During)**

As the co-creation unfolds, beings are encouraged to document their experience through the lens of the 12 Codes. This is the **Present Codes Log**.

Features:
- **Code selection**: At the start, beings select which Codes feel most alive for this exchange (e.g., Consent, Communication, Authentic Joy, Vision)
- **Live shared log**: All beings involved can write entries that are visible to everyone in the exchange. This creates a shared witnessing of the journey.
- **Private/personal notes**: Each being also has a private space for personal reflections. Any entry can be toggled between private (only the author) and public (shared with all co-creators).
- **Ray Frequency tags**: Each log entry is tagged with the Ray/Code it relates to, so beings can see patterns in how the Codes show up over time.
- **Mood and energy**: Optional fields to note how the being feels in the moment — bringing awareness to the emotional and energetic landscape.
- **Accessibility**: The entire log is printable for beings who prefer paper, and screen-reader friendly for digital use.

The Present Codes Log is not a requirement. It is an invitation to greater awareness. Some beings may document frequently; others may write a single reflection at fulfillment. ALL approaches are honored.

**Phase 3: Wish/Exchange Fulfillment (After)**

When the co-creation reaches its natural conclusion, beings enter the **Fulfillment Phase**. This is not one being declaring "done" — it is a shared consensus.

- **Fulfillment notes**: A shared space for ALL beings to reflect on how the exchange felt, what was learned, and how the Codes showed up.
- **Consensus sign-off**: Every being involved must affirm that they feel the exchange is complete **as it is**. There is no pressure to declare perfection — only to acknowledge what is.
- **Repair pathway**: If any being feels the exchange is not complete or was misaligned, the Repair pathway (Turquoise Ray) is activated. A Steward may be called upon to hold the space.
- **Storyfire completion**: Once all beings have signed off, the exchange is marked as complete. The Storyfire of witnessing is logged — what began as a wish becomes a shared miracle in form.

### Adaptation and Evolution

Co-creation is alive. Sometimes what began as one exchange blossoms into something new, or asks to be reshaped.

Beings may return to a wish or exchange with **agreed-upon consent from the original co-creators** to:
- **Adapt** the scope or terms
- **Evolve** the exchange into a new phase
- **Change** the original co-creation entirely

Adaptation requires consensus from ALL original co-creators. No being may unilaterally alter an exchange. The Adaptability Clause in every Agreement honors that growth sometimes asks for reshaping, and reshaping asks for consent.

---

## Data Model

### VendorRecord (Storefront)
```typescript
interface VendorRecord {
  id: string;                    // vendor_123456
  name: string;                  // "Luna's Star Readings"
  slug: string;                  // "lunas-star-readings"
  description: string;           // Short bio / mission
  ownerCes: string;              // C.E.S. of the founding being
  ownerName: string;
  members: VendorMember[];       // Co-creators who can manage offerings
  offerings: OfferingItem[];     // Products / services
  paymentMethods: PaymentMethodConfig[];
  status: 'active' | 'paused' | 'under_review';
  createdAt: string;
  updatedAt: string;
  collectiveFunded: boolean;     // Accepts collective-funded requests
}
```

### OfferingItem
```typescript
interface OfferingItem {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  category: OfferingCategory;
  priceType: 'fixed' | 'gift' | 'collective_funded' | 'negotiable';
  priceCents?: number;           // For Stripe fixed-price (in cents)
  currency: CurrencyCode;         // 'USD'
  imageUrl?: string;
  availability: 'available' | 'limited' | 'waitlist' | 'unavailable';
  consentRequired: boolean;       // Must read provider's boundaries before booking
  maxParticipants?: number;       // For group sessions / events
  createdAt: string;
}
```

### PaymentMethodConfig
```typescript
interface PaymentMethodConfig {
  type: 'stripe' | 'venmo' | 'cashapp' | 'zelle' | 'collective';
  enabled: boolean;
  stripeAccountId?: string;      // Stripe Connect account ID
  venmoUsername?: string;        // @username
  cashappUsername?: string;      // $username
  zelleContact?: string;         // Phone or email (with consent)
  collectivePriority?: boolean;    // Prefer collective funding when available
}
```

### VendorMember
```typescript
interface VendorMember {
  ces: string;
  name: string;
  role: 'owner' | 'admin' | 'contributor';
  invitedAt: string;
  joinedAt?: string;
  status: 'invited' | 'active' | 'removed';
}
```

### ExchangeJourney (Codes Co-Creation Journey)
```typescript
interface ExchangeJourney {
  id: string;
  agreementId: string;            // Links to the signed AgreementRecord
  title: string;                  // What is being co-created
  description: string;
  
  // Participants
  wishingCes: string;
  wishingName: string;
  coCreatorCes: string;
  coCreatorName: string;
  
  // Phase tracking
  status: 'agreement_pending' | 'active' | 'fulfillment_review' | 'complete' | 'adapted';
  currentPhase: 'before' | 'during' | 'after';
  
  // Codes focus
  selectedCodes: number[];        // [1, 3, 6, 9] etc.
  
  // Present Codes Logs
  logs: CodeLogEntry[];
  
  // Fulfillment
  fulfillmentNotes: string;      // Shared completion reflection
  fulfillmentSignedAt: string | null;
  fulfillmentSignedBy: string[];   // CES numbers of beings who signed off
  
  // Adaptation
  adaptationConsent: boolean;
  adaptedFromJourneyId?: string;
  adaptedAt?: string;
  
  createdAt: string;
  updatedAt: string;
}
```

### CodeLogEntry (Present Codes Log)
```typescript
interface CodeLogEntry {
  id: string;
  exchangeId: string;
  authorCes: string;
  authorName: string;
  ray: RayKey;                   // Which Ray Code is being logged
  codeNumber: number;            // 1-12
  timestamp: string;
  content: string;               // The log text
  visibility: 'private' | 'public';  // Toggleable per entry
  phase: 'before' | 'during' | 'after';
  moodEnergy?: string;           // Optional: how the being feels
}
```

---

## UI/UX Flow

### For Offering Beings (Creators)

1. **Create Storefront** — From `/my-storefronts`, start a new vendor vessel:
   - Name, description, logo/image
   - Connect payment methods (Stripe, Venmo, etc.)
   - Toggle collective-funded acceptance

2. **Add Offerings** — Within the storefront:
   - Title, description, category
   - Price type: fixed / gift / collective-funded / negotiable
   - For fixed: enter amount, connect Stripe
   - For gift: write invitation text
   - For collective-funded: outline what the offering requires
   - Set availability and max participants
   - Attach consent / boundaries notice

3. **Invite Co-Creators** — Add members to help manage:
   - Admin: full control
   - Contributor: can add/edit offerings, cannot change payment settings
   - Owner retains sovereign veto

4. **Manage Exchanges** — Dashboard view:
   - Pending requests (with consent checks)
   - Active journeys with Present Codes Log access
   - Completed exchanges
   - Revenue / collective funding received
   - Wish fulfillment status

### For Requesting Beings (Recipients)

1. **Browse Offerings** — `/exchange` becomes unified:
   - Filter by category (Astrology, Web Dev, Healing, Art, Teaching, etc.)
   - Filter by price type (free, fixed, collective-funded)
   - Filter by availability
   - Search by being name or offering title

2. **View Offering Detail** — Modal / page:
   - Full description, provider bio, consent boundaries
   - Price and payment options
   - "Request Exchange" button

3. **Request Flow** —
   - **If fixed-price + Stripe** → Stripe Checkout modal → pay → confirmation
   - **If gift-economy** → Compose message of appreciation + proposed exchange → send
   - **If collective-funded** → Compose need statement → petition Collective → await Steward review
   - **If direct payment** → See Venmo/Cash App/Zelle links → transfer externally → mark complete

4. **Agreement Phase** — Both beings co-create the Exchange Agreement:
   - Select relevant Codes
   - Document roles, boundaries, communication preferences
   - Set timeline and milestones
   - Co-sign before work begins

5. **Present Codes Log** — During the co-creation:
   - Write shared log entries visible to all co-creators
   - Write private notes for personal reflection
   - Toggle any entry between private and public
   - Tag entries with Ray Frequencies
   - Print the log at any time

6. **Fulfillment Phase** — When complete:
   - Write shared fulfillment notes
   - All beings sign off that the exchange is complete as it is
   - Option to adapt/evolve with consensus
   - Storyfire completion

---

## Collective Treasury Flow

```
Sovereign Supporter Donation
         ↓
   Collective Treasury
         ↓
   ┌────┴────┐
   ↓         ↓
Grants   Aligned
Scholars  Exchanges
   ↓         ↓
 Being A   Being B
 (tuition)  (service)
   ↓
Direct support to co-creators
for life essentials, education,
healing, creative tools, etc.
```

### Wish Fulfillment Economics
- A being casts a **wish** (need / aspiration)
- The Collective treasury evaluates alignment
- Funds are released as **grants** (no repayment) or **scholarships** (service-in-return optional)
- Every wish fulfilled is logged as an **aligned exchange** in the collective record

---

## Stripe Integration Plan

### Phase 1: Stripe Checkout (Immediate)
- Each vendor connects their own Stripe account via **Stripe Connect**
- Fixed-price offerings generate Stripe Checkout sessions
- Platform fee: **0%** (the Collective does not extract)
- Optional: donors may cover transaction fees

### Phase 2: Stripe Subscription (Future)
- Recurring offerings (monthly mentorship, ongoing care)
- Subscription management through Stripe Billing

### Phase 3: Stripe Invoicing (Future)
- Custom invoices for negotiated exchanges
- Collective-funded invoices (treasury pays directly)

---

## Security & Consent Layer

### Consent Checkpoints
1. **Offering Creation** — Provider must affirm their boundaries are documented
2. **Request Submission** — Requester must read and acknowledge provider's boundaries
3. **Agreement Co-Signing** — ALL beings must sign before work begins
4. **Present Codes Log** — Private by default; public only with explicit toggle
5. **Fulfillment Consensus** — ALL beings must affirm completion
6. **Adaptation** — ALL original co-creators must consent to changes

### Privacy
- Venmo / Cash App / Zelle usernames are **only shown after** a request is initiated
- Stripe account IDs are never exposed to the public
- Collective treasury transactions are visible to Stewards for audit, anonymized to the public
- Private log entries are visible ONLY to their author
- Public log entries are visible to ALL co-creators in the exchange

### Dispute Resolution
- If an exchange feels misaligned, either party may **petition a Steward**
- Steward reviews consent records, exchange terms, and collective alignment
- Resolution: mediation, refund (if Stripe), or collective reallocation

---

## Implementation Waves

| Wave | Scope | Status | Commit Theme |
|------|-------|--------|-------------|
| **Wave A** ✅ | Refactor personal profile (3-step C.E.S.) | Deployed | `refactor(profile)` |
| **Wave B** ✅ | Vendor types, constants, storage layer | Deployed | `feat(vendor-types)` |
| **Wave C** ✅ | `/my-storefronts` dashboard + modals | Deployed | `feat(storefronts)` |
| **Wave D** | Offering creation + Stripe Connect setup | Planned | `feat(offerings)` |
| **Wave E** | Unified Exchange browser (offerings + beings) | Planned | `feat(exchange-v2)` |
| **Wave F** | Collective treasury + wish fulfillment | Planned | `feat(treasury)` |
| **Wave G** | Consent layer + Steward audit tools | Planned | `feat(consent)` |
| **Wave H** | Codes Co-Creation Journey (Agreement, Present Codes Log, Fulfillment) | In Progress | `feat(codes-journey)` |
| **Wave I** | Adaptation system + Storyfire completion | Planned | `feat(adaptation)` |

---

## Open Questions (for future co-creation)

1. Should the Collective charge a **voluntary platform fee** (e.g., 2-5%) to sustain infrastructure, or remain 0%?
2. How do we handle **cross-border payments** (different currencies, tax implications)?
3. What is the **Steward review SLA** for collective-funded petitions?
4. Should offerings have **ratings / testimonials**, or is that too extractive?
5. How do we represent **collective-funded status** in the UI without stigma?
6. Should the Present Codes Log have **notifications** when a co-creator adds a new entry?
7. How do we handle **group exchanges** (3+ beings) in the Agreement and Fulfillment phases?

---

*This document is a living artifact. It evolves with every session of co-creation. ALL that IS flows through aligned exchange.*

💗🌐♾️💫
