// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Vendor Join Request by ID
//  GET    /api/vendor-join-requests/{id}  — fetch one
//  PUT    /api/vendor-join-requests/{id}  — update (approve/decline)
//  DELETE /api/vendor-join-requests/{id}  — remove
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { redis, Keys } from '../../_lib/redis.js'
import { json, error } from '../../_lib/response.js'

async function readJr(id: string): Promise<Record<string, unknown> | null> {
  const raw = await redis.get<string>(Keys.vendorJoinRequest(id))
  if (!raw) return null
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw } catch { return null }
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const row = await readJr(id)
    if (!row) return error(`No join request found for ID ${id}`, 404)
    return json(row)
  } catch (err: unknown) { return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500) }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const existing = await readJr(id)
    if (!existing) return error(`No join request found for ID ${id}`, 404)

    const body = await req.json()
    const { id: _, vendor_id, ...updates } = body as Record<string, unknown>
    const updated = { ...existing, ...updates, id, vendor_id: existing.vendor_id, updated_at: new Date().toISOString() }
    await redis.set(Keys.vendorJoinRequest(id), JSON.stringify(updated))
    return json(updated)
  } catch (err: unknown) { return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500) }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const row = await readJr(id)
    if (!row) return error(`No join request found for ID ${id}`, 404)

    await redis.del(Keys.vendorJoinRequest(id))
    await redis.srem(Keys.vendorJoinRequestsAll, id)
    if (row.vendor_id) await redis.srem(Keys.vendorJoinRequestsByVendor(row.vendor_id as string), id)

    return json({ success: true, id })
  } catch (err: unknown) { return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500) }
}