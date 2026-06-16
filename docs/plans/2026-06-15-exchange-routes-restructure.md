# Heartlight Exchange URL Restructure Plan

> For Hermes: implement wave-by-wave with `npx tsc --noEmit` between waves.

**Goal:** Reorganize Heartlight Exchange navigation under `/exchange/*` and Flow/Vendor Shops under `/flow/*`, while preserving old routes as redirects during transition.

**Architecture:**
- `/exchange` becomes a unified landing page with sub-tabs.
- `/exchange/wishes`, `/exchange/gifts`, `/exchange/vendors` render filtered views of the existing Exchange grid.
- `/exchange/wish/cast-wish` renders the wish form (alias: `/cast-wish`).
- `/exchange/gift/share-gift` renders the gift form (alias: `/share-gift`).
- `/flow/vendor-shop` replaces `/my-storefronts` for creating/joining Vendor Shops.
- Add an individual being view of Vendor Shops.
- Add a "Dedication of Profits" section to Exchange Agreements as high priority.

**Tech Stack:** React + React Router + TypeScript + Tailwind.

---

## Wave 1: Exchange Sub-Routes

### Task 1.1: Create Exchange layout wrapper
**Files:**
- Create `src/pages/ExchangeLayout.tsx`
- Modify `src/App.tsx`

**Steps:**
1. Create `ExchangeLayout.tsx` that renders the existing Exchange header, stats, CTAs, and a tab bar for Wishes / Gifts / Vendors.
2. Use `Outlet` from `react-router-dom` for nested child routes.
3. In `App.tsx`, wrap Exchange routes under a parent `/exchange` route.
4. Add redirects: `/cast-wish` → `/exchange/wish/cast-wish`, `/share-gift` → `/exchange/gift/share-gift`, `/my-storefronts` → `/flow/vendor-shop`.

### Task 1.2: Split Exchange views into nested pages
**Files:**
- Modify `src/pages/Exchange.tsx`
- Create `src/pages/ExchangeWishes.tsx`, `src/pages/ExchangeGifts.tsx`, `src/pages/ExchangeVendors.tsx`

**Steps:**
1. Refactor `Exchange.tsx` into the layout wrapper (or keep it as the unified page and use it inside `ExchangeLayout`).
2. Create `ExchangeWishes`, `ExchangeGifts`, `ExchangeVendors` as filtered grid views (`type=wish`, `type=offer`, `type=offering` / vendor list).
3. Update the CTA buttons on `/exchange` to point to the new nested form routes.

### Task 1.3: Update internal links
**Files:**
- Search and patch all `to="/cast-wish"`, `to="/share-gift"`, `to="/my-storefronts"`, `to="/exchange"` links across `src/`.
- Keep old route paths supported via redirects so bookmarks do not break during transition.

**Verification:**
- `npx tsc --noEmit` passes.
- `npm run build` passes.
- Local dev server responds at `/exchange`, `/exchange/wishes`, `/exchange/gifts`, `/exchange/vendors`, `/exchange/wish/cast-wish`, `/exchange/gift/share-gift`.

---

## Wave 2: Flow Vendor Shop Route

### Task 2.1: Rename MyStorefronts route
**Files:**
- Modify `src/App.tsx`
- Modify `src/components/Header.tsx`

**Steps:**
1. Add `/flow/vendor-shop` route pointing to existing `MyStorefronts` component.
2. Keep `/my-storefronts` as a redirect alias.
3. Update Header dropdown link from `/my-storefronts` to `/flow/vendor-shop`.

### Task 2.2: Add individual being view of Vendor Shops
**Files:**
- Create or extend `src/pages/Profile.tsx` or a new `src/pages/ProfileVendors.tsx`
- Modify `src/pages/Storefront.tsx`

**Steps:**
1. On `/profile/:ces`, add a "Vendor Shops" section listing Vendor Shops where this being is owner/admin/contributor.
2. Each shop card links to `/storefront/:slug`.
3. Ensure `useStorage` exposes a `getVendorsByOwnerCes(ces)` helper if it does not already exist.

**Verification:**
- `npx tsc --noEmit` passes.
- `/flow/vendor-shop` renders the same UI as `/my-storefronts`.
- A profile page shows the being's Vendor Shops.

---

## Wave 3: Dedication of Profits Agreement

### Task 3.1: Add model field
**Files:**
- Modify `src/types/ces.ts`
- Modify `src/lib/database.types.ts` (Supabase types) if needed

**Steps:**
1. Add to `ExchangeAgreement`:
   ```ts
   dedicationOfProfits?: {
     enabled: boolean
     percentage?: number
     destination?: string
     notes?: string
   }
   ```

### Task 3.2: Add UI editor
**Files:**
- Modify `src/components/exchange/ExchangeAgreementEditor.tsx`

**Steps:**
1. Add a "Dedication of Profits" card in the agreement editor.
2. Toggle to enable, number input for percentage, text input for destination/notes.
3. Save into the agreement object.

### Task 3.3: Display in agreement view
**Files:**
- Modify `src/components/exchange/ExchangeAgreementEditor.tsx` and any agreement detail view.

**Verification:**
- `npx tsc --noEmit` passes.
- Dedication of Profits field appears in the agreement editor and persists.

---

## Wave 4: Cleanup (future, after transition)

- Remove redirect aliases `/cast-wish`, `/share-gift`, `/my-storefronts` once Atlas confirms transition is complete.
- Delete dead route imports.
- Run final `npx tsc --noEmit && npm run build`.

---

## Sacred Copy Notes

- Emoji/symbol after text: "Cast a Wish ⭐", "Share a Gift 🤝".
- Use collective framing: "our Greatest & Highest Good".
- Zero "not" language in new user-facing copy.
