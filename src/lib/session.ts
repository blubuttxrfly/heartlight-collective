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
  emoji: string                  // Profile emoji
  photo?: string                 // Profile photo URL
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
  const [user, setUser] = useState<HLCUser | null>(() => {
    const saved = readSession()
    console.log('[useSession] Initial user from localStorage:', saved)
    return saved
  })

  /* ── Sign in with CES + passphrase ── */
  const signIn = useCallback(async (profile: CreatorRecord) => {
    console.log('[useSession] signIn called for:', profile.cesNumber, profile.name)
    const u: HLCUser = {
      ces: profile.cesNumber || '',
      name: profile.name,
      emoji: profile.emoji || '✦',
      photo: profile.photo || undefined,
      isSteward: profile.stewardship === 'active',
    }
    writeSession(u)
    setUser(u)
    console.log('[useSession] Session saved, new user state:', u)
    
    // Dispatch custom event to notify other components (like Header)
    window.dispatchEvent(new CustomEvent('hlc-session-change', { detail: u }))
  }, [])

  /* ── Sign out ── */
  const signOut = useCallback(() => {
    console.log('[useSession] signOut called')
    writeSession(null)
    setUser(null)
  }, [])

  /* ── Refresh (for external changes) ── */
  const refresh = useCallback(() => {
    const current = readSession()
    console.log('[useSession] refresh called, current user:', current)
    setUser(current)
  }, [])

  /* ── Listen for storage events from other tabs ── */
  useEffect(() => {
    const handler = () => {
      const updated = readSession()
      console.log('[useSession] Storage event, updated user:', updated)
      setUser(updated)
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  console.log('[useSession] Rendering with user:', user, 'signedIn:', Boolean(user))

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
