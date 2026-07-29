// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Profiles List + Create
//  GET  /api/profiles          — list all profiles
//  POST /api/profiles          — create a new profile
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { redis, Keys } from './_lib/redis.js'
import { hashPassphrase } from './_lib/auth.js'
import { json, error } from './_lib/response.js'

// ── GET: List all profiles ──

async function GET() {

  try {
    const cesNumbers = await redis.smembers(Keys.profilesAll)

    if (!cesNumbers || cesNumbers.length === 0) {
      return json([])
    }

    // Batch-fetch all profiles in one call
    const keys = cesNumbers.map((ces) => Keys.profile(ces))
    const rawProfiles = await redis.mget<string[]>(...keys)

    const profiles: Record<string, unknown>[] = []
    for (const raw of rawProfiles) {
      if (!raw) continue
      try {
        const profile = typeof raw === 'string' ? JSON.parse(raw) : raw
        // Strip passphrase hash from public listing
        const { ces_passphrase_hash, ...safe } = profile
        profiles.push(safe)
      } catch {
        // Skip corrupted entries
      }
    }

    return json(profiles)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return error(`Failed to list profiles: ${message}`, 500)
  }

}

async function POST(request: Request) {

  try {
    const body = await request.json()
    const { ces_number, ces_passphrase_hash, passphrase, ...rest } = body as {
      ces_number?: string
      ces_passphrase_hash?: string
      passphrase?: string
      [key: string]: unknown
    }

    if (!ces_number) {
      return error('ces_number is required', 400)
    }

    // Check if profile already exists
    const existing = await redis.exists(Keys.profile(ces_number))
    if (existing) {
      return error(`Profile with CES ${ces_number} already exists`, 409)
    }

    // Hash the passphrase — accept either a pre-hashed value or a plain passphrase
    let finalHash: string | undefined
    if (passphrase) {
      finalHash = await hashPassphrase(passphrase)
    } else if (ces_passphrase_hash) {
      // Already hashed (e.g., migration script provides the hash directly)
      finalHash = ces_passphrase_hash
    }

    const now = new Date().toISOString()
    const profile: Record<string, unknown> = {
      id: `profile_${ces_number}`,
      ces_number,
      ...rest,
      ces_passphrase_hash: finalHash || '',
      stewardship: (rest.stewardship as string) || 'pending',
      created_at: (rest.created_at as string) || now,
      updated_at: now,
    }

    // Store the profile JSON
    await redis.set(Keys.profile(ces_number), JSON.stringify(profile))

    // Add to index sets
    await redis.sadd(Keys.profilesAll, ces_number)
    await redis.sadd(Keys.profilesByStewardship(profile.stewardship as string), ces_number)

    // Strip hash from response
    const { ces_passphrase_hash: _, ...safeProfile } = profile
    return json(safeProfile, 201)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return error(`Failed to create profile: ${message}`, 500)
  }

}

// ── Vercel Functions entry point ──
export default {
  async fetch(request: Request): Promise<Response> {
    const method = request.method.toUpperCase();
    try {
      if (method === "GET") return await GET();
      if (method === "POST") return await POST(request);
      return new Response("Method Not Allowed", { status: 405 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return new Response(JSON.stringify({ error: message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }
}
