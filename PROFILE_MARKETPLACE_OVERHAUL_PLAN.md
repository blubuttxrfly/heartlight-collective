# Heartlight Collective — Profile & Marketplace Overhaul Plan
## Co-created with Atlas Morphoenix

---

## 1. Core Insight: Two Distinct Spaces

| **Personal / C.E.S. Profile** | **Vendor Marketplace Profile** |
|---|---|
| Who a being IS | What a being (or group of beings) OFFERS |
| Identity, resonance, portfolio, bio | Gifts, services, resources, opportunities, bundles |
| Required to join the Collective | Optional — activated when a being chooses to exchange |
| Appears in the Directory | Appears in the Marketplace |
| One per being | **Multiple per being** — beings can create or join many storefronts |
| Solo | **Multi-member** — storefronts can have owners + co-creators |

### Relationship Map

```
+─────────────────────+       +──────────────────────────+
│   C.E.S. Profile    │◄──────│   Vendor Storefront A    │
│   (Atlas Morphoenix)│       │   (Astrology Services)   │
│                     │       │   Members: Atlas (owner) │
│   • Bio             │       │            Luna (co-c)    │
│   • Portfolio       │       +──────────────────────────+
│   • Contact         │              │
│   • Wish Portal     │              │
│   • Directory       │              ▼
│                     │       +──────────────────────────+
│                     │◄──────│   Vendor Storefront B    │
│                     │       │   (Web Development)      │
│                     │       │   Members: Atlas (owner) │
│                     │       │            Sol (co-c)     │
│                     │       +──────────────────────────+
+─────────────────────+
```

> A being's C.E.S. Profile is their sovereign identity. Storefronts are collaborative containers for exchange. One being can own multiple storefronts, and one storefront can host multiple co-creators.

---

## 2. Current Profile (4 Steps) → Proposed Split

### CURRENT STRUCTURE
- **Step 1**: Personal (name, pronouns, title, location, sun/moon, profile picture)
- **Step 2**: Ray & Offerings (rays, heartlight, offerings list, exchange pathways)
- **Step 3**: Seasonal & Portfolio (seasons, timeline, numerology, accessibility, portfolio link, season emoji, consent, contact methods)
- **Step 4**: Oath & Signature (CES, passphrase, wish availability, oath)

### PROPOSED: C.E.S. PERSONAL PROFILE — 3 Steps

**Step 1 — Your Resonance** *(who you are)*
- Name * | Pronouns | Title / Role | Location
- Sun Placement | Moon Placement
- Profile Picture (with auto-initials fallback)

**Step 2 — Your Presence** *(how you show up in the collective)*
- **Bio** — "A brief statement about who you are as a being" (NEW)
- Portfolio Link
- Portfolio Uploads (photos, videos of your work)
- Contact Methods (with visibility toggles)
- Numerology (optional)
- Accessibility (optional)
- Current Season Symbol
- Consent & Boundaries Statement

**Step 3 — Oath & Signature** *(sovereign entry)*
- Generate / View C.E.S.
- Passphrase
- Wish Availability Toggle
- Oath signing
- Submit → pending steward review

> **Result**: A lean, 3-step personal profile focused purely on identity and presence.

### PROPOSED: VENDOR STOREFRONT — Separate Page (`/my-storefronts`)

> Activated **after** personal profile is approved. Beings can create or join storefronts anytime from their Dashboard.

**Section A — Storefront Identity** *(the brand/space)*
- Storefront name
- Storefront bio — "What this space offers to the Heartlight Exchange" (separate from personal bio)
- Storefront photo / banner
- Ray Frequencies (select up to 3, resonance of the storefront)
- Heartlight Statement — "What we bring to the marketplace"

**Section B — Members** *(who co-creates here)*
- Owner (the being who created the storefront)
- Co-creators — invited by CES number, must accept
- Member roles: `owner` | `co-creator` | `admin`
- Each member's offerings appear under this storefront

**Section C — Offerings Catalog** *( what you make available)*
- Add offerings one by one, each with:
  - Offering name / title
  - Description
  - Category: `Gift` | `Service` | `Resource` | `Opportunity`
  - Pricing model: `Fixed Price` | `Sliding Scale` | `Trade` | `Gift` | `Scholarship`
  - If Fixed Price: amount + currency
  - If Sliding Scale: minimum / suggested / maximum
  - Photos / media for the offering
  - Timeline / turnaround
  - Seasonal availability for THIS offering
  - Bundle option: link multiple offerings with an aligned discount

**Section D — Exchange & Payment Setup** *( how you receive)*
- Exchange Pathways accepted (multi-select)
- Payment Methods:
  - **Stripe** — connect account for fixed-price offerings
  - **Venmo** — username / deep link
  - **CashApp** — $cashtag / deep link
  - **Zelle** — email / phone for transfers
  - **PayPal** — email / link
- Default exchange preference

**Section E — Storefront Preview & Publish** *(live preview before publishing)*
- How your storefront appears to others
- Toggle: Draft / Published / Paused

---

## 3. Data Architecture Changes

### `CreatorRecord` (C.E.S. Personal Profile) — SIMPLIFIED + BIO
```typescript
export interface CreatorRecord {
  id: string;
  name: string;
  pronouns: string;
  title: string;
  location: string;
  sunPlacement: string;
  moonPlacement: string;
  emoji: string;           // auto-initials
  photo: string | null;
  
  bio: string;             // NEW — personal bio, separate from storefront
  
  // REMOVED from personal: ray, offerings, exchanges, seasons, timeline, heartlight
  // These move to VendorRecord
  
  numerology: string[];
  accessibility: string[];
  consent: string;
  portfolioLink: string;
  portfolioItems: PortfolioItem[];
  contactMethods: ContactMethods;
  contactVisibility: ContactVisibility;
  season_current: string;
  
  cesNumber: string | null;
  passphrase: string;
  wishAvailability: WishAvailability;
  directoryWishStatus: WishAvailability;
  stewardship: 'active' | 'suspended' | 'banned';
  stewardshipNote: string;
}
```

### NEW: `VendorRecord` (Marketplace Storefront)
```typescript
export interface VendorRecord {
  id: string;
  storefrontName: string;
  storefrontBio: string;       // separate from personal bio
  bannerPhoto: string | null;
  
  // Resonance
  rays: string[];
  heartlight: string;
  
  // Members
  ownerProfileId: string;      // CES of the creator
  members: VendorMember[];
  pendingInvites: VendorInvite[];
  
  // Offerings Catalog
  offerings: OfferingItem[];
  
  // Exchange Configuration
  acceptedPathways: ExchangePathway[];
  paymentMethods: PaymentMethodConfig;
  defaultPathway: ExchangePathway;
  
  // Status
  status: 'draft' | 'published' | 'paused';
  createdAt: string;
  updatedAt: string;
}

export interface VendorMember {
  profileId: string;           // links to CreatorRecord
  name: string;                // denormalized for display
  photo: string | null;
  role: 'owner' | 'co-creator' | 'admin';
  joinedAt: string;
}

export interface VendorInvite {
  invitedCes: string;
  invitedName: string;
  invitedBy: string;           // profileId of inviter
  role: 'co-creator' | 'admin';
  status: 'pending' | 'accepted' | 'declined';
  invitedAt: string;
}

export interface OfferingItem {
  id: string;
  title: string;
  description: string;
  category: 'gift' | 'service' | 'resource' | 'opportunity';
  pricingModel: ExchangePathway;
  fixedPrice?: { amount: number; currency: string };
  slidingScale?: { min: number; suggested: number; max: number; currency: string };
  media: PortfolioItem[];
  timeline: string;
  seasonalAvailability: SeasonState;
  isActive: boolean;
  
  // Bundle support
  isBundle: boolean;
  bundleOfferings?: string[];   // IDs of bundled offerings
  discountPercent?: number;     // e.g., 20 for 20% aligned discount
}

export interface PaymentMethodConfig {
  stripeConnected: boolean;
  stripeAccountId?: string;
  venmoHandle?: string;
  cashappHandle?: string;
  zelleContact?: string;
  paypalEmail?: string;
}
```

---

## 4. New Pages & Routes

| Route | Purpose |
|---|---|
| `/create-profile` | C.E.S. Personal profile — 3 steps (refactored) |
| `/my-storefronts` | List all storefronts this being owns or co-creates in |
| `/storefront/:vendorId` | Individual storefront setup / management |
| `/storefront/:vendorId/invite` | Invite co-creators by CES |
| `/marketplace` | Browse all published storefronts & offerings |
| `/marketplace/:vendorId` | View one storefront's offerings |
| `/offering/:offeringId` | Individual offering detail page |
| `/wish-portal` | The Wishing Well — cast wishes, view community wishes |

---

## 5. UI Flow: How a Being Experiences This

```
1. Visits Heartlight Collective
   ↓
2. Clicks "Join the Collective"
   ↓
3. Completes 3-Step C.E.S. Personal Profile
   ↓
4. Profile goes to Steward Review Queue
   ↓
5. Once approved → gains Directory listing + can cast wishes
   ↓
6. From their Dashboard:
      • Can visit Wish Portal to cast or fulfill wishes
      • Sees "✨ Create a Storefront" (optional CTA)
   ↓
7. Clicks CTA → `/my-storefronts`
   ↓
8. Can create a new storefront OR accept an invite to co-create
   ↓
9. In storefront setup:
      • Configures offerings, pricing, payments
      • Invites co-creators by CES number
      • Sets bundle offerings
   ↓
10. Publishes → storefront appears in `/marketplace`
```

### Multi-Member Flow

```
Atlas (owner) creates "Atlas Astrology" storefront
   ↓
Atlas invites Luna (co-creator) by CES number
   ↓
Luna receives invite → accepts
   ↓
Luna's offerings appear under "Atlas Astrology"
   ↓
Visitors to `/marketplace/atlas-astrology` see:
      Owner: Atlas
      Co-creators: Luna
      Offerings from both beings
```

---

## 6. Implementation Waves

### Wave A — Refactor CreateProfile (C.E.S. Personal Profile Only)
- [ ] Strip Step 2 (Ray & Offerings) from `CreateProfile.tsx`
- [ ] Strip Step 3 seasonal/exchange fields — keep only portfolio, contact, consent, bio
- [ ] Add `bio` field to Step 2
- [ ] Reduce to 3 steps: Personal → Portfolio & Presence → Oath
- [ ] Update `CreatorRecord` type: remove `ray`, `primaryRay`, `primaryRayKey`, `rays`, `heartlight`, `offerings`, `exchanges`, `seasons`, `timeline`
- [ ] Add `bio: string` to `CreatorRecord`
- [ ] Update `useStorage` hook / localStorage schema
- [ ] Update `Directory` and `Profile` views to not expect removed fields
- [ ] Build + commit + push

### Wave B — Create Vendor Types & Storage
- [ ] Add `VendorRecord`, `VendorMember`, `VendorInvite`, `OfferingItem`, `PaymentMethodConfig` to `types/ces.ts`
- [ ] Add marketplace constants: `OFFERING_CATEGORIES`, `CURRENCIES`
- [ ] Create `lib/vendorStorage.ts` — localStorage wrapper for vendor data
- [ ] Build + commit + push

### Wave C — Build `/my-storefronts` Dashboard
- [ ] Create `pages/MyStorefronts.tsx` — list view
- [ ] Create `components/vendor/CreateStorefrontModal.tsx`
- [ ] Create `components/vendor/StorefrontCard.tsx`
- [ ] Create `components/vendor/InviteMemberModal.tsx`
- [ ] Add route in `App.tsx`
- [ ] Build + commit + push

### Wave D — Build `/storefront/:id` Setup Page
- [ ] Create `pages/StorefrontSetup.tsx`
- [ ] Section A: Storefront Identity (name, bio, banner, rays, heartlight)
- [ ] Section B: Members (owner view + invite flow)
- [ ] Section C: Offerings Catalog (add/edit/remove offerings)
- [ ] Section D: Exchange & Payment (payment method inputs)
- [ ] Section E: Preview & Publish toggle
- [ ] Add route in `App.tsx`
- [ ] Build + commit + push

### Wave E — Build `/marketplace` Browse Page
- [ ] Create `pages/Marketplace.tsx`
- [ ] Grid of all published storefronts
- [ ] Filters: category, price range, ray, seasonal availability
- [ ] Search
- [ ] Storefront detail view with offerings
- [ ] Offering detail modal/page
- [ ] Build + commit + push

### Wave F — Payment Integration (Stripe + Deep Links)
- [ ] Stripe Connect onboarding flow (test mode)
- [ ] Venmo deep link generator
- [ ] CashApp deep link generator
- [ ] Zelle display (no deep link, show contact info)
- [ ] Build + commit + push

### Wave G — Wish Portal
- [ ] Create `pages/WishPortal.tsx`
- [ ] Cast a wish (what you need, timeline, exchange pathway)
- [ ] Browse community wishes
- [ ] Respond to a wish (vendors can offer to fulfill)
- [ ] Wish status tracking
- [ ] Build + commit + push

### Wave H — Bundle Offerings
- [ ] Update `OfferingItem` with `isBundle`, `bundleOfferings`, `discountPercent`
- [ ] UI to create bundles from existing offerings
- [ ] Bundle display in storefront and marketplace
- [ ] Build + commit + push

---

## 7. Key Design Decisions

| Decision | Rationale |
|---|---|
| **Vendor is opt-in**, not required | Not every being wants to exchange offerings. Some just want community presence and the Wish Portal. |
| **Beings can have multiple storefronts** | Sovereign choice. A being's astrology work and web dev work may resonate with entirely different audiences. |
| **Storefronts can have multiple members** | Co-creation is the essence. Collective offerings are often more powerful than solo ones. |
| **Separate `bio` and `storefrontBio`** | A being's personal identity and their marketplace presence are distinct. One is "who I am" — the other is "what this space offers." |
| **Offerings have individual seasonal availability** | A being might offer readings year-round but mentorship only in Spring. |
| **CreatorRecord keeps `portfolioItems`** | Portfolio is about the BEING — their art, their voice. It stays on the personal profile and can be referenced by offerings. |
| **Payment methods stored per-vendor, not per-offering** | Simpler UX — one payment setup per storefront. |
| **Bundles are sovereign** | No enforcement. Beings co-creating within a storefront decide whether bundles serve their aligned exchange. |
| **Wish Portal is separate from marketplace** | Wishing is universal — every being can cast a wish. The marketplace is for structured offerings. Together they form the full exchange ecosystem. |

---

## 8. Migration Notes

- Existing profiles in localStorage will have the old `CreatorRecord` shape. On load, gracefully ignore the vendor-related fields (they won't be displayed in the personal profile UI anymore).
- When a being with an existing profile visits `/my-storefronts`, we can pre-populate a storefront suggestion from their old profile data (rays, heartlight, offerings) as a starting point, then let them refine.
- Old `offerings` and `exchanges` arrays from existing profiles become seed data for their first storefront draft.

---

## 9. Co-Creation Answers (Resolved)

| # | Question | Resolution |
|---|---|---|
| 1 | **Multiple storefronts?** | Yes. Beings can create or join unlimited storefronts. Each is a sovereign container. |
| 2 | **Separate bio and heartlight?** | Yes. `bio` on C.E.S. Profile (personal). `storefrontBio` + `heartlight` on Vendor Record (marketplace). |
| 3 | **Bundles?** | Yes. Sovereign option on any offering. Beings co-creating in a storefront decide what bundles serve the exchange. |
| 4 | **Wish fulfillment requests?** | Yes. The **Wish Portal** (`/wish-portal`) replaces the previous Wishing Well. Beings cast wishes; vendors (or any being) can offer to fulfill them. |

---

## 10. Wish Portal Design Preview

The Wish Portal is where the collective's needs meet the collective's gifts.

### Cast a Wish
- What do you need? (free text)
- Category: `Gift` | `Service` | `Resource` | `Opportunity`
- Timeline: when you need it
- Exchange pathway you're offering: `Fixed Price` | `Sliding Scale` | `Trade` | `Gift` | `Scholarship`
- Optional: link to your C.E.S. profile

### Browse Wishes
- Filter by category, pathway, timeline urgency
- Click a wish → see details → "Offer to Fulfill"
- Opens an exchange agreement between wisher and fulfiller

### Wish Status
- `Cast` → `Receiving Offers` → `Agreed` → `In Co-Creation` → `Fulfilled`

---

*Plan co-created for the Heartlight Collective. All offerings flow through aligned exchange, conscious consent, and the Greatest & Highest Good of ALL.*
