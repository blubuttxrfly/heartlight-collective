import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Sparkles, Heart, MapPin, Clock, ChevronRight, X, ArrowLeft, Plus, Tag, Globe, Navigation, Repeat, Store } from 'lucide-react'
import { PiShootingStar, PiHeartLight } from 'react-icons/pi'
import { FaHandHoldingHeart } from 'react-icons/fa'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../lib/session'
import { useStorage } from '../lib/storage'
import { haversineDistance, formatDistance } from '../lib/geo'
import { CONTINENTS, CONTINENT_EMOJIS, DEFAULT_LOCAL_RADIUS_KM, LOCAL_RADIUS_PRESETS, PAYMENT_METHOD_LABELS } from '../lib/constants'
import type { WishScope, ExchangeAgreement, OfferingItem, VendorRecord } from '../types/ces'
import { ExchangeRequestModal } from '../components/exchange/ExchangeRequestModal'
import { ExchangeAgreementEditor } from '../components/exchange/ExchangeAgreementEditor'

/* ─── Codes Data (for display) ─── */
const CODES_DATA = [
  { number: 1, name: 'Consent', ray: 'Red', color: '#ef4444' },
  { number: 2, name: 'Care', ray: 'Orange', color: '#f97316' },
  { number: 3, name: 'Sovereignty', ray: 'Yellow', color: '#eab308' },
  { number: 4, name: 'Thrival', ray: 'Green', color: '#22c55e' },
  { number: 5, name: 'Discernment & Repair', ray: 'Turquoise', color: '#2dd4bf' },
  { number: 6, name: 'Sustainability & Communication', ray: 'Blue', color: '#3b82f6' },
  { number: 7, name: 'Vision', ray: 'Indigo', color: '#6366f1' },
  { number: 8, name: 'Sanctity of Experience', ray: 'Violet', color: '#8b5cf6' },
  { number: 9, name: 'Authentic Joy', ray: 'Magenta', color: '#d946ef' },
  { number: 10, name: 'Conscious Awareness', ray: 'Omni', color: '#c0c0d8' },
  { number: 11, name: 'Sacred Service', ray: 'Elemental', color: '#7a9e5a' },
  { number: 12, name: 'Co-Creation', ray: 'ALL', color: '#e8d4ff' },
]

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
    selectedCodes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
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
    selectedCodes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
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
    selectedCodes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
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
    selectedCodes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    status: 'open',
    postedByCes: 'local_being_04',
    postedByName: 'Vision Seed',
    createdAt: '2026-06-12T16:00:00Z',
  },
  {
    id: 'wish_005',
    type: 'offer',
    title: 'Free breathwork sessions for community wellness circles',
    description: 'I hold space for somatic breathwork journeys. This is a continual offering — feel called whenever you need to return to your breath. I offer sessions weekly and welcome new beings at any time.',
    category: 'Healing & Wellness',
    skills: ['breathwork', 'somatic practice', 'facilitation'],
    resources: ['Time', 'Skills'],
    roles: ['teacher', 'guide'],
    urgency: 'low',
    location: 'Remote / Anywhere',
    exchangeAvenue: 'direct',
    fundsAvailable: 0,
    timeCommitment: '60-minute sessions, weekly availability',
    selectedCodes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    status: 'open',
    postedByCes: 'local_being_05',
    postedByName: 'Breath of Gaia',
    createdAt: '2026-06-12T18:00:00Z',
    isContinualOffering: true,
    claims: [],
  },
  // ═══ Demo Vendor Offerings ═══
  {
    id: 'offering_001',
    type: 'offering',
    title: 'Evolutionary Astrology Reading — 90 min',
    description: 'A deep dive into your soul purpose, current transits, and heartlight alignment. Sessions held via Zoom with recording available.',
    category: 'Astrology & Guidance',
    skills: ['astrology', 'evolutionary astrology', 'transit interpretation'],
    resources: ['Time', 'Skills'],
    roles: ['teacher', 'guide'],
    urgency: 'low',
    location: 'Remote / Zoom',
    exchangeAvenue: 'direct',
    fundsAvailable: 0,
    timeCommitment: '90-minute session',
    selectedCodes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    status: 'open',
    postedByCes: 'local_being_02',
    postedByName: 'Cosmic Bloom',
    createdAt: '2026-06-12T19:00:00Z',
    vendorId: 'vendor_lunas_star',
    vendorName: "Luna's Star Readings",
    priceType: 'fixed',
    priceCents: 7500,
    availability: 'available',
    paymentMethods: [
      { type: 'stripe', enabled: true },
      { type: 'venmo', enabled: true, venmoUsername: '@cosmicbloom' },
      { type: 'collective', enabled: true, collectivePriority: false },
    ],
  },
  {
    id: 'offering_002',
    type: 'offering',
    title: 'Climate Action Campaign Design — Pro Bono',
    description: 'Professional graphic design for climate justice campaigns. Posters, social assets, presentations, and brand identity. Vision Seed contributes via the Green Canvas Collective.',
    category: 'Creative & Design',
    skills: ['graphic design', 'branding', 'social media', 'illustration'],
    resources: ['Time', 'Skills', 'Equipment'],
    roles: ['co-creator', 'teacher'],
    urgency: 'low',
    location: 'Remote / Anywhere',
    exchangeAvenue: 'direct',
    fundsAvailable: 0,
    timeCommitment: '2-5 hours per project',
    selectedCodes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    status: 'open',
    postedByCes: 'local_being_04',
    postedByName: 'Vision Seed',
    createdAt: '2026-06-12T20:00:00Z',
    vendorId: 'vendor_green_canvas',
    vendorName: 'Green Canvas Collective',
    priceType: 'gift',
    availability: 'limited',
    paymentMethods: [
      { type: 'venmo', enabled: true, venmoUsername: '@visionseed' },
      { type: 'collective', enabled: true, collectivePriority: true },
    ],
  },
]

/* ─── Helper: load wishes from localStorage ─── */
function loadWishes() {
  const stored = JSON.parse(localStorage.getItem('hlw_wishes') || '[]')
  return [...INITIAL_WISHES, ...stored]
}

function loadVendorOfferings() {
  try {
    const vendors = JSON.parse(localStorage.getItem('hlc_vendors') || '[]')
    const offerings: any[] = []
    for (const v of vendors) {
      if (!v.offerings || !Array.isArray(v.offerings)) continue
      for (const o of v.offerings) {
        offerings.push({
          ...o,
          type: 'offering',
          postedByCes: v.ownerCes,
          postedByName: v.name,
          status: 'open',
          vendorName: v.name,
          vendorId: v.id,
          // Normalize fields the grid expects
          skills: [],
          resources: [],
          roles: [],
          urgency: 'low',
          scope: 'universal',
          location: 'Remote / Anywhere',
          locationData: { continent: 'Anywhere', city: 'Remote', country: 'Anywhere' },
          fundsRequired: o.priceCents || 0,
          fundsAvailable: 0,
          timeCommitment: '',
          isContinualOffering: false,
          claims: [],
          exchangeAvenue: 'vendor',
        })
      }
    }
    return offerings
  } catch {
    return []
  }
}

function loadAllItems() {
  return [...loadWishes(), ...loadVendorOfferings()]
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
  const [wishes, setWishes] = useState(loadAllItems)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedWish, setSelectedWish] = useState(null)
  const [viewScope, setViewScope] = useState<WishScope>('universal')
  const [selectedContinent, setSelectedContinent] = useState<string>('')
  const [localRadius, setLocalRadius] = useState(DEFAULT_LOCAL_RADIUS_KM)
  const [typeFilter, setTypeFilter] = useState<'all' | 'wish' | 'offer' | 'offering'>('all')
  const [requestModalOffering, setRequestModalOffering] = useState<OfferingItem | null>(null)
  const [requestModalVendor, setRequestModalVendor] = useState<VendorRecord | null>(null)
  const [editingAgreement, setEditingAgreement] = useState<ExchangeAgreement | null>(null)

  const { user } = useSession()
  const { findProfileByCES, findVendorById } = useStorage()
  const navigate = useNavigate()

  // Load user profile location for distance filtering
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  useEffect(() => {
    if (user?.ces) {
      const profile = findProfileByCES(user.ces)
      if (profile?.locationData?.lat && profile?.locationData?.lon) {
        setUserLocation({ lat: profile.locationData.lat, lon: profile.locationData.lon })
      }
    }
  }, [user?.ces, findProfileByCES])

  const categories = useMemo(() => {
    const cats = new Set(wishes.map(w => w.category))
    return Array.from(cats)
  }, [wishes])

  const filtered = useMemo(() => {
    let list = [...wishes]

    // Type filter: all | wish | offer | offering
    if (typeFilter !== 'all') {
      list = list.filter(w => w.type === typeFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(w =>
        w.title.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        w.skills.some((s: string) => s.toLowerCase().includes(q)) ||
        w.category.toLowerCase().includes(q) ||
        w.postedByName.toLowerCase().includes(q)
      )
    }

    if (selectedCategory) {
      list = list.filter(w => w.category === selectedCategory)
    }

    // Scope filtering: Local / Global / Universal
    if (viewScope === 'local') {
      // Show wishes scoped to 'local' or 'universal' that are within radius
      list = list.filter(w => {
        if (w.scope === 'universal' || w.scope === 'local') {
          // Need precise coordinates to check distance
          if (w.locationData?.lat && w.locationData?.lon && userLocation) {
            const dist = haversineDistance(
              { lat: w.locationData.lat, lon: w.locationData.lon },
              userLocation
            )
            return dist !== null && dist <= localRadius
          }
          // Wishes without precise coords but same continent — include if no user location
          if (!userLocation && w.locationData?.continent && selectedContinent) {
            return w.locationData.continent === selectedContinent
          }
          return w.scope === 'universal' // Always show universal
        }
        return false
      })
    } else if (viewScope === 'global') {
      // Show wishes scoped to 'global', 'universal', or matching continent
      list = list.filter(w => {
        if (w.scope === 'universal') return true
        if (selectedContinent && w.locationData?.continent) {
          return w.locationData.continent === selectedContinent
        }
        return w.scope === 'global' || w.scope === 'universal'
      })
    }
    // 'universal' = show all (after category + search filters)

    // Sort: urgent first, then by recency
    const urgencyOrder = { 'time-sensitive': 0, 'high': 1, 'medium': 2, 'low': 3 }
    list.sort((a, b) => {
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
      if (urgencyDiff !== 0) return urgencyDiff
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return list
  }, [wishes, search, selectedCategory, viewScope, selectedContinent, localRadius, userLocation, typeFilter])

  const wishCount = wishes.filter(w => w.type === 'wish').length
  const offerCount = wishes.filter(w => w.type === 'offer').length
  const offeringCount = wishes.filter(w => w.type === 'offering').length

  const typeLabels = [
    { key: 'all', label: 'ALL', count: wishes.length, icon: null },
    { key: 'wish', label: 'Wishes', count: wishCount, icon: Heart },
    { key: 'offer', label: 'Gifts', count: offerCount, icon: Sparkles },
    { key: 'offering', label: 'Offerings', count: offeringCount, icon: Store },
  ] as const;

  return (
    <div className="px-4 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-lavender/60 hover:text-gold-400 transition-colors text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Collective
        </Link>

        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gold-400/10 border border-gold-400/20 flex items-center justify-center mx-auto mb-4">
            <PiHeartLight className="w-8 h-8 text-gold-400" aria-label="Heartlight" />
          </div>
          <h1 className="font-serif text-3xl text-gold-400 mb-2">
            Heartlight Exchange
          </h1>
          <p className="text-lavender/50 max-w-lg mx-auto">
            Cast a Wish, Share a Gift, and Exchange with Fulfillment!
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-center gap-6 mb-8 text-xs text-lavender/40 flex-wrap">
        <span><Heart className="w-3 h-3 inline mr-1 text-magenta-400" />{wishCount} wishes</span>
        <span><Sparkles className="w-3 h-3 inline mr-1 text-gold-400" />{offerCount} gifts</span>
        <span><Store className="w-3 h-3 inline mr-1 text-blue-400" />{offeringCount} offerings</span>
        <span><Tag className="w-3 h-3 inline mr-1 text-lavender/50" />{categories.length} categories</span>
      </div>

      {/* Post CTA */}
      <div className="flex flex-wrap gap-3 mb-8 justify-center">
        <Link
          to="/post-wish?type=wish"
          className="px-6 py-3 rounded-full bg-magenta-400/10 border border-magenta-400/30 text-magenta-300 hover:bg-magenta-400/20 transition-all inline-flex items-center gap-2"
        >
          Cast a Wish <PiShootingStar className="w-4 h-4" />
        </Link>
        <Link
          to="/post-wish?type=gift"
          className="px-6 py-3 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all inline-flex items-center gap-2"
        >
          Share a Gift <FaHandHoldingHeart className="w-4 h-4" />
        </Link>
        <Link
          to="/directory"
          className="px-6 py-3 rounded-full bg-blue-400/10 border border-blue-400/30 text-blue-300 hover:bg-blue-400/20 transition-all inline-flex items-center gap-2"
        >
          Find a Vendor <Store className="w-4 h-4" />
        </Link>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {typeLabels.map(t => {
          const Icon = t.icon
          const isActive = typeFilter === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTypeFilter(t.key)}
              className={`px-4 py-2 rounded-full border text-sm transition-all inline-flex items-center gap-2 ${
                isActive
                  ? t.key === 'wish'
                    ? 'bg-magenta-400/10 border-magenta-400/30 text-magenta-300'
                    : t.key === 'offer'
                    ? 'bg-gold-400/10 border-gold-400/30 text-gold-300'
                    : t.key === 'offering'
                    ? 'bg-blue-400/10 border-blue-400/30 text-blue-300'
                    : 'bg-lavender/10 border-lavender/30 text-cream'
                  : 'border-lavender/10 text-lavender/50 hover:border-lavender/20 hover:text-lavender/70'
              }`}
            >
              {t.icon && <Icon className="w-3.5 h-3.5" />}
              {t.label} <span className="text-[10px] opacity-60">({t.count})</span>
            </button>
          )
        })}
      </div>

      {/* View Scope Toggle: Local | Regional | Universal */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 justify-center">
          {(['local', 'global', 'universal'] as WishScope[]).map(s => {
            const isActive = viewScope === s
            const activeClass =
              s === 'local'
                ? 'bg-green-400/10 border-green-400/30 text-green-300'
                : s === 'global'
                ? 'bg-blue-400/10 border-blue-400/30 text-blue-300'
                : 'bg-magenta-400/10 border-magenta-400/30 text-magenta-300'
            return (
              <button
                key={s}
                onClick={() => {
                  setViewScope(s)
                  if (s === 'universal') setSelectedContinent('')
                }}
                className={`px-5 py-2 rounded-full border text-sm transition-all inline-flex items-center gap-2 ${
                  isActive ? activeClass : 'border-lavender/10 text-lavender/50 hover:border-lavender/30'
                }`}
              >
                {s === 'local' ? 'Local' : s === 'global' ? 'Regional' : 'Universal'}
                {s === 'local' && <Navigation className="w-4 h-4" />}
                {s === 'global' && <Globe className="w-4 h-4" />}
                {s === 'universal' && <Sparkles className="w-4 h-4" />}
              </button>
            )
          })}
        </div>

        {/* Radius presets (only in Local view) */}
        {viewScope === 'local' && (
          <div className="flex items-center justify-center gap-3 mt-3">
            <span className="text-xs text-lavender/40">Radius:</span>
            {LOCAL_RADIUS_PRESETS.map(r => (
              <button
                key={r}
                onClick={() => setLocalRadius(r)}
                className={`px-3 py-1 rounded-full border text-xs transition-all ${
                  localRadius === r
                    ? 'bg-green-400/10 border-green-400/30 text-green-300'
                    : 'border-lavender/10 text-lavender/50 hover:border-lavender/30'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        )}

        {/* Continent selector (only in Regional view) */}
        {viewScope === 'global' && (
          <div className="flex items-center justify-center gap-3 mt-3">
            <span className="text-xs text-lavender/40">Region:</span>
            <select
              value={selectedContinent}
              onChange={e => setSelectedContinent(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-void-800/60 border border-lavender/10 text-cream text-sm focus:border-gold-400/30 focus:outline-none cursor-pointer"
            >
              <option value="">All Regions</option>
              {CONTINENTS.map(c => (
                <option key={c} value={c}>{CONTINENT_EMOJIS[c]} {c}</option>
              ))}
            </select>
          </div>
        )}
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
            Share Your Wish <Plus className="w-4 h-4" />
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
              className={`rounded-2xl border p-5 transition-all cursor-pointer ${
                wish.type === 'wish'
                  ? 'border-magenta-500/15 bg-void-800/40 hover:border-magenta-500/30'
                  : wish.type === 'offering'
                  ? 'border-blue-400/15 bg-void-800/30 hover:border-blue-400/30'
                  : 'border-gold-400/15 bg-void-800/30 hover:border-gold-400/30'
              }`}
              onClick={() => setSelectedWish(wish)}
            >
              {/* Type badge + Urgency + Continual Offering */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex flex-wrap gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    wish.type === 'wish'
                      ? 'bg-magenta-500/10 text-magenta-400'
                      : wish.type === 'offering'
                      ? 'bg-blue-400/10 text-blue-300'
                      : 'bg-gold-400/10 text-gold-300'
                  }`}>
                    {wish.type === 'wish' ? '💫 Wish' : wish.type === 'offering' ? '🏪 Offering' : '🎁 Gift'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${URGENCY_CONFIG[wish.urgency].bg} ${URGENCY_CONFIG[wish.urgency].color}`}>
                    <Clock className="w-2.5 h-2.5 inline mr-1" />
                    {URGENCY_CONFIG[wish.urgency].label}
                  </span>
                  {wish.isContinualOffering && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-green-400/10 text-green-300 flex items-center gap-1">
                      <Repeat className="w-2.5 h-2.5" /> Continual
                    </span>
                  )}
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
                  {viewScope === 'local' && wish.locationData?.lat && wish.locationData?.lon && userLocation && (
                    <span className="text-green-400">
                      {(() => {
                        const dist = haversineDistance(
                          { lat: wish.locationData.lat, lon: wish.locationData.lon },
                          userLocation
                        )
                        return dist !== null ? `~${formatDistance(dist)}` : null
                      })()}
                    </span>
                  )}
                  {wish.scope && wish.scope !== 'universal' && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      wish.scope === 'local'
                        ? 'bg-green-400/10 text-green-400/70'
                        : 'bg-blue-400/10 text-blue-400/70'
                    }`}>
                      {wish.scope === 'local' ? 'Local' : 'Regional'}
                    </span>
                  )}
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
              if (selectedWish.type === 'offering') {
                if (!user?.ces) {
                  alert('Please sign in with your C.E.S. before requesting an aligned exchange.')
                  return
                }
                const vendor = selectedWish.vendorId ? findVendorById(selectedWish.vendorId) : undefined
                if (!vendor) {
                  alert('This offering is not connected to a storefront right now.')
                  return
                }
                // Build a typed OfferingItem from the grid payload
                const offering: OfferingItem = {
                  id: selectedWish.id,
                  vendorId: vendor.id,
                  title: selectedWish.title,
                  description: selectedWish.description,
                  category: selectedWish.category,
                  priceType: selectedWish.priceType,
                  priceCents: selectedWish.priceCents,
                  currency: 'USD',
                  availability: selectedWish.availability,
                  consentRequired: selectedWish.consentRequired ?? true,
                  maxParticipants: selectedWish.maxParticipants,
                  stripePriceId: selectedWish.stripePriceId,
                  createdAt: selectedWish.createdAt,
                  updatedAt: selectedWish.updatedAt,
                }
                setRequestModalOffering(offering)
                setRequestModalVendor(vendor)
                setSelectedWish(null)
                return
              }
              const stored = JSON.parse(localStorage.getItem('hlw_wishes') || '[]')
              const idx = stored.findIndex(w => w.id === selectedWish.id)
              if (idx >= 0) {
                const target = stored[idx]
                if (target.isContinualOffering) {
                  // Continual: keep open, record the claim
                  if (!target.claims) target.claims = []
                  target.claims.push({
                    claimedByCes: 'current_user',
                    claimedByName: 'You',
                    claimedAt: new Date().toISOString(),
                  })
                } else {
                  // One-time: mark as claimed
                  target.status = 'claimed'
                  target.claimedByCes = 'current_user'
                  target.claimedByName = 'You'
                  target.claimedAt = new Date().toISOString()
                }
                localStorage.setItem('hlw_wishes', JSON.stringify(stored))
                setWishes(loadWishes())
              }
              setSelectedWish(null)
            }}
          />
        )}
      </AnimatePresence>

      {/* Exchange Request Modal */}
      <AnimatePresence>
        {requestModalOffering && requestModalVendor && user?.ces && (
          <ExchangeRequestModal
            offering={requestModalOffering}
            vendor={requestModalVendor}
            requesterCes={user.ces}
            requesterName={findProfileByCES(user.ces)?.name || user.name || 'You'}
            onClose={() => {
              setRequestModalOffering(null)
              setRequestModalVendor(null)
            }}
            onAgreementCreated={(ag) => {
              setRequestModalOffering(null)
              setRequestModalVendor(null)
              setEditingAgreement(ag)
            }}
          />
        )}
      </AnimatePresence>

      {/* Exchange Agreement Editor */}
      <AnimatePresence>
        {editingAgreement && (
          <ExchangeAgreementEditor
            agreement={editingAgreement}
            onClose={() => {
              setEditingAgreement(null)
              setWishes(loadWishes())
            }}
            onSigned={() => {
              setEditingAgreement(null)
              navigate('/flow')
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

/* ─── Wish / Gift / Offering Detail Modal ─── */
function WishDetailModal({ wish, onClose, onClaim }) {
  const u = URGENCY_CONFIG[wish.urgency]
  const isOffering = wish.type === 'offering'

  const formatPrice = () => {
    if (wish.priceType === 'gift') return 'Gift Economy'
    if (wish.priceType === 'collective_funded') return 'Collective Funded'
    if (wish.priceType === 'negotiable') return 'Negotiable'
    if (wish.priceCents != null) return `$${(wish.priceCents / 100).toFixed(2)}`
    return 'Fixed Price'
  }

  const statusClass = () => {
    switch (wish.availability) {
      case 'available': return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'limited': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'waitlist': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      default: return 'bg-lavender/5 text-lavender/40 border-lavender/10'
    }
  }

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
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              wish.type === 'wish'
                ? 'bg-magenta-500/10 text-magenta-400'
                : wish.type === 'offering'
                ? 'bg-blue-400/10 text-blue-300'
                : 'bg-gold-400/10 text-gold-300'
            }`}>
              {wish.type === 'wish' ? '💫 Wish' : wish.type === 'offering' ? '🏪 Offering' : '🎁 Gift'}
            </span>
            {u && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${u.bg} ${u.color}`}>
                <Clock className="w-2.5 h-2.5 inline mr-1" />{u.label}
              </span>
            )}
            {isOffering && (
              <span className={`px-2 py-0.5 rounded-full text-xs border ${statusClass()}`}>
                {wish.availability}
              </span>
            )}
            {wish.isContinualOffering && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-green-400/10 text-green-300 flex items-center gap-1">
                <Repeat className="w-2.5 h-2.5" /> Continual
              </span>
            )}
          </div>

          <h2 className="font-serif text-2xl text-cream mb-2">{wish.title}</h2>
          <p className="text-sm text-lavender/40">
            {isOffering ? `Offered by ${wish.vendorName || wish.postedByName}` : `Posted by ${wish.postedByName}`}
            {' • '}
            {wish.category} {CATEGORY_EMOJIS[wish.category]}
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
              <label className="block text-xs text-lavender/50 mb-1">{isOffering ? 'Exchange Type' : 'Location'}</label>
              <div className="text-sm text-cream flex items-center gap-1">
                {isOffering ? <Store className="w-3.5 h-3.5 text-lavender/40" /> : <MapPin className="w-3.5 h-3.5 text-lavender/40" />}
                {isOffering ? formatPrice() : wish.location}
              </div>
            </div>

            <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-3">
              <label className="block text-xs text-lavender/50 mb-1">{isOffering ? 'Availability' : 'Time Commitment'}</label>
              <div className="text-sm text-cream">{isOffering ? wish.availability : wish.timeCommitment}</div>
            </div>

            <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-3">
              <label className="block text-xs text-lavender/50 mb-1">{isOffering ? 'Vendor' : 'Exchange Avenue'}</label>
              <div className="text-sm text-cream">{isOffering ? wish.vendorName || wish.postedByName : wish.exchangeAvenue}</div>
            </div>

            <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-3">
              <label className="block text-xs text-lavender/50 mb-1">{isOffering ? 'Category' : 'Resources'}</label>
              <div className="flex flex-wrap gap-1">
                {isOffering ? (
                  <span className="text-xs text-lavender/60 bg-void-900 px-2 py-0.5 rounded-full">{wish.category}</span>
                ) : (
                  wish.resources.map(r => (
                    <span key={r} className="text-xs text-lavender/60 bg-void-900 px-2 py-0.5 rounded-full">
                      {r}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Skills */}
          {!isOffering && wish.skills.length > 0 && (
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

          {/* 12 Ray Frequencies — present in every exchange */}
          <div className="rounded-xl border border-gold-400/10 bg-gold-400/5 p-4">
            <label className="block text-xs text-gold-400/60 mb-2 uppercase tracking-wider">12 Ray Frequencies of ALL — Present in Every Exchange</label>
            <div className="flex flex-wrap gap-1.5">
              {CODES_DATA.map(code => (
                <span
                  key={code.number}
                  className="px-2 py-0.5 rounded-full bg-void-900 border text-[10px]"
                  style={{ borderColor: code.color + '30', color: code.color + 'bb' }}
                  title={`${code.ray}: ${code.name}`}
                >
                  {code.number}. {code.name}
                </span>
              ))}
            </div>
          </div>

          {/* Funds / Price for offerings */}
          {(isOffering || wish.fundsRequired > 0 || wish.fundsAvailable > 0) && (
            <div className="rounded-xl border border-magenta-500/10 bg-magenta-500/5 p-4">
              <label className="block text-xs text-magenta-400/60 mb-2 uppercase tracking-wider">{isOffering ? 'Exchange Value' : 'Funds'}</label>
              <div className="text-sm text-cream">
                {isOffering && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gold-400 font-medium text-lg">{formatPrice()}</span>
                    <span className="text-xs text-lavender/40">{wish.priceType}</span>
                  </div>
                )}
                {wish.fundsRequired > 0 && !isOffering && <span><span className="text-magenta-400">Needed: ${(wish.fundsRequired / 100).toFixed(2)}</span> </span>}
                {wish.fundsAvailable > 0 && <span><span className="text-gold-400">Available: ${(wish.fundsAvailable / 100).toFixed(2)}</span> </span>}
              </div>
            </div>
          )}

          {/* Claims history for continual offerings */}
          {wish.isContinualOffering && wish.claims && wish.claims.length > 0 && (
            <div className="rounded-xl border border-green-400/10 bg-green-400/5 p-4">
              <label className="block text-xs text-green-400/60 mb-2 uppercase tracking-wider">
                <Repeat className="w-3 h-3 inline mr-1" /> Continual Offering — {wish.claims.length} {wish.claims.length === 1 ? 'being' : 'beings'} called
              </label>
              <div className="space-y-1">
                {wish.claims.map((c, i) => (
                  <div key={i} className="text-xs text-lavender/50">
                    {c.claimedByName} — {new Date(c.claimedAt).toLocaleDateString()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Claim / Request Exchange Button */}
          {(wish.status === 'open' || wish.isContinualOffering || isOffering) && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClaim}
              className={`w-full py-4 rounded-xl border transition-all ${
                isOffering
                  ? 'bg-blue-400/10 border-blue-400/30 text-blue-300 hover:bg-blue-400/20'
                  : 'bg-magenta-400/10 border-magenta-400/30 text-magenta-300 hover:bg-magenta-400/20'
              }`}
            >
              {isOffering ? (
                <>
                  <Store className="w-5 h-5 inline mr-2" />
                  Request Exchange
                </>
              ) : wish.isContinualOffering ? (
                <>
                  <Heart className="w-5 h-5 inline mr-2" />
                  I Feel Called to Meet This Gift ({wish.claims?.length || 0} previous resonances)
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5 inline mr-2" />
                  I Feel Called to Meet This {wish.type === 'wish' ? 'Wish' : 'Gift'}
                </>
              )}
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
