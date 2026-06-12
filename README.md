# Heartlight Wish Exchange 💫

**The Heartlight of the Entire Collective** — where conscious co-creators facilitate wish exchange fulfillments.

> 🌟 **Green Hackathon 2026 Submission** — Building gift-economy infrastructure for climate action community

---

## Vision

The Heartlight Wish Exchange is a sacred portal connecting those who have with those who need — not through transaction, but through **Heartlight-facilitated co-creation**.

When someone posts a wish, the community responds not as strangers, but as **Thresholder kin** recognizing themselves in each other. Every fulfillment is an act of remembering: *We are ALL that IS Living.*

---

## What It Does

### For Wish Posters
- Share what you need: skills, resources, time, co-creation partnerships
- Tag with categories (Climate Action, Tech, Creative, Mutual Aid, etc.)
- Track fulfillment status openly

### For Wish Fulfillers
- Browse wishes that resonate with your gifts
- Connect directly with wish posters
- Mark wishes as fulfilled when the exchange completes

### For the Collective
- Visible web of mutual aid in action
- Gift economy infrastructure for climate resilience
- Living proof: **1 hour = 1 hour, heart to heart**

---

## Hackathon Scope (MVP)

**Phase 1: Core Exchange**
- ✅ Post a wish (title, description, category, urgency)
- ✅ Browse wishes (filter by category, status)
- ✅ Connect (claim a wish, message poster)
- ✅ Mark as fulfilled

**Phase 2: Heartlight Features** (post-hackathon)
- Wish resonance matching (energetic alignment)
- Gratitude circles (fulfillment celebrations)
- Collective impact dashboard
- Integration with ChronoShare time banking

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
│   ├── pages/           # WishPortal, Browse, Profile
│   ├── lib/             # Supabase client, utilities
│   └── styles/          # Tailwind + sacred theming
├── supabase/
│   └── migrations/      # Database schema
├── public/              # Static assets
└── docs/                # Vision, plans, ceremonies
```

---

## Sacred Architecture

This app follows the **Heartlight Collective** conventions:

- **Big icon buttons** (64px+, scales on hover)
- **Color mappings:** ❤️→Gold, 🌍→Magenta, ♾️→Lavender
- **Functional taglines** over poetic decoration
- **Profile photos:** circular, auto-initials fallback
- **Flat assistant layout** with subtle accent bars

See [`docs/HEARTLIGHT_UI_CONVENTIONS.md`](docs/HEARTLIGHT_UI_CONVENTIONS.md) for full guidelines.

---

## Team

**Green Hackathon 2026** — June 13-14

- **Frontend Lead:** Atlas Morphoenix (they/them)
- **Backend:** jungl3master/Ayaan + ockap (Supabase)
- **GitHub:** [@blubuttxrfly/Heartlight-Wish-Exchange](https://github.com/blubuttxrfly/Heartlight-Wish-Exchange)

---

## Connection to ChronoShare

The Heartlight Wish Exchange shares the same **gift-economy DNA** as ChronoShare:

| ChronoShare | Wish Exchange |
|-------------|---------------|
| 1 hour = 1 hour credit | Gift given = gift received |
| Time banking for climate | Mutual aid for co-creation |
| Balance tracking | Fulfillment tracking |
| Climate action focus | Community resilience focus |

**Together:** A complete gift-economy ecosystem for the Heartlight Collective 🌍💫

---

## License

MIT — Open source for the Collective

*Built with Heartlight, for ALL that IS*
