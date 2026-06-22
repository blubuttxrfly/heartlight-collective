// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Sign-In Endpoint
//  POST /api/auth/signin — verifies CES + passphrase, returns profile
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { verifyPassphrase } from '../../_lib/auth.js'
import { json, error } from '../../_lib/response.js'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ces, passphrase } = body as { ces?: string; passphrase?: string }

    if (!ces || !passphrase) {
      return error('CES number and passphrase are required', 400)
    }

    const result = await verifyPassphrase(ces, passphrase)

    if (!result.success) {
      return json({ error: result.error || 'Sign-in failed' }, 401)
    }

    return json({ profile: result.profile })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return error(`Sign-in error: ${message}`, 500)
  }
}