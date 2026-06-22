// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Profiles by Stewardship Status
//  GET /api/profiles/stewardship/{status}
//  Returns all profiles matching a stewardship status:
//    pending | active | suspended | banned | returned
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { redis, Keys } from '../../_lib/redis.js'
import { json, error } from '../../_lib/response.js'


async function GET(_request: Request,
  context: { params: Promise<{ status: string }> }) {

  try {
    const { status } = await context.params

    const validStatuses = ['pending', 'active', 'suspended', 'banned', 'returned']
    if (!validStatuses.includes(status)) {
      return error(`Invalid stewardship status: ${status}. Valid: ${validStatuses.join(', ')}`, 400)
    }

    // Try the index set first (fast path)
    const indexedCes = await redis.smembers(Keys.profilesByStewardship(status))

    let profiles: Record<string, unknown>[] = []

    if (indexedCes && indexedCes.length > 0) {
      // Batch-fetch from the index
      const keys = indexedCes.map((ces) => Keys.profile(ces))
      const rawProfiles = await redis.mget<string[]>(...keys)

      for (const raw of rawProfiles) {
        if (!raw) continue
        try {
          const profile = typeof raw === 'string' ? JSON.parse(raw) : raw
          // Double-check the status matches (in case index is stale)
          if (profile.stewardship === status) {
            const { ces_passphrase_hash, ...safe } = profile
            profiles.push(safe)
          }
        } catch {
          // Skip corrupted entries
        }
      }
    }

    // Fallback: if index set is empty, scan all profiles and filter
    // (handles case where index wasn't maintained — e.g., after migration)
    if (profiles.length === 0) {
      const allCes = await redis.smembers(Keys.profilesAll)
      if (allCes && allCes.length > 0) {
        const allKeys = allCes.map((ces) => Keys.profile(ces))
        const allRaw = await redis.mget<string[]>(...allKeys)

        for (const raw of allRaw) {
          if (!raw) continue
          try {
            const profile = typeof raw === 'string' ? JSON.parse(raw) : raw
            if (profile.stewardship === status) {
              const { ces_passphrase_hash, ...safe } = profile
              profiles.push(safe)
            }
          } catch {
            // Skip corrupted entries
          }
        }

        // Rebuild the index set for next time
        if (profiles.length > 0) {
          const matchingCes = profiles.map((p) => p.ces_number as string)
          await redis.sadd(Keys.profilesByStewardship(status), matchingCes)
        }
      }
    }

    return json(profiles)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return error(`Failed to fetch profiles by stewardship: ${message}`, 500)
  }

}

// ── Vercel Functions entry point ──
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const context = { params: Promise.resolve({ status: pathSegments[pathSegments.length - 1] }) };
    const method = request.method.toUpperCase();
    try {
      if (method === "GET") return await GET(request, context);
      return new Response("Method Not Allowed", { status: 405 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return new Response(JSON.stringify({ error: message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }
}
