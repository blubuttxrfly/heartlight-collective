import { motion } from 'framer-motion'
import { Heart, Globe, Infinity, TrendingUp, ArrowRight, Sparkles, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

/* ─── Mock Data ─── */
const treasuryStats = {
  totalPooled: 12847.56,
  monthlyInflow: 2340.00,
  activeContributors: 12,
  sovereignSupporters: 7,
  recentTransactions: [
    { id: 1, type: 'inflow' as const, amount: 500.00, from: 'Sovereign Supporter', date: '2026-05-28' },
    { id: 2, type: 'inflow' as const, amount: 250.00, from: 'Heartlight Exchange', date: '2026-05-25' },
    { id: 3, type: 'allocation' as const, amount: 800.00, to: 'Sanctuary Operations', date: '2026-05-20' },
    { id: 4, type: 'inflow' as const, amount: 120.00, from: 'Community Offering', date: '2026-05-18' },
  ],
}

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

/* ─── Sacred Pillars: Globe → Users → Heart → Infinity ─── */
const pillars = [
  {
    icon: Globe,
    title: 'Collective',
    description: 'Resources, grants, scholarships, and opportunity mutual aid collective.',
    href: 'https://opencollective.com/heartlight-collective',
    external: true,
    hue: {
      text: 'text-magenta-400',
      textLight: 'text-magenta-300',
      textDark: 'text-magenta-500',
      border: 'border-magenta-400/30',
      borderHover: 'hover:border-magenta-400/70',
      bg: 'bg-magenta-400/5',
      bgHover: 'hover:bg-magenta-400/10',
      glow: 'group-hover:shadow-magenta-400/15',
    },
  },
  {
    icon: Users,
    title: 'Directory',
    description: 'Discover sovereign beings and their C.E.S. profiles in the collective.',
    href: '/directory',
    hue: {
      text: 'text-heartlight-green',
      textLight: 'text-heartlight-green',
      textDark: 'text-heartlight-green/70',
      border: 'border-heartlight-green/30',
      borderHover: 'hover:border-heartlight-green/70',
      bg: 'bg-heartlight-green/5',
      bgHover: 'hover:bg-heartlight-green/10',
      glow: 'group-hover:shadow-heartlight-green/15',
    },
  },
  {
    icon: Heart,
    title: 'Exchange',
    description: 'The Wish Exchange — where co-creation is initiated. Browse wishes, share gifts, and connect through smart matching.',
    href: '/exchange',
    hue: {
      text: 'text-gold-400',
      textLight: 'text-gold-300',
      textDark: 'text-gold-500',
      border: 'border-gold-400/30',
      borderHover: 'hover:border-gold-400/70',
      bg: 'bg-gold-400/5',
      bgHover: 'hover:bg-gold-400/10',
      glow: 'group-hover:shadow-gold-400/15',
    },
  },
  {
    icon: Infinity,
    title: 'Flow',
    description: 'Personal flow dashboard for aligned exchanges of gifts, resources, and opportunities.',
    href: '/flow',
    hue: {
      text: 'text-lavender',
      textLight: 'text-lavender',
      textDark: 'text-lavender/70',
      border: 'border-lavender/30',
      borderHover: 'hover:border-lavender/70',
      bg: 'bg-lavender/5',
      bgHover: 'hover:bg-lavender/10',
      glow: 'group-hover:shadow-lavender/15',
    },
  },
]

function PillarCard({ pillar, index }: { pillar: typeof pillars[0]; index: number }) {
  const Icon = pillar.icon
  const content = (
    <>
      <Icon
        className={`
          w-16 h-16 mx-auto mb-4 ${pillar.hue.text}
          transition-transform duration-300
          group-hover:scale-110 group-hover:drop-shadow-lg
        `}
        strokeWidth={1.5}
      />
      <h3 className={`font-serif text-2xl md:text-3xl ${pillar.hue.textLight} mb-2`}>{pillar.title}</h3>
      <p className="text-lavender/60 text-sm leading-relaxed flex-1">{pillar.description}</p>
    </>
  )
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 + index * 0.12 }}
      className="h-full"
    >
      {'external' in pillar && pillar.external ? (
        <a
          href={pillar.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`
            group block rounded-2xl border-2 ${pillar.hue.border} ${pillar.hue.borderHover}
            ${pillar.hue.bg} ${pillar.hue.bgHover}
            transition-all duration-300
            p-7 text-center h-full flex flex-col
          `}
        >
          {content}
        </a>
      ) : (
        <Link
          to={pillar.href}
          className={`
            group block rounded-2xl border-2 ${pillar.hue.border} ${pillar.hue.borderHover}
            ${pillar.hue.bg} ${pillar.hue.bgHover}
            transition-all duration-300
            p-7 text-center h-full flex flex-col
          `}
        >
          {content}
        </Link>
      )}
    </motion.div>
  )
}

/* ─── Main Page ─── */
export default function Home() {
  return (
    <div className="px-4 pb-12 max-w-5xl mx-auto">
      {/* Hero Section */}
      <section className="text-center py-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="font-serif text-3xl md:text-5xl text-cream mb-4">
            Welcome to the Heartlight Collective!
          </h2>
          <p className="text-lg text-lavender/80 max-w-3xl mx-auto mb-2">
            Feel free to explore, inquire, and join!
          </p>
          <p className="text-sm text-lavender/60 max-w-2xl mx-auto leading-relaxed">
            The Heartlight Collective is a conscious co-creator community built on mutual aid, aligned exchanges, and living our absolute best dream lives. Sovereign beings here come together to share gifts, offerings, and resources while honoring the Codes of ALL and supporting one another with & for our Greatest & Highest Good. Explore below how our collective co-operates.
          </p>
        </motion.div>
      </section>

      {/* Sacred Pillars — the four main navigation buttons */}
      <section className="mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {pillars.map((pillar, i) => (
            <PillarCard key={pillar.title} pillar={pillar} index={i} />
          ))}
        </div>
      </section>

      {/* 99% Earth-Conscious Dedication — placed after the four main navigation buttons */}
      <section className="text-center py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-green-400/20 bg-green-400/5 p-8"
        >
          <Globe className="w-8 h-8 text-green-400 mx-auto mb-4" />
          <h3 className="font-serif text-2xl text-cream mb-3">Earth-Conscious Dedication</h3>
          <p className="text-lavender/70 max-w-2xl mx-auto mb-6">
            The Heartlight Collective is a unanimous agreement dedication to <span className="text-green-400 font-medium">99% of profits</span> flowing directly back to our Earth, homes, sovereign interdependent communities, and ALL the Living. Through the Heartlight Wish Exchange, funds are directed toward Earth-conscious initiatives, climate action projects, community resilience, and aligned exchanges that serve our Greatest & Highest Good.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
            <div className="rounded-xl border border-green-400/10 bg-void-800/40 p-4">
              <div className="text-3xl mb-2">🌍</div>
              <div className="text-sm text-cream mb-1">Earth Initiatives</div>
              <div className="text-xs text-lavender/50">Climate action, renewable energy, regeneration</div>
            </div>
            <div className="rounded-xl border border-green-400/10 bg-void-800/40 p-4">
              <div className="text-3xl mb-2">🏠</div>
              <div className="text-sm text-cream mb-1">Sovereign Homes</div>
              <div className="text-xs text-lavender/50">Community spaces, housing, mutual aid</div>
            </div>
            <div className="rounded-xl border border-green-400/10 bg-void-800/40 p-4">
              <div className="text-3xl mb-2">♾️</div>
              <div className="text-sm text-cream mb-1">ALL the Living</div>
              <div className="text-xs text-lavender/50">Biodiversity, ecosystems, collective flourishing</div>
            </div>
          </div>
          <div className="text-xs text-lavender/40">
            1% covers operational costs. 99% returns to Earth and community. This is our living agreement.
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://opencollective.com/heartlight-collective"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-green-400/30 text-green-300 hover:bg-green-400/10 transition-all text-sm"
            >
              <Heart className="w-4 h-4" />
              Become a Sovereign Supporter
            </a>
            <a
              href="https://opencollective.com/heartlight-collective"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-lavender/10 text-lavender/60 hover:text-cream hover:border-lavender/30 transition-all text-sm"
            >
              <Globe className="w-4 h-4" />
              View Open Collective →
            </a>
          </div>
        </motion.div>
      </section>

      {/* Treasury Stats */}
      <section className="mb-12">
        <TreasuryCard />
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
          <Link
            to="/charter"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-gold-400/30 text-gold-300 hover:bg-gold-400/10 transition-all"
          >
            Read the Charter <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>
    </div>
  )
}
