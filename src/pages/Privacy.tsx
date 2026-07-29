import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Lock,
  EyeOff,
  Shield,
  Sparkles,
  Target,
  Share2,
  KeyRound,
  RefreshCw,
  Leaf,
  ShieldCheck,
  Heart,
  ArrowRight,
} from 'lucide-react'

const phases = [
  {
    icon: EyeOff,
    label: 'Before the Exchange',
    title: 'Consent Opens the Door',
    body: 'A wish or gift enters the Heartlight Exchange as a sacred letter. Its contents are held with reverence and shared only with Co-Creators who feel genuine resonance. A Co-Creator reads a wish through the lens of care, and any response they offer is an act of consent, not obligation. No being\'s story is shared beyond the portal without their explicit agreement.',
    color: '#3a9b6f',
    pillars: [
      { name: 'Data Minimization', desc: 'Only what supports care, safety, and the exchange is gathered. Nothing more.' },
      { name: 'Transparent Purpose', desc: 'Both beings understand clearly why information is shared and how it will be held.' },
      { name: 'Consent-Forward Entry', desc: 'Information flows through permission and clarity from the very first moment.' },
    ],
  },
  {
    icon: Shield,
    label: 'During the Exchange',
    title: 'The Sacred Container Holds',
    body: 'Once a Heartlight Exchange Agreement is signed, the exchange lives inside a sacred container shared only by the beings in the agreement. Personal stories, wishes, creative details, and the shape of what is being made remain within that container. Neither being shares the work in progress, the personal content of the wish, nor the nature of the exchange without the other\'s explicit consent.',
    color: '#d4b830',
    pillars: [
      { name: 'Sacred Container', desc: 'What is shared within the exchange stays within the exchange unless both beings agree otherwise.' },
      { name: 'Agreement Boundaries', desc: 'The Exchange Agreement names what may be shared and protects what may not.' },
      { name: 'Protective Stewardship', desc: 'Secure handling, limited access, and respectful retention of all creative and personal material.' },
    ],
  },
  {
    icon: Sparkles,
    label: 'After the Exchange',
    title: 'Witnessing With Permission',
    body: 'When the co-creation completes, the Storyfire of witnessing invites both beings to celebrate what was made together. Sharing the completed creation beyond the exchange happens only with the full and joyful consent of every being involved. A Co-Creator does not share, publish, or exhibit the creation without agreement.',
    color: '#c94040',
    pillars: [
      { name: 'Storyfire Consent', desc: 'Witnessing and celebration are invitations, always chosen freely.' },
      { name: 'Portfolio Agreement', desc: 'A Co-Creator includes the work in their portfolio only with explicit permission.' },
      { name: 'Sovereign Story', desc: 'Every being holds sovereignty over their story and how it is shared in the world.' },
    ],
  },
]

const boundaries = [
  {
    icon: Target,
    title: 'Scope Boundary',
    body: 'The Agreement names exactly what is being created. Anything beyond that scope requires a new consent conversation before it comes into being.',
  },
  {
    icon: Share2,
    title: 'Sharing Boundary',
    body: 'The Agreement specifies what may be shared publicly, what stays private, and what requires a new conversation before any sharing occurs.',
  },
  {
    icon: KeyRound,
    title: 'Access Boundary',
    body: 'Personal stories, wish letters, and creative communications shared within the exchange are accessible only to the beings in the agreement and, when needed, a consented Code Steward.',
  },
  {
    icon: RefreshCw,
    title: 'Adaptability Boundary',
    body: 'If either being wishes to adjust a boundary during the exchange, they bring it forward openly. Boundaries may grow and evolve through mutual resonance and clear communication.',
  },
  {
    icon: Leaf,
    title: 'Energetic Ethics',
    body: 'Technology within the Heartlight Collective serves life, community, and healing. The exchange platform holds all data in alignment with this principle. No creative work, personal information, or wish content is used for any purpose beyond the sacred container of the exchange itself.',
  },
]

export default function Privacy() {
  return (
    <div className="px-4 pb-16 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8 mb-8">
        <h1 className="font-serif text-3xl md:text-4xl text-gold-300 mb-3 flex items-center justify-center gap-3">
          Privacy Assurance
          <Lock className="w-8 h-8" />
        </h1>
        <p className="font-serif italic text-lg text-lavender/60 max-w-xl mx-auto">
          Sacred boundaries for every co-creation in the Heartlight Exchange
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="rounded-xl border border-gold-400/25 bg-gold-400/5 p-6 text-center mb-12"
      >
        <p className="font-serif italic text-base text-gold-300/80 leading-relaxed">
          The Heartlight Collective treats privacy as dignity and sovereignty. In the Wish & Gift Exchange, what is shared in love is protected in love, and what is created in trust remains in trust until both beings choose how it lives in the world.
        </p>
      </motion.div>

      <div className="grid gap-8 mb-12">
        {phases.map((phase, i) => (
          <motion.div
            key={phase.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.15 }}
            className="rounded-2xl border border-white/10 bg-void-800/40 overflow-hidden"
          >
            <div className="h-1" style={{ background: `linear-gradient(90deg, ${phase.color}, ${phase.color}88, transparent)` }} />
            <div className="p-8">
              <div className="flex items-center gap-3 mb-3">
                <phase.icon className="w-6 h-6" style={{ color: phase.color }} />
                <div>
                  <h2 className="font-serif text-xl text-gold-300 mb-0.5">{phase.label}</h2>
                  <p className="text-xs uppercase tracking-widest text-white/50 font-sans">{phase.title}</p>
                </div>
              </div>
              <p className="text-sm text-lavender/60 leading-relaxed mb-6">{phase.body}</p>

              <div className="grid md:grid-cols-3 gap-4">
                {phase.pillars.map((pillar) => (
                  <div key={pillar.name} className="p-4 rounded-lg border border-white/8 bg-white/3">
                    <h3 className="font-sans text-sm font-bold text-cream mb-2 uppercase tracking-wider">{pillar.name}</h3>
                    <p className="font-serif italic text-sm text-lavender/70 leading-relaxed">{pillar.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mb-12">
        <h2 className="font-serif text-xl text-gold-300 mb-4 flex items-center gap-2">
          Boundaries of the Exchange Agreement
          <ShieldCheck className="w-5 h-5" />
        </h2>
        <p className="text-sm text-lavender/60 leading-relaxed mb-6">
          The Exchange Agreement is the living boundary holder of the exchange. Within it, both beings name what is protected, what may flow outward, and how the creative work lives in the world once it is complete.
        </p>
        <div className="grid gap-3">
          {boundaries.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + i * 0.08 }}
              className="flex gap-4 items-start p-4 rounded-xl border border-gold-400/10 bg-void-800/30"
            >
              <b.icon className="w-5 h-5 flex-shrink-0 mt-0.5 text-gold-400" />
              <div>
                <h3 className="font-serif text-base text-cream mb-1">{b.title}</h3>
                <p className="text-sm text-lavender/60 leading-relaxed">{b.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="rounded-xl border border-magenta-500/20 bg-magenta-500/5 p-6 mb-12 flex gap-4 items-start"
      >
        <ShieldCheck className="w-6 h-6 flex-shrink-0 text-magenta-400" />
        <div>
          <h3 className="font-sans text-sm font-bold text-cream mb-2">A Note on Code Stewards</h3>
          <p className="text-sm text-lavender/60 leading-relaxed">
            Code Stewards hold the field with conscious awareness. In matters of privacy, a Code Steward may be invited into a situation only with the consent of the beings in the exchange. Their role is to support clarity, hold space for repair, and uphold the boundaries of the Agreement. They carry what is shared with them in full reverence and do not carry it beyond the resolution of the situation.
          </p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }} className="text-center py-8 max-w-xl mx-auto">
        <p className="font-serif italic text-lavender/50 mb-6 leading-relaxed">
          The Heartlight Collective treats privacy as dignity and sovereignty. In the Wish & Gift Exchange, what is shared in love is protected in love, and what is created in trust remains in trust until both beings choose how it lives in the world.
        </p>
        <Link to="/exchange" className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-gold-400/40 text-gold-300 hover:bg-gold-400/10 transition-all font-serif">
          Enter the Wish & Gift Exchange
          <Heart className="w-4 h-4" />
        </Link>
      </motion.div>
    </div>
  )
}
