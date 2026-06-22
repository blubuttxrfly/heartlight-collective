// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Vendors List + Create
//  GET  /api/vendors          — list all vendors (optionally ?owner={ces})
//  POST /api/vendors          — create a new vendor storefront
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { redis, Keys } from '../_lib/redis.js'
import { json, error } from '../_lib/response.js'

// ── GET: List vendors (optionally filtered by owner CES) ──

async function GET(request: Request) {

  try {
    const url = new URL(request.url)
    const ownerCes = url.searchParams.get('owner')

    let vendorIds: string[]

    if (ownerCes) {
      // Fast path: use owner index set
      vendorIds = await redis.smembers(Keys.vendorsByOwner(ownerCes))
      // Fallback: scan all if index is empty
      if (!vendorIds || vendorIds.length === 0) {
        const allIds = await redis.smembers(Keys.vendorsAll)
        if (!allIds || allIds.length === 0) return json([])
        const allKeys = allIds.map((id) => Keys.vendor(id))
        const allRaw = await redis.mget<string[]>(...allKeys)
        vendorIds = []
        for (let i = 0; i < allRaw.length; i++) {
          if (!allRaw[i]) continue
          try {
            const v = typeof allRaw[i] === 'string' ? JSON.parse(allRaw[i]) : allRaw[i]
            if (v.owner_ces === ownerCes) vendorIds.push(allIds[i])
          } catch { /* skip */ }
        }
        // Rebuild index
        if (vendorIds.length > 0) {
          await redis.sadd(Keys.vendorsByOwner(ownerCes), vendorIds)
        }
      }
    } else {
      vendorIds = await redis.smembers(Keys.vendorsAll)
    }

    if (!vendorIds || vendorIds.length === 0) return json([])

    const keys = vendorIds.map((id) => Keys.vendor(id))
    const rawVendors = await redis.mget<string[]>(...keys)

    const vendors: Record<string, unknown>[] = []
    for (const raw of rawVendors) {
      if (!raw) continue
      try {
        const vendor = typeof raw === 'string' ? JSON.parse(raw) : raw
        vendors.push(vendor)
      } catch { /* skip corrupted */ }
    }

    return json(vendors)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return error(`Failed to list vendors: ${message}`, 500)
  }

}

async function POST(request: Request) {

  try {
    const body = await request.json()
    const { id, owner_ces, name, slug, ...rest } = body as {
      id?: string
      owner_ces?: string
      name?: string
      slug?: string
      [key: string]: unknown
    }

    if (!owner_ces) {
      return error('owner_ces is required', 400)
    }
    if (!name) {
      return error('name is required', 400)
    }

    // Generate ID if not provided
    const vendorId = id || `vendor_${Math.random().toString(36).slice(2, 10)}`
    const vendorSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    // Check if vendor ID already exists
    const existing = await redis.exists(Keys.vendor(vendorId))
    if (existing) {
      return error(`Vendor with ID ${vendorId} already exists`, 409)
    }

    // Check slug uniqueness
    const allVendorIds = await redis.smembers(Keys.vendorsAll)
    if (allVendorIds.length > 0) {
      const allKeys = allVendorIds.map((vid) => Keys.vendor(vid))
      const allRaw = await redis.mget<string[]>(...allKeys)
      for (const raw of allRaw) {
        if (!raw) continue
        try {
          const v = typeof raw === 'string' ? JSON.parse(raw) : raw
          if (v.slug === vendorSlug) {
            return error(`Vendor slug "${vendorSlug}" is already taken`, 409)
          }
        } catch { /* skip */ }
      }
    }

    const now = new Date().toISOString()
    const vendor: Record<string, unknown> = {
      id: vendorId,
      name,
      slug: vendorSlug,
      owner_ces,
      ...rest,
      status: (rest.status as string) || 'active',
      collective_funded: Boolean(rest.collective_funded),
      members: rest.members || [],
      payment_methods: rest.payment_methods || [],
      offerings: rest.offerings || [],
      join_requests: rest.join_requests || [],
      created_at: (rest.created_at as string) || now,
      updated_at: now,
    }

    // Store vendor JSON
    await redis.set(Keys.vendor(vendorId), JSON.stringify(vendor))

    // Add to index sets
    await redis.sadd(Keys.vendorsAll, vendorId)
    await redis.sadd(Keys.vendorsByOwner(owner_ces), vendorId)

    return json(vendor, 201)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return error(`Failed to create vendor: ${message}`, 500)
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
