// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Sovereign Session (Atlas-first)
//  Source of truth: Atlas Island shared session cookie (cross-device)
//  Local cache: localStorage for instant UI + cross-tab sync
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import type { CreatorRecord } from '../types/ces'
import { fetchAtlasMe, signOutAtlas, type AtlasUser } from './atlasAuth'

const SESSION_KEY = 'hlc_session_v2' // cache of Atlas-bound identity

/* ═══ Unified User ─ local cache of Atlas identity ═══ */
export interface HLCUser {
  ces: string                    // 9-digit C.E.S.
  name: string
  emoji: string                  // Profile emoji
  photo?: string                 // Profile photo URL
  isSteward: boolean
  fromSupabase?: boolean          // legacy field, kept for compat
  atlasEmail?: string             // bound Atlas Island email identity
  atlasSessionActive?: boolean    // true if shared session cookie is valid
  atlasUserId?: string            // Atlas Island user id
  cesProfileId?: string           // id() of the C.E.S. record, if known
}

/* ═══ Helpers ── read/write localStorage cache ═══ */
function readSession(): HLCUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as HLCUser
  } catch { /* ignore */ }
  return null
}

function writeSession(user: HLCUser | null) {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem('hlc_currentUser')
  }
}

/* ═══ Load a C.E.S. profile from any localStorage queue by cesNumber ═══ */
function loadLocalProfileByCes(ces: string): CreatorRecord | null {
  if (!ces) return null
  try {
    const queues = ['pending', 'approved', 'returned'] as const
    for (const queue of queues) {
      const raw = localStorage.getItem(`hlc_${queue}`)
      if (!raw) continue
      const list = JSON.parse(raw) as CreatorRecord[]
      const found = list.find((p) => p.cesNumber === ces || p.id === ces)
      if (found) return found
    }
  } catch (err) {
    console.warn('[loadLocalProfileByCes] error:', err)
  }
  return null
}

function profileToUser(profile: CreatorRecord, atlas?: AtlasUser): HLCUser {
  return {
    ces: profile.cesNumber || '',
    name: profile.name,
    emoji: profile.emoji || '✦',
    photo: profile.photo || undefined,
    isSteward: profile.stewardship === 'active',
    atlasEmail: atlas?.email,
    atlasUserId: atlas?.id,
    cesProfileId: atlas?.cesProfileId || profile.id,
    atlasSessionActive: Boolean(atlas?.email),
  }
}

/* ═══ Hook ── Unified useSession ═══ */
export function useSession() {
  const [user, setUser] = useState<HLCUser | null>(() => {
    const saved = readSession()
    console.log('[useSession] Initial cache:', saved)
    return saved
  })
  const [atlasChecked, setAtlasChecked] = useState(false)

  /* ── Apply a resolved user to state + cache + other tabs ── */
  const applyUser = useCallback((u: HLCUser | null) => {
    writeSession(u)
    setUser(u)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hlc-session-change', { detail: u }))
    }
  }, [])

  /* ── Legacy sign in with CES + passphrase ── */
  const signIn = useCallback(async (profile: CreatorRecord) => {
    console.log('[useSession] legacy signIn for:', profile.cesNumber, profile.name)
    const u = profileToUser(profile)
    applyUser(u)
  }, [applyUser])

  /* ── Atlas-first sign in / hydration ── */
  const atlasSignIn = useCallback((atlasUser: AtlasUser, profile?: CreatorRecord | null) => {
    console.log('[useSession] atlasSignIn:', atlasUser.email, 'cesProfileId:', atlasUser.cesProfileId)
    let resolvedProfile = profile
    if (!resolvedProfile && atlasUser.cesProfileId) {
      resolvedProfile = loadLocalProfileByCes(atlasUser.cesProfileId)
    }
    if (!resolvedProfile && atlasUser.cesProfileId) {
      // We know the Atlas user is bound to a C.E.S. id, but no local profile exists.
      // Create a minimal sovereign identity so the UI can still show "signed in".
      resolvedProfile = {
        id: atlasUser.cesProfileId,
        cesNumber: atlasUser.cesProfileId,
        name: atlasUser.name || 'Atlas Being',
        emoji: '✦',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as CreatorRecord
    }
    const u = resolvedProfile ? profileToUser(resolvedProfile, atlasUser) : {
      ces: '',
      name: atlasUser.name || 'Atlas Being',
      emoji: '✦',
      isSteward: false,
      atlasEmail: atlasUser.email,
      atlasUserId: atlasUser.id,
      atlasSessionActive: true,
    }
    applyUser(u)
  }, [applyUser])

  /* ── Sign out ── */
  const signOut = useCallback(async () => {
    console.log('[useSession] signOut called')
    try {
      await signOutAtlas()
    } catch (err) {
      console.warn('[useSession] Atlas sign-out failed:', err)
    }
    applyUser(null)
  }, [applyUser])

  /* ── Atlas-first session resolution on mount ── */
  useEffect(() => {
    let mounted = true
    fetchAtlasMe()
      .then((me) => {
        if (!mounted) return
        if (me.success && me.user) {
          // Atlas says we are signed in. Prefer Atlas identity over stale local cache.
          atlasSignIn(me.user, null)
        } else {
          // No Atlas session. Keep local cache as-is (legacy CES sign-in).
          setUser((prev) => {
            if (!prev) return prev
            return { ...prev, atlasSessionActive: false }
          })
        }
        setAtlasChecked(true)
      })
      .catch((err) => {
        if (!mounted) return
        console.warn('[useSession] Atlas session check failed:', err)
        setAtlasChecked(true)
      })
    return () => { mounted = false }
  }, [atlasSignIn])

  /* ── Refresh (for external changes / other tabs) ── */
  const refresh = useCallback(() => {
    const current = readSession()
    setUser(current)
  }, [])

  /* ── Listen for storage events from other tabs ── */
  useEffect(() => {
    const handler = () => {
      const updated = readSession()
      setUser(updated)
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  return {
    user,
    signedIn: Boolean(user),
    atlasChecked,
    signIn,
    atlasSignIn,
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
