// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Resonant Matching Engine
//  Scores beings and Vendor Shops against a wish's intention
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import type {
  Wish,
  CreatorRecord,
  VendorRecord,
  OfferingItem,
  MatchResult,
  LocationData,
  ExchangeForm,
} from '../types/ces'

/* ═══════════════════════════════════════════════════════════════
   Default weights
   ═══════════════════════════════════════════════════════════════ */

const DEFAULT_WEIGHTS = {
  category: 30,
  skills: 20,        // per overlap
  resources: 15,     // per overlap
  locationClose: 25,
  locationMedium: 15,
  locationContinent: 5,
  exchangeAvenues: 20,
  timeline: 10,
  availability: 10,
}

const MAX_POSSIBLE = 150

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */

function normalize(str: string): string {
  return str.toLowerCase().trim()
}

function overlapScore(needles: string[], haystack: string[]): number {
  if (!needles.length || !haystack.length) return 0
  const normHay = haystack.map(normalize)
  let hits = 0
  for (const n of needles) {
    const nn = normalize(n)
    if (normHay.some((h) => h.includes(nn) || nn.includes(h))) hits++
  }
  return hits
}

function haversineKm(a: LocationData, b: LocationData): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const sinDLat = Math.sin(dLat / 2)
  const sinDLon = Math.sin(dLon / 2)
  const c =
    2 *
    Math.atan2(
      Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon),
      Math.sqrt(1 - (sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon))
    )
  return R * c
}

function locationScore(wishLoc: LocationData | undefined, candidateLoc: LocationData | undefined): { points: number; reason: string } {
  if (!wishLoc || !candidateLoc) return { points: DEFAULT_WEIGHTS.locationContinent, reason: 'Location unknown — field is open' }
  const dist = haversineKm(wishLoc, candidateLoc)
  if (dist <= 50) return { points: DEFAULT_WEIGHTS.locationClose, reason: `Within ${Math.round(dist)} km` }
  if (dist <= 200) return { points: DEFAULT_WEIGHTS.locationMedium, reason: `Within ${Math.round(dist)} km` }
  if (wishLoc.continent && candidateLoc.continent && wishLoc.continent === candidateLoc.continent) {
    return { points: DEFAULT_WEIGHTS.locationContinent, reason: `Same continent — ${wishLoc.continent}` }
  }
  return { points: 0, reason: 'Distant — still resonant in the field' }
}

function exchangeAvenueCompatibility(wishForms: ExchangeForm[] | undefined, candidateForms: ExchangeForm[] | undefined): { points: number; reason: string } {
  if (!wishForms?.length || !candidateForms?.length) return { points: 0, reason: '' }
  const wishSet = new Set(wishForms)
  const matches = candidateForms.filter((f) => wishSet.has(f))
  if (matches.length === 0) return { points: 0, reason: 'No exchange avenue overlap' }
  if (matches.length === wishForms.length) return { points: DEFAULT_WEIGHTS.exchangeAvenues, reason: 'All exchange avenues aligned' }
  return { points: Math.round(DEFAULT_WEIGHTS.exchangeAvenues * (matches.length / wishForms.length)), reason: `${matches.length} of ${wishForms.length} exchange avenues aligned` }
}

function timelineCompatibility(wishTimeline: string | undefined, offering: OfferingItem | undefined): { points: number; reason: string } {
  if (!wishTimeline) return { points: DEFAULT_WEIGHTS.timeline, reason: 'Open timeline' }
  if (wishTimeline === 'ongoing') return { points: DEFAULT_WEIGHTS.timeline, reason: 'Open-ended timeline' }
  // Default: timeline is compatible unless there's a strong signal otherwise
  return { points: DEFAULT_WEIGHTS.timeline, reason: 'Timeline compatible' }
}

/* ═══════════════════════════════════════════════════════════════
   Scoring a Registered Being (CreatorRecord)
   ═══════════════════════════════════════════════════════════════ */

function scoreRegisteredBeing(wish: Wish, profile: CreatorRecord): MatchResult {
  let score = 0
  const reasons: string[] = []

  // Category alignment
  if (profile.tags?.some((t) => normalize(t).includes(normalize(wish.category)) || normalize(wish.category).includes(normalize(t)))) {
    score += DEFAULT_WEIGHTS.category
    reasons.push(`Category resonance: ${wish.category}`)
  }

  // Skills overlap
  const skillHits = overlapScore(wish.skillsNeeded || [], profile.tags || [])
  if (skillHits > 0) {
    score += DEFAULT_WEIGHTS.skills * skillHits
    reasons.push(`Skills alignment: ${skillHits} match${skillHits > 1 ? 'es' : ''}`)
  }

  // Resources overlap
  const resourceHits = overlapScore(wish.resourcesNeeded || [], profile.tags || [])
  if (resourceHits > 0) {
    score += DEFAULT_WEIGHTS.resources * resourceHits
    reasons.push(`Resources alignment: ${resourceHits} match${resourceHits > 1 ? 'es' : ''}`)
  }

  // Location
  const loc = locationScore(wish.locationData, profile.locationData)
  score += loc.points
  if (loc.points > 0) reasons.push(loc.reason)

  // Exchange avenues
  const ex = exchangeAvenueCompatibility(wish.exchangeForms, undefined)
  // For beings without explicit exchange policy, we check their offerings or assume flexibility
  score += ex.points
  if (ex.points > 0) reasons.push(ex.reason)

  // Timeline
  const tl = timelineCompatibility(wish.completionTimeline, undefined)
  score += tl.points
  if (tl.points > 0) reasons.push(tl.reason)

  // Availability
  if (profile.stewardship === 'active') {
    score += DEFAULT_WEIGHTS.availability
    reasons.push('Active steward — available to co-create')
  }

  const scorePercent = Math.min(100, Math.round((score / MAX_POSSIBLE) * 100))

  return {
    candidateId: profile.cesNumber,
    candidateType: 'registered',
    score,
    scorePercent,
    reasons,
    profile,
  }
}

/* ═══════════════════════════════════════════════════════════════
   Scoring a Vendor Shop
   ═══════════════════════════════════════════════════════════════ */

function scoreVendor(wish: Wish, vendor: VendorRecord): MatchResult {
  let score = 0
  const reasons: string[] = []

  // Category alignment via tags
  if (vendor.tags?.some((t) => normalize(t).includes(normalize(wish.category)) || normalize(wish.category).includes(normalize(t)))) {
    score += DEFAULT_WEIGHTS.category
    reasons.push(`Category resonance: ${wish.category}`)
  }

  // Offering-level matches
  let bestOffering: OfferingItem | undefined
  let bestOfferingScore = 0

  for (const o of vendor.offerings || []) {
    let oScore = 0
    const oReasons: string[] = []

    // Skills
    const skillHits = overlapScore(wish.skillsNeeded || [], o.tags || [])
    if (skillHits > 0) {
      oScore += DEFAULT_WEIGHTS.skills * skillHits
      oReasons.push(`${skillHits} skill match${skillHits > 1 ? 'es' : ''}`)
    }

    // Resources
    const resourceHits = overlapScore(wish.resourcesNeeded || [], o.tags || [])
    if (resourceHits > 0) {
      oScore += DEFAULT_WEIGHTS.resources * resourceHits
      oReasons.push(`${resourceHits} resource match${resourceHits > 1 ? 'es' : ''}`)
    }

    // Exchange avenue compatibility
    const ex = exchangeAvenueCompatibility(wish.exchangeForms, vendor.exchangePolicy)
    oScore += ex.points
    if (ex.points > 0) oReasons.push(ex.reason)

    // Timeline
    const tl = timelineCompatibility(wish.completionTimeline, o)
    oScore += tl.points
    if (tl.points > 0) oReasons.push(tl.reason)

    if (oScore > bestOfferingScore) {
      bestOfferingScore = oScore
      bestOffering = o
    }
  }

  if (bestOffering) {
    score += bestOfferingScore
    reasons.push(`Offering resonance: "${bestOffering.title}"`)
  }

  // Location
  const loc = locationScore(wish.locationData, vendor.locationData)
  score += loc.points
  if (loc.points > 0) reasons.push(loc.reason)

  // Vendor availability (active status)
  if (vendor.status === 'active') {
    score += DEFAULT_WEIGHTS.availability
    reasons.push('Active Vendor Shop — open for exchange')
  }

  const scorePercent = Math.min(100, Math.round((score / MAX_POSSIBLE) * 100))

  return {
    candidateId: vendor.id,
    candidateType: 'vendor',
    score,
    scorePercent,
    reasons,
    vendor,
  }
}

/* ═══════════════════════════════════════════════════════════════
   Public API
   ═══════════════════════════════════════════════════════════════ */

export interface MatchPool {
  profiles: CreatorRecord[]
  vendors: VendorRecord[]
}

export function findResonantMatches(wish: Wish, pool: MatchPool, opts?: { topN?: number; minScore?: number }): MatchResult[] {
  const { topN = 10, minScore = 10 } = opts || {}

  const results: MatchResult[] = []

  for (const profile of pool.profiles) {
    if (profile.stewardship !== 'active') continue
    results.push(scoreRegisteredBeing(wish, profile))
  }

  for (const vendor of pool.vendors) {
    if (vendor.status !== 'active') continue
    results.push(scoreVendor(wish, vendor))
  }

  return results
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
}

/** Warm messages for the alignment loading screen */
export const ALIGNMENT_MESSAGES = [
  'Scanning the Heartlight Collective...',
  'Aligning by category resonance...',
  'Matching skills and resources...',
  'Checking availability and proximity...',
  'Tuning to exchange avenue compatibility...',
  'Your matches are ready.',
]
