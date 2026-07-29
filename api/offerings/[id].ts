// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Offering by ID (CRUD)
//  GET    /api/offerings/{id}  — fetch one offering
//  PUT    /api/offerings/{id}  — update an offering
//  DELETE /api/offerings/{id}  — remove an offering
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { redis, Keys } from '../_lib/redis.js'
import { json, error } from '../_lib/response.js'

// ── Helper: read and parse an offering ──
async function readOffering(id: string): Promise<Record<string, unknown> | null> {
  const raw = await redis.get<string>(Keys.offering(id))
  if (!raw) return null
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return null
  }
}

// ── GET: Fetch one offering ──

async function GET(_request: Request,
  context: { params: Promise<{ id: string }> }) {

  try {
    const { id } = await context.params
    const offering = await readOffering(id)

    if (!offering) {
      return error(`No offering found for ID ${id}`, 404)
    }

    return json(offering)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return error(`Failed to fetch offering: ${message}`, 500)
  }

}

async function PUT(request: Request,
  context: { params: Promise<{ id: string }> }) {

  try {
    const { id } = await context.params
    const existing = await readOffering(id)

    if (!existing) {
      return error(`No offering found for ID ${id}`, 404)
    }

    const body = await request.json()
    const { id: _bodyId, vendor_id, ...updates } = body as Record<string, unknown>

    // Prevent vendor_id change (offering transfers are a separate flow)
    const now = new Date().toISOString()
    const updatedOffering: Record<string, unknown> = {
      ...existing,
      ...updates,
      id, // preserve original ID
      vendor_id: existing.vendor_id, // preserve parent vendor
      updated_at: now,
    }

    await redis.set(Keys.offering(id), JSON.stringify(updatedOffering))

    return json(updatedOffering)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return error(`Failed to update offering: ${message}`, 500)
  }

}

async function DELETE(_request: Request,
  context: { params: Promise<{ id: string }> }) {

  try {
    const { id } = await context.params
    const offering = await readOffering(id)

    if (!offering) {
      return error(`No offering found for ID ${id}`, 404)
    }

    const vendorId = offering.vendor_id as string

    // Remove from Redis
    await redis.del(Keys.offering(id))
    await redis.srem(Keys.offeringsAll, id)
    if (vendorId) {
      await redis.srem(Keys.offeringsByVendor(vendorId), id)
    }

    return json({ success: true, id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return error(`Failed to delete offering: ${message}`, 500)
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
