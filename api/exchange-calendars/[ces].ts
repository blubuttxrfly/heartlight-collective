// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Exchange Calendar by CES
//  GET  /api/exchange-calendars/{ces}  — fetch calendar for a being
//  PUT  /api/exchange-calendars/{ces}  — upsert calendar for a being
//  DELETE /api/exchange-calendars/{ces} — remove calendar
//  (One calendar per CES — no separate list/create routes needed)
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { redis, Keys } from '../_lib/redis.js'
import { json, error } from '../_lib/response.js'


async function GET(_req: Request, ctx: { params: Promise<{ ces: string }> }) {

  try {
    const { ces } = await ctx.params
    const raw = await redis.get<string>(Keys.exchangeCalendar(ces))
    if (!raw) return json({ ces, availabilityBlocks: [], scheduledMeetings: [], updatedAt: new Date().toISOString() })
    try { return json(typeof raw === 'string' ? JSON.parse(raw) : raw) } catch { return error('Calendar data corrupted', 500) }
  } catch (err: unknown) {
    return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500)
  }

}

async function PUT(req: Request, ctx: { params: Promise<{ ces: string }> }) {

  try {
    const { ces } = await ctx.params
    const body = await req.json()
    const { ces: _bodyCes, ...updates } = body as Record<string, unknown>

    const now = new Date().toISOString()
    const calendar: Record<string, unknown> = {
      ces,
      availabilityBlocks: updates.availabilityBlocks || [],
      scheduledMeetings: updates.scheduledMeetings || [],
      updatedAt: now,
      created_at: updates.created_at || now,
    }

    await redis.set(Keys.exchangeCalendar(ces), JSON.stringify(calendar))
    await redis.sadd(Keys.exchangeCalendarsAll, ces)

    return json(calendar)
  } catch (err: unknown) {
    return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500)
  }

}

async function DELETE(_req: Request, ctx: { params: Promise<{ ces: string }> }) {

  try {
    const { ces } = await ctx.params
    await redis.del(Keys.exchangeCalendar(ces))
    await redis.srem(Keys.exchangeCalendarsAll, ces)
    return json({ success: true, ces })
  } catch (err: unknown) {
    return error(`Failed: ${err instanceof Error ? err.message : String(err)}`, 500)
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
