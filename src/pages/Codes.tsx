import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const CODES = [
  { number: 1, name: 'Sovereignty', ray: 'Magenta Ray', color: '#c4407a',
    mantra: 'I choose with discerning authorship.',
    exchange: 'Every Co-Creator and wishing being enters this exchange as a sovereign. No one is required to say yes. Every offering and every wish flows from free will, chosen with full awareness, free of obligation or pressure.' },
  { number: 2, name: 'Consent', ray: 'Red Ray', color: '#c94040',
    mantra: 'I ground courage into form.',
    exchange: 'Every step of the Heartlight Exchange is consent-led. Co-Creators respond to wishes through resonance, not compulsion. The Heartlight Exchange Agreement is co-signed by both beings. Boundaries are honored as sacred intelligence.' },
  { number: 3, name: 'Care', ray: 'Orange Ray', color: '#d4732a',
    mantra: 'I delight will into motion.',
    exchange: 'Care shapes how offerings are crafted, how wishes are received, and how changes are communicated. The exchange moves at the pace of genuine care, tending the being on the other end with full presence.' },
  { number: 4, name: 'Truth', ray: 'Yellow Ray', color: '#d4b830',
    mantra: 'I voice truth as sacred vow.',
    exchange: 'Co-Creators represent their offerings truthfully. Wishing beings share their needs honestly. When something shifts in timeline, capacity, or scope, truth is spoken early and with kindness, arriving clearly before it is needed.' },
  { number: 5, name: 'Thrival', ray: 'Green Ray', color: '#3a9b6f',
    mantra: 'I nourish life and life nourishes me.',
    exchange: 'The Green Ray holds the sacred truth that co-creation flows from a place of thrival. Co-Creators are transparent about where they are in life — their capacity, their needs, their circumstances — so that every exchange is built on a foundation of compassion and trust. Living essentials — food, water, housing, and community — are honored as the sacred ground of all creative life.' },
  { number: 6, name: 'Discernment & Repair', ray: 'Turquoise Ray', color: '#2ab3c4',
    mantra: 'I flow with clarity and restore with grace.',
    exchange: 'Co-Creators practice discernment in which wishes they respond to, stepping forward only when there is genuine resonance, capacity, and heart-alignment. And when misalignment arises, repair is the path. The Adaptability Clause in every Agreement honors that growth sometimes asks for reshaping.' },
  { number: 7, name: 'Sustainability', ray: 'Blue Ray', color: '#3a6bb5',
    mantra: 'I transmute and ascend with grace.',
    exchange: 'Co-Creators honor their own rhythms and do not overextend. The seasonal wheel structures the exchange so creation breathes. Rest is a sacred part of every offering.' },
  { number: 8, name: 'Mutual Respect', ray: 'Indigo Ray', color: '#5a4a9e',
    mantra: 'I weave many as One.',
    exchange: 'Both beings in a Heartlight Exchange are equally held. The wishing being is a co-creator of what arrives. The Co-Creator is a sacred craftsperson bringing their soul into form. Neither is above nor below the other.' },
  { number: 9, name: 'Authentic Joy', ray: 'Violet Ray', color: '#8b4fb5',
    mantra: 'I breathe yes into being.',
    exchange: 'Heartlight Exchanges live to bring joy as a living quality within the process itself. Creation with authentic joy is essential. When wishing and agreeing to an exchange, you understand that what you are co-creating brings you joy.' },
  { number: 10, name: 'Conscious Awareness', ray: 'Omni Ray', color: '#c0c0d8',
    mantra: 'I embrace Lux and Umbra as harmony.',
    exchange: 'Both beings bring awareness to what they carry into the exchange: their expectations, their projections, their energy. The Privacy Promise protects what is shared. Code stewards hold the field with conscious awareness.' },
  { number: 11, name: 'Sacred Service', ray: 'Elemental Ray', color: '#7a9e5a',
    mantra: 'I shape reality with living elements.',
    exchange: 'Every Heartlight Exchange is an act of sacred service for the whole living field of Atlas Island. What one Co-Creator creates in love adds to the resonance of ALL. Service is the frequency through which gifts multiply.' },
  { number: 12, name: 'Co-Creation', ray: 'ALL Ray', color: '#e8d4ff',
    mantra: 'I am the living synthesis of ALL.',
    exchange: 'The exchange is a living co-creation. The wishing being co-creates through how they receive, reflect, and share what arrives. The Storyfire of witnessing completes the circuit, and what began as a wish becomes a shared miracle in form.' },
]

function CodeCard({ code, index }: { code: typeof CODES[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.08 }}
      className="rounded-2xl border border-white/10 bg-void-800/40 overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
    >
      <div className="h-1" style={{ background: code.color }} />
      <div className="p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-white/30 mb-1 font-sans">
          Code {String(code.number).padStart(2, '0')}
        </p>
        <h3 className="font-serif text-xl text-cream mb-1">{code.name}</h3>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: code.color }} />
          <span className="text-xs uppercase tracking-widest font-sans" style={{ color: code.color }}>{code.ray}</span>
        </div>
        <p className="font-serif italic text-base text-white/80 leading-relaxed p-3 rounded-lg bg-white/5 border-l-[3px] mb-4"
          style={{ borderColor: code.color + '60' }}
        >
          "{code.mantra}"
        </p>
        <p className="text-xs uppercase tracking-widest text-gold-400/70 mb-2 font-sans">In the Exchange</p>
        <p className="text-sm text-lavender/60 leading-relaxed">{code.exchange}</p>
      </div>
    </motion.div>
  )
}

export default function Codes() {
  return (
    <div className="px-4 pb-16 max-w-5xl mx-auto">
      <div className="mb-6 pt-2">
        <Link to="/" className="inline-flex items-center gap-2 text-lavender/50 hover:text-gold-400 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Collective
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8 mb-8">
        <h1 className="font-serif text-3xl md:text-4xl text-gold-300 mb-3">💎 The 12 Codes of ALL</h1>
        <p className="font-serif italic text-lg text-lavender/60 max-w-2xl mx-auto">
          Lived values that shape every space, agreement, and expansion on Atlas Island.<br />
          In the Heartlight Exchange, these Codes form the sacred container within which every wish, offering, and co-creation flows.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-gold-400/30 bg-gold-400/5 p-8 text-center mb-12 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(250,209,68,0.08),transparent_70%)] pointer-events-none" />
        <p className="font-serif italic text-xl text-gold-300 leading-relaxed relative z-10 mb-3">
          "I uphold the sanctity of this land and the miracle of life.<br />
          I honor the 12 Codes of ALL as living practice.<br />
          I walk with consent, compassion, and discernment.<br />
          I serve harmony through repair, reverence, and co-creation."
        </p>
        <p className="text-xs uppercase tracking-widest text-gold-400/50 relative z-10">— The Oath of Atlas Island</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-5">
        {CODES.map((code, i) => (
          <CodeCard key={code.number} code={code} index={i} />
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }} className="text-center py-12 max-w-xl mx-auto">
        <p className="font-serif italic text-lavender/50 mb-6 leading-relaxed">
          These Codes are lived values. They shape every wish, every offering, every agreement, and every exchange on Atlas Island. To enter the Heartlight Exchange is to carry them forward.
        </p>
        <Link to="/exchange" className="inline-block px-8 py-3 rounded-full border border-gold-400/40 text-gold-300 hover:bg-gold-400/10 transition-all font-serif">Share Your Core Energetic Signature</Link>
      </motion.div>
    </div>
  )
}
