// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Sovereign Session (Unified)
//  Single source of truth: localStorage for cross-tab persistence
//  + Supabase sync when credentials are configured
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import type { CreatorRecord } from '../types/ces'

const SESSION_KEY = 'hlc_session_v2' // bumped for new unified format

/* ═══ Unified User ─ both local and Supabase ═══ */
export interface HLCUser {
  ces: string                    // 9-digit C.E.S.
  name: string
  isSteward: boolean
  fromSupabase?: boolean          // true if validated against cloud
}

/* ═══ Helpers ── read/write localStorage ═══ */
function readSession(): HLCUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as HLCUser
  } catch {
    // Migrate from old sessionStorage format if present
    try {
      const old = sessionStorage.getItem('hlc_currentUser')
      if (old) {
        const profile = JSON.parse(old) as CreatorRecord
        const user: HLCUser = {
          ces: profile.cesNumber || '',
          name: profile.name,
          isSteward: profile.stewardship === 'active',
        }
        localStorage.setItem(SESSION_KEY, JSON.stringify(user))
        sessionStorage.removeItem('hlc_currentUser')
        return user
      }
    } catch { /* ignore */ }
    return null
  }
}

function writeSession(user: HLCUser | null) {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem('hlc_currentUser')
  }
}

/* ═══ Hook ── Unified useSession ═══ */
export function useSession() {
  const [user, setUser] = useState<HLCUser | null>(() => readSession())

  /* ── Sign in with CES + passphrase ── */
  const signIn = useCallback(async (profile: CreatorRecord) => {
    const u: HLCUser = {
      ces: profile.cesNumber || '',
      name: profile.name,
      isSteward: profile.stewardship === 'active',
    }
    writeSession(u)
    setUser(u)
  }, [])

  /* ── Sign out ── */
  const signOut = useCallback(() => {
    writeSession(null)
    setUser(null)
  }, [])

  /* ── Refresh (for external changes) ── */
  const refresh = useCallback(() => {
    setUser(readSession())
  }, [])

  /* ── Listen for storage events from other tabs ── */
  useEffect(() => {
    const handler = () => setUser(readSession())
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  return {
    user,
    signedIn: Boolean(user),
    signIn,
    signOut,
    refresh,
  }
}

// ── Backward-compat helpers (for non-React code) ──
export function getCurrentUser(): HLCUser | null {
  return readSession()
}

export function clearCurrentUser(): void {
  writeSession(null)
}

export function setCurrentUser(user: HLCUser | null): void {
  writeSession(user)
}
