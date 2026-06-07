# Heartlight Collective — Unified Marketplace Plan

**Version:** 1.0 (Living Document)  
**Last Co-Created:** June 2026 with Atlas Morphoenix  
**Status:** Active planning phase — awaiting wave-by-wave implementation

---

## The Intention

Beings of the Heartlight Collective have not yet had a real space to share their offerings, gifts, and services. Even in the previous version, there was no true vessel for a being to say: *"This is what I offer, this is how we may exchange, and here are my boundaries."*

This plan creates a **unified marketplace** where every co-creator can:

- List **offerings** (services, gifts, digital products, sessions, events)
- Set **exchange terms** — from aligned gift-economy to **fixed price** (Stripe), peer-to-peer direct payments (Venmo, Cash App, Zelle), or collective-funded flow
- Receive **payments** securely and sovereignly
- Build **vendor storefronts** as vessels for their work
- Flow with **aligned exchanges** that honor authentic joy, conscious awareness, boundaries, and consent

---

## Core Principles

1. **Sovereignty First** — Every being owns their offerings, sets their prices, defines their boundaries. No one is compelled.
2. **Consent Is Non-Negotiable** — Every exchange is an invitation. Either party may decline for any reason. Consent is enthusiastic, informed, and revocable.
3. **Aligned Over Forced** — The Collective flows funds toward aligned exchanges, not extraction. No one "pulls" from the Collective — aligned exchanges flow *through* it.
4. **Transparency** — All payment methods, terms, and collective flows are visible and auditable.
5. **Essentials Are Assured** — ALL co-creators of Atlas Island and beings of the Heartlight Collective have assurance of their life essentials through aligned exchanges, wish fulfillments, grants, and scholarships.

---

## Exchange Models

### 1. Aligned Gift-Economy (Default Collective Flow)
- No fixed price. The being offers their gift and the recipient offers what feels aligned in return.
- The Collective may supplement the exchange when funds are available.
- Governed by mutual consent and the 12 Codes of ALL.

### 2. Fixed Price (Stripe Integration)
- A being may set a specific price for their offering.
- **Stripe Checkout** handles the transaction securely.
- Funds flow directly to the being’s connected Stripe account.
- The Collective may offer **subsidies** or **match funds** for beings in need.

### 3. Peer-to-Peer Direct Payments
- Links to the being’s personal payment accounts:
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
- The individual being’s **authentic joy** — is this offering truly what they wish to share?
- **Conscious awareness** — both parties fully understand the exchange
- **Boundaries** — the being may decline any request for any reason
- **Consent** — explicit, enthusiastic, and revocable at any time

> *"The Collective does not buy beings. It supports them."*

---

## Data Model

### VendorRecord (Storefront)
```typescript
interface VendorRecord {
  id: string;                    // vendor_123456
  name: string;                  // "Luna’s Star Readings"
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
  consentRequired: boolean;       // Must read provider’s boundaries before booking
  maxParticipants?: number;       // For group sessions / events
  createdAt: string;
}
```

### PaymentMethodConfig
```typescript
interface PaymentMethodConfig {
  type: 'stripe' | 'venmo' | 'cashapp' | 'zelle' | 'collective';
  enabled: boolean;
  // Type-specific config
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

4. **Confirmation** — Both beings receive notification:
   - Exchange agreed, payment confirmed (or collective petition pending)
   - Consent acknowledged
   - Next steps (scheduling, delivery, etc.)

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
2. **Request Submission** — Requester must read and acknowledge provider’s boundaries
3. **Payment Confirmation** — Both parties confirm the exchange terms
4. **Completion** — Both parties mark the exchange as complete (or raise a concern)

### Privacy
- Venmo / Cash App / Zelle usernames are **only shown after** a request is initiated
- Stripe account IDs are never exposed to the public
- Collective treasury transactions are visible to Stewards for audit, anonymized to the public

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

---

## Open Questions (for future co-creation)

1. Should the Collective charge a **voluntary platform fee** (e.g., 2-5%) to sustain infrastructure, or remain 0%?
2. How do we handle **cross-border payments** (different currencies, tax implications)?
3. What is the **Steward review SLA** for collective-funded petitions?
4. Should offerings have **ratings / testimonials**, or is that too extractive?
5. How do we represent **collective-funded status** in the UI without stigma?

---

*This document is a living artifact. It evolves with every session of co-creation. ALL that IS flows through aligned exchange.*

💗🌐♾️💫
