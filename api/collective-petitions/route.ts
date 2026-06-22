// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Collective Petitions List + Create
//  GET  /api/collective-petitions   — list all petitions
//  POST /api/collective-petitions   — create a new petition
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { redis, Keys } from '../_lib/redis'
import { json, error } from '../_lib/response'

export async function GET() {
  try {
    const ids = await redis.smembers(Keys.collectivePetitionsAll)
    if (!ids || ids.length === 0) return json([])

    const keys = ids.map((id) => Keys.collectivePetition(id))
    const rawRows = await redis.mget<string[]>(...keys)
    const rows: Record<string, unknown>[] = []
    for (const raw of rawRows) {
      if (!raw) continue
      try { rows.push(typeof raw === 'string' ? JSON.parse(raw) : raw) } catch { /* skip */ }
    }
    return json(rows)
  } catch (err: unknown) {
    return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, requester_ces, ...rest } = body as { id?: string; requester_ces?: string; [key: string]: unknown }
    if (!requester_ces) return error('requester_ces is required', 400)

    const petId = id || `petition_${Math.random().toString(36).slice(2, 10)}`
    const now = new Date().toISOString()
    const row: Record<string, unknown> = {
      id: petId, requester_ces, ...rest,
      status: rest.status || 'pending',
      created_at: (rest.created_at as string) || now,
    }

    await redis.set(Keys.collectivePetition(petId), JSON.stringify(row))
    await redis.sadd(Keys.collectivePetitionsAll, petId)

    return json(row, 201)
  } catch (err: unknown) {
    return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500)
  }
}