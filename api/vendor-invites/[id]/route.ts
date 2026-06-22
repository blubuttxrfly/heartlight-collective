// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Vendor Invite by ID
//  GET    /api/vendor-invites/{id}  — fetch one
//  PUT    /api/vendor-invites/{id}  — update (accept/decline)
//  DELETE /api/vendor-invites/{id}  — remove
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { redis, Keys } from '../../_lib/redis.js'
import { json, error } from '../../_lib/response.js'

async function readInv(id: string): Promise<Record<string, unknown> | null> {
  const raw = await redis.get<string>(Keys.vendorInvite(id))
  if (!raw) return null
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw } catch { return null }
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const row = await readInv(id)
    if (!row) return error(`No invite found for ID ${id}`, 404)
    return json(row)
  } catch (err: unknown) { return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500) }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const existing = await readInv(id)
    if (!existing) return error(`No invite found for ID ${id}`, 404)

    const body = await req.json()
    const { id: _, vendor_id, ...updates } = body as Record<string, unknown>
    const updated = { ...existing, ...updates, id, vendor_id: existing.vendor_id, updated_at: new Date().toISOString() }
    await redis.set(Keys.vendorInvite(id), JSON.stringify(updated))
    return json(updated)
  } catch (err: unknown) { return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500) }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const row = await readInv(id)
    if (!row) return error(`No invite found for ID ${id}`, 404)

    await redis.del(Keys.vendorInvite(id))
    await redis.srem(Keys.vendorInvitesAll, id)
    if (row.vendor_id) await redis.srem(Keys.vendorInvitesByVendor(row.vendor_id as string), id)

    return json({ success: true, id })
  } catch (err: unknown) { return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500) }
}