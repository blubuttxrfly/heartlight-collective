// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Exchange Agreement by ID
//  GET    /api/exchange-agreements/{id}  — fetch one
//  PUT    /api/exchange-agreements/{id}  — update
//  DELETE /api/exchange-agreements/{id}  — remove
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { redis, Keys } from '../_lib/redis.js'
import { json, error } from '../_lib/response.js'

async function readAg(id: string): Promise<Record<string, unknown> | null> {
  const raw = await redis.get<string>(Keys.exchangeAgreement(id))
  if (!raw) return null
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw } catch { return null }
}


async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {

  try {
    const { id } = await ctx.params
    const row = await readAg(id)
    if (!row) return error(`No agreement found for ID ${id}`, 404)
    return json(row)
  } catch (err: unknown) {
    return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500)
  }

}

async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {

  try {
    const { id } = await ctx.params
    const existing = await readAg(id)
    if (!existing) return error(`No agreement found for ID ${id}`, 404)

    const body = await req.json()
    const { id: _, requester_ces, provider_ces, ...updates } = body as Record<string, unknown>

    const updated = { ...existing, ...updates, id, requester_ces: existing.requester_ces, provider_ces: existing.provider_ces, updated_at: new Date().toISOString() }
    await redis.set(Keys.exchangeAgreement(id), JSON.stringify(updated))
    return json(updated)
  } catch (err: unknown) {
    return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500)
  }

}

async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {

  try {
    const { id } = await ctx.params
    const row = await readAg(id)
    if (!row) return error(`No agreement found for ID ${id}`, 404)

    await redis.del(Keys.exchangeAgreement(id))
    await redis.srem(Keys.exchangeAgreementsAll, id)
    if (row.requester_ces) await redis.srem(Keys.exchangeAgreementsByCes(row.requester_ces as string), id)
    if (row.provider_ces) await redis.srem(Keys.exchangeAgreementsByCes(row.provider_ces as string), id)

    return json({ success: true, id })
  } catch (err: unknown) {
    return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500)
  }

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
