import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

/* Data */
const flowSteps = [
  { step: '1. Create Core Energetic Signature', title: 'Join As A Co-Creator',
    body: 'Every being enters through a Core Energetic Signature. Your signature holds your resonance, offerings, exchange pathways, and seasonal capacity inside the Heartlight Exchange.' },
  { step: '2. Enter The Wishing Well', title: 'Cast And Answer Wishes',
    body: 'Wishes are cast through an active Core Energetic Signature. The same Wishing Well lets beings answer wishes, feel resonance, and step forward for the roles they are called to fulfill.' },
  { step: '3. Grant Through Co-Creation', title: 'Weave The Exchange',
    body: 'When resonance is mutual, the co-creation moves into seasonal agreements, shared stewardship, and eventually into a granted wish that the wish-holder marks as fulfilled.' },
]

const seasons = [
  { emoji: '❄️', label: 'Winter Solstice', name: 'Hearth of Wishes',
    body: 'Wishes arrive as letters, voice notes, art, prayers, or story sparks. Early resonance and gentle matching begin here.',
    border: 'border-blue-400/30', text: 'text-blue-300' },
  { emoji: '🌱', label: 'Spring Equinox', name: 'Seed of Co-Creation',
    body: 'Agreements set the scope, exchange, and timeline. Sketches, first drafts, and prototypes begin taking root.',
    border: 'border-emerald-400/30', text: 'text-emerald-300' },
  { emoji: '🌞', label: 'Summer Solstice', name: 'Bloom of Form',
    body: 'Crafting, refining, recording, editing, and shaping bring the offering into embodied form in the world.',
    border: 'border-yellow-400/30', text: 'text-yellow-300' },
  { emoji: '🍂', label: 'Fall Equinox', name: 'Heartlight Harvest',
    body: 'Exchange completes. Gifts deliver, gratitude lands, and the cycle closes through witnessing, celebration, and storyfire.',
    border: 'border-red-400/30', text: 'text-red-300' },
]

const pathways = [
  { icon: '💱', title: 'Currency Fixed Price',
    body: 'A clear, agreed-upon offering in exchange for currency. Both beings know what is being exchanged before co-creation begins, held with transparency and care.' },
  { icon: '🎚️', title: 'Currency Sliding Scale',
    body: 'A range of exchange is offered, honoring that different beings hold different access to currency. The Co-Creator sets the range; the receiver chooses with honesty and resonance.' },
  { icon: '🤝', title: 'Value Exchange Trade or Skill Swap',
    body: 'One offering in return for another. Both beings bring their gifts and agree on the scope of what is exchanged. Energy flows in both directions with joy and equity.' },
  { icon: '🎁', title: 'Gift Exchange',
    body: 'A Co-Creator offers their gift freely from their overflow, as an act of love and sacred service. This is clearly named as gifting — never assumed, always chosen with sovereignty.' },
  { icon: '🌱', title: 'Scholarship Exchange',
    body: 'Community-supported offerings that allow beings to receive who may not have access to other pathways. Scholarships may be offered by Co-Creators or funded through the collective generosity of the Exchange.' },
]

const digitalOfferings = ['Audio blessings','Sigils and sacred art','Guided visualizations','Ritual pages and scripts','Oracle-style messages','Mini courses and teachings','Music and sound healing','Mentorship sessions','Community circles']
const physicalOfferings = ['Handcrafted talismans','Tea blends and apothecary','Charms and sacred objects','Scrolls and printed art','Custom co-created wands, staffs, etc.','Altar objects','Woven and textile crafts']

function SectionTitle({ icon, children }: { icon?: string; children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-xl text-gold-300 mb-4 flex items-center gap-2">
      {icon && <span>{icon}</span>}
      {children}
    </h2>
  )
}

function BodyText({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-lavender/70 leading-relaxed font-sans">{children}</p>
}

export default function Charter() {
  return (
    <div className="px-4 pb-16 max-w-4xl mx-auto">
      <div className="mb-6 pt-2">
        <Link to="/" className="inline-flex items-center gap-2 text-lavender/50 hover:text-gold-400 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Collective
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8 mb-8">
        <h1 className="font-serif text-3xl md:text-4xl text-gold-300 mb-3">📜 Heartlight Exchange Charter</h1>
        <p className="font-serif italic text-lg text-lavender/60 max-w-xl mx-auto">A living vow for Atlas Island's seasonal co-creation economy</p>
      </motion.div>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-12">
        <SectionTitle icon="✦">How The Exchange Flows</SectionTitle>
        <BodyText>Heartlight Exchange moves through a simple living rhythm: beings join through a Core Energetic Signature, cast and answer wishes through the Wishing Well, and then complete co-creations through resonance, agreement, and granting.</BodyText>
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          {flowSteps.map((s, i) => (
            <motion.div key={s.step} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className="rounded-2xl border border-gold-400/15 bg-void-800/40 p-5">
              <p className="text-xs uppercase tracking-widest text-gold-400 mb-2 font-sans">{s.step}</p>
              <h3 className="font-serif text-lg text-cream mb-2">{s.title}</h3>
              <p className="text-sm text-lavender/60 leading-relaxed">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-gold-400/25 bg-gold-400/5 p-8 text-center mb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(250,209,68,0.07),transparent_65%)] pointer-events-none" />
        <p className="font-serif italic text-lg text-gold-300 leading-relaxed relative z-10 max-w-2xl mx-auto">
          Heartlight Exchanges exist to harmonize the Ray frequencies of ALL through intentional co-creation. Beings across Earth and beyond may share wishes, requests, offerings, lessons, art, healing, and sacred skill crafted with care by Atlastizens in a mutual energetic exchange.
        </p>
      </motion.div>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-12">
        <SectionTitle icon="🌍">Seasonal Exchange Thresholds</SectionTitle>
        <p className="font-serif italic text-lavender/60 mb-6 max-w-2xl">The seasonal wheel now lives as one connected threshold map, so each phase touches the next and the co-creation cycle reads as a single living pattern.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {seasons.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className={`rounded-2xl border ${s.border} bg-void-800/40 p-6 relative overflow-hidden hover:shadow-lg transition-all duration-300`}>
              <div className="text-3xl mb-2">{s.emoji}</div>
              <p className={`text-xs uppercase tracking-widest ${s.text} mb-1 font-sans`}>{s.label}</p>
              <h3 className="font-serif text-xl text-cream mb-3">{s.name}</h3>
              <p className="text-sm text-lavender/60 leading-relaxed">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mb-12">
        <SectionTitle icon="🦋">Heartlight Co-Creators</SectionTitle>
        <BodyText>Heartlight Co-Creators are Atlastizens whose occupation is co-creating for ALL through reciprocity. Recipients may select a Co-Creator directly via Core Energetic Signatures, and Co-Creators respond through resonance and capacity for that season.</BodyText>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mb-12">
        <SectionTitle icon="🎁">Exchange Pathways</SectionTitle>
        <BodyText>Every exchange is an act of sacred reciprocity. Heartlight Exchange pathways flow through five forms; choose the one that feels most resonant for each co-creation.</BodyText>
        <div className="grid gap-3 mt-6">
          {pathways.map((p, i) => (
            <motion.div key={p.title} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.08 }} className="flex gap-4 items-start p-4 rounded-xl border border-gold-400/10 bg-void-800/30">
              <span className="text-xl flex-shrink-0 mt-0.5">{p.icon}</span>
              <div>
                <h3 className="font-serif text-base text-cream mb-1">{p.title}</h3>
                <p className="text-sm text-lavender/60 leading-relaxed">{p.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="mb-12">
        <SectionTitle icon="🌐">Offerings That Travel Worldwide</SectionTitle>
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="rounded-2xl border border-magenta-500/15 bg-void-800/30 p-6">
            <p className="text-xs uppercase tracking-widest text-orichalcum mb-4">✨ Digital Gifts</p>
            <ul className="space-y-2">
              {digitalOfferings.map((o) => (
                <li key={o} className="text-sm text-lavender/60 pl-4 relative border-l-2 border-gold-400/20 leading-relaxed">
                  <span className="absolute left-0 top-1.5 text-[0.5rem] text-gold-400 opacity-60">✦</span>
                  {o}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-magenta-500/15 bg-void-800/30 p-6">
            <p className="text-xs uppercase tracking-widest text-orichalcum mb-4">🪄 Physical Gifts</p>
            <ul className="space-y-2">
              {physicalOfferings.map((o) => (
                <li key={o} className="text-sm text-lavender/60 pl-4 relative border-l-2 border-gold-400/20 leading-relaxed">
                  <span className="absolute left-0 top-1.5 text-[0.5rem] text-gold-400 opacity-60">✦</span>
                  {o}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }} className="mb-12">
        <SectionTitle icon="🤍">Accessibility Promise</SectionTitle>
        <BodyText>Offerings may be created in multiple formats whenever it supports the receiver: text, audio, captioned video, sensory-friendly pacing, simplified steps, multiple time-zone windows.</BodyText>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="mb-12">
        <SectionTitle icon="🔒">Privacy Assurance</SectionTitle>
        <BodyText>The Privacy Assurance is sacred to the thrival and harmony of every co-creator in the Heartlight Exchange. Letters, personal stories, and creative details stay held within the sacred container shared by the receiver and their chosen Co-Creator. Consent governs every moment of sharing before, during, and after the exchange.</BodyText>
        <div className="mt-4">
          <Link to="/privacy" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gold-400/30 text-gold-300 hover:bg-gold-400/10 transition-all text-sm">🔒 View Full Privacy Assurance →</Link>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="mb-12">
        <SectionTitle icon="💎">The 12 Codes of ALL</SectionTitle>
        <BodyText>The 12 Codes of ALL are the living values that Atlas Island and the Heartlight Exchange uphold. Each Code is held by a Ray frequency and carries its own mantra of practice.</BodyText>
        <div className="mt-4">
          <Link to="/codes" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gold-400/30 text-gold-300 hover:bg-gold-400/10 transition-all text-sm">💎 View All 12 Codes of ALL →</Link>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }} className="mb-12">
        <SectionTitle icon="✨">Stewardship</SectionTitle>
        <BodyText>A small circle of Stewards holds the directory, Codes, scholarships, seasonal announcements, and gentle conflict resolution through care and clarity.</BodyText>
      </motion.section>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="text-center py-8 max-w-xl mx-auto">
        <p className="font-serif italic text-lavender/50 mb-6 leading-relaxed">Join the Heartlight Exchange to share your Core Energetic Signature. Let's make our dreams and wishes come true!</p>
        <Link to="/exchange" className="inline-block px-8 py-3 rounded-full border border-gold-400/40 text-gold-300 hover:bg-gold-400/10 transition-all font-serif">Create Your Core Energetic Signature</Link>
      </motion.div>
    </div>
  )
}
