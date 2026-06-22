// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Health Check
//  GET /api/health — verifies Redis connection is live
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { redis, isRedisConfigured } from '../_lib/redis.js'
import { json, error } from '../_lib/response.js'


async function GET() {

  if (!isRedisConfigured()) {
    return error('UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not configured', 500)
  }

  try {
    const pong = await redis.ping()
    return json({
      status: 'ok',
      redis: pong,
      timestamp: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return error(`Redis connection failed: ${message}`, 500)
  }

}

// ── Vercel Functions entry point ──
export default {
  async fetch(request: Request): Promise<Response> {
    const method = request.method.toUpperCase();
    try {
      if (method === "GET") return await GET();
      return new Response("Method Not Allowed", { status: 405 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return new Response(JSON.stringify({ error: message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }
}
