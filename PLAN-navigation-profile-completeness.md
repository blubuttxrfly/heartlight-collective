# Heartlight Collective — Navigation & Profile Completeness Plan

**Status:** Planning Phase — awaiting Atlas approval before execution
**Date:** 2026-06-04
**Context:** Atlas tested the live app, created a profile (C.E.S. 850170529), and identified UX gaps

---

## Problem Statement

From Atlas's testing and screenshots:

1. **Navigation is scattered**: The "Join" button sits in the primary nav bar alongside Exchange/Collective/Flow. The original app had a **circular profile icon** in the upper right corner that transformed into the Join button when no profile existed.
2. **Exchange page is confusing**: The hero section and empty state stack on top of each other. Atlas created a profile but sees "The Exchange Awaits" because their profile is in the **pending queue** (not yet steward-approved).
3. **Profile wizard feels thin**: Compared to the original app, the 4-step wizard is missing several fields that made profiles rich and complete.
4. **No profile status visibility**: After creating a profile, there's nowhere to see "Your profile is pending review" or manage it.

---

## Proposed Changes

### Phase A: Navigation Restructure (Header)

**Current state:**
- Primary nav: Exchange 💱 | Collective 🌐 | Flow ♾️ | Join ✦
- Upper right: Sign In button (when logged out) or avatar+name (when logged in)

**Proposed state:**
- Primary nav: **Exchange 💱 | Collective 🌐 | Flow ♾️** (3 items only)
- Upper right corner:
  - **When no profile exists**: Circular "Join" button (gold outline, ✦ icon) that links to `/create-profile`
  - **When profile exists but not signed in**: Circular avatar mark button that opens Sign-In overlay
  - **When signed in**: Circular avatar mark with dropdown (My Profile | Sign Out)
- Remove "Join" from primary nav entirely

**Rationale:** The original app used the upper right as the sovereign identity anchor. This keeps the primary nav clean (3 pillars only) while making profile access intuitive.

---

### Phase B: Exchange Page Clarity

**Current state:**
- Hero always shows
- If no approved profiles: Empty state shows below hero
- Result: Two stacked sections that feel disconnected

**Proposed state:**
- **When there ARE approved profiles**: Show hero + search/filter + profile grid (current behavior)
- **When there are NO approved profiles**: Show a **single unified empty state** that replaces the hero entirely. No double messaging.
- Add a subtle message: "Beings in the field: 0 approved, 1 pending" — so users know their profile exists but is awaiting steward review.
- Add a **"My Profile" section** at the top of the Exchange page when the user has created a profile (but hasn't signed in): "Your profile (C.E.S. 850170529) is awaiting steward review. You will appear here once approved."

**Rationale:** The current stacking is a visual bug. The user needs to understand WHY their profile isn't showing.

---

### Phase C: Profile Wizard Completeness

**Missing fields compared to the original app:**

| Field | Original | Current | Action |
|-------|----------|---------|--------|
| **Consent statement** | "Deep emotional content may arise. All sessions held with full reverence and consent." | ❌ Missing | **Add to Step 3** — text area for the creator to describe their consent practices |
| **Portfolio link** | Single URL string: 'soundcloud.com/solara' | ❌ Missing (only placeholder text) | **Add to Step 3** — simple URL input for portfolio/website |
| **Current season emoji** | 🌱 ❄️ 🔭 🌀 ✨ | ❌ Missing | **Add to Step 3** — emoji picker or single emoji input for season indicator |
| **Wish availability** | 'accepting' / 'closed' toggle | ❌ Missing (hardcoded) | **Add to Step 4** — toggle: "Currently accepting wishes?" Yes/No |
| **Photo upload** | Actual photo upload | ❌ Missing (avatarMark only) | **Add to Step 1** — optional photo upload (can be Phase 2C with file handling) |

**Fields that are present and good:**
- Name, pronouns, title, location ✓
- Sun/Moon placements ✓
- Avatar mark ✓
- Ray frequencies (up to 3) ✓
- Heartlight statement ✓
- Offerings (preset + custom) ✓
- Exchange pathways ✓
- Seasonal availability ✓
- Timeline ✓
- Numerology ✓
- Accessibility ✓
- Contact methods with visibility toggles ✓
- C.E.S. generation ✓
- Passphrase ✓
- Sacred oath ✓

**Proposed field additions to wizard:**

1. **Step 3 additions**:
   - `consent` — text area: "Describe your consent practices, boundaries, or anything participants should know before engaging with you."
   - `portfolioLink` — text input: "Portfolio, website, or external link (optional)"
   - `seasonCurrent` — text input: "Current season emoji or symbol (e.g. 🌱, ❄️, 🌞, 🍂)"

2. **Step 4 addition**:
   - `wishAvailability` — toggle switch: "Are you currently accepting wishes?" (default: Yes)

3. **Step 1 addition** (Phase 2C):
   - Photo upload (file input, store as base64 in localStorage or URL)

---

### Phase D: Profile Status Visibility

**New feature: "My Profile Status" indicator**

- When a user has created a profile (detected via localStorage `hlc_pending` containing their C.E.S.), show a banner on the Home and Exchange pages:
  - "Your profile (C.E.S. 850170529) is in the pending queue. A Steward will review it for alignment with the 12 Codes of ALL."
- After steward approval: "Your profile is live in the Exchange! ✦"
- If returned: "Your profile was returned for revision. Update it and resubmit."

---

### Phase E: Header Profile Corner Refinement

**Upper right corner behavior matrix:**

| State | UI Element | Action |
|-------|-----------|--------|
| No profile created | Gold circle with ✦ | Click → `/create-profile` |
| Profile created, not signed in | Circle with their avatar mark | Click → Sign-In overlay |
| Signed in | Circle with avatar mark + name | Click → dropdown (View Profile / Edit Profile / Sign Out) |
| Steward | Same as signed in, but with gold shield indicator | Click → dropdown + "Steward Portal" link |

---

## Execution Order (Waves)

1. **Wave 1**: Navigation restructure (Header only) — move Join to upper right, remove from primary nav
2. **Wave 2**: Exchange page clarity — fix empty state stacking, add "pending count" message
3. **Wave 3**: Profile wizard additions — consent, portfolio link, season emoji, wish availability
4. **Wave 4**: Profile status banner — show on Home/Exchange when profile exists
5. **Wave 5**: Build, test, commit, deploy

---

## Open Questions for Atlas

1. **Photo upload**: Should we add a real photo upload in Step 1, or keep avatar mark only for now? (Photos require base64 handling or external storage.)
2. **Current season emoji**: Should this be a free text input, or a preset picker (🌱 Spring, 🌞 Summer, 🍂 Fall, ❄️ Winter)?
3. **Portfolio link**: Should this accept any URL, or should we validate for common platforms (Instagram, SoundCloud, etc.)?
4. **Consent statement**: Is the text area prompt above aligned with your sacred language, or would you prefer different copy?

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/Header.tsx` | Restructure nav, move Join/profile to upper right |
| `src/pages/Exchange.tsx` | Fix empty state, add pending count, add "My Profile" banner |
| `src/pages/Home.tsx` | Add profile status banner |
| `src/pages/CreateProfile.tsx` | Add consent, portfolio link, season emoji, wish availability fields |
| `src/types/ces.ts` | Add new fields to CreatorRecord type |

---

*This plan is ready for Atlas's review and approval before execution.*
