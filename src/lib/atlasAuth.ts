// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Atlas Island Shared Auth Client
//  Talks to https://auth.atlasisland.co with credentials included
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL || 'https://auth.atlasisland.co'

export interface AtlasUser {
  id: string
  email: string
  name?: string
  cesProfileId?: string
}

export interface AtlasSession {
  id: string
  createdAt: string
  expiresAt: string
}

export interface AtlasMeResponse {
  success: boolean
  user?: AtlasUser
  session?: AtlasSession
  error?: string
}

export interface MagicLinkResponse {
  success: boolean
  message?: string
  error?: string
}

export class AtlasAuthError extends Error {
  status: number
  constructor(message: string, status = 0) {
    super(message)
    this.status = status
  }
}

async function authRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${AUTH_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  let data: unknown
  const text = await res.text()
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { raw: text }
  }

  if (!res.ok) {
    const message =
      typeof data === 'object' && data && 'error' in data
        ? String((data as { error?: string }).error)
        : `${res.status} ${res.statusText}`
    throw new AtlasAuthError(message, res.status)
  }

  return data as T
}

/** Request a magic link email from the shared auth service */
export async function requestMagicLink(email: string, returnTo?: string): Promise<MagicLinkResponse> {
  return authRequest('/api/auth/magic-link', {
    method: 'POST',
    body: JSON.stringify({ email, returnTo: returnTo || window.location.origin + '/auth/callback' }),
  })
}

/** Fetch the currently signed-in Atlas user using the shared session cookie */
export async function fetchAtlasMe(): Promise<AtlasMeResponse> {
  return authRequest('/api/user/me')
}

/** Bind a C.E.S. profile to the currently signed-in Atlas user */
export async function bindCesToAtlasUser(cesProfileId: string): Promise<AtlasMeResponse> {
  return authRequest('/api/user/bind-ces', {
    method: 'PATCH',
    body: JSON.stringify({ cesProfileId }),
  })
}

/** Refresh the shared session cookie (extends expiry) */
export async function refreshAtlasSession(): Promise<AtlasMeResponse> {
  return authRequest('/api/session/refresh', { method: 'POST' })
}

/** Sign out from the shared auth service and clear the cookie */
export async function signOutAtlas(): Promise<{ success: boolean; message?: string }> {
  return authRequest('/api/auth/sign-out', { method: 'POST' })
}
