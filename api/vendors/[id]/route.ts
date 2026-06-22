// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Vendor by ID (CRUD)
//  GET    /api/vendors/{id}  — fetch one vendor (with offerings + join requests)
//  PUT    /api/vendors/{id}  — update a vendor
//  DELETE /api/vendors/{id}  — remove a vendor + cascade delete offerings
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { redis, Keys } from '../../_lib/redis.js'
import { json, error } from '../../_lib/response.js'

// ── Helper: read and parse a vendor ──
async function readVendor(id: string): Promise<Record<string, unknown> | null> {
  const raw = await redis.get<string>(Keys.vendor(id))
  if (!raw) return null
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return null
  }
}

// ── Helper: hydrate offerings + join requests for a vendor ──
async function hydrateVendorChildren(vendor: Record<string, unknown>): Promise<Record<string, unknown>> {
  const vendorId = vendor.id as string

  // Fetch offerings for this vendor
  const offeringIds = await redis.smembers(Keys.offeringsByVendor(vendorId))
  if (offeringIds && offeringIds.length > 0) {
    const offKeys = offeringIds.map((oid) => Keys.offering(oid))
    const offRaw = await redis.mget<string[]>(...offKeys)
    const offerings: Record<string, unknown>[] = []
    for (const raw of offRaw) {
      if (!raw) continue
      try {
        offerings.push(typeof raw === 'string' ? JSON.parse(raw) : raw)
      } catch { /* skip */ }
    }
    vendor.offerings = offerings
  } else {
    vendor.offerings = vendor.offerings || []
  }

  return vendor
}

// ── GET: Fetch one vendor (with hydrated offerings) ──
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const vendor = await readVendor(id)

    if (!vendor) {
      return error(`No vendor found for ID ${id}`, 404)
    }

    const hydrated = await hydrateVendorChildren(vendor)
    return json(hydrated)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return error(`Failed to fetch vendor: ${message}`, 500)
  }
}

// ── PUT: Update a vendor ──
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const existing = await readVendor(id)

    if (!existing) {
      return error(`No vendor found for ID ${id}`, 404)
    }

    const body = await request.json()
    const { id: _bodyId, owner_ces, ...updates } = body as Record<string, unknown>

    // Prevent owner_ces change (ownership transfers are a separate flow)
    // Prevent id change
    const now = new Date().toISOString()
    const updatedVendor: Record<string, unknown> = {
      ...existing,
      ...updates,
      id, // preserve original ID
      owner_ces: existing.owner_ces, // preserve original owner
      updated_at: now,
    }

    await redis.set(Keys.vendor(id), JSON.stringify(updatedVendor))

    return json(updatedVendor)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return error(`Failed to update vendor: ${message}`, 500)
  }
}

// ── DELETE: Remove a vendor + cascade-delete its offerings ──
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const vendor = await readVendor(id)

    if (!vendor) {
      return error(`No vendor found for ID ${id}`, 404)
    }

    // Cascade: delete all offerings for this vendor
    const offeringIds = await redis.smembers(Keys.offeringsByVendor(id))
    if (offeringIds && offeringIds.length > 0) {
      for (const oid of offeringIds) {
        await redis.del(Keys.offering(oid))
        await redis.srem(Keys.offeringsAll, oid)
      }
      await redis.del(Keys.offeringsByVendor(id))
    }

    // Remove vendor from Redis
    await redis.del(Keys.vendor(id))
    await redis.srem(Keys.vendorsAll, id)
    await redis.srem(Keys.vendorsByOwner(vendor.owner_ces as string), id)

    return json({ success: true, id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return error(`Failed to delete vendor: ${message}`, 500)
  }
}