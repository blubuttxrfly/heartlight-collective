// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Exchange Agreements List + Create
//  GET  /api/exchange-agreements   — list all (optionally ?ces={ces})
//  POST /api/exchange-agreements   — create a new agreement
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
      ids = await redis.smembers(Keys.exchangeAgreementsByCes(ces))
      if (!ids || ids.length === 0) {
        // Fallback: scan all and filter
        const allIds = await redis.smembers(Keys.exchangeAgreementsAll)
        if (!allIds || allIds.length === 0) return json([])
        const allKeys = allIds.map((id) => Keys.exchangeAgreement(id))
        const allRaw = await redis.mget<string[]>(...allKeys)
        ids = []
        for (let i = 0; i < allRaw.length; i++) {
          if (!allRaw[i]) continue
          try {
            const a = typeof allRaw[i] === 'string' ? JSON.parse(allRaw[i]) : allRaw[i]
            if (a.requester_ces === ces || a.provider_ces === ces) ids.push(allIds[i])
          } catch { /* skip */ }
        }
        if (ids.length > 0) await redis.sadd(Keys.exchangeAgreementsByCes(ces), ...ids)
      }
    } else {
      ids = await redis.smembers(Keys.exchangeAgreementsAll)
    }

    if (!ids || ids.length === 0) return json([])

    const keys = ids.map((id) => Keys.exchangeAgreement(id))
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

    const agId = id || `agreement_${Math.random().toString(36).slice(2, 10)}`
    const existing = await redis.exists(Keys.exchangeAgreement(agId))
    if (existing) return error(`Agreement with ID ${agId} already exists`, 409)

    const now = new Date().toISOString()
    const row: Record<string, unknown> = {
      id: agId, requester_ces, provider_ces, ...rest,
      status: rest.status || 'draft',
      requester_consented: Boolean(rest.requester_consented),
      provider_consented: Boolean(rest.provider_consented),
      created_at: (rest.created_at as string) || now,
      updated_at: now,
    }

    await redis.set(Keys.exchangeAgreement(agId), JSON.stringify(row))
    await redis.sadd(Keys.exchangeAgreementsAll, agId)
    await redis.sadd(Keys.exchangeAgreementsByCes(requester_ces), agId)
    await redis.sadd(Keys.exchangeAgreementsByCes(provider_ces), agId)

    return json(row, 201)
  } catch (err: unknown) {
    return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500)
  }
}