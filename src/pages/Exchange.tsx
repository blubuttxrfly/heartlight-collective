import { motion } from 'framer-motion'
import { ArrowLeft, Search, Filter, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

/* ─── Mock Data ─── */
const offerings = [
  { id: 1, name: 'Web Development', creator: 'Atlas Morphoenix', category: 'Tech', exchange: 'Reciprocal', status: 'open' },
  { id: 2, name: 'Astrology Readings', creator: 'Star Weaver', category: 'Spiritual', exchange: 'Sliding Scale', status: 'open' },
  { id: 3, name: 'Community Facilitation', creator: 'Heart Holder', category: 'Governance', exchange: 'Collective Fund', status: 'open' },
  { id: 4, name: 'Visual Design', creator: 'Color Keeper', category: 'Creative', exchange: 'Barter', status: 'open' },
  { id: 5, name: 'Sound Healing', creator: 'Tone Weaver', category: 'Wellness', exchange: 'Gift', status: 'open' },
]

export default function Exchange() {
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
        <Sparkles className="w-10 h-10 text-magenta-400 mx-auto mb-4" />
        <h1 className="font-serif text-3xl md:text-4xl text-cream mb-3">Heartlight Exchange</h1>
        <p className="text-lavender/70 max-w-xl mx-auto">
          Where resonant beings find each other across the Heartlines. 
          Browse offerings, cast wishes, and co-create in sacred reciprocity.
        </p>
      </motion.div>

      {/* Search + Filter Bar */}
      <div className="flex gap-3 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lavender/40" />
          <input
            type="text"
            placeholder="Search offerings..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none transition-colors"
            onClick={() => alert('Full search coming in Phase 2 with live directory data.')}
          />
        </div>
        <button
          className="px-4 py-2.5 rounded-full border border-lavender/10 text-lavender/60 hover:text-lavender flex items-center gap-2"
          onClick={() => alert('Filter panel coming in Phase 2.')}
        >
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Offerings Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offerings.map((offering, i) => (
          <motion.div
            key={offering.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl border border-magenta-500/15 bg-void-800/40 p-5 hover:border-magenta-500/30 transition-all cursor-pointer"
            onClick={() => alert(`Full offering detail view coming in Phase 2 for: ${offering.name}`)}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="px-2 py-1 rounded-full bg-magenta-500/10 text-magenta-400 text-xs">
                {offering.category}
              </span>
              <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">
                {offering.status}
              </span>
            </div>
            <h3 className="font-serif text-lg text-cream mb-1">{offering.name}</h3>
            <p className="text-lavender/50 text-sm mb-3">by {offering.creator}</p>
            <div className="flex items-center justify-between">
              <span className="text-gold-400 text-sm">{offering.exchange}</span>
              <span className="text-lavender/30 text-xs">♥ Exchange</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
