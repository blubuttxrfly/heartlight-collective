// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Exchange Requests List + Create
//  GET  /api/exchange-requests   — list all (optionally ?requester={ces} or ?provider={ces})
//  POST /api/exchange-requests   — create a new exchange request
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { redis, Keys } from '../_lib/redis.js'
import { json, error } from '../_lib/response.js'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const requesterCes = url.searchParams.get('requester')
    const providerCes = url.searchParams.get('provider')

    let ids: string[]

    if (requesterCes) {
      ids = await redis.smembers(Keys.exchangeRequestsByRequester(requesterCes))
    } else if (providerCes) {
      ids = await redis.smembers(Keys.exchangeRequestsByProvider(providerCes))
    } else {
      ids = await redis.smembers(Keys.exchangeRequestsAll)
    }

    if (!ids || ids.length === 0) return json([])

    const keys = ids.map((id) => Keys.exchangeRequest(id))
    const rawRows = await redis.mget<string[]>(...keys)

    const rows: Record<string, unknown>[] = []
    for (const raw of rawRows) {
      if (!raw) continue
      try { rows.push(typeof raw === 'string' ? JSON.parse(raw) : raw) } catch { /* skip */ }
    }

    return json(rows)
  } catch (err: unknown) {
    return error(`Failed to list exchange requests: ${err instanceof Error ? err.message : String(err)}`, 500)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, requester_ces, provider_ces, offering_id, vendor_id, ...rest } = body as {
      id?: string; requester_ces?: string; provider_ces?: string; offering_id?: string; vendor_id?: string
      [key: string]: unknown
    }

    if (!requester_ces) return error('requester_ces is required', 400)
    if (!provider_ces) return error('provider_ces is required', 400)

    const reqId = id || `request_${Math.random().toString(36).slice(2, 10)}`
    const existing = await redis.exists(Keys.exchangeRequest(reqId))
    if (existing) return error(`Exchange request with ID ${reqId} already exists`, 409)

    const now = new Date().toISOString()
    const row: Record<string, unknown> = {
      id: reqId, requester_ces, provider_ces, offering_id, vendor_id,
      ...rest,
      status: rest.status || 'pending',
      consent_acknowledged: Boolean(rest.consent_acknowledged),
      created_at: (rest.created_at as string) || now,
      updated_at: now,
    }

    await redis.set(Keys.exchangeRequest(reqId), JSON.stringify(row))
    await redis.sadd(Keys.exchangeRequestsAll, reqId)
    await redis.sadd(Keys.exchangeRequestsByRequester(requester_ces), reqId)
    await redis.sadd(Keys.exchangeRequestsByProvider(provider_ces), reqId)

    return json(row, 201)
  } catch (err: unknown) {
    return error(`Failed to create exchange request: ${err instanceof Error ? err.message : String(err)}`, 500)
  }
}