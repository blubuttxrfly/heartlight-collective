import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Sparkles, Heart, MapPin, Clock, ChevronRight, X, Repeat, Store, Tag, Globe, Navigation, Filter, ChevronDown, ChevronLeft, ChevronRight as ChevronRightIcon, RefreshCw, DollarSign, SlidersHorizontal, GraduationCap, HandHeart } from 'lucide-react';
import { PiShootingStar } from 'react-icons/pi'
import { Link, useNavigate } from 'react-router-dom'
import { useSession } from '../../lib/session'
import { useStorage } from '../../lib/storage'
import { fetchRemoteVendors } from '../../lib/redisVendors'
import { haversineDistance, formatDistance } from '../../lib/geo'
import { CONTINENTS, CONTINENT_EMOJIS, DEFAULT_LOCAL_RADIUS_KM, LOCAL_RADIUS_PRESETS } from '../../lib/constants'
import type { WishScope, ExchangeAgreement, OfferingItem, VendorRecord, LocationData } from '../../types/ces'
import { ExchangeRequestModal } from '../../components/exchange/ExchangeRequestModal'
import { ExchangeAgreementEditor } from '../../components/exchange/ExchangeAgreementEditor'
import LocationSelect from '../../components/LocationSelect'

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

/* ─── Helper: build vendor offerings from storage context ─── */
function buildVendorOfferings(vendors: VendorRecord[]) {
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
        skills: [],
        resources: [],
        roles: o.fulfillers?.map((f: any) => f.role).filter(Boolean) || [],
        vendorLogoUrl: v.logoUrl,
        vendorLinks: v.links,
        gallery: o.gallery,
        urgency: 'low',
        scope: (o.offeringType === 'virtual_session' || o.location?.type === 'virtual') ? 'universal' : 'local',
        location: o.location?.label || o.location?.address || 'Remote / Anywhere',
        locationData: o.location?.locationData || o.location?.latitude != null ? {
          lat: o.location!.latitude,
          lon: o.location!.longitude,
          city: o.location!.city || null,
          region: o.location!.region || null,
          country: o.location!.country || null,
          continent: null,
          raw: o.location!.label || o.location!.address || null,
        } : { continent: 'Anywhere', city: 'Remote', country: 'Anywhere' },
        fulfillers: o.fulfillers,
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
interface ExchangeDiscoveryProps {
  typeFilter: 'all' | 'wish' | 'offer' | 'offering'
}

export default function ExchangeDiscovery({ typeFilter }: ExchangeDiscoveryProps) {
  const { user } = useSession()
  const { findProfileByCES, findVendorById: findLocalVendorById, vendors: localVendors, getProfiles } = useStorage()
  const navigate = useNavigate()

  const [wishes, setWishes] = useState<any[]>([])
  const [isLoadingWishes, setIsLoadingWishes] = useState(true)

  // Remote vendors from Upstash Redis — fresh browsers / other devices see synced shops
  const [remoteVendors, setRemoteVendors] = useState<VendorRecord[]>([])

  // Merge localStorage vendors with remote Redis vendors (remote wins by id)
  const vendors = useMemo(() => {
    const mergedMap = new Map<string, VendorRecord>()
    for (const v of localVendors) mergedMap.set(v.id, v)
    for (const v of remoteVendors) mergedMap.set(v.id, v)
    return Array.from(mergedMap.values())
  }, [localVendors, remoteVendors])

  const findVendorById = useCallback((id: string) => {
    return vendors.find((v) => v.id === id) || findLocalVendorById(id)
  }, [vendors, findLocalVendorById])

  // Wave 8.3 — fetch remote Vendor Shops from Upstash Redis once on mount
  useEffect(() => {
    let cancelled = false
    fetchRemoteVendors().then(({ vendors: remote }) => {
      if (!cancelled) setRemoteVendors(remote)
    })
    return () => { cancelled = true }
  }, [])

  // Wave 8.3 — load live wishes, merge with local wishes and vendor offerings
  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoadingWishes(true)
      try {
        // Wave 10 — pure localStorage, no Supabase dependency
        const local = JSON.parse(localStorage.getItem('hlw_wishes') || '[]')

        // Safety: ensure all items are valid objects with an id
        const validWishes = Array.isArray(local) ? local.filter((w: any) => w && typeof w === 'object' && w.id) : []

        // Wave 8.3 — hide wishes from private individual profiles (not vendor offerings)
        const privateCes = new Set(
          getProfiles()
            .filter((p) => p.isPrivate)
            .map((p) => p.cesNumber)
        )

        const visible = validWishes.filter((w: any) => {
          // Vendor offerings are always visible even if a member is private
          if (w.type === 'offering' || w.vendorId) return true
          // Individual wish/gift: hide if the author profile is private
          if (w.postedByCes && privateCes.has(w.postedByCes)) return false
          return true
        })

        if (!cancelled) {
          // Use merged vendors (local + remote) when building vendor offerings
          setWishes([...visible, ...buildVendorOfferings(vendors)])
          setIsLoadingWishes(false)
        }
      } catch (err) {
        console.error('[ExchangeDiscovery] Failed to load wishes:', err)
        if (!cancelled) {
          // Fallback to vendor offerings only
          setWishes(buildVendorOfferings(vendors))
          setIsLoadingWishes(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [vendors, getProfiles])

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedEntityType, setSelectedEntityType] = useState<'any' | 'wish' | 'gift' | 'offering' | 'vendor'>('any')
  const [selectedPathway, setSelectedPathway] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedWish, setSelectedWish] = useState(null)
  const [viewScope, setViewScope] = useState<WishScope>('universal')
  const [selectedContinent, setSelectedContinent] = useState<string>('')
  const [localRadius, setLocalRadius] = useState(DEFAULT_LOCAL_RADIUS_KM)
  const [requestModalOffering, setRequestModalOffering] = useState<OfferingItem | null>(null)
  const [requestModalVendor, setRequestModalVendor] = useState<VendorRecord | null>(null)
  const [editingAgreement, setEditingAgreement] = useState<ExchangeAgreement | null>(null)

  // Pagination: 9 items per page
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 9

  // Load user profile location for distance filtering
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [recentLocations, setRecentLocations] = useState<LocationData[]>(() => {
    try {
      const raw = localStorage.getItem('hlc_recent_locations')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [searchLocation, setSearchLocation] = useState<LocationData | null>(null)

  useEffect(() => {
    if (user?.ces) {
      const profile = findProfileByCES(user.ces)
      if (profile?.locationData?.lat && profile?.locationData?.lon) {
        setUserLocation({ lat: profile.locationData.lat, lon: profile.locationData.lon })
        setSearchLocation(profile.locationData)
      }
    }
  }, [user?.ces, findProfileByCES])

  function rememberLocation(loc: LocationData | null) {
    if (!loc) return
    const next = [loc, ...recentLocations.filter((l) => l.raw !== loc.raw)].slice(0, 5)
    setRecentLocations(next)
    try {
      localStorage.setItem('hlc_recent_locations', JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  const categories = useMemo(() => {
    const cats = new Set(wishes.map(w => w.category))
    return Array.from(cats)
  }, [wishes])

  const allRoles = useMemo(() => {
    const set = new Set<string>()
    wishes.forEach(w => {
      if (w.roles?.length) w.roles.forEach((r: string) => set.add(r))
      if (w.fulfillers?.length) w.fulfillers.forEach((f: any) => f.role && set.add(f.role))
    })
    return Array.from(set).sort()
  }, [wishes])

  // Reset pagination when filters or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [search, selectedCategory, selectedRole, selectedEntityType, selectedPathway, viewScope, selectedContinent, localRadius, typeFilter])

  const filtered = useMemo(() => {
    let list = [...wishes]

    // Type filter: all | wish | offer | offering
    if (typeFilter !== 'all') {
      list = list.filter(w => w.type === typeFilter)
    }

    // Entity type filter from expanded tags panel
    if (selectedEntityType !== 'any') {
      if (selectedEntityType === 'vendor') {
        list = list.filter(w => w.type === 'offering' && w.vendorId)
      } else {
        list = list.filter(w => w.type === selectedEntityType)
      }
    }

    // Role filter
    if (selectedRole) {
      list = list.filter(w =>
        (w.roles?.includes(selectedRole)) ||
        (w.fulfillers?.some((f: any) => f.role === selectedRole))
      )
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(w =>
        (w.title || '').toLowerCase().includes(q) ||
        (w.description || '').toLowerCase().includes(q) ||
        (w.skills || []).some((s: string) => s.toLowerCase().includes(q)) ||
        (w.category || '').toLowerCase().includes(q) ||
        (w.postedByName || '').toLowerCase().includes(q)
      )
    }

    if (selectedCategory) {
      list = list.filter(w => w.category === selectedCategory)
    }

    // Pathway filter
    if (selectedPathway) {
      list = list.filter(w => {
        const policy = w.exchangePolicy || []
        const priceType = w.priceType || ''
        switch (selectedPathway) {
          case 'Gift':
            return policy.includes('gift') || priceType === 'gift'
          case 'Trade':
            return policy.includes('barter')
          case 'Fixed Price':
            return policy.includes('fixed') || priceType === 'fixed'
          case 'Sliding Scale':
            return policy.includes('negotiable') || priceType === 'negotiable'
          case 'Scholarship':
            return policy.includes('collective_funded') || priceType === 'collective_funded'
          default:
            return true
        }
      })
    }

    // Scope filtering: Local / Global / Universal
    const activeLocation = searchLocation || (userLocation ? {
      raw: 'My profile location',
      lat: userLocation.lat,
      lon: userLocation.lon,
      city: null,
      region: null,
      country: null,
      continent: null,
    } : null)

    if (viewScope === 'local') {
      // Show wishes scoped to 'local' or 'universal' that are within radius
      list = list.filter(w => {
        if (w.scope === 'universal' || w.scope === 'local') {
          // Need precise coordinates to check distance
          if (w.locationData?.lat && w.locationData?.lon && activeLocation) {
            const dist = haversineDistance(
              { lat: w.locationData.lat, lon: w.locationData.lon },
              { lat: activeLocation.lat, lon: activeLocation.lon }
            )
            return dist !== null && dist <= localRadius
          }
          // Wishes without precise coords but same continent — include if no user location
          if (!activeLocation && w.locationData?.continent && selectedContinent) {
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
    const urgencyOrder: Record<string, number> = { 'time-sensitive': 0, 'high': 1, 'medium': 2, 'low': 3 }
    list.sort((a, b) => {
      const urgencyA = urgencyOrder[a.urgency as string] ?? 3
      const urgencyB = urgencyOrder[b.urgency as string] ?? 3
      const urgencyDiff = urgencyA - urgencyB
      if (urgencyDiff !== 0) return urgencyDiff
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return list
  }, [wishes, search, selectedCategory, selectedRole, selectedEntityType, selectedPathway, viewScope, selectedContinent, localRadius, userLocation, searchLocation, typeFilter])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, currentPage])

  const wishCount = wishes.filter(w => w.type === 'wish').length
  const offerCount = wishes.filter(w => w.type === 'offer').length
  const offeringCount = wishes.filter(w => w.type === 'offering').length

  return (
    <div className="px-4 pb-16 max-w-6xl mx-auto">
      {/* Location bar */}
      <div className="mb-6 max-w-md mx-auto">
        <LocationSelect
          label="My exchange location"
          value={searchLocation}
          onChange={(loc) => {
            setSearchLocation(loc)
            if (loc) {
              setUserLocation({ lat: loc.lat, lon: loc.lon })
              rememberLocation(loc)
            }
          }}
          placeholder="Search city, town, or place…"
          allowRemote
        />
        {recentLocations.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs text-lavender/40">Recent:</span>
            {recentLocations.map((loc) => (
              <button
                key={loc.raw}
                onClick={() => {
                  setSearchLocation(loc)
                  setUserLocation({ lat: loc.lat, lon: loc.lon })
                }}
                className="text-xs text-green-300 hover:text-green-200 transition-colors"
              >
                {loc.city || loc.raw}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* View Scope Toggle: Local | Regional | Universal */}
      <div className="mb-6">
        <div className="flex gap-2 justify-center">
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
          <div className="space-y-3 mt-3">
            <div className="max-w-md mx-auto">
              <LocationSelect
                label="My local location"
                value={searchLocation}
                onChange={(loc) => {
                  setSearchLocation(loc)
                  if (loc) {
                    setUserLocation({ lat: loc.lat, lon: loc.lon })
                    rememberLocation(loc)
                  }
                }}
                placeholder="Search city, town, or place…"
                allowRemote
              />
              {recentLocations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs text-lavender/40">Recent:</span>
                  {recentLocations.map((loc) => (
                    <button
                      key={loc.raw}
                      onClick={() => {
                        setSearchLocation(loc)
                        setUserLocation({ lat: loc.lat, lon: loc.lon })
                      }}
                      className="text-xs text-green-300 hover:text-green-200 transition-colors"
                    >
                      {loc.city || loc.raw}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-3">
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

        {/* 5 Exchange Pathways Strip */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            { label: 'Gift', icon: Heart, value: 'Gift', color: 'magenta' },
            { label: 'Trade', icon: RefreshCw, value: 'Trade', color: 'gold' },
            { label: 'Fixed', icon: DollarSign, value: 'Fixed Price', color: 'blue' },
            { label: 'Sliding Scale', icon: SlidersHorizontal, value: 'Sliding Scale', color: 'green' },
            { label: 'Scholarship', icon: GraduationCap, value: 'Scholarship', color: 'violet' },
          ].map((p) => {
            const active = selectedPathway === p.value
            const colorMap: Record<string, string> = {
              magenta: active ? 'bg-magenta-400/15 border-magenta-400/40 text-magenta-300' : 'border-lavender/10 text-lavender/50 hover:border-magenta-400/30 hover:text-magenta-300',
              gold: active ? 'bg-gold-400/15 border-gold-400/40 text-gold-300' : 'border-lavender/10 text-lavender/50 hover:border-gold-400/30 hover:text-gold-300',
              blue: active ? 'bg-blue-400/15 border-blue-400/40 text-blue-300' : 'border-lavender/10 text-lavender/50 hover:border-blue-400/30 hover:text-blue-300',
              green: active ? 'bg-green-400/15 border-green-400/40 text-green-300' : 'border-lavender/10 text-lavender/50 hover:border-green-400/30 hover:text-green-300',
              violet: active ? 'bg-violet-400/15 border-violet-400/40 text-violet-300' : 'border-lavender/10 text-lavender/50 hover:border-violet-400/30 hover:text-violet-300',
            }
            const Icon = p.icon
            return (
              <button
                key={p.value}
                onClick={() => setSelectedPathway(active ? '' : p.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all ${colorMap[p.color]}`}
              >
                <Icon className="w-3.5 h-3.5" /> {p.label}
              </button>
            )
          })}
        </div>

        {/* Expandable Tags / Filters panel */}
        <div className="rounded-2xl border border-lavender/10 bg-void-800/30 overflow-hidden">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-lavender/70 hover:text-cream transition-colors"
          >
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4" /> Tags & Filters
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-lavender/5"
              >
                <div className="p-4 space-y-4">
                  {/* Entity type */}
                  <div>
                    <label className="block text-xs text-lavender/50 mb-2 uppercase tracking-wider">Looking for</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'any', label: 'All' },
                        { value: 'wish', label: 'Wish' },
                        { value: 'gift', label: 'Gift' },
                        { value: 'offering', label: 'Offering' },
                        { value: 'vendor', label: 'Vendor' },
                      ].map((et) => (
                        <button
                          key={et.value}
                          onClick={() => setSelectedEntityType(et.value as any)}
                          className={`px-3 py-1.5 rounded-full border text-xs transition-all ${
                            selectedEntityType === et.value
                              ? 'bg-magenta-400/10 border-magenta-400/30 text-magenta-300'
                              : 'border-lavender/10 text-lavender/50 hover:border-lavender/30'
                          }`}
                        >
                          {et.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Categories */}
                  <div>
                    <label className="block text-xs text-lavender/50 mb-2 uppercase tracking-wider">Category</label>
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
                      {categories.map((cat) => (
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
                  </div>

                  {/* Roles */}
                  {allRoles.length > 0 && (
                    <div>
                      <label className="block text-xs text-lavender/50 mb-2 uppercase tracking-wider">Role</label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedRole('')}
                          className={`px-3 py-1.5 rounded-full border text-xs transition-all ${
                            !selectedRole
                              ? 'bg-magenta-400/10 border-magenta-400/30 text-magenta-300'
                              : 'border-lavender/10 text-lavender/50 hover:border-lavender/30'
                          }`}
                        >
                          All
                        </button>
                        {allRoles.map((role) => (
                          <button
                            key={role}
                            onClick={() => setSelectedRole(role === selectedRole ? '' : role)}
                            className={`px-3 py-1.5 rounded-full border text-xs transition-all ${
                              selectedRole === role
                                ? 'bg-magenta-400/10 border-magenta-400/30 text-magenta-300'
                                : 'border-lavender/10 text-lavender/50 hover:border-lavender/30'
                            }`}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-xs text-lavender/40">
          {filtered.length} {filtered.length === 1 ? 'being' : 'beings'} in the exchange field
        </p>
      </div>
      {isLoadingWishes ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Sparkles className="w-12 h-12 text-lavender/30 mx-auto mb-4 animate-pulse" />
          <h2 className="font-serif text-2xl text-cream mb-3">Tuning into the Exchange Field</h2>
          <p className="text-lavender/60">Gathering wishes, gifts, and offerings from across the Collective…</p>
        </motion.div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Sparkles className="w-12 h-12 text-lavender/30 mx-auto mb-4" />
          <h2 className="font-serif text-2xl text-cream mb-3">The Exchange Field Awaits Your Resonance</h2>
          <p className="text-lavender/60 mb-2">
            The Heartlight Collective is alive, and your presence adds to its frequency.
          </p>
          <p className="text-lavender/60 mb-6">
            Be the first to cast a wish, share a gift, or open a Vendor Shop.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/exchange/wish/cast-wish?type=wish"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-magenta-400/10 border border-magenta-400/30 text-magenta-300 hover:bg-magenta-400/20 transition-all"
            >
              Cast a Wish <PiShootingStar className="w-4 h-4" />
            </Link>
            <Link
              to="/exchange/gift/share-gift?type=gift"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all"
            >
              Share a Gift <HandHeart className="w-4 h-4" />
            </Link>
            <Link
              to="/flow"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-400/10 border border-blue-400/30 text-blue-300 hover:bg-blue-400/20 transition-all"
            >
              Open a Vendor Shop <Store className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map((wish, i) => (
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
                  <span className={`px-2 py-0.5 rounded-full text-xs ${(URGENCY_CONFIG[wish.urgency as keyof typeof URGENCY_CONFIG] || URGENCY_CONFIG.low).bg} ${(URGENCY_CONFIG[wish.urgency as keyof typeof URGENCY_CONFIG] || URGENCY_CONFIG.low).color}`}>
                    <Clock className="w-2.5 h-2.5 inline mr-1" />
                    {(URGENCY_CONFIG[wish.urgency as keyof typeof URGENCY_CONFIG] || URGENCY_CONFIG.low).label}
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
              <div className="flex items-start gap-3 mb-2">
                <h3 className="font-serif text-lg text-cream line-clamp-2 flex-1">{wish.title}</h3>
                {wish.type === 'offering' && wish.vendorLogoUrl && (
                  <img src={wish.vendorLogoUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-lavender/10 shrink-0" />
                )}
              </div>

              {/* Gallery thumbnail */}
              {wish.gallery?.length > 0 && (
                <div className="mb-3 rounded-xl overflow-hidden border border-lavender/10">
                  <img
                    src={wish.gallery[0].url}
                    alt={wish.gallery[0].caption || ''}
                    className="w-full h-40 object-cover"
                  />
                  {wish.gallery.length > 1 && (
                    <div className="px-3 py-1.5 bg-void-900 text-xs text-lavender/40 flex items-center justify-between">
                      <span>{wish.gallery[0].caption || 'Gallery'}</span>
                      <span>+{wish.gallery.length - 1} more</span>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <p className="text-lavender/60 text-sm mb-3 line-clamp-2">
                {wish.description}
              </p>

              {/* Skills */}
              {wish.skills?.length > 0 && (
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
                  {viewScope === 'local' && wish.locationData?.lat && wish.locationData?.lon && (searchLocation || userLocation) && (
                    <span className="text-green-400">
                      {(() => {
                        const origin = searchLocation ? { lat: searchLocation.lat, lon: searchLocation.lon } : userLocation
                        if (!origin) return null
                        const dist = haversineDistance(
                          { lat: wish.locationData.lat, lon: wish.locationData.lon },
                          origin
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-full border border-lavender/20 text-lavender/70 hover:border-gold-400/40 hover:text-gold-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-lavender/60">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-full border border-lavender/20 text-lavender/70 hover:border-gold-400/40 hover:text-gold-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Next page"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        )}
        </>
      )}
      {/* Wish Detail Modal */}
      {/* Wish Detail Modal */}
      <AnimatePresence>
        {selectedWish && (
          <WishDetailModal
            wish={selectedWish}
            findVendorById={findVendorById}
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
                  // Wave 8.2
                  offeringType: selectedWish.offeringType,
                  virtualSession: selectedWish.virtualSession,
                  workStudyExchange: selectedWish.workStudyExchange,
                  location: selectedWish.location,
                  requiresScheduling: selectedWish.requiresScheduling,
                  fulfillers: selectedWish.fulfillers,
                  gallery: selectedWish.gallery,
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
                setWishes(JSON.parse(localStorage.getItem('hlw_wishes') || '[]'))
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
              setWishes(JSON.parse(localStorage.getItem('hlw_wishes') || '[]'))
            }}
            onSigned={() => {
              setEditingAgreement(null)
              navigate('/flow')
            }}
          />
        )}
      </AnimatePresence>

      {/* Stats Bar */}
      <div className="flex items-center justify-center gap-6 mt-12 text-xs text-lavender/40 flex-wrap">
        <span><Heart className="w-3 h-3 inline mr-1 text-magenta-400" />{wishCount} wishes</span>
        <span><Sparkles className="w-3 h-3 inline mr-1 text-gold-400" />{offerCount} gifts</span>
        <span><Store className="w-3 h-3 inline mr-1 text-blue-400" />{offeringCount} offerings</span>
        <span><Tag className="w-3 h-3 inline mr-1 text-lavender/50" />{categories.length} categories</span>
      </div>
    </div>
  )
}


/* ─── Code Frequency Ring (offering detail only) ─── */
function WishDetailModal({ wish, findVendorById, onClose, onClaim }: { wish: any; findVendorById: (id: string) => VendorRecord | undefined; onClose: () => void; onClaim: () => void }) {
  const u = URGENCY_CONFIG[wish.urgency as keyof typeof URGENCY_CONFIG] || URGENCY_CONFIG.low
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
            {isOffering ? `Offered by ${wish.vendorName || wish.postedByName || 'Unknown'}` : `Posted by ${wish.postedByName || 'Unknown'}`}
            {' • '}
            {wish.category || 'Uncategorized'} {CATEGORY_EMOJIS[wish.category || 'Other'] || '✨'}
          </p>
        </div>

        <div className="space-y-5">
          {/* Vendor icon + name */}
          {isOffering && (wish.vendorLogoUrl || wish.vendorLinks?.length > 0) && (
            <Link
              to={`/flow/vendor-shop/${wish.vendorId ? (findVendorById(wish.vendorId)?.slug || wish.vendorId) : ''}`}
              className="flex items-center gap-3 rounded-xl border border-lavender/10 bg-void-800/40 p-3 hover:border-gold-400/30 transition-all"
            >
              {wish.vendorLogoUrl && (
                <img src={wish.vendorLogoUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-lavender/10" />
              )}
              <div className="flex-1">
                <p className="text-xs text-lavender/50 mb-1">Vendor Shop</p>
                <p className="text-sm text-cream">{wish.vendorName || wish.postedByName}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {wish.vendorLinks?.filter((l: any) => l.url?.trim()).map((l: any) => (
                  <a
                    key={l.id}
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs px-2 py-1 rounded-full bg-lavender/5 border border-lavender/10 text-lavender/60 hover:text-cream hover:border-lavender/30 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {l.label || 'Link'}
                  </a>
                ))}
              </div>
            </Link>
          )}

          {/* Gallery */}
          {wish.gallery?.length > 0 && (
            <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-4">
              <label className="block text-xs text-lavender/50 mb-2 uppercase tracking-wider">Gallery</label>
              <div className="grid grid-cols-2 gap-2">
                {wish.gallery.map((item: any) => (
                  <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-lavender/10">
                    <img src={item.url} alt={item.caption || ''} className="w-full h-32 object-cover" />
                    {item.caption && <p className="text-[10px] text-lavender/40 px-2 py-1 truncate">{item.caption}</p>}
                  </a>
                ))}
              </div>
            </div>
          )}

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
                {isOffering ? formatPrice() : (wish.location || 'Anywhere')}
              </div>
            </div>

            <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-3">
              <label className="block text-xs text-lavender/50 mb-1">{isOffering ? 'Availability' : 'Time Commitment'}</label>
              <div className="text-sm text-cream">{isOffering ? (wish.availability || 'Available') : (wish.timeCommitment || '')}</div>
            </div>

            <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-3">
              <label className="block text-xs text-lavender/50 mb-1">{isOffering ? 'Vendor' : 'Exchange Avenue'}</label>
              <div className="text-sm text-cream">{isOffering ? (wish.vendorName || wish.postedByName || 'Unknown') : (wish.exchangeAvenue || '')}</div>
            </div>

            <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-3">
              <label className="block text-xs text-lavender/50 mb-1">{isOffering ? 'Category' : 'Resources'}</label>
              <div className="flex flex-wrap gap-1">
                {isOffering ? (
                  <span className="text-xs text-lavender/60 bg-void-900 px-2 py-0.5 rounded-full">{wish.category || 'Other'}</span>
                ) : (
                  (wish.resources || []).map((r: string) => (
                    <span key={r} className="text-xs text-lavender/60 bg-void-900 px-2 py-0.5 rounded-full">
                      {r}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Skills */}
          {!isOffering && (wish.skills?.length > 0) && (
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
          {/* NOTE: Hidden per request — frequencies are carried implicitly in every exchange. */}
          {false && (
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
          )}

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

