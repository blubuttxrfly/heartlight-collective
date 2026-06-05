# Heartlight Collective — Profile & Marketplace Overhaul Plan
## Co-created with Atlas Morphoenix

---

## 1. Core Insight: Two Distinct Spaces

| **Personal / Co-Creator Profile** | **Vendor Marketplace Profile** |
|---|---|
| Who a being IS | What a being OFFERS |
| Identity, resonance, portfolio | Gifts, services, resources, opportunities |
| Required to join the Collective | Optional — activated when a being chooses to exchange |
| Appears in the Directory | Appears in the Marketplace |

---

## 2. Current Profile (4 Steps) → Proposed Split

### CURRENT STRUCTURE
- **Step 1**: Personal (name, pronouns, title, location, sun/moon, profile picture)
- **Step 2**: Ray & Offerings (rays, heartlight, offerings list, exchange pathways)
- **Step 3**: Seasonal & Portfolio (seasons, timeline, numerology, accessibility, portfolio link, season emoji, consent, contact methods)
- **Step 4**: Oath & Signature (CES, passphrase, wish availability, oath)

### PROPOSED: PERSONAL PROFILE — 3 Steps

**Step 1 — Your Resonance** *(who you are)*
- Name * | Pronouns | Title / Role | Location
- Sun Placement | Moon Placement
- Profile Picture (with auto-initials fallback)

**Step 2 — Your Presence** *(how you show up in the collective)*
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

### PROPOSED: VENDOR PROFILE — Separate Page (`/my-storefront`)

> Activated **after** personal profile is approved. Beings can opt in anytime from their dashboard.

**Section A — Resonance Field** *( rays & heartlight for offerings)*
- Ray Frequencies (select up to 3, same as before)
- Heartlight Statement (now framed as: "What you bring to the marketplace")

**Section B — Offerings Catalog** *( what you make available)*
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

**Section C — Exchange & Payment Setup** *( how you receive)*
- Exchange Pathways accepted (multi-select)
- Payment Methods:
  - **Stripe** — connect account for fixed-price offerings
  - **Venmo** — username / deep link
  - **CashApp** — $cashtag / deep link
  - **Zelle** — email / phone for transfers
  - **PayPal** — email / link
- Default exchange preference

**Section D — Storefront Preview** *(live preview before publishing)*
- How your storefront appears to others
- Toggle: Draft / Published

---

## 3. Data Architecture Changes

### `CreatorRecord` (Personal Profile) — SIMPLIFIED
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

### NEW: `VendorRecord` (Marketplace Profile)
```typescript
export interface VendorRecord {
  id: string;
  profileId: string;           // links to CreatorRecord
  cesNumber: string;
  
  // Resonance
  rays: string[];
  heartlight: string;
  
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
}

export interface PaymentMethodConfig {
  stripeConnected: boolean;      // Stripe Connect onboarding status
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
| `/create-profile` | Personal profile — 3 steps (refactored) |
| `/my-storefront` | Vendor profile setup — 4 sections |
| `/marketplace` | Browse all vendor offerings |
| `/offering/:id` | Individual offering detail page |

---

## 5. UI Flow: How a Being Experiences This

```
1. Visits Heartlight Collective
   ↓
2. Clicks "Join the Collective"
   ↓
3. Completes 3-Step Personal Profile
   ↓
4. Profile goes to Steward Review Queue
   ↓
5. Once approved → gains Directory listing + can cast wishes
   ↓
6. From their Dashboard, sees:
      "✨ Set Up Your Storefront" (optional CTA)
   ↓
7. Clicks CTA → `/my-storefront` wizard
   ↓
8. Configures offerings, pricing, payments
   ↓
9. Publhes → offerings appear in `/marketplace`
```

---

## 6. Implementation Waves

### Wave A — Refactor CreateProfile (Personal Profile Only)
- [ ] Strip Step 2 (Ray & Offerings) from `CreateProfile.tsx`
- [ ] Strip Step 3 seasonal/exchange fields — keep only portfolio, contact, consent
- [ ] Reduce to 3 steps: Personal → Portfolio & Presence → Oath
- [ ] Update `CreatorRecord` type: remove `ray`, `primaryRay`, `primaryRayKey`, `rays`, `heartlight`, `offerings`, `exchanges`, `seasons`, `timeline`
- [ ] Update `useStorage` hook / localStorage schema
- [ ] Update `Directory` and `Profile` views to not expect removed fields
- [ ] Build + commit + push

### Wave B — Create Vendor Types & Constants
- [ ] Add `VendorRecord`, `OfferingItem`, `PaymentMethodConfig` to `types/ces.ts`
- [ ] Add marketplace constants: `OFFERING_CATEGORIES`, `CURRENCIES`
- [ ] Create `lib/vendorStorage.ts` — localStorage wrapper for vendor data
- [ ] Build + commit + push

### Wave C — Build `/my-storefront` Page
- [ ] Create `pages/MyStorefront.tsx`
- [ ] Section A: Resonance Field (rays, heartlight)
- [ ] Section B: Offerings Catalog (add/edit/remove offerings)
- [ ] Section C: Exchange & Payment (payment method inputs)
- [ ] Section D: Preview & Publish toggle
- [ ] Add route in `App.tsx`
- [ ] Build + commit + push

### Wave D — Build `/marketplace` Browse Page
- [ ] Create `pages/Marketplace.tsx`
- [ ] Grid of all published offerings across all vendors
- [ ] Filters: category, price range, ray, seasonal availability
- [ ] Search
- [ ] Offering detail modal/page
- [ ] Build + commit + push

### Wave E — Payment Integration (Stripe + Deep Links)
- [ ] Stripe Connect onboarding flow (test mode)
- [ ] Venmo deep link generator (`venmo://paycharge?txn=pay&recipients=...`)
- [ ] CashApp deep link generator (`https://cash.app/$...`)
- [ ] Zelle display (no deep link, show contact info)
- [ ] Build + commit + push

---

## 7. Key Design Decisions

| Decision | Rationale |
|---|---|
| Vendor is **opt-in**, not required | Not every being wants to exchange offerings. Some just want community presence. |
| Offerings have **individual seasonal availability** | A being might offer readings year-round but mentorship only in Spring. |
| `CreatorRecord` keeps `portfolioItems` | Portfolio is about the BEING — their art, their voice. It stays on the personal profile and can be referenced by offerings. |
| Payment methods stored per-vendor, not per-offering | Simpler UX — one payment setup per storefront. |
| `heartlight` moves to vendor | "What you bring to the Heartlight Exchange" is marketplace-specific. A being could have a personal bio AND a marketplace heartlight. |

---

## 8. Migration Notes

- Existing profiles in localStorage will have the old `CreatorRecord` shape. On load, we can gracefully ignore the vendor-related fields (they just won't be displayed in the personal profile UI anymore).
- When a being with an existing profile visits `/my-storefront`, we can pre-populate rays/heartlight from their old profile data as a starting point, then let them refine for the marketplace context.

---

## 9. Open Questions for Co-creation

1. **Should a being be able to have MULTIPLE storefronts?** (e.g., one for astrology, one for web dev) Or one storefront with categorized offerings?
2. **Should the personal profile have a `bio` field** separate from the marketplace `heartlight`?
3. **Should offerings support "bundles"?** (e.g., "3-session package" at a discount)
4. **Should the marketplace support "wish fulfillment requests"** where a being posts what they need, and vendors can offer to fill it?

---

*Plan co-created for the Heartlight Collective. All offerings flow through aligned exchange, conscious consent, and the Greatest & Highest Good of ALL.*
