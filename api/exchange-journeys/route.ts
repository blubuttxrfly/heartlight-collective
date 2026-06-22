// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Exchange Journeys List + Create
//  GET  /api/exchange-journeys   — list all (optionally ?ces={ces})
//  POST /api/exchange-journeys   — create a new journey
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { redis, Keys } from '../_lib/redis'
import { json, error } from '../_lib/response'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const ces = url.searchParams.get('ces')

    let ids: string[]

    if (ces) {
      ids = await redis.smembers(Keys.exchangeJourneysByCes(ces))
      if (!ids || ids.length === 0) {
        const allIds = await redis.smembers(Keys.exchangeJourneysAll)
        if (!allIds || allIds.length === 0) return json([])
        const allKeys = allIds.map((id) => Keys.exchangeJourney(id))
        const allRaw = await redis.mget<string[]>(...allKeys)
        ids = []
        for (let i = 0; i < allRaw.length; i++) {
          if (!allRaw[i]) continue
          try {
            const j = typeof allRaw[i] === 'string' ? JSON.parse(allRaw[i]) : allRaw[i]
            if (j.requester_ces === ces || j.provider_ces === ces) ids.push(allIds[i])
          } catch { /* skip */ }
        }
        if (ids.length > 0) await redis.sadd(Keys.exchangeJourneysByCes(ces), ...ids)
      }
    } else {
      ids = await redis.smembers(Keys.exchangeJourneysAll)
    }

    if (!ids || ids.length === 0) return json([])

    const keys = ids.map((id) => Keys.exchangeJourney(id))
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
    const { id, requester_ces, provider_ces, ...rest } = body as {
      id?: string; requester_ces?: string; provider_ces?: string; [key: string]: unknown
    }

    if (!requester_ces) return error('requester_ces is required', 400)
    if (!provider_ces) return error('provider_ces is required', 400)

    const jrnId = id || `journey_${Math.random().toString(36).slice(2, 10)}`
    const existing = await redis.exists(Keys.exchangeJourney(jrnId))
    if (existing) return error(`Journey with ID ${jrnId} already exists`, 409)

    const now = new Date().toISOString()
    const row: Record<string, unknown> = {
      id: jrnId, requester_ces, provider_ces, ...rest,
      status: rest.status || 'agreement_pending',
      created_at: (rest.created_at as string) || now,
      updated_at: now,
    }

    await redis.set(Keys.exchangeJourney(jrnId), JSON.stringify(row))
    await redis.sadd(Keys.exchangeJourneysAll, jrnId)
    await redis.sadd(Keys.exchangeJourneysByCes(requester_ces), jrnId)
    await redis.sadd(Keys.exchangeJourneysByCes(provider_ces), jrnId)

    return json(row, 201)
  } catch (err: unknown) {
    return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500)
  }
}