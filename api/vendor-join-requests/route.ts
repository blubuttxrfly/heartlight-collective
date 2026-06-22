// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Vendor Join Requests List + Create
//  GET  /api/vendor-join-requests   — list all (optionally ?vendor={vid})
//  POST /api/vendor-join-requests   — create a new join request
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { redis, Keys } from '../_lib/redis.js'
import { json, error } from '../_lib/response.js'


async function GET(request: Request) {

  try {
    const url = new URL(request.url)
    const vendorId = url.searchParams.get('vendor')

    let ids: string[]
    if (vendorId) {
      ids = await redis.smembers(Keys.vendorJoinRequestsByVendor(vendorId))
    } else {
      ids = await redis.smembers(Keys.vendorJoinRequestsAll)
    }

    if (!ids || ids.length === 0) return json([])

    const keys = ids.map((id) => Keys.vendorJoinRequest(id))
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

async function POST(request: Request) {

  try {
    const body = await request.json()
    const { id, vendor_id, ...rest } = body as { id?: string; vendor_id?: string; [key: string]: unknown }
    if (!vendor_id) return error('vendor_id is required', 400)

    const jrId = id || `joinreq_${Math.random().toString(36).slice(2, 10)}`
    const now = new Date().toISOString()
    const row: Record<string, unknown> = {
      id: jrId, vendor_id, ...rest,
      status: rest.status || 'pending',
      requested_at: (rest.requested_at as string) || now,
    }

    await redis.set(Keys.vendorJoinRequest(jrId), JSON.stringify(row))
    await redis.sadd(Keys.vendorJoinRequestsAll, jrId)
    await redis.sadd(Keys.vendorJoinRequestsByVendor(vendor_id), jrId)

    return json(row, 201)
  } catch (err: unknown) {
    return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500)
  }

}

// ── Vercel Functions entry point ──
export default {
  async fetch(request: Request): Promise<Response> {
    const method = request.method.toUpperCase();
    try {
      if (method === "GET") return await GET(request);
      if (method === "POST") return await POST(request);
      return new Response("Method Not Allowed", { status: 405 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return new Response(JSON.stringify({ error: message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }
}
