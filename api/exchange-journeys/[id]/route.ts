// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Exchange Journey by ID
//  GET    /api/exchange-journeys/{id}  — fetch one
//  PUT    /api/exchange-journeys/{id}  — update
//  DELETE /api/exchange-journeys/{id}  — remove
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { redis, Keys } from '../../_lib/redis.js'
import { json, error } from '../../_lib/response.js'

async function readJrn(id: string): Promise<Record<string, unknown> | null> {
  const raw = await redis.get<string>(Keys.exchangeJourney(id))
  if (!raw) return null
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw } catch { return null }
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const row = await readJrn(id)
    if (!row) return error(`No journey found for ID ${id}`, 404)
    return json(row)
  } catch (err: unknown) {
    return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500)
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const existing = await readJrn(id)
    if (!existing) return error(`No journey found for ID ${id}`, 404)

    const body = await req.json()
    const { id: _, requester_ces, provider_ces, ...updates } = body as Record<string, unknown>

    const updated = { ...existing, ...updates, id, requester_ces: existing.requester_ces, provider_ces: existing.provider_ces, updated_at: new Date().toISOString() }
    await redis.set(Keys.exchangeJourney(id), JSON.stringify(updated))
    return json(updated)
  } catch (err: unknown) {
    return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500)
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const row = await readJrn(id)
    if (!row) return error(`No journey found for ID ${id}`, 404)

    await redis.del(Keys.exchangeJourney(id))
    await redis.srem(Keys.exchangeJourneysAll, id)
    if (row.requester_ces) await redis.srem(Keys.exchangeJourneysByCes(row.requester_ces as string), id)
    if (row.provider_ces) await redis.srem(Keys.exchangeJourneysByCes(row.provider_ces as string), id)

    return json({ success: true, id })
  } catch (err: unknown) {
    return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500)
  }
}