// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Health Check
//  GET /api/health — verifies Redis connection is live
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { redis, isRedisConfigured } from '../_lib/redis'
import { json, error } from '../_lib/response'

export async function GET() {
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