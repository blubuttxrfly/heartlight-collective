import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Sparkles, Heart, MapPin, Clock, ChevronRight, X, ArrowLeft, Plus, Tag, Wand2 } from 'lucide-react'
import { Link } from 'react-router-dom'

/* ─── Mock Wishes (initial data) ─── */
const INITIAL_WISHES = [
  {
    id: 'wish_001',
    type: 'wish',
    title: 'Help building a React + Supabase dashboard for climate action',
    description: 'I need frontend support for building a real-time climate action dashboard that tracks community carbon offset contributions. Using React, Tailwind, and Supabase real-time subscriptions.',
    category: 'Tech & Development',
    skills: ['react', 'supabase', 'tailwind', 'typescript'],
    resources: ['Time', 'Skills'],
    roles: ['co-creator', 'learner'],
    urgency: 'medium',
    location: 'Remote / Anywhere',
    exchangeAvenue: 'direct',
    fundsRequired: 0,
    timeCommitment: '5-10 hours over 2 weeks',
    selectedCodes: [1, 3, 6, 12],
    status: 'open',
    postedByCes: 'local_being_01',
    postedByName: 'Gaia Weaver',
    createdAt: '2026-06-12T10:00:00Z',
  },
  {
    id: 'wish_002',
    type: 'offer',
    title: 'I offer free astrology readings for Heartlight Collective members',
    description: 'I practice evolutionary astrology focused on soul purpose and current transits. Happy to offer readings for beings in the Collective who are navigating transitions or seeking clarity.',
    category: 'Astrology & Guidance',
    skills: ['astrology', 'counseling', 'evolutionary astrology'],
    resources: ['Time', 'Skills'],
    roles: ['teacher', 'guide'],
    urgency: 'low',
    location: 'Remote / Zoom',
    exchangeAvenue: 'direct',
    fundsAvailable: 0,
    timeCommitment: '90-minute sessions',
    selectedCodes: [1, 3, 9, 12],
    status: 'open',
    postedByCes: 'local_being_02',
    postedByName: 'Cosmic Bloom',
    createdAt: '2026-06-12T12:00:00Z',
  },
  {
    id: 'wish_003',
    type: 'wish',
    title: 'Seeking $500 for solar panel installation on community center',
    description: 'We are installing solar panels on the Atlas Island community center to reduce our carbon footprint and model renewable energy for the Collective. Need $500 for final hardware costs.',
    category: 'Climate Action',
    skills: [],
    resources: ['Funds'],
    roles: ['co-creator'],
    urgency: 'high',
    location: 'Burlington, VT',
    exchangeAvenue: 'collective',
    fundsRequired: 50000,
    timeCommitment: 'One-time support',
    selectedCodes: [4, 6, 11, 12],
    status: 'open',
    postedByCes: 'local_being_03',
    postedByName: 'Sol Guardian',
    createdAt: '2026-06-12T14:00:00Z',
  },
  {
    id: 'wish_004',
    type: 'offer',
    title: 'Graphic design support for climate activist campaigns',
    description: 'Professional graphic designer with 8 years experience. I offer pro-bono design for climate action campaigns: posters, social media, presentations. Passionate about visual storytelling for the movement.',
    category: 'Creative & Design',
    skills: ['graphic design', 'branding', 'social media', 'illustration'],
    resources: ['Time', 'Skills', 'Equipment'],
    roles: ['co-creator', 'teacher'],
    urgency: 'low',
    location: 'Remote / Anywhere',
    exchangeAvenue: 'direct',
    fundsAvailable: 0,
    timeCommitment: '2-5 hours per project',
    selectedCodes: [2, 5, 7, 12],
    status: 'open',
    postedByCes: 'local_being_04',
    postedByName: 'Vision Seed',
    createdAt: '2026-06-12T16:00:00Z',
  },
]

/* ─── Helper: load wishes from localStorage ─── */
function loadWishes() {
  const stored = JSON.parse(localStorage.getItem('hlw_wishes') || '[]')
  return [...INITIAL_WISHES, ...stored]
}

const CATEGORY_EMOJIS = {
  'Tech & Development': '💻',
  'Creative & Design': '🎨',
  'Writing & Content': '✍️',
  'Healing & Wellness': '🌿',
  'Astrology & Guidance': '⭐',
  'Music & Sound': '🎵',
  'Events & Facilitation': '🎭',
  'Mutual Aid': '🤝',
  'Climate Action': '🌍',
  'Co-Creation Partnership': '♾️',
  'Resources': '📦',
  'Funds': '💰',
  'Space & Place': '🏠',
  'Other': '✨'
}

const URGENCY_CONFIG = {
  'low': { color: 'text-green-400', bg: 'bg-green-400/10', label: 'Gentle' },
  'medium': { color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Steady' },
  'high': { color: 'text-magenta-400', bg: 'bg-magenta-400/10', label: 'Urgent' },
  'time-sensitive': { color: 'text-red-400', bg: 'bg-red-400/10', label: 'Time Sensitive' }
}

/* ─── Exchange Portal ─── */
export default function Exchange() {
  const [wishes, setWishes] = useState(loadWishes)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedWish, setSelectedWish] = useState(null)

  const categories = useMemo(() => {
    const cats = new Set(wishes.map(w => w.category))
    return Array.from(cats)
  }, [wishes])

  const filtered = useMemo(() => {
    let list = [...wishes]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(w =>
        w.title.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        w.skills.some(s => s.toLowerCase().includes(q)) ||
        w.category.toLowerCase().includes(q) ||
        w.postedByName.toLowerCase().includes(q)
      )
    }

    if (selectedCategory) {
      list = list.filter(w => w.category === selectedCategory)
    }

    // Sort: urgent first, then by recency
    const urgencyOrder = { 'time-sensitive': 0, 'high': 1, 'medium': 2, 'low': 3 }
    list.sort((a, b) => {
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
      if (urgencyDiff !== 0) return urgencyDiff
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return list
  }, [wishes, search, selectedCategory])

  const wishCount = wishes.filter(w => w.type === 'wish').length
  const offerCount = wishes.filter(w => w.type === 'offer').length

  return (
    <div className="px-4 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-lavender/60 hover:text-gold-400 transition-colors text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Collective
        </Link>

        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-magenta-500/10 border border-magenta-400/20 flex items-center justify-center mx-auto mb-4">
            <Wand2 className="w-8 h-8 text-magenta-400" />
          </div>
          <h1 className="font-serif text-3xl text-cream mb-2">The Exchange Portal</h1>
          <p className="text-lavender/50 max-w-lg mx-auto">
            Where co-creation is initiated. Browse wishes and gifts that resonate with you. 
            Feel into alignment before claiming.
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-center gap-6 mb-8 text-xs text-lavender/40">
        <span><Heart className="w-3 h-3 inline mr-1 text-magenta-400" />{wishCount} wishes</span>
        <span><Sparkles className="w-3 h-3 inline mr-1 text-gold-400" />{offerCount} gifts</span>
        <span><Tag className="w-3 h-3 inline mr-1 text-lavender/50" />{categories.length} categories</span>
      </div>

      {/* Post CTA */}
      <div className="flex gap-3 mb-8 justify-center">
        <Link
          to="/post-wish"
          className="px-6 py-3 rounded-full bg-magenta-400/10 border border-magenta-400/30 text-magenta-300 hover:bg-magenta-400/20 transition-all inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Post a Wish
        </Link>
        <Link
          to="/post-wish"
          className="px-6 py-3 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" /> Share a Gift
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lavender/40" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, skill, category, or being..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-full border text-xs transition-all ${
              !selectedCategory
                ? 'bg-magenta-400/10 border-magenta-400/30 text-magenta-300'
                : 'border-lavender/10 text-lavender/50 hover:border-lavender/30'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
              className={`px-3 py-1.5 rounded-full border text-xs transition-all ${
                selectedCategory === cat
                  ? 'bg-magenta-400/10 border-magenta-400/30 text-magenta-300'
                  : 'border-lavender/10 text-lavender/50 hover:border-lavender/30'
              }`}
            >
              {CATEGORY_EMOJIS[cat] || '✨'} {cat}
            </button>
          ))}
        </div>

        <p className="text-xs text-lavender/40">
          {filtered.length} {filtered.length === 1 ? 'being' : 'beings'} in the exchange field
        </p>
      </div>

      {/* Wishes Grid */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Sparkles className="w-12 h-12 text-lavender/30 mx-auto mb-4" />
          <h2 className="font-serif text-2xl text-cream mb-3">The Field Awaits</h2>
          <p className="text-lavender/60 mb-6">
            No beings match your search yet. You can be the first to plant your heartlight here.
          </p>
          <Link
            to="/post-wish"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all"
          >
            Post Your Wish <Plus className="w-4 h-4" />
          </Link>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((wish, i) => (
            <motion.div
              key={wish.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-2xl border p-5 hover:border-magenta-500/30 transition-all cursor-pointer ${
                wish.type === 'wish'
                  ? 'border-magenta-500/15 bg-void-800/40'
                  : 'border-gold-400/15 bg-void-800/30'
              }`}
              onClick={() => setSelectedWish(wish)}
            >
              {/* Type badge + Urgency */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    wish.type === 'wish'
                      ? 'bg-magenta-500/10 text-magenta-400'
                      : 'bg-gold-400/10 text-gold-300'
                  }`}>
                    {wish.type === 'wish' ? '💫 Wish' : '🎁 Gift'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${URGENCY_CONFIG[wish.urgency].bg} ${URGENCY_CONFIG[wish.urgency].color}`}>
                    <Clock className="w-2.5 h-2.5 inline mr-1" />
                    {URGENCY_CONFIG[wish.urgency].label}
                  </span>
                </div>
                <span className="text-xs text-lavender/30">
                  {CATEGORY_EMOJIS[wish.category]}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-serif text-lg text-cream mb-2 line-clamp-2">{wish.title}</h3>

              {/* Description */}
              <p className="text-lavender/60 text-sm mb-3 line-clamp-2">
                {wish.description}
              </p>

              {/* Skills */}
              {wish.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {wish.skills.slice(0, 4).map(skill => (
                    <span key={skill} className="px-2 py-0.5 rounded-full bg-void-900 border border-lavender/10 text-lavender/50 text-xs">
                      {skill}
                    </span>
                  ))}
                  {wish.skills.length > 4 && (
                    <span className="text-lavender/30 text-xs">+{wish.skills.length - 4}</span>
                  )}
                </div>
              )}

              {/* Meta */}
              <div className="flex items-center justify-between pt-3 border-t border-lavender/5">
                <div className="flex items-center gap-3 text-xs text-lavender/40">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {wish.location}
                  </span>
                  {wish.fundsRequired > 0 && (
                    <span className="text-magenta-400">
                      💰 ${(wish.fundsRequired / 100).toFixed(2)} needed
                    </span>
                  )}
                  {wish.fundsAvailable > 0 && (
                    <span className="text-gold-400">
                      💰 ${(wish.fundsAvailable / 100).toFixed(2)} available
                    </span>
                  )}
                </div>
                <span className="text-gold-400 text-xs flex items-center gap-1">
                  View <ChevronRight className="w-3 h-3" />
                </span>
              </div>

              {/* Being name */}
              <div className="mt-2 text-xs text-lavender/30">
                Posted by {wish.postedByName}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Wish Detail Modal */}
      {/* Wish Detail Modal */}
      <AnimatePresence>
        {selectedWish && (
          <WishDetailModal
            wish={selectedWish}
            onClose={() => setSelectedWish(null)}
            onClaim={() => {
              const stored = JSON.parse(localStorage.getItem('hlw_wishes') || '[]')
              const idx = stored.findIndex(w => w.id === selectedWish.id)
              if (idx >= 0) {
                stored[idx].status = 'claimed'
                stored[idx].claimedByCes = 'current_user'
                stored[idx].claimedByName = 'You'
                stored[idx].claimedAt = new Date().toISOString()
                localStorage.setItem('hlw_wishes', JSON.stringify(stored))
                setWishes(loadWishes())
              }
              setSelectedWish(null)
            }}
          />
        )}
      </AnimatePresence>

      {/* 99% Earth-Conscious Dedication */}
      <div className="mt-16 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-green-400/20 bg-green-400/5 p-8"
        >
          <div className="text-4xl mb-4">🌍</div>
          <h3 className="font-serif text-xl text-cream mb-3">99% Flows Back to Earth</h3>
          <p className="text-lavender/60 max-w-xl mx-auto mb-4 text-sm">
            The Heartlight Collective is dedicated to directing 99% of all profits back to 
            Earth-conscious initiatives, climate action, sovereign communities, and ALL the Living. 
            1% covers operational costs. This is our unanimous living agreement.
          </p>
          <div className="flex gap-4 justify-center text-xs text-lavender/40">
            <span>🌍 Earth Initiatives</span>
            <span>🏠 Sovereign Homes</span>
            <span>♾️ ALL the Living</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

/* ─── Wish Detail Modal ─── */
function WishDetailModal({ wish, onClose, onClaim }) {
  const u = URGENCY_CONFIG[wish.urgency]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-gold-400/20 bg-void-900/95 p-6 shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-lavender/40 hover:text-cream transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              wish.type === 'wish'
                ? 'bg-magenta-500/10 text-magenta-400'
                : 'bg-gold-400/10 text-gold-300'
            }`}>
              {wish.type === 'wish' ? '💫 Wish' : '🎁 Gift'}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${u.bg} ${u.color}`}>
              <Clock className="w-2.5 h-2.5 inline mr-1" />{u.label}
            </span>
          </div>

          <h2 className="font-serif text-2xl text-cream mb-2">{wish.title}</h2>
          <p className="text-sm text-lavender/40">
            Posted by {wish.postedByName} • {wish.category} {CATEGORY_EMOJIS[wish.category]}
          </p>
        </div>

        <div className="space-y-5">
          {/* Description */}
          <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-4">
            <label className="block text-xs text-lavender/50 mb-1.5 uppercase tracking-wider">Description</label>
            <p className="text-sm text-lavender/70">{wish.description}</p>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-3">
              <label className="block text-xs text-lavender/50 mb-1">Location</label>
              <div className="text-sm text-cream flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-lavender/40" />
                {wish.location}
              </div>
            </div>

            <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-3">
              <label className="block text-xs text-lavender/50 mb-1">Time Commitment</label>
              <div className="text-sm text-cream">{wish.timeCommitment}</div>
            </div>

            <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-3">
              <label className="block text-xs text-lavender/50 mb-1">Exchange Avenue</label>
              <div className="text-sm text-cream">{wish.exchangeAvenue}</div>
            </div>

            <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-3">
              <label className="block text-xs text-lavender/50 mb-1">Resources</label>
              <div className="flex flex-wrap gap-1">
                {wish.resources.map(r => (
                  <span key={r} className="text-xs text-lavender/60 bg-void-900 px-2 py-0.5 rounded-full">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Skills */}
          {wish.skills.length > 0 && (
            <div>
              <label className="block text-xs text-lavender/50 mb-2 uppercase tracking-wider">{wish.type === 'wish' ? 'Skills Needed' : 'Skills Offered'}</label>
              <div className="flex flex-wrap gap-2">
                {wish.skills.map(s => (
                  <span key={s} className="px-3 py-1 rounded-full bg-void-900 border border-lavender/10 text-lavender/60 text-sm">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Roles */}
          {wish.roles.length > 0 && (
            <div>
              <label className="block text-xs text-lavender/50 mb-2 uppercase tracking-wider">Roles</label>
              <div className="flex flex-wrap gap-2">
                {wish.roles.map(r => (
                  <span key={r} className="px-3 py-1 rounded-full bg-turquoise-400/10 border border-turquoise-400/20 text-turquoise-300 text-sm">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Codes */}
          <div className="rounded-xl border border-gold-400/10 bg-gold-400/5 p-4">
            <label className="block text-xs text-gold-400/60 mb-2 uppercase tracking-wider">12 Codes of ALL Guiding This Exchange</label>
            <div className="flex flex-wrap gap-2">
              {wish.selectedCodes.map(code => (
                <span key={code} className="px-2 py-0.5 rounded-full bg-void-900 border border-gold-400/20 text-gold-300 text-xs">
                  Code {code}
                </span>
              ))}
            </div>
          </div>

          {/* Funds */}
          {(wish.fundsRequired > 0 || wish.fundsAvailable > 0) && (
            <div className="rounded-xl border border-magenta-500/10 bg-magenta-500/5 p-4">
              <label className="block text-xs text-magenta-400/60 mb-2 uppercase tracking-wider">Funds</label>
              <div className="text-sm text-cream">
                {wish.fundsRequired > 0 && <span><span className="text-magenta-400">Needed: ${(wish.fundsRequired / 100).toFixed(2)}</span> </span>}
                {wish.fundsAvailable > 0 && <span><span className="text-gold-400">Available: ${(wish.fundsAvailable / 100).toFixed(2)}</span> </span>}
              </div>
            </div>
          )}

          {/* Claim Button */}
          {wish.status === 'open' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClaim}
              className="w-full py-4 rounded-xl bg-magenta-400/10 border border-magenta-400/30 text-magenta-300 hover:bg-magenta-400/20 transition-all"
            >
              <Heart className="w-5 h-5 inline mr-2" />
              I Feel Called to Meet This {wish.type === 'wish' ? 'Wish' : 'Gift'}
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
