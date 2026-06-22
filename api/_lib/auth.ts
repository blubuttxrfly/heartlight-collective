// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Auth Helper (Server-Side)
//  CES + passphrase verification using bCrypt against Redis
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import bcrypt from 'bcryptjs'
import { redis, Keys } from './redis.js'

export interface AuthResult {
  success: boolean
  profile?: Record<string, unknown>
  error?: string
}

/**
 * Verify CES + passphrase against Redis-stored profile.
 * Returns the profile (without passphrase hash) on success.
 */
export async function verifyPassphrase(ces: string, passphrase: string): Promise<AuthResult> {
  if (!ces || !passphrase) {
    return { success: false, error: 'CES number and passphrase are required' }
  }

  const raw = await redis.get<string>(Keys.profile(ces))
  if (!raw) {
    return { success: false, error: 'No profile found for that CES number' }
  }

  let profile: Record<string, unknown>
  try {
    profile = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return { success: false, error: 'Profile data corrupted' }
  }

  const storedHash = profile.ces_passphrase_hash as string | undefined
  if (!storedHash) {
    return { success: false, error: 'Profile has no passphrase set' }
  }

  const match = await bcrypt.compare(passphrase, storedHash)
  if (!match) {
    return { success: false, error: 'Passphrase does not match' }
  }

  // Strip the hash before returning
  const { ces_passphrase_hash, ...safeProfile } = profile
  return { success: true, profile: safeProfile }
}

/**
 * Hash a passphrase using bCrypt (10 rounds — standard for serverless).
 */
export async function hashPassphrase(passphrase: string): Promise<string> {
  return bcrypt.hash(passphrase, 10)
}