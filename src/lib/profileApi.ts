// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Profile HTTP Client
//  Replaces direct Supabase calls with serverless Redis-backed API
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import type { CreatorRecord } from '../types/ces'

export interface ApiResult<T> {
  success: boolean
  data?: T
  error?: string
}

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */

async function getJson<T>(url: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { success: false, error: body.error || `${res.status} ${res.statusText}` }
    }
    const data = await res.json()
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' }
  }
}

async function postJson<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const bodyJson = await res.json().catch(() => ({}))
      return { success: false, error: bodyJson.error || `${res.status} ${res.statusText}` }
    }
    const data = await res.json()
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' }
  }
}

async function putJson<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const bodyJson = await res.json().catch(() => ({}))
      return { success: false, error: bodyJson.error || `${res.status} ${res.statusText}` }
    }
    const data = await res.json()
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' }
  }
}

/* ═══════════════════════════════════════════════════════════════
   Profile CRUD
   ═══════════════════════════════════════════════════════════════ */

/** GET /api/profiles — list all profiles */
export async function fetchProfiles(): Promise<CreatorRecord[]> {
  const result = await getJson<Record<string, unknown>[]>('/api/profiles')
  if (!result.success || !result.data) return []
  return result.data.map(rowToCreatorRecord)
}

/** GET /api/profiles/{ces} — fetch one profile */
export async function fetchProfileByCes(ces: string): Promise<CreatorRecord | undefined> {
  const result = await getJson<Record<string, unknown>>(`/api/profiles/${ces}`)
  if (!result.success || !result.data) return undefined
  return rowToCreatorRecord(result.data)
}

/** POST /api/profiles — create a new profile */
export async function createProfileApi(profile: CreatorRecord): Promise<ApiResult<CreatorRecord>> {
  const body = profileToApiBody(profile)
  const result = await postJson<unknown>('/api/profiles', body)
  if (!result.success || !result.data) return result as ApiResult<CreatorRecord>
  return { success: true, data: rowToCreatorRecord(result.data as Record<string, unknown>) }
}

/** PUT /api/profiles/{ces} — update an existing profile */
export async function updateProfileApi(ces: string, profile: CreatorRecord): Promise<ApiResult<CreatorRecord>> {
  const body = profileToApiBody(profile)
  const result = await putJson<unknown>(`/api/profiles/${ces}`, body)
  if (!result.success || !result.data) return result as ApiResult<CreatorRecord>
  return { success: true, data: rowToCreatorRecord(result.data as Record<string, unknown>) }
}

/** GET /api/profiles/stewardship/{status} — list by stewardship */
export async function fetchProfilesByStewardship(status: string): Promise<CreatorRecord[]> {
  const result = await getJson<Record<string, unknown>[]>(`/api/profiles/stewardship/${status}`)
  if (!result.success || !result.data) return []
  return result.data.map(rowToCreatorRecord)
}

/* ═══════════════════════════════════════════════════════════════
   Auth — verify CES + passphrase
   ═══════════════════════════════════════════════════════════════ */

export async function verifyCesPassphrase(ces: string, passphrase: string): Promise<ApiResult<CreatorRecord>> {
  const result = await postJson<unknown>('/api/auth/signin', { ces, passphrase })
  if (!result.success || !result.data) return result as ApiResult<CreatorRecord>
  const data = result.data as Record<string, unknown>
  const profile = (data.profile as Record<string, unknown>) || data
  return { success: true, data: rowToCreatorRecord(profile) }
}

/* ═══════════════════════════════════════════════════════════════
   Mappers: app entity ↔ API row
   ═══════════════════════════════════════════════════════════════ */

function profileToApiBody(profile: CreatorRecord): Record<string, unknown> {
  return {
    ces_number: profile.cesNumber,
    name: profile.name,
    pronouns: profile.pronouns || '',
    title: profile.title || '',
    location: profile.location || '',
    emoji: profile.emoji || '✨',
    photo_url: profile.photo || '',
    bio: profile.bio || '',
    tags: profile.tags || [],
    sun_placement: profile.sunPlacement,
    moon_placement: profile.moonPlacement,
    ces_passphrase_hash: profile.passphrase,
    wish_availability: profile.wishAvailability || 'accepting',
    directory_wish_status: profile.directoryWishStatus || 'accepting',
    stewardship: profile.stewardship || 'suspended',
    stewardship_note: profile.stewardshipNote || '',
    contact_methods: profile.contactMethods || {},
    contact_visibility: profile.contactVisibility || {},
    public_contact_visibility: profile.publicContactVisibility || false,
    portfolio_items: profile.portfolioItems || [],
    portfolio_link: profile.portfolioLink || '',
    accessibility: profile.accessibility || [],
    consent: profile.consent || '',
    numerology: profile.numerology || [],
    guide_guardian_status: profile.guideGuardianStatus || 'not_opted_in',
    guide_guardian_opted_in_at: profile.guideGuardianOptedInAt || null,
    peer_payment_methods: profile.peerPaymentMethods || [],
    location_data: profile.locationData || null,
    is_private: profile.isPrivate ?? false,
    created_at: profile.createdAt || null,
    updated_at: profile.updatedAt || new Date().toISOString(),
  }
}

function rowToCreatorRecord(row: Record<string, unknown>): CreatorRecord {
  return {
    id: String(row.id ?? row.uuid ?? ''),
    cesNumber: String(row.ces_number || ''),
    name: String(row.name || ''),
    pronouns: String(row.pronouns || ''),
    title: String(row.title || ''),
    location: String(row.location || ''),
    emoji: String(row.emoji || '✨'),
    photo: String(row.photo_url || ''),
    bio: String(row.bio || ''),
    tags: Array.isArray(row.tags) ? row.tags : [],
    sunPlacement: String(row.sun_placement || ''),
    moonPlacement: String(row.moon_placement || ''),
    passphrase: String(row.ces_passphrase_hash || ''),
    wishAvailability: row.wish_availability === 'closed' ? 'closed' : 'accepting',
    directoryWishStatus: row.directory_wish_status === 'closed' ? 'closed' : 'accepting',
    stewardship: row.stewardship === 'active' || row.stewardship === 'banned'
      ? row.stewardship
      : row.stewardship === 'pending' || row.stewardship === 'returned'
        ? row.stewardship
        : 'suspended',
    stewardshipNote: String(row.stewardship_note || ''),
    contactMethods: (row.contact_methods as CreatorRecord['contactMethods']) || {
      email: '', phone: '', instagram: '', youtube: '', threads: '', spotify: '', discord: '', telegram: '', signal: ''
    },
    contactVisibility: (row.contact_visibility as CreatorRecord['contactVisibility']) || {
      email: false, phone: false, instagram: false, youtube: false, threads: false, spotify: false, discord: false, telegram: false, signal: false
    },
    publicContactVisibility: Boolean(row.public_contact_visibility),
    portfolioItems: Array.isArray(row.portfolio_items) ? row.portfolio_items : [],
    portfolioLink: String(row.portfolio_link || ''),
    accessibility: Array.isArray(row.accessibility) ? row.accessibility : [],
    consent: String(row.consent || ''),
    numerology: Array.isArray(row.numerology) ? row.numerology : [],
    contactMethod: '',
    guideGuardianStatus: ((row.guide_guardian_status as CreatorRecord['guideGuardianStatus'] | undefined) ?? 'not_opted_in') as CreatorRecord['guideGuardianStatus'],
    guideGuardianOptedInAt: (row.guide_guardian_opted_in_at as string | undefined) || undefined,
    peerPaymentMethods: Array.isArray(row.peer_payment_methods) ? row.peer_payment_methods : [],
    locationData: (row.location_data as any) || undefined,
    isPrivate: Boolean(row.is_private),
    createdAt: (row.created_at as string | undefined) || undefined,
    updatedAt: (row.updated_at as string | undefined) || undefined,
    // Legacy optional fields
    ray: undefined,
    rays: undefined,
    heartlight: undefined,
    offerings: undefined,
    exchanges: undefined,
    seasons: undefined,
    timeline: undefined,
    season_current: undefined,
    primaryRay: undefined,
    primaryRayKey: undefined,
  }
}
