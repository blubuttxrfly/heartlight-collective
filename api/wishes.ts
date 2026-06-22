// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Wishes List + Create
//  GET  /api/wishes          — list all wishes (optionally ?author={ces})
//  POST /api/wishes          — create a new wish
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { redis, Keys } from './_lib/redis.js'
import { json, error } from './_lib/response.js'


async function GET(request: Request) {

  try {
    const url = new URL(request.url)
    const authorCes = url.searchParams.get('author')

    let wishIds: string[]

    if (authorCes) {
      wishIds = await redis.smembers(Keys.wishesByAuthor(authorCes))
      if (!wishIds || wishIds.length === 0) {
        const allIds = await redis.smembers(Keys.wishesAll)
        if (!allIds || allIds.length === 0) return json([])
        const allKeys = allIds.map((id) => Keys.wish(id))
        const allRaw = await redis.mget<string[]>(...allKeys)
        wishIds = []
        for (let i = 0; i < allRaw.length; i++) {
          if (!allRaw[i]) continue
          try {
            const w = typeof allRaw[i] === 'string' ? JSON.parse(allRaw[i]) : allRaw[i]
            if (w.author_ces === authorCes) wishIds.push(allIds[i])
          } catch { /* skip */ }
        }
        if (wishIds.length > 0) await redis.sadd(Keys.wishesByAuthor(authorCes), wishIds)
      }
    } else {
      wishIds = await redis.smembers(Keys.wishesAll)
    }

    if (!wishIds || wishIds.length === 0) return json([])

    const keys = wishIds.map((id) => Keys.wish(id))
    const rawWishes = await redis.mget<string[]>(...keys)

    const wishes: Record<string, unknown>[] = []
    for (const raw of rawWishes) {
      if (!raw) continue
      try { wishes.push(typeof raw === 'string' ? JSON.parse(raw) : raw) } catch { /* skip */ }
    }

    return json(wishes)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return error(`Failed to list wishes: ${message}`, 500)
  }

}

async function POST(request: Request) {

  try {
    const body = await request.json()
    const { id, title, author_ces, ...rest } = body as {
      id?: string; title?: string; author_ces?: string; [key: string]: unknown
    }

    if (!title) return error('title is required', 400)

    const wishId = id || `wish_${Math.random().toString(36).slice(2, 10)}`
    const existing = await redis.exists(Keys.wish(wishId))
    if (existing) return error(`Wish with ID ${wishId} already exists`, 409)

    const now = new Date().toISOString()
    const wish: Record<string, unknown> = {
      id: wishId,
      title,
      author_ces: author_ces || 'unknown',
      author_name: rest.author_name || 'Atlas Island Being',
      type: rest.type || 'wish',
      status: rest.status || 'open',
      scope: rest.scope || 'universal',
      ...rest,
      created_at: (rest.created_at as string) || now,
      updated_at: now,
    }

    await redis.set(Keys.wish(wishId), JSON.stringify(wish))
    await redis.sadd(Keys.wishesAll, wishId)
    if (author_ces) await redis.sadd(Keys.wishesByAuthor(author_ces), wishId)

    return json(wish, 201)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return error(`Failed to create wish: ${message}`, 500)
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
