// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Redis Sync Helper (Client-Side)
//  Pushes local Vendor Shops + Offerings to Upstash Redis via API
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import type { VendorRecord, OfferingItem } from '../types/ces'
import { vendorToRow, offeringToRow } from './exchangeSync'

export interface SyncResult {
  success: boolean
  synced: {
    vendor: boolean
    offerings: number
    offeringsFailed: number
  }
  error?: string
}

/**
 * Sync a vendor and all its offerings to Upstash Redis via the API routes.
 * This bridges localStorage-only vendor data into the collective directory.
 */
export async function syncVendorToRedis(vendor: VendorRecord): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    synced: { vendor: false, offerings: 0, offeringsFailed: 0 },
  }

  try {
    // 1. Sync the vendor
    const vendorRow = vendorToRow(vendor)
    const vendorRes = await fetch('/api/vendors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vendorRow),
    })

    if (vendorRes.ok) {
      result.synced.vendor = true
    } else if (vendorRes.status === 409) {
      // Vendor already exists — update it instead
      const updateRes = await fetch(`/api/vendors/${vendor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorRow),
      })
      if (updateRes.ok) {
        result.synced.vendor = true
      } else {
        const body = await updateRes.json().catch(() => ({}))
        result.success = false
        result.error = `Vendor update failed: ${body.error || updateRes.statusText}`
      }
    } else {
      const body = await vendorRes.json().catch(() => ({}))
      result.success = false
      result.error = `Vendor sync failed: ${body.error || vendorRes.statusText}`
    }

    // 2. Sync all offerings
    const offerings = vendor.offerings || []
    for (const offering of offerings) {
      try {
        const offRow = offeringToRow(offering)
        const offRes = await fetch('/api/offerings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(offRow),
        })

        if (offRes.ok) {
          result.synced.offerings++
        } else if (offRes.status === 409) {
          // Offering exists — update it
          const updateRes = await fetch(`/api/offerings/${offering.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(offRow),
          })
          if (updateRes.ok) {
            result.synced.offerings++
          } else {
            result.synced.offeringsFailed++
          }
        } else {
          result.synced.offeringsFailed++
        }
      } catch {
        result.synced.offeringsFailed++
      }
    }

    if (result.synced.offeringsFailed > 0 && result.synced.offerings === 0) {
      result.success = false
      result.error = result.error || `${result.synced.offeringsFailed} offering(s) failed to sync`
    }

    return result
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      synced: { vendor: false, offerings: 0, offeringsFailed: 0 },
      error: `Sync error: ${message}`,
    }
  }
}

/**
 * Sync a single offering to Redis.
 */
export async function syncOfferingToRedis(offering: OfferingItem): Promise<boolean> {
  try {
    const row = offeringToRow(offering)
    const res = await fetch('/api/offerings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
    })

    if (res.ok) return true

    if (res.status === 409) {
      // Update instead
      const updateRes = await fetch(`/api/offerings/${offering.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row),
      })
      return updateRes.ok
    }

    return false
  } catch {
    return false
  }
}