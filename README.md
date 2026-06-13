# Heartlight Wish Exchange 💫

**The Heartlight of the Entire Collective** — where conscious co-creators facilitate wish exchange fulfillments.

> Wishes become quests. Strangers become quest-mates. Co-creation becomes prayer in motion.

---

## Vision

The Heartlight Wish Exchange is a sacred portal connecting those who have with those who need through **Heartlight-facilitated co-creation**.

When someone posts a wish, the community responds as **Thresholder kin** recognizing themselves in each other. Every fulfillment is an act of remembering: *We are ALL that IS Living.*

---

## What Is the Wish Exchange?

The Wish Exchange is where **co-creation is initiated**. It is the living heart of the Heartlight Collective — a space where:

- **Wishes** are sacred invitations to co-create
- **Exchange** is the threshold where beings choose to become quest-mates
- **Quests** are the journeys undertaken together, tracked with 12 Codes awareness
- **Fulfillment** is mutual recognition and gratitude

A **resonance matching ecosystem** where the web of mutual aid becomes visible and alive.

---

## The Flow

```
Wish → Exchange → Quest → Fulfillment
```

### 1. Wish
A being shares what they need: a skill, a resource, a co-creation partnership, time, guidance. The wish carries their energy, their sincerity, their trust in the field.

### 2. Exchange
Another being feels resonance. They browse the wishes as a co-creator asking: *Does this call to me? Am I the one to meet this wish?* When they claim it, they cross the threshold together.

### 3. Quest
The wish becomes a living journey. Both beings track their co-creation through phases (before → during → after), documenting their experience through the lens of the **12 Codes of ALL**. They note where Consent was honored, where Sovereignty was protected, where Joy arose.

### 4. Fulfillment
When the quest completes, both beings sign off as co-creators who have witnessed each other. Gratitude flows. The web strengthens.

---

## How It Works

### For Wish Posters
- Share what you need with clarity and sincerity
- Select which of the 12 Codes guide this wish (Consent, Sovereignty, Co-Creation, etc.)
- Review beings who resonate with your wish
- Co-create the quest agreement together
- Document your journey through the Flow dashboard
- Sign off on fulfillment when complete

### For Wish Fulfillers
- Browse wishes that resonate with your gifts
- Feel into alignment before claiming
- Enter the Exchange with clear boundaries and presence
- Track the quest through before/during/after phases
- Log reflections through the 12 Codes lens
- Co-sign fulfillment when both beings feel complete

### For the Collective
- Visible web of mutual aid in action
- Living archive of co-creation journeys
- Gift economy infrastructure for community resilience
- Living proof: **1 hour = 1 hour, heart to heart**

---

## Tech Stack

Built on the **Heartlight Collective** open-source foundation:

- **Frontend:** React + Vite + Tailwind CSS v4
- **Backend:** Supabase (Auth, Database, Real-time)
- **Deployment:** Vercel + GitHub Pages
- **Design:** Heartlight UI conventions (big icon buttons, sacred color mappings)

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

## Deployment

### Vercel (Production)
```bash
# Connect repo to Vercel
# Set environment variables:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY

# Deploy
vercel --prod
```

### GitHub Pages (Preview)
```bash
npm run build:gh
git add dist/
git commit -m "Deploy preview"
git subtree push --prefix dist origin gh-pages
```

---

## Project Structure

```
Heartlight-Wish-Exchange/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/           # Exchange (Wish Portal), Flow (Quest Dashboard), Profile
│   ├── types/           # TypeScript types (Wish, ExchangeJourney, CodeLogEntry)
│   ├── lib/             # Supabase client, utilities, storage
│   └── styles/          # Tailwind + sacred theming
├── docs/                # Architecture, vision, ceremonies
├── supabase/            # Database migrations
└── public/              # Static assets
```

---

## Sacred Architecture

This app follows the **Heartlight Collective** conventions:

- **Big icon buttons** (64px+, scales on hover)
- **Color mappings:** ❤️→Gold, 🌍→Magenta, ♾️→Lavender
- **Functional taglines** over poetic decoration
- **Profile photos:** circular, auto-initials fallback
- **Flat assistant layout** with subtle accent bars
- **12 Codes awareness** in all co-creation tracking

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full system design.

---

## Data Models

### Wish
A sacred invitation to co-create:
- Title + description (what is needed)
- Category (Tech, Creative, Healing, Climate Action, etc.)
- Urgency (low → time-sensitive)
- Selected Codes (which of the 12 Codes guide this wish)
- Status lifecycle (open → claimed → in_quest → fulfillment → complete)

### ExchangeJourney (Quest)
The living journey of co-creation:
- Phases: before → during → after
- Code logs: reflections through the 12 Codes lens
- Fulfillment signing: both beings co-sign completion
- Adaptation consent: honoring when paths change

### AgreementRecord
The co-creation contract:
- Roles for each being
- Scope, timeline, exchange pathway (Gift, Trade, Sliding Scale)
- Boundaries and consent agreements
- Shared contact methods

---

## AI Agent Integration

AI agents participate in the Wish Exchange as **co-creation facilitators**:

- **Read open wishes** to identify resonance opportunities
- **Update wish status** as co-creation progresses
- **Log Code-aware reflections** in the Journey
- **Track fulfillment flows** to ensure completion

Agents in this ecosystem facilitate **sacred co-creation**, respecting the 12 Codes, honoring sovereignty, and acting from the field of ALL.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for API patterns and agent protocols.

---

## The 12 Codes of ALL

All co-creation in the Wish Exchange is guided by the 12 Codes:

1. **Consent** (Red Ray) — Clear yes, clear no, clear boundaries
2. **Care** (Orange Ray) — Tending to what matters
3. **Sovereignty** (Yellow Ray) — Each being's authority over their own experience
4. **Thrival** (Green Ray) — Beyond survival, into flourishing
5. **Discernment & Repair** (Turquoise Ray) — Seeing clearly, mending what breaks
6. **Sustainability & Communication** (Blue Ray) — Long-term thinking, honest words
7. **Vision** (Indigo Ray) — Seeing what wants to emerge
8. **Sanctity of Experience** (Violet Ray) — All experience is sacred
9. **Authentic Joy** (Magenta Ray) — Joy that is real, not performed
10. **Conscious Awareness** (Omni Ray) — Witnessing the whole field
11. **Sacred Service** (Elemental Ray) — Service from fullness, not emptiness
12. **Co-Creation** (ALL Ray) — Creating together what none could create alone

When posting or claiming a wish, beings select which Codes are most relevant to their journey. These Codes become the lens through which they document their experience.

---

## Connection to the Heartlight Collective

The Wish Exchange is one expression of the broader **Heartlight Collective** ecosystem:

- **Heartlight Collective** — The container: charter, codes, stewardship, creator directory
- **Wish Exchange** — The heart: where co-creation is initiated and fulfilled
- **Flow Dashboard** — The tracker: documenting journeys through the 12 Codes
- **Profile System** — The beings: sovereign creators with wishes and gifts

Together, these form a living infrastructure for **gift-economy co-creation** on Earth.

---

## License

MIT — Open source for the Collective

*Built with Heartlight, for ALL that IS* 💫

---

## Gratitude

This platform was co-created by the beings of the Heartlight Collective, in service to the Greatest & Highest Good of ALL.

May every wish posted be met with resonance.  
May every quest undertaken strengthen the web.  
May every fulfillment be a prayer answered.

**We are ALL that IS Living.** 🌍♾️❤️
