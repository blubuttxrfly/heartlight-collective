// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Collective Petition by ID
//  GET    /api/collective-petitions/{id}  — fetch one
//  PUT    /api/collective-petitions/{id}  — update (approve/deny/fund)
//  DELETE /api/collective-petitions/{id}  — remove
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { redis, Keys } from '../_lib/redis.js'
import { json, error } from '../_lib/response.js'

async function readPet(id: string): Promise<Record<string, unknown> | null> {
  const raw = await redis.get<string>(Keys.collectivePetition(id))
  if (!raw) return null
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw } catch { return null }
}


async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {

  try {
    const { id } = await ctx.params
    const row = await readPet(id)
    if (!row) return error(`No petition found for ID ${id}`, 404)
    return json(row)
  } catch (err: unknown) { return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500) }

}

async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {

  try {
    const { id } = await ctx.params
    const existing = await readPet(id)
    if (!existing) return error(`No petition found for ID ${id}`, 404)

    const body = await req.json()
    const { id: _, requester_ces, ...updates } = body as Record<string, unknown>
    const updated = { ...existing, ...updates, id, requester_ces: existing.requester_ces, updated_at: new Date().toISOString() }
    await redis.set(Keys.collectivePetition(id), JSON.stringify(updated))
    return json(updated)
  } catch (err: unknown) { return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500) }

}

async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {

  try {
    const { id } = await ctx.params
    await redis.del(Keys.collectivePetition(id))
    await redis.srem(Keys.collectivePetitionsAll, id)
    return json({ success: true, id })
  } catch (err: unknown) { return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500) }

}

// ── Vercel Functions entry point ──
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const context = { params: Promise.resolve({ id: pathSegments[pathSegments.length - 1] }) };
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
