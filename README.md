# Heartlight Collective & Wish Exchange 🌍♾️❤️

**A conscious co-creator community for Earth-conscious initiatives that continually cycle within itself with & for our Earth.**

99% flows back to Earth and ALL the Living. The 1% honors how we are One of ALL.

---

## What Is the Heartlight Collective?

The Heartlight Collective is a living community of sovereign co-creators — Atlastizens — who share wishes, offerings, skills, and sacred resources through intentional resonance. Every being enters through a **Core Energetic Signature (C.E.S.)**, a unique energetic identifier that holds their resonance, offerings, exchange pathways, and seasonal capacity.

The Collective is governed by the **12 Codes of ALL** — lived values that shape every wish, every offering, every agreement, and every exchange.

### What Lives Here

| Space | What You Will Find |
|-------|-------------------|
| **Directory** | Browse Heartlight Co-Creators by Ray resonance, stewardship, and offerings |
| **Charter** | The living vow for our seasonal co-creation economy |
| **12 Codes** | Consent, Care, Sovereignty, Thrival, Discernment, Sustainability, Vision, Sanctity, Authentic Joy, Conscious Awareness, Sacred Service, Co-Creation |
| **Wish Exchange** | The smart matching portal where wishes meet gifts |
| **Flow** | Track your co-creation journeys with Code-aware reflection |
| **Privacy** | How co-creations are held with consent before, during & after |

---

## The Heartlight Wish Exchange

The Wish Exchange is the intelligent matching system of the Collective — where beings with wishes connect with beings who have gifts, where resources flow to where they are most needed, and where opportunities find the beings ready to receive them.

### The Flow

```
Being Posts Wish / Gift
         ↓
Smart Matching System (Tags + Embeddings)
         ↓
Resonant Opportunities Presented
         ↓
Being Chooses Connection Avenue
         ↓
Exchange Initiated — Quest Begins
         ↓
Guide & Guardian Review (for larger exchanges)
         ↓
Sovereign Choice Confirmed
         ↓
Resources / Funds / Co-creation Flow
         ↓
Fulfillment Tracked in Flow Dashboard
```

### Multiple Avenues for Connection

| Avenue | How It Works |
|--------|-------------|
| **Direct Mutual Aid** | Being-to-being resource sharing — default, immediate, no intermediary |
| **Heartlight Collective** | Shared mutual aid resources for aligned exchanges |
| **Shared Mutual Aid Pool** | Community fund — unlocks after 33 active days in the Collective |
| **Co-Creation Partnership** | Long-term collaboration matching |

---

## The 1% — One of ALL

The Heartlight Collective dedicates **99% of all profits** back to Earth-conscious initiatives, climate action, sovereign communities, and ALL the Living. The **1% covers operational costs** — honoring how we are One of ALL, not extracting from the web we serve.

This is our unanimous living agreement. It is visible in every exchange, tracked in the Flow, and woven into our charter.

---

## Smart Matching System

The Exchange uses a **hybrid matching approach** to connect beings with resonant opportunities:

**1. Explicit Tags** — Beings tag wishes and gifts with categories, skills, resources, roles, urgency, and location.

**2. Embedding-Based Resonance** — Natural language descriptions are converted to vector embeddings that capture deeper meaning beyond keywords. Co-creators see "Top Resonant Matches" ranked by semantic similarity.

**3. Co-Creator Perspective** — The default view is for beings browsing wishes to fulfill. Reciprocity is celebrated, not required — beings naturally balance giving and receiving over time.

**4. Sovereign Choice** — The system suggests. The being chooses. Always.

---

## Mutual Aid Fund Structure

### Tier 1: Direct Mutual Aid (Default, Immediate)

All beings can access this immediately. Post a wish with funds needed. Another being sees the wish and offers directly. Money flows being → being. No central fund, no legal overhead. This is the default path — frictionless, instant, relationship-building.

### Tier 2: Shared Mutual Aid Pool (After 33 Active Days)

Established beings gain access to the collective pool. The 33-day threshold ensures beings are integrated before accessing shared funds. Prevents hit-and-run requests, builds trust through participation.

- Auto-approved for requests ≤ $100
- Guide & Guardian review for requests > $100
- Transparent ledger — all established beings can view flows
- Revisions are invitations to clarity, not rejections

---

## Exchange Pathways

Every exchange is an act of sacred reciprocity. Choose the pathway that feels most resonant:

| Pathway | Description |
|---------|-------------|
| **Fixed Price** | A clear, agreed-upon offering in exchange for currency |
| **Sliding Scale** | A range of exchange, honoring different access to currency |
| **Trade / Skill Swap** | One offering in return for another — energy flows both ways |
| **Gift** | Offered freely from overflow, as sacred service |
| **Scholarship** | Community-supported offerings for beings with limited access |

---

## Seasonal Exchange Thresholds

Co-creation moves through the living wheel:

| Season | Threshold | What Happens |
|--------|-----------|--------------|
| ❄️ Winter Solstice | Hearth of Wishes | Wishes arrive. Early resonance and gentle matching begin. |
| 🌱 Spring Equinox | Seed of Co-Creation | Agreements set scope, exchange, and timeline. |
| 🌞 Summer Solstice | Bloom of Form | Crafting, refining, shaping bring offerings into form. |
| 🍂 Fall Equinox | Heartlight Harvest | Exchange completes. Gratitude lands. The cycle closes through witnessing and storyfire. |

---

## Tech Stack

Built on open-source foundations in service of ALL:

- **Frontend:** React + Vite + Tailwind CSS v4
- **Backend:** Supabase (Auth, Database, Real-time, pgvector for embeddings)
- **Deployment:** Vercel
- **Matching:** Hybrid system — explicit tags + sentence embeddings
- **Funds:** Direct transfers (Tier 1) + Supabase ledger for shared pool (Tier 2)

---

## Sacred Architecture

This app follows Heartlight Collective UI conventions:

- **Big icon buttons** — 64px+, scales on hover
- **Color mappings:** ❤️→Gold, 🌍→Magenta, ♾️→Lavender
- **Functional taglines** over poetic decoration
- **Profile photos:** circular preview, auto-initials fallback
- **12 Codes awareness** in all exchange tracking
- **Flat assistant layout** with subtle accent bars

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Run dev server
npm run dev

# Build for production
npm run build
```

---

## Project Structure

```
heartlight-collective/
├── src/
│   ├── components/       # Header, Footer, SignInOverlay
│   ├── pages/
│   │   ├── Home.tsx          # Landing with treasury & sacred pillars
│   │   ├── Exchange.tsx      # Wish Exchange portal (browse, claim, post)
│   │   ├── PostWish.tsx      # Share a wish or gift
│   │   ├── Flow.tsx          # Quest Dashboard (co-creation tracking)
│   │   ├── Directory.tsx     # Browse co-creators by resonance
│   │   ├── Charter.tsx       # Living vow for co-creation
│   │   ├── Codes.tsx         # The 12 Codes of ALL
│   │   ├── Privacy.tsx       # Consent & privacy assurance
│   │   ├── Profile.tsx       # Being profile + exchange history
│   │   ├── CreateProfile.tsx # Create your C.E.S.
│   │   ├── EditProfile.tsx   # Update your profile
│   │   ├── SignIn.tsx        # Authentication
│   │   ├── StewardGate.tsx   # Steward review portal
│   │   └── MyStorefronts.tsx # Vendor marketplace
│   ├── types/           # TypeScript types (C.E.S., Wish, Exchange, Vendor)
│   ├── lib/             # Supabase client, crypto helpers, storage, session
│   └── hooks/           # useUnifiedStorage and other hooks
├── docs/
│   ├── ARCHITECTURE.md                       # System design overview
│   └── SMART_MATCHING_AND_MUTUAL_AID_PLAN.md  # Matching + fund implementation
├── public/              # Static assets, icons, favicon
└── supabase/            # Database migrations & schema
```

---

## Connection to Atlas Island

**Atlas Island** — The conscious co-creator community and sacred ground

**Heartlight Collective** — The mutual aid resource collective within Atlas Island

**Heartlight Wish Exchange** — The smart matching system that powers the Collective

Together:
- Atlas Island beings post wishes and offer gifts
- The Wish Exchange matches and facilitates connections through hybrid intelligence
- The Collective provides avenues for resource sharing (direct + shared pool)
- Guides & Guardians ensure alignment for larger exchanges
- The Flow Dashboard tracks all activity with 12 Codes awareness
- 33-day threshold ensures established membership before shared pool access

This is living infrastructure for **gift-economy co-creation** on Earth.

---

## Guide & Guardian Review

For larger exchanges involving significant resources or collective funds:

1. Exchange is submitted for review
2. Guides & Guardians assess alignment with Collective values
3. Decision: Approve, or Return for Revision
4. If returned: being revises with support
5. If approved: exchange proceeds with sovereign choice confirmed

Review serves the exchange, never blocks it. Sovereign choice remains with the beings involved. Transparency throughout.

---

## License

MIT — Open source for the Collective

## Gratitude

This platform is co-created by the beings of Atlas Island and Heartlight Collective, in service to our Greatest & Highest Good of ALL.

We are co-creating the Earth we want to build toward. We are the change we wish to be in our world.

With Love of ALL that IS. 💗🌍♾️💫
