// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Code Log by ID
//  GET    /api/code-logs/{id}  — fetch one
//  PUT    /api/code-logs/{id}  — update
//  DELETE /api/code-logs/{id}  — remove
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { redis, Keys } from '../../_lib/redis'
import { json, error } from '../../_lib/response'

async function readLog(id: string): Promise<Record<string, unknown> | null> {
  const raw = await redis.get<string>(Keys.codeLog(id))
  if (!raw) return null
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw } catch { return null }
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const row = await readLog(id)
    if (!row) return error(`No code log found for ID ${id}`, 404)
    return json(row)
  } catch (err: unknown) { return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500) }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const existing = await readLog(id)
    if (!existing) return error(`No code log found for ID ${id}`, 404)

    const body = await req.json()
    const { id: _, exchange_id, author_ces, ...updates } = body as Record<string, unknown>
    const updated = { ...existing, ...updates, id, exchange_id: existing.exchange_id, author_ces: existing.author_ces, updated_at: new Date().toISOString() }
    await redis.set(Keys.codeLog(id), JSON.stringify(updated))
    return json(updated)
  } catch (err: unknown) { return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500) }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const row = await readLog(id)
    if (!row) return error(`No code log found for ID ${id}`, 404)

    await redis.del(Keys.codeLog(id))
    await redis.srem(Keys.codeLogsAll, id)
    if (row.exchange_id) await redis.srem(Keys.codeLogsByExchange(row.exchange_id as string), id)

    return json({ success: true, id })
  } catch (err: unknown) { return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500) }
}