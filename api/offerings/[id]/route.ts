// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Offering by ID (CRUD)
//  GET    /api/offerings/{id}  — fetch one offering
//  PUT    /api/offerings/{id}  — update an offering
//  DELETE /api/offerings/{id}  — remove an offering
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { redis, Keys } from '../../_lib/redis'
import { json, error } from '../../_lib/response'

// ── Helper: read and parse an offering ──
async function readOffering(id: string): Promise<Record<string, unknown> | null> {
  const raw = await redis.get<string>(Keys.offering(id))
  if (!raw) return null
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return null
  }
}

// ── GET: Fetch one offering ──
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const offering = await readOffering(id)

    if (!offering) {
      return error(`No offering found for ID ${id}`, 404)
    }

    return json(offering)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return error(`Failed to fetch offering: ${message}`, 500)
  }
}

// ── PUT: Update an offering ──
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const existing = await readOffering(id)

    if (!existing) {
      return error(`No offering found for ID ${id}`, 404)
    }

    const body = await request.json()
    const { id: _bodyId, vendor_id, ...updates } = body as Record<string, unknown>

    // Prevent vendor_id change (offering transfers are a separate flow)
    const now = new Date().toISOString()
    const updatedOffering: Record<string, unknown> = {
      ...existing,
      ...updates,
      id, // preserve original ID
      vendor_id: existing.vendor_id, // preserve parent vendor
      updated_at: now,
    }

    await redis.set(Keys.offering(id), JSON.stringify(updatedOffering))

    return json(updatedOffering)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return error(`Failed to update offering: ${message}`, 500)
  }
}

// ── DELETE: Remove an offering ──
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const offering = await readOffering(id)

    if (!offering) {
      return error(`No offering found for ID ${id}`, 404)
    }

    const vendorId = offering.vendor_id as string

    // Remove from Redis
    await redis.del(Keys.offering(id))
    await redis.srem(Keys.offeringsAll, id)
    if (vendorId) {
      await redis.srem(Keys.offeringsByVendor(vendorId), id)
    }

    return json({ success: true, id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return error(`Failed to delete offering: ${message}`, 500)
  }
}