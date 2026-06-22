// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Exchange Request by ID
//  GET    /api/exchange-requests/{id}  — fetch one
//  PUT    /api/exchange-requests/{id}  — update
//  DELETE /api/exchange-requests/{id}  — remove
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { redis, Keys } from '../../_lib/redis'
import { json, error } from '../../_lib/response'

async function readReq(id: string): Promise<Record<string, unknown> | null> {
  const raw = await redis.get<string>(Keys.exchangeRequest(id))
  if (!raw) return null
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw } catch { return null }
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const row = await readReq(id)
    if (!row) return error(`No exchange request found for ID ${id}`, 404)
    return json(row)
  } catch (err: unknown) {
    return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500)
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const existing = await readReq(id)
    if (!existing) return error(`No exchange request found for ID ${id}`, 404)

    const body = await req.json()
    const { id: _, requester_ces, provider_ces, ...updates } = body as Record<string, unknown>

    const updated = { ...existing, ...updates, id, requester_ces: existing.requester_ces, provider_ces: existing.provider_ces, updated_at: new Date().toISOString() }
    await redis.set(Keys.exchangeRequest(id), JSON.stringify(updated))
    return json(updated)
  } catch (err: unknown) {
    return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500)
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const row = await readReq(id)
    if (!row) return error(`No exchange request found for ID ${id}`, 404)

    await redis.del(Keys.exchangeRequest(id))
    await redis.srem(Keys.exchangeRequestsAll, id)
    if (row.requester_ces) await redis.srem(Keys.exchangeRequestsByRequester(row.requester_ces as string), id)
    if (row.provider_ces) await redis.srem(Keys.exchangeRequestsByProvider(row.provider_ces as string), id)

    return json({ success: true, id })
  } catch (err: unknown) {
    return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500)
  }
}