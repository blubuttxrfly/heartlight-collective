import { motion } from 'framer-motion'
import { Heart, Globe, Infinity, Users, TrendingUp, ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStorage } from '../lib/storage'

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
    cta: 'Create Your Profile',
    href: '/create-profile',
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

/* ─── Profile Status Banner ─── */
function ProfileStatusBanner() {
  const { getPending, getApproved, getReturned } = useStorage();

  // Find user's profile in any queue
  const queues = [
    { list: getPending(), label: 'pending' as const },
    { list: getApproved(), label: 'approved' as const },
    { list: getReturned(), label: 'returned' as const },
  ];

  const myQueue = queues.find((q) => q.list.length > 0);
  if (!myQueue) return null;

  const profile = myQueue.list[0];
  const queue = myQueue.label;

  const config = {
    pending: {
      border: 'border-gold-400/20',
      bg: 'bg-gold-400/5',
      text: 'text-gold-300',
      subtext: 'text-lavender/50',
      title: 'Profile Awaiting Review',
      message: `Your profile (C.E.S. ${profile.cesNumber}) is in the pending queue. A Steward will review it for alignment with the 12 Codes of ALL.`,
      icon: '🌱',
    },
    approved: {
      border: 'border-green-400/20',
      bg: 'bg-green-400/5',
      text: 'text-green-300',
      subtext: 'text-lavender/50',
      title: 'Profile Live',
      message: `Your profile is now visible in the Exchange! C.E.S. ${profile.cesNumber}`,
      icon: '✦',
    },
    returned: {
      border: 'border-orange-400/20',
      bg: 'bg-orange-400/5',
      text: 'text-orange-300',
      subtext: 'text-lavender/50',
      title: 'Profile Returned',
      message: `Your profile was returned for revision. Sign in to update and resubmit. C.E.S. ${profile.cesNumber}`,
      icon: '🍂',
    },
  };

  const c = config[queue];

  return (
    <section className="mb-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border ${c.border} ${c.bg} p-4`}
      >
        <div className="flex items-start gap-3">
          <span className="text-xl">{c.icon}</span>
          <div>
            <p className={`text-sm font-medium ${c.text}`}>{c.title}</p>
            <p className={`text-xs ${c.subtext} mt-1`}>{c.message}</p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ─── Live Directory Preview ─── */
function LiveDirectorySection() {
  const { getApproved } = useStorage();
  const approved = getApproved();

  if (approved.length === 0) return null;

  return (
    <section className="mb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-serif text-2xl text-cream">Resonant Beings in the Field</h3>
            <p className="text-sm text-lavender/50">{approved.length} {approved.length === 1 ? 'being' : 'beings'} ready for exchange</p>
          </div>
          <Link
            to="/exchange"
            className="px-4 py-2 rounded-full border border-magenta-500/20 text-magenta-300 text-sm hover:bg-magenta-500/10 transition-all"
          >
            Enter Exchange <ArrowRight className="w-4 h-4 inline" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {approved.slice(0, 6).map((profile) => (
            <Link
              key={profile.id}
              to="/exchange"
              className="rounded-xl border border-lavender/10 bg-void-800/40 p-4 hover:border-lavender/20 transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-void-900 border border-lavender/10 flex items-center justify-center text-lg">
                  {profile.emoji || '✦'}
                </div>
                <div>
                  <div className="text-cream text-sm font-medium">{profile.name}</div>
                  {profile.title && <div className="text-xs text-lavender/50">{profile.title}</div>}
                </div>
              </div>
              <p className="text-xs text-lavender/60 line-clamp-2">{profile.heartlight}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {profile.offerings.slice(0, 3).map((o) => (
                  <span key={o} className="px-2 py-0.5 rounded-full bg-void-900/60 border border-lavender/10 text-lavender/50 text-xs">
                    {o}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>

        {approved.length > 6 && (
          <p className="text-center mt-4 text-sm text-lavender/40">
            +{approved.length - 6} more in the Exchange →
          </p>
        )}
      </motion.div>
    </section>
  );
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

      <ProfileStatusBanner />

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

      <LiveDirectorySection />

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
