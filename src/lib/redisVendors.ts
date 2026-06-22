// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Remote Vendor Hydration Helper
//  Fetches Vendor Shops + Offerings from Upstash Redis via /api/*
//  and merges them with localStorage state so the Directory & Exchange
//  stay synchronized across devices and fresh browsers.
// ─────────────────────────────────────────────────────────────

import type { VendorRecord, OfferingItem } from '../types/ces'

interface ApiVendor {
  id: string
  name: string
  slug: string
  description?: string
  core_directive?: string
  logo_url?: string
  owner_ces: string
  owner_name?: string
  members?: unknown[]
  payment_methods?: unknown[]
  exchange_policy?: string[]
  location_data?: unknown
  tags?: string[]
  links?: unknown[]
  status?: string
  collective_funded?: boolean
  created_at?: string
  updated_at?: string
  offerings?: ApiOffering[]
}

interface ApiOffering {
  id: string
  vendor_id: string
  title: string
  description?: string
  category?: string
  price_type?: string
  price_cents?: number | null
  currency?: string
  image_url?: string | null
  gallery?: unknown[]
  availability?: string
  consent_required?: boolean
  max_participants?: number | null
  stripe_price_id?: string | null
  exchange_policy?: string[]
  tags?: string[]
  offering_type?: string
  virtual_session?: unknown
  work_study_exchange?: unknown
  location?: unknown
  requires_scheduling?: boolean
  fulfillers?: unknown[]
  created_at?: string
  updated_at?: string
}

function apiVendorToRecord(v: ApiVendor): VendorRecord {
  return {
    id: String(v.id),
    name: String(v.name),
    slug: String(v.slug || v.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || v.id),
    description: String(v.description || v.core_directive || ''),
    coreDirective: v.core_directive || undefined,
    logoUrl: v.logo_url || undefined,
    ownerCes: String(v.owner_ces),
    ownerName: String(v.owner_name || v.name),
    members: Array.isArray(v.members) ? (v.members as VendorRecord['members']) : [],
    offerings: [],
    paymentMethods: Array.isArray(v.payment_methods) ? (v.payment_methods as VendorRecord['paymentMethods']) : [],
    exchangePolicy: Array.isArray(v.exchange_policy) ? (v.exchange_policy as VendorRecord['exchangePolicy']) : undefined,
    locationData: v.location_data as VendorRecord['locationData'] | undefined,
    tags: Array.isArray(v.tags) ? v.tags : undefined,
    links: Array.isArray(v.links) ? (v.links as VendorRecord['links']) : undefined,
    status: (v.status as VendorRecord['status']) || 'active',
    collectiveFunded: Boolean(v.collective_funded),
    joinRequests: [],
    createdAt: String(v.created_at || new Date().toISOString()),
    updatedAt: String(v.updated_at || new Date().toISOString()),
  }
}

function apiOfferingToRecord(o: ApiOffering): OfferingItem {
  return {
    id: String(o.id),
    vendorId: String(o.vendor_id),
    title: String(o.title),
    description: String(o.description || ''),
    category: (o.category || 'Other') as OfferingItem['category'],
    priceType: (o.price_type || 'gift') as OfferingItem['priceType'],
    priceCents: o.price_cents ?? undefined,
    currency: (o.currency || 'USD') as OfferingItem['currency'],
    imageUrl: o.image_url || undefined,
    gallery: Array.isArray(o.gallery) ? (o.gallery as OfferingItem['gallery']) : undefined,
    availability: (o.availability || 'available') as OfferingItem['availability'],
    consentRequired: Boolean(o.consent_required),
    maxParticipants: o.max_participants ?? undefined,
    stripePriceId: o.stripe_price_id || undefined,
    exchangePolicy: Array.isArray(o.exchange_policy) ? (o.exchange_policy as OfferingItem['exchangePolicy']) : undefined,
    tags: Array.isArray(o.tags) ? o.tags : undefined,
    offeringType: (o.offering_type as OfferingItem['offeringType']) || undefined,
    virtualSession: o.virtual_session as OfferingItem['virtualSession'] | undefined,
    workStudyExchange: o.work_study_exchange as OfferingItem['workStudyExchange'] | undefined,
    location: o.location as OfferingItem['location'] | undefined,
    requiresScheduling: Boolean(o.requires_scheduling),
    fulfillers: Array.isArray(o.fulfillers) ? (o.fulfillers as OfferingItem['fulfillers']) : undefined,
    createdAt: String(o.created_at || new Date().toISOString()),
    updatedAt: String(o.updated_at || new Date().toISOString()),
  }
}

export interface RemoteVendorsResult {
  vendors: VendorRecord[]
  error?: string
}

/**
 * Fetch all Vendor Shops from Redis and hydrate each with its offerings.
 * Safe to call from any page; returns empty array on failure so local data
 * remains authoritative as a fallback.
 */
export async function fetchRemoteVendors(): Promise<RemoteVendorsResult> {
  try {
    const [vendorRes, offeringRes] = await Promise.all([
      fetch('/api/vendors'),
      fetch('/api/offerings'),
    ])

    if (!vendorRes.ok) {
      const body = await vendorRes.json().catch(() => ({}))
      throw new Error(`Vendors API ${vendorRes.status}: ${body.error || vendorRes.statusText}`)
    }

    const vendorRows: ApiVendor[] = (await vendorRes.json()) || []
    const offeringRows: ApiOffering[] = offeringRes.ok ? ((await offeringRes.json()) || []) : []

    // Group offerings by vendor_id for fast hydration
    const offeringsByVendor = new Map<string, OfferingItem[]>()
    for (const o of offeringRows) {
      if (!o?.vendor_id) continue
      const list = offeringsByVendor.get(o.vendor_id) || []
      list.push(apiOfferingToRecord(o))
      offeringsByVendor.set(o.vendor_id, list)
    }

    const vendors: VendorRecord[] = []
    for (const v of vendorRows) {
      if (!v?.id) continue
      const vendor = apiVendorToRecord(v)
      // Prefer hydrated offerings list from dedicated API, fall back to inline offerings
      vendor.offerings = offeringsByVendor.get(vendor.id) ||
        (Array.isArray(v.offerings) ? v.offerings.map(apiOfferingToRecord) : [])
      vendors.push(vendor)
    }

    return { vendors }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn('[fetchRemoteVendors] failed:', message)
    return { vendors: [], error: message }
  }
}
