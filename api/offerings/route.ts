// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Offerings List + Create
//  GET  /api/offerings          — list all offerings (optionally ?vendor={vid})
//  POST /api/offerings          — create a new offering
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { redis, Keys } from '../_lib/redis.js'
import { json, error } from '../_lib/response.js'

// ── GET: List offerings (optionally filtered by vendor ID) ──
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const vendorId = url.searchParams.get('vendor')

    let offeringIds: string[]

    if (vendorId) {
      // Fast path: vendor index set
      offeringIds = await redis.smembers(Keys.offeringsByVendor(vendorId))
      // Fallback: scan all if index is empty
      if (!offeringIds || offeringIds.length === 0) {
        const allIds = await redis.smembers(Keys.offeringsAll)
        if (!allIds || allIds.length === 0) return json([])
        const allKeys = allIds.map((oid) => Keys.offering(oid))
        const allRaw = await redis.mget<string[]>(...allKeys)
        offeringIds = []
        for (let i = 0; i < allRaw.length; i++) {
          if (!allRaw[i]) continue
          try {
            const o = typeof allRaw[i] === 'string' ? JSON.parse(allRaw[i]) : allRaw[i]
            if (o.vendor_id === vendorId) offeringIds.push(allIds[i])
          } catch { /* skip */ }
        }
        // Rebuild index
        if (offeringIds.length > 0) {
          await redis.sadd(Keys.offeringsByVendor(vendorId), offeringIds)
        }
      }
    } else {
      offeringIds = await redis.smembers(Keys.offeringsAll)
    }

    if (!offeringIds || offeringIds.length === 0) return json([])

    const keys = offeringIds.map((oid) => Keys.offering(oid))
    const rawOfferings = await redis.mget<string[]>(...keys)

    const offerings: Record<string, unknown>[] = []
    for (const raw of rawOfferings) {
      if (!raw) continue
      try {
        offerings.push(typeof raw === 'string' ? JSON.parse(raw) : raw)
      } catch { /* skip corrupted */ }
    }

    return json(offerings)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return error(`Failed to list offerings: ${message}`, 500)
  }
}

// ── POST: Create a new offering ──
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, vendor_id, title, category, ...rest } = body as {
      id?: string
      vendor_id?: string
      title?: string
      category?: string
      [key: string]: unknown
    }

    if (!vendor_id) {
      return error('vendor_id is required', 400)
    }
    if (!title) {
      return error('title is required', 400)
    }

    // Verify the parent vendor exists
    const vendorExists = await redis.exists(Keys.vendor(vendor_id))
    if (!vendorExists) {
      return error(`Vendor ${vendor_id} does not exist`, 400)
    }

    // Generate ID if not provided
    const offeringId = id || `offering_${Math.random().toString(36).slice(2, 10)}`

    // Check if offering ID already exists
    const existing = await redis.exists(Keys.offering(offeringId))
    if (existing) {
      return error(`Offering with ID ${offeringId} already exists`, 409)
    }

    const now = new Date().toISOString()
    const offering: Record<string, unknown> = {
      id: offeringId,
      vendor_id,
      title,
      category: category || 'Other',
      ...rest,
      price_type: (rest.price_type as string) || 'gift',
      price_cents: rest.price_cents ?? null,
      currency: (rest.currency as string) || 'USD',
      availability: (rest.availability as string) || 'available',
      consent_required: Boolean(rest.consent_required),
      max_participants: rest.max_participants ?? null,
      exchange_policy: rest.exchange_policy || [],
      tags: rest.tags || [],
      created_at: (rest.created_at as string) || now,
      updated_at: now,
    }

    // Store offering JSON
    await redis.set(Keys.offering(offeringId), JSON.stringify(offering))

    // Add to index sets
    await redis.sadd(Keys.offeringsAll, offeringId)
    await redis.sadd(Keys.offeringsByVendor(vendor_id), offeringId)

    return json(offering, 201)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return error(`Failed to create offering: ${message}`, 500)
  }
}