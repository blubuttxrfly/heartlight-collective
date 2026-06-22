// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Code Logs List + Create
//  GET  /api/code-logs   — list all (optionally ?exchange={eid})
//  POST /api/code-logs   — create a new code log entry
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { redis, Keys } from './_lib/redis.js'
import { json, error } from './_lib/response.js'


async function GET(request: Request) {

  try {
    const url = new URL(request.url)
    const exchangeId = url.searchParams.get('exchange')

    let ids: string[]
    if (exchangeId) {
      ids = await redis.smembers(Keys.codeLogsByExchange(exchangeId))
    } else {
      ids = await redis.smembers(Keys.codeLogsAll)
    }

    if (!ids || ids.length === 0) return json([])

    const keys = ids.map((id) => Keys.codeLog(id))
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
    const { id, exchange_id, author_ces, ...rest } = body as {
      id?: string; exchange_id?: string; author_ces?: string; [key: string]: unknown
    }
    if (!exchange_id) return error('exchange_id is required', 400)
    if (!author_ces) return error('author_ces is required', 400)

    const logId = id || `log_${Math.random().toString(36).slice(2, 10)}`
    const now = new Date().toISOString()
    const row: Record<string, unknown> = {
      id: logId, exchange_id, author_ces, ...rest,
      visibility: rest.visibility || 'public',
      phase: rest.phase || 'during',
      created_at: (rest.created_at as string) || now,
    }

    await redis.set(Keys.codeLog(logId), JSON.stringify(row))
    await redis.sadd(Keys.codeLogsAll, logId)
    await redis.sadd(Keys.codeLogsByExchange(exchange_id), logId)

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
