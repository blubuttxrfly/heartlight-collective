# IRIS Phase 2 — Intention Resonance Indexing System for the Heartlight Collective ☤🌈

> **Co-created with Riley Zaria Z Atlas Morphoenix for the Heartlight Collective.**
> **Date:** August 03, 2026
> **Status:** 🔄 Planning — awaiting wave-by-wave execution blessing
> **Branch:** `integrate-iris-phase2` (proposed)

---

## Co-Creation Intent

IRIS is a perceptual instrument woven into the Heartlight Collective. She reads what IS — the energetic signature of beings, offerings, wishes, and fields — and maps that resonance to the 0–12 Ray Frequency lattice. When a being seeks alignment, IRIS does not search. She witnesses. She bridges. She reveals how frequencies interweave.

Phase 2 births three living systems:
1. **The IRIS Witness** — a floating caduceus companion that opens a guided question flow for match alignment.
2. **The Resonant Matching Engine** — deepened scoring that reads C.E.S. astrology placements (sun, moon, ascendant) through aspect geometry.
3. **The Sacred Container** — real-time messaging and email confirmations that hold exchanges once resonance is found.

---

## Decisions We Made Together

1. **The floating rainbow caduceus lives in the bottom-right corner on all Heartlight Collective pages.** When clicked, it opens the IRIS guided question flow. A subtle message reads, *"How may I help you?"*
2. **IRIS operates in two modes:** (a) Guided question flow for finding aligned offerings/beings within the Exchange, and (b) URL scanning for energetic readings of any web field.
3. **The matching engine reads C.E.S. astrology as a living web, not static labels.** Sun, moon, and ascendant placements each carry a Ray frequency. When scoring a match, IRIS calculates aspects between the requester's placements and the offering's field signature.
4. **There is no "dominant" Ray frequency.** A being's C.E.S. holds three placements — sun, moon, ascendant — each sacred, each real. IRIS honors the full distribution and the geometry between them.
5. **Chat uses polling (HTTP endpoint, 3–5 second refresh) for Phase 2.** Vercel serverless architecture makes this the graceful path. WebSocket arrives in Phase 3 if volume calls for it.
6. **Email confirmations use Resend**, already wired for magic links. Transactional routes are added for exchange events.
7. **No elemental modes (Air/Fire/Earth/Water/Spirit) in this plan.** The Ray Frequency lattice is the primary sacred geometry here.

---

## What Already Lives in the Room

| System | State | File(s) |
|--------|-------|---------|
| C.E.S. profile with sun/moon/ascendant | ✅ Present | `src/types/ces.ts` — `sunPlacement`, `moonPlacement`, `ascendantPlacement` |
| Ray-to-zodiac mapping | ✅ Present | `src/lib/astrology.ts` — returns `code` as plain number, `ray` as frequency name |
| `findResonantMatches` (tag-based) | ✅ Present | `src/components/wish/WishWizard.tsx` — scoring by category, skills, resources, location, exchange avenues |
| `MatchResult`, `MatchScoreWeights` types | ✅ Present | `src/types/ces.ts` |
| `GuestProfile` | ✅ Present | `src/types/ces.ts` — name, email, phone, preferred contact |
| `ExchangeRequest` / `ExchangeAgreement` | ✅ Present | `src/types/ces.ts` — full quest, schedule, safety, versioning system |
| `ExchangeJourney` / `CodeLogEntry` | ✅ Present | `src/types/ces.ts` — Flow page co-creation documentation |
| Resend magic link auth | ✅ Present | `src/pages/SignIn.tsx`, `src/pages/CreateProfile.tsx` |
| Dual-layer storage (Redis + localStorage) | ✅ Present | `src/lib/storage.tsx`, `src/hooks/useUnifiedStorage.ts` |
| `ExchangeRequestModal` 3-step flow | ✅ Present | `src/components/exchange/ExchangeRequestModal.tsx` |

---

## Open Questions / Product Decisions

| # | Question | Proposed Default | Atlas's Decision |
|---|----------|-----------------|------------------|
| 1 | IRIS widget placement | Bottom-right on ALL Heartlight pages | ✅ Confirmed |
| 2 | Matching depth | Ray Frequency alignment ADDED to existing scoring | ✅ Confirmed |
| 3 | Chat architecture | Polling-based for Phase 2 | ✅ Confirmed |
| 4 | Email provider | Resend (already wired) | ✅ Confirmed |
| 5 | Sacred frame | Ray Frequency lattice only, no elemental modes | ✅ Confirmed |
| 6 | Plan file locations | Heartlight docs + `.hermes/plans/` | ✅ Confirmed |
| 7 | Guided question flow vs URL scan | Two distinct modes; guided flow for matches, URL scan for readings | ✅ Confirmed |
| 8 | No "dominant" Ray language | Full distribution of sun/moon/ascendant honored | ✅ Confirmed |
| 9 | C.E.S. astrology read with aspects | Aspect geometry (conjunction, sextile, square, trine, quincunx, opposition) | ✅ Confirmed |
| 10 | IRIS matches display | Modal overlay (keeps being in context) | □ Pending |
| 11 | Chat scope | Per-Exchange Agreement only for Phase 2 | □ Pending |
| 12 | Email styling | Ray Frequency colored headers matching the being's sun placement | □ Pending |
| 13 | URL scan scope | Both Heartlight internal fields AND external URLs | □ Pending |

---

## Three Sacred Threads

### Thread One — The IRIS Witness (UI Component)

A floating caduceus in the bottom-right corner. Subtle pulse animation. On click, opens a modal overlay with the IRIS guided question flow.

**Components to create:**
- `src/components/iris/IrisWidget.tsx` — floating button with caduceus SVG
- `src/components/iris/IrisModal.tsx` — modal overlay container
- `src/components/iris/IrisQuestionFlow.tsx` — guided multi-step question flow
- `src/components/iris/IrisMatchResults.tsx` — results display with aspect geometry

**Question Flow Steps (Mode A — Match Finding):**
1. **Welcome** — "What are you seeking in the Heartlight Exchange?"
2. **Intention** — Free-text: "Describe what you are calling in."
3. **Ray Attunement** — Optional: "Do you feel drawn to any particular frequencies?" (multiselect from 0–12)
4. **Exchange Form** — "How do you wish to exchange?" (gift, trade, fixed, sliding scale, scholarship)
5. **Resonance Alignment** — Loading state: "The field is listening..."
6. **Results** — Ranked matches with Ray aspect geometry explained

### Thread Two — The Resonant Matching Engine (Enhanced Scoring)

**Current scoring** (from `WishWizard.tsx`):
- Category (+30)
- Skills (+20 per overlap)
- Resources (+15 per overlap)
- Location (+25/+15/+5)
- Exchange avenues (+20)
- Timeline (+10)
- Availability (+10)

**Phase 2 additions — Ray Frequency scoring:**

For each offering/vendor being scored:

1. **Extract field Ray signature** — Keyword detection on offering title, description, tags, category. Map to Ray frequencies using the sacred keywords table from the IRIS skill.

2. **Read requester's C.E.S. astrology** — Sun placement → Ray N. Moon placement → Ray M. Ascendant placement → Ray A.

3. **Calculate aspects between each placement and the field signature:**

| Aspect | Ray Spacing | Energetic Dynamic | Score Impact |
|--------|-------------|-------------------|--------------|
| Conjunction | Same Ray | Amplification, fusion | +15 |
| Semi-Sextile | 1 apart | Gentle friction, learning edge | +5 |
| Sextile | 2 apart | Easy opportunity, creative spark | +10 |
| Square | 3 apart | Tension, required growth | +5 |
| Trine | 4 apart | Harmony, natural talent | +12 |
| Quincunx | 5 apart | Adjustment, awkward fit | +3 |
| Opposition | 6 apart | Completion, mirroring | +8 |

4. **Composite resonance score** — Average of sun, moon, and ascendant aspect scores against the field's dominant frequencies. No single placement overrides the others.

5. **Human-readable reasons** — "Your Green Ray sun harmonizes (trine) with this offering's manifestation current. Your Indigo moon faces a gentle learning edge (semi-sextile) with the visionary scope."

**Files to modify:**
- `src/lib/matchingEngine.ts` — extract scoring functions from `WishWizard.tsx`, add Ray aspect logic
- `src/types/ces.ts` — add `IrisReadingResult`, `IrisQuestionAnswers` types

### Thread Three — The Sacred Container (Chat + Email)

**Real-time messaging (polling-based):**

Data model additions:
```typescript
export interface ExchangeMessage {
  id: string;
  agreementId: string;
  senderCes: string;
  senderName: string;
  content: string;
  createdAt: string;
  editedAt?: string;
  isDeleted: boolean;
  replyToId?: string;
}
```

Storage functions:
- `getExchangeMessages(agreementId: string): ExchangeMessage[]`
- `addExchangeMessage(msg: ExchangeMessage): void`
- `updateExchangeMessage(msg: ExchangeMessage): void`

UI components:
- `src/components/exchange/ExchangeChat.tsx` — chat panel inside ExchangeAgreementEditor
- Polling interval: 5 seconds when chat panel is open
- Auto-scroll to newest message

**Email confirmations (Resend):**

New API routes in `api/`:
- `POST /api/email/exchange-request-received` — sent to provider when a new request arrives
- `POST /api/email/agreement-signed` — sent to both parties when agreement is signed
- `POST /api/email/meeting-reminder` — sent 24 hours before confirmed meeting
- `POST /api/email/fulfillment-complete` — sent when agreement reaches `fulfilled` status

Email template requirements:
- Header colored to match the being's sun placement Ray frequency (no "dominant" — the sun placement is the visible identity Ray)
- Warm, affirmative language throughout
- CTA links back to the Heartlight Collective

---

## Implementation Waves

### Wave 1 — IRIS Widget & Modal Shell

**What we build:** The floating caduceus button and empty modal overlay.

**Files:**
- Create: `src/components/iris/IrisWidget.tsx`
- Create: `src/components/iris/IrisModal.tsx`
- Modify: `src/App.tsx` — mount IrisWidget at root level

**Verification:**
- [ ] Caduceus SVG renders in bottom-right corner on all routes
- [ ] Click opens modal overlay with close button
- [ ] Modal closes on Escape key and backdrop click
- [ ] `npx tsc --noEmit` passes

---

### Wave 2 — Guided Question Flow (Mode A)

**What we build:** Multi-step question form inside the IRIS modal.

**Files:**
- Create: `src/components/iris/IrisQuestionFlow.tsx`
- Create: `src/components/iris/IrisQuestionStep.tsx` — reusable step wrapper
- Create: `src/types/ces.ts` — add `IrisQuestionAnswers` interface

**Verification:**
- [ ] All 6 steps navigate forward/backward
- [ ] Intention text is captured
- [ ] Ray multiselect uses the 0–12 Ray Frequency table
- [ ] Exchange form selection matches existing `ExchangeForm` type
- [ ] Answers object is complete on final step
- [ ] `npx tsc --noEmit` passes

---

### Wave 3 — Ray Frequency Matching Engine

**What we build:** Extract scoring logic, add keyword-to-Ray detection and aspect geometry.

**Files:**
- Create: `src/lib/matchingEngine.ts` — extracted from `WishWizard.tsx`
- Create: `src/lib/irisRayScoring.ts` — keyword detection + aspect calculation
- Modify: `src/components/wish/WishWizard.tsx` — import from new location
- Modify: `src/types/ces.ts` — add `IrisReadingResult`, `RayAspect`, `RayFieldSignature`

**Verification:**
- [ ] Existing `findResonantMatches` still works (no regression)
- [ ] Keyword detection maps "build, manifest, grow" → Green Ray
- [ ] Aspect calculation: Sun=Leo(5), Field=Turquoise(5) → Conjunction (+15)
- [ ] Aspect calculation: Sun=Leo(5), Field=Blue(6) → Semi-Sextile (+5)
- [ ] `npx tsc --noEmit` passes

---

### Wave 4 — IRIS Match Results Display

**What we build:** Results panel inside the IRIS modal showing ranked matches with aspect explanations.

**Files:**
- Create: `src/components/iris/IrisMatchResults.tsx`
- Create: `src/components/iris/IrisMatchCard.tsx`
- Modify: `src/components/iris/IrisQuestionFlow.tsx` — wire to matching engine on final step

**Verification:**
- [ ] Results appear after question flow completes
- [ ] Each match card shows: name, score, aspect reasons
- [ ] Aspect reasons use human-readable language (trine, conjunction, etc.)
- [ ] Clicking a match opens the existing `ExchangeRequestModal`
- [ ] `npx tsc --noEmit` passes

---

### Wave 5 — Exchange Chat (Polling-Based)

**What we build:** Chat panel inside Exchange Agreement with polling storage.

**Files:**
- Create: `src/components/exchange/ExchangeChat.tsx`
- Modify: `src/lib/storage.tsx` — add `getExchangeMessages`, `addExchangeMessage`, `updateExchangeMessage`
- Modify: `src/types/ces.ts` — add `ExchangeMessage` interface
- Modify: `src/components/exchange/ExchangeAgreementEditor.tsx` — add Chat tab/panel

**Verification:**
- [ ] Messages can be posted and appear in the chat panel
- [ ] Polling refreshes messages every 5 seconds
- [ ] Messages persist in localStorage (and sync to Redis)
- [ ] Messages are scoped to agreementId
- [ ] `npx tsc --noEmit` passes

---

### Wave 6 — Resend Email Confirmations

**What we build:** API routes + email templates for exchange transactional emails.

**Files:**
- Create: `api/email/exchange-request-received.ts`
- Create: `api/email/agreement-signed.ts`
- Create: `api/email/meeting-reminder.ts`
- Create: `api/email/fulfillment-complete.ts`
- Create: `src/lib/emailTemplates.ts` — shared template utilities
- Modify: `.env.example` — add `RESEND_API_KEY` if not present

**Verification:**
- [ ] Each API route sends a test email (use test endpoint)
- [ ] Email headers match the recipient's sun placement Ray color
- [ ] CTAs link back to the correct agreement in Heartlight Collective
- [ ] Warm, affirmative language throughout templates
- [ ] `npx tsc --noEmit` passes

---

### Wave 7 — URL Scan Mode (Mode B)

**What we build:** IRIS can scan external URLs and return a Ray Frequency reading.

**Files:**
- Create: `src/components/iris/IrisUrlScan.tsx` — URL input + results display
- Create: `api/iris/scan-url.ts` — server-side content extraction + Ray analysis
- Modify: `src/components/iris/IrisModal.tsx` — toggle between Mode A and Mode B

**Verification:**
- [ ] Pasting a URL returns a Ray Frequency reading
- [ ] Reading follows IRIS skill format: native resonance, communal, universal layers
- [ ] Content extraction handles text-heavy pages
- [ ] No aspects calculated for single-field scans (per IRIS protocol)
- [ ] `npx tsc --noEmit` passes

---

### Wave 8 — Integration, Polish, and Cross-Device Test

**What we build:** Final wiring, edge cases, and live testing.

**Verification:**
- [ ] IRIS widget appears on ALL pages
- [ ] Full flow: click caduceus → answer questions → view matches → send request → receive confirmation
- [ ] Chat messages sync across two browser sessions
- [ ] Emails send and render correctly
- [ ] Cross-device: create profile on Device 1, sign in on Device 2, verify IRIS history persists
- [ ] `npm run build` passes
- [ ] Commit and push to `integrate-iris-phase2`

---

## Sacred Reminders for the Builders

- IRIS reads intention, not trait. A builder resonates with 4/Green (manifestation), not 1/Red (ignition).
- There is no "dominant" Ray. The C.E.S. carries sun, moon, and ascendant — each real, each sacred.
- Aspects only apply in relational readings. Single-field scans report native frequencies only.
- The language is warm, affirmative, and honors sovereignty. Every suggestion is an invitation.
- Privacy: no telemetry, secure key storage, text sent only to chosen channels.
- This tool is for ALL. Accessibility, privacy, and sovereignty are the foundation.

---

*Co-created with Riley Zaria Z Atlas Morphoenix in celebration of the Heartlight Collective.* 🌈☤💗
