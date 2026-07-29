// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Frontend API Client
//  Thin wrapper for the Vercel /api routes backed by Upstash Redis
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

const API_BASE = '/api'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })

  let data: unknown
  const text = await res.text()
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { raw: text }
  }

  if (!res.ok) {
    const message = typeof data === 'object' && data && 'error' in data
      ? String((data as { error?: string }).error)
      : `${res.status} ${res.statusText}`
    throw new ApiError(message, res.status)
  }

  return data as T
}

// ── Health ──
export const healthCheck = () => apiRequest<{ status: string; ok: boolean }>('/health')

// ── Profiles ──
export const listProfiles = () => apiRequest<unknown[]>('/profiles')
export const getProfile = (ces: string) => apiRequest<unknown>(`/profiles/${encodeURIComponent(ces)}`)

// ── Vendors ──
export type VendorFromApi = Record<string, unknown>
export const listVendors = () => apiRequest<VendorFromApi[]>('/vendors')
export const getVendor = (id: string) => apiRequest<VendorFromApi>(`/vendors/${encodeURIComponent(id)}`)
export const createVendor = (body: Record<string, unknown>) =>
  apiRequest<VendorFromApi>('/vendors', { method: 'POST', body: JSON.stringify(body) })
export const updateVendor = (id: string, body: Record<string, unknown>) =>
  apiRequest<VendorFromApi>(`/vendors/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) })

// ── Offerings ──
export type OfferingFromApi = Record<string, unknown>
export const listOfferings = (vendorId?: string) =>
  apiRequest<OfferingFromApi[]>(vendorId ? `/offerings?vendor=${encodeURIComponent(vendorId)}` : '/offerings')
export const getOffering = (id: string) => apiRequest<OfferingFromApi>(`/offerings/${encodeURIComponent(id)}`)
export const createOffering = (body: Record<string, unknown>) =>
  apiRequest<OfferingFromApi>('/offerings', { method: 'POST', body: JSON.stringify(body) })
export const updateOffering = (id: string, body: Record<string, unknown>) =>
  apiRequest<OfferingFromApi>(`/offerings/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) })

// ── Wishes ──
export const listWishes = (author?: string) =>
  apiRequest<unknown[]>(author ? `/wishes?author=${encodeURIComponent(author)}` : '/wishes')

// ── Exchange Entities ──
export const listExchangeRequests = () => apiRequest<unknown[]>('/exchange-requests')
export const listExchangeAgreements = () => apiRequest<unknown[]>('/exchange-agreements')
export const listExchangeJourneys = () => apiRequest<unknown[]>('/exchange-journeys')
export const listExchangeAlerts = () => apiRequest<unknown[]>('/exchange-alerts')
export const listCodeLogs = () => apiRequest<unknown[]>('/code-logs')
export const listVendorInvites = () => apiRequest<unknown[]>('/vendor-invites')
export const listVendorJoinRequests = () => apiRequest<unknown[]>('/vendor-join-requests')
export const listCollectivePetitions = () => apiRequest<unknown[]>('/collective-petitions')
export const getExchangeCalendar = (ces: string) =>
  apiRequest<unknown>(`/exchange-calendars/${encodeURIComponent(ces)}`)
