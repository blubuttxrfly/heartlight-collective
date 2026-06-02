import { motion } from 'framer-motion'
import { Heart, Globe, Infinity, Users, TrendingUp, ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

/* ─── Mock Data ─── */
const treasuryStats = {
  totalPooled: 12847.56,
  monthlyInflow: 2340.00,
  activeContributors: 12,
  sovereignSupporters: 7,
  recentTransactions: [
    { id: 1, type: 'inflow', amount: 500.00, from: 'Sovereign Supporter', date: '2026-05-28' },
    { id: 2, type: 'inflow', amount: 250.00, from: 'Heartlight Exchange', date: '2026-05-25' },
    { id: 3, type: 'allocation', amount: 800.00, to: 'Sanctuary Operations', date: '2026-05-20' },
    { id: 4, type: 'inflow', amount: 120.00, from: 'Community Offering', date: '2026-05-18' },
  ],
}

const pathways = [
  {
    icon: Sparkles,
    title: 'Sovereign Supporter',
    description: 'Recurring contribution sustaining the Heartlight infrastructure and collective operations.',
    cta: 'Join as Supporter',
    href: '/exchange',
    color: 'gold',
  },
  {
    icon: Users,
    title: 'Co-Creator',
    description: 'Offer skills, time, or resources through the Exchange. Find aligned collaborators.',
    cta: 'Enter the Exchange',
    href: '/exchange',
    color: 'magenta',
  },
  {
    icon: TrendingUp,
    title: 'Resource Steward',
    description: 'Help steward Flow allocations. Review proposals and guide treasury distribution.',
    cta: 'Explore Flow',
    href: '/flow',
    color: 'lavender',
  },
]

/* ─── Components ─── */
function TreasuryCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="rounded-2xl border border-gold-400/20 bg-void-800/50 p-6 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-gold-400" />
        <h2 className="font-serif text-xl text-gold-300">Live Treasury</h2>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">
          Live
        </span>
      </div>

      <div className="mb-6">
        <p className="text-lavender/60 text-sm mb-1">Total Pooled Resources</p>
        <p className="font-serif text-4xl text-gold-shimmer">
          ${treasuryStats.totalPooled.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-2xl font-serif text-magenta-400">${treasuryStats.monthlyInflow.toLocaleString()}</p>
          <p className="text-xs text-lavender/50">Monthly Inflow</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-serif text-gold-400">{treasuryStats.activeContributors}</p>
          <p className="text-xs text-lavender/50">Contributors</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-serif text-lavender">{treasuryStats.sovereignSupporters}</p>
          <p className="text-xs text-lavender/50">Sovereign Supporters</p>
        </div>
      </div>

      <div className="border-t border-gold-400/10 pt-4">
        <p className="text-xs text-lavender/50 mb-3">Recent Activity</p>
        <div className="space-y-2">
          {treasuryStats.recentTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between text-sm">
              <span className="text-lavender/70">
                {tx.type === 'inflow' ? '↑' : '↓'} {tx.from || tx.to}
              </span>
              <span className={tx.type === 'inflow' ? 'text-green-400' : 'text-magenta-400'}>
                {tx.type === 'inflow' ? '+' : '-'}${tx.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function PathwayCard({ pathway, index }: { pathway: typeof pathways[0]; index: number }) {
  const Icon = pathway.icon
  const colorMap = {
    gold: 'border-gold-400/20 hover:border-gold-400/40 bg-gold-400/5',
    magenta: 'border-magenta-500/20 hover:border-magenta-500/40 bg-magenta-500/5',
    lavender: 'border-lavender/20 hover:border-lavender/40 bg-lavender/5',
  }
  const iconColorMap = {
    gold: 'text-gold-400',
    magenta: 'text-magenta-400',
    lavender: 'text-lavender',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
      className={`rounded-2xl border p-6 transition-all duration-300 ${colorMap[pathway.color as keyof typeof colorMap]}`}
    >
      <Icon className={`w-8 h-8 mb-4 ${iconColorMap[pathway.color as keyof typeof iconColorMap]}`} />
      <h3 className="font-serif text-xl text-cream mb-2">{pathway.title}</h3>
      <p className="text-lavender/70 text-sm leading-relaxed mb-4">{pathway.description}</p>
      <Link
        to={pathway.href}
        className="inline-flex items-center gap-2 text-sm font-medium text-gold-400 hover:text-gold-300 transition-colors"
      >
        {pathway.cta}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </motion.div>
  )
}

/* ─── Main Page ─── */
export default function Home() {
  return (
    <div className="px-4 pb-12 max-w-5xl mx-auto">
      {/* Hero Section */}
      <section className="text-center py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex justify-center gap-6 mb-6">
            <Globe className="w-8 h-8 text-magenta-400" />
            <Heart className="w-8 h-8 text-gold-400 fill-gold-400/20" />
            <Infinity className="w-8 h-8 text-lavender" />
          </div>
          <h2 className="font-serif text-3xl md:text-5xl text-cream mb-4">
            Three Pillars of Heartlight
          </h2>
          <p className="text-lavender/70 text-lg max-w-2xl mx-auto leading-relaxed">
            The Heartlight Collective unites resonant beings through Exchange, governance, and Flow. 
            Sovereign Supporters sustain us. Co-creators build with us. Resource Stewards guide us.
          </p>
        </motion.div>
      </section>

      {/* Treasury Stats */}
      <section className="mb-12">
        <TreasuryCard />
      </section>

      {/* Pathways */}
      <section className="mb-12">
        <h3 className="font-serif text-2xl text-cream text-center mb-8">
          How Will You Co-Create?
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {pathways.map((pathway, i) => (
            <PathwayCard key={pathway.title} pathway={pathway} index={i} />
          ))}
        </div>
      </section>

      {/* Charter Teaser */}
      <section className="text-center py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl border border-magenta-500/20 bg-void-800/30 p-8"
        >
          <Sparkles className="w-6 h-6 text-gold-400 mx-auto mb-4" />
          <h3 className="font-serif text-2xl text-cream mb-3">The Heartlight Collective Charter</h3>
          <p className="text-lavender/70 max-w-xl mx-auto mb-6">
            A living vow for Atlas Island's seasonal co-creation economy. 
            Grounded in sacred reciprocity, radical transparency, and the Heartlight of ALL that IS.
          </p>
          <button
            className="px-6 py-3 rounded-full border border-gold-400/30 text-gold-300 hover:bg-gold-400/10 transition-all"
            onClick={() => alert('Full Charter coming in Phase 2 — governance, agreements, and seasonal cycles.')}
          >
            Read the Charter 📜
          </button>
        </motion.div>
      </section>
    </div>
  )
}
