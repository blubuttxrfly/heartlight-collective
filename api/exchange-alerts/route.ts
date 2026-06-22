// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Exchange Alerts List + Create
//  GET  /api/exchange-alerts   — list all (optionally ?to={ces})
//  POST /api/exchange-alerts   — create a new alert
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { redis, Keys } from '../_lib/redis.js'
import { json, error } from '../_lib/response.js'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const toCes = url.searchParams.get('to')

    let ids: string[]
    if (toCes) {
      ids = await redis.smembers(Keys.exchangeAlertsByTo(toCes))
    } else {
      ids = await redis.smembers(Keys.exchangeAlertsAll)
    }

    if (!ids || ids.length === 0) return json([])

    const keys = ids.map((id) => Keys.exchangeAlert(id))
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
    const { id, from_ces, ...rest } = body as { id?: string; from_ces?: string; [key: string]: unknown }
    if (!from_ces) return error('from_ces is required', 400)

    const altId = id || `alert_${Math.random().toString(36).slice(2, 10)}`
    const now = new Date().toISOString()
    const row: Record<string, unknown> = {
      id: altId, from_ces, ...rest,
      status: rest.status || 'pending',
      created_at: (rest.created_at as string) || now,
    }

    await redis.set(Keys.exchangeAlert(altId), JSON.stringify(row))
    await redis.sadd(Keys.exchangeAlertsAll, altId)
    if (rest.to_ces) await redis.sadd(Keys.exchangeAlertsByTo(rest.to_ces as string), altId)

    return json(row, 201)
  } catch (err: unknown) {
    return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500)
  }
}