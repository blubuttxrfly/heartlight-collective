// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Collective Petition by ID
//  GET    /api/collective-petitions/{id}  — fetch one
//  PUT    /api/collective-petitions/{id}  — update (approve/deny/fund)
//  DELETE /api/collective-petitions/{id}  — remove
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { redis, Keys } from '../../_lib/redis.js'
import { json, error } from '../../_lib/response.js'

async function readPet(id: string): Promise<Record<string, unknown> | null> {
  const raw = await redis.get<string>(Keys.collectivePetition(id))
  if (!raw) return null
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw } catch { return null }
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const row = await readPet(id)
    if (!row) return error(`No petition found for ID ${id}`, 404)
    return json(row)
  } catch (err: unknown) { return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500) }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const existing = await readPet(id)
    if (!existing) return error(`No petition found for ID ${id}`, 404)

    const body = await req.json()
    const { id: _, requester_ces, ...updates } = body as Record<string, unknown>
    const updated = { ...existing, ...updates, id, requester_ces: existing.requester_ces, updated_at: new Date().toISOString() }
    await redis.set(Keys.collectivePetition(id), JSON.stringify(updated))
    return json(updated)
  } catch (err: unknown) { return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500) }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    await redis.del(Keys.collectivePetition(id))
    await redis.srem(Keys.collectivePetitionsAll, id)
    return json({ success: true, id })
  } catch (err: unknown) { return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500) }
}