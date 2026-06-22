// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Profile by CES (CRUD)
//  GET    /api/profiles/{ces}  — fetch one profile
//  PUT    /api/profiles/{ces}  — update a profile
//  DELETE /api/profiles/{ces}  — remove a profile
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { redis, Keys } from '../_lib/redis.js'
import { json, error } from '../_lib/response.js'

// ── Helper: read and parse a profile ──
async function readProfile(ces: string): Promise<Record<string, unknown> | null> {
  const raw = await redis.get<string>(Keys.profile(ces))
  if (!raw) return null
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return null
  }
}

// ── GET: Fetch one profile ──

async function GET(_request: Request,
  context: { params: Promise<{ ces: string }> }) {

  try {
    const { ces } = await context.params
    const profile = await readProfile(ces)

    if (!profile) {
      return error(`No profile found for CES ${ces}`, 404)
    }

    // Strip passphrase hash
    const { ces_passphrase_hash, ...safe } = profile
    return json(safe)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return error(`Failed to fetch profile: ${message}`, 500)
  }

}

async function PUT(request: Request,
  context: { params: Promise<{ ces: string }> }) {

  try {
    const { ces } = await context.params
    const existing = await readProfile(ces)

    if (!existing) {
      return error(`No profile found for CES ${ces}`, 404)
    }

    const body = await request.json()
    const { ces_number, ces_passphrase_hash, ...updates } = body as Record<string, unknown>

    // Prevent CES number changes via this route (use delete + create)
    // Prevent direct hash updates from the client (auth route handles passphrase changes)
    const now = new Date().toISOString()
    const updatedProfile: Record<string, unknown> = {
      ...existing,
      ...updates,
      ces_number: ces, // preserve original CES
      ces_passphrase_hash: existing.ces_passphrase_hash, // preserve existing hash
      updated_at: now,
    }

    await redis.set(Keys.profile(ces), JSON.stringify(updatedProfile))

    // Update stewardship index if status changed
    const oldStatus = existing.stewardship as string | undefined
    const newStatus = updatedProfile.stewardship as string | undefined
    if (oldStatus && newStatus && oldStatus !== newStatus) {
      await redis.srem(Keys.profilesByStewardship(oldStatus), ces)
      await redis.sadd(Keys.profilesByStewardship(newStatus), ces)
    }

    // Strip hash from response
    const { ces_passphrase_hash: _, ...safe } = updatedProfile
    return json(safe)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return error(`Failed to update profile: ${message}`, 500)
  }

}

async function DELETE(_request: Request,
  context: { params: Promise<{ ces: string }> }) {

  try {
    const { ces } = await context.params
    const profile = await readProfile(ces)

    if (!profile) {
      return error(`No profile found for CES ${ces}`, 404)
    }

    // Remove from Redis
    await redis.del(Keys.profile(ces))
    await redis.srem(Keys.profilesAll, ces)

    // Remove from stewardship index
    const status = profile.stewardship as string | undefined
    if (status) {
      await redis.srem(Keys.profilesByStewardship(status), ces)
    }

    return json({ success: true, ces })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return error(`Failed to delete profile: ${message}`, 500)
  }

}

// ── Vercel Functions entry point ──
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const context = { params: Promise.resolve({ ces: pathSegments[pathSegments.length - 1] }) };
    const method = request.method.toUpperCase();
    try {
      if (method === "GET") return await GET(request, context);
      if (method === "PUT") return await PUT(request, context);
      if (method === "DELETE") return await DELETE(request, context);
      return new Response("Method Not Allowed", { status: 405 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return new Response(JSON.stringify({ error: message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }
}
