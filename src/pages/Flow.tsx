import { motion } from 'framer-motion'
import { ArrowLeft, Infinity, TrendingUp, PieChart, ArrowRight, Users, Wallet, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

/* ─── Mock Dashboard Data ─── */
const flowStats = {
  personalBalance: 2840.00,
  allocatedThisMonth: 450.00,
  pendingProposals: 3,
  approvedAllTime: 12,
}

const allocations = [
  { id: 1, name: 'Sanctuary Operations', amount: 1200, percentage: 35, status: 'active' },
  { id: 2, name: 'Co-Creator Stipends', amount: 800, percentage: 23, status: 'active' },
  { id: 3, name: 'Seasonal Gatherings', amount: 600, percentage: 18, status: 'review' },
  { id: 4, name: 'Infrastructure', amount: 500, percentage: 15, status: 'active' },
  { id: 5, name: 'Reserve', amount: 400, percentage: 9, status: 'locked' },
]

const recentFlows = [
  { id: 1, type: 'inflow', source: 'Sovereign Supporter', amount: 500, date: '2026-05-28' },
  { id: 2, type: 'allocation', target: 'Sanctuary Operations', amount: 300, date: '2026-05-25' },
  { id: 3, type: 'inflow', source: 'Exchange Revenue', amount: 250, date: '2026-05-22' },
]

export default function Flow() {
  return (
    <div className="px-4 pb-12 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-lavender/60 hover:text-gold-400 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Collective
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8">
        <Infinity className="w-10 h-10 text-lavender mx-auto mb-4" />
        <h1 className="font-serif text-3xl md:text-4xl text-cream mb-3">Heartlight Flow</h1>
        <p className="text-lavender/70 max-w-xl mx-auto">
          Resource flow coordination for the Heartlight Collective. 
          Mockup dashboard — live Actual Budget integration coming in Phase 4.
        </p>
      </motion.div>

      {/* Personal Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Wallet, label: 'Your Balance', value: `$${flowStats.personalBalance.toLocaleString()}`, color: 'text-gold-400' },
          { icon: Zap, label: 'Allocated This Month', value: `$${flowStats.allocatedThisMonth}`, color: 'text-magenta-400' },
          { icon: Users, label: 'Pending Proposals', value: flowStats.pendingProposals.toString(), color: 'text-lavender' },
          { icon: TrendingUp, label: 'Approved All-Time', value: flowStats.approvedAllTime.toString(), color: 'text-green-400' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-lavender/10 bg-void-800/40 p-4 text-center"
            >
              <Icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
              <p className={`text-xl font-serif ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-lavender/50">{stat.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Allocations Breakdown */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border border-lavender/10 bg-void-800/40 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-lavender" />
            <h2 className="font-serif text-lg text-cream">Allocation Breakdown</h2>
          </div>
          <div className="space-y-3">
            {allocations.map((alloc) => (
              <div key={alloc.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-lavender/70">{alloc.name}</span>
                  <span className="text-cream">${alloc.amount} ({alloc.percentage}%)</span>
                </div>
                <div className="h-2 rounded-full bg-void-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      alloc.status === 'active' ? 'bg-magenta-500' :
                      alloc.status === 'review' ? 'bg-gold-400' :
                      'bg-void-500'
                    }`}
                    style={{ width: `${alloc.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border border-lavender/10 bg-void-800/40 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-gold-400" />
            <h2 className="font-serif text-lg text-cream">Recent Flow</h2>
          </div>
          <div className="space-y-3">
            {recentFlows.map((flow) => (
              <div key={flow.id} className="flex items-center justify-between py-2 border-b border-lavender/5">
                <div>
                  <p className="text-sm text-lavender/70">
                    {flow.type === 'inflow' ? '↑ ' : '↓ '}
                    {flow.source || flow.target}
                  </p>
                  <p className="text-xs text-lavender/30">{flow.date}</p>
                </div>
                <span className={flow.type === 'inflow' ? 'text-green-400' : 'text-magenta-400'}>
                  {flow.type === 'inflow' ? '+' : '-'}${flow.amount}
                </span>
              </div>
            ))}
          </div>
          <button
            className="mt-4 w-full py-2.5 rounded-full border border-gold-400/20 text-gold-400 hover:bg-gold-400/10 transition-all text-sm"
            onClick={() => alert('Full proposal and allocation history coming in Phase 4.')}
          >
            View All Flow History
          </button>
        </motion.div>
      </div>

      {/* Action CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center">
        <button
          className="px-8 py-3 rounded-full bg-magenta-500/20 border border-magenta-500/30 text-magenta-300 hover:bg-magenta-500/30 transition-all inline-flex items-center gap-2"
          onClick={() => alert('Proposal submission form coming in Phase 3. This mockup demonstrates the Flow interface.')}
        >
          Submit a Flow Proposal
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  )
}
