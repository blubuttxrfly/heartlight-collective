// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Sovereign Session
//  Mirrors the original getCurrentUser / setCurrentUser pattern
//  Uses sessionStorage so the session is tab-specific
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import type { CreatorRecord } from '../types/ces';

const SESSION_KEY = 'hlc_currentUser';

/** Read the current user from sessionStorage. */
export function getCurrentUser(): CreatorRecord | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CreatorRecord;
  } catch {
    return null;
  }
}

/** Store the current user in sessionStorage. */
export function setCurrentUser(profile: CreatorRecord | null): void {
  try {
    if (profile === null) {
      sessionStorage.removeItem(SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(profile));
    }
  } catch {
    // silently fail
  }
}

/** Clear the current session. */
export function clearCurrentUser(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

/** React hook for live session state. */
export function useSession() {
  const [user, setUser] = useState<CreatorRecord | null>(() => getCurrentUser());

  const signIn = useCallback((profile: CreatorRecord) => {
    setCurrentUser(profile);
    setUser(profile);
  }, []);

  const signOut = useCallback(() => {
    clearCurrentUser();
    setUser(null);
  }, []);

  const refresh = useCallback(() => {
    setUser(getCurrentUser());
  }, []);

  // Listen for storage events from other tabs (optional)
  useEffect(() => {
    const handler = () => setUser(getCurrentUser());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return { user, signedIn: !!user, signIn, signOut, refresh };
}
