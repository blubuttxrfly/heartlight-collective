// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Sovereign Storage Engine
//  Pure localStorage — no serverless backend
//  Brings the dual-layer pattern home: localStorage for data, React state for UI speed
// ─────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { CreatorRecord, AuthorizedStewardEntry, SecurityLogEntry, AgreementRecord } from '../types/ces';

const STORAGE_PREFIX = 'hlc_';

interface StorageState {
  pending: CreatorRecord[];
  approved: CreatorRecord[];
  returned: CreatorRecord[];
  authorizedCES: AuthorizedStewardEntry[];
  securityLog: SecurityLogEntry[];
  agreements: AgreementRecord[];
}

type StorageKey = keyof StorageState;

const DEFAULT_STATE: StorageState = {
  pending: [],
  approved: [],
  returned: [],
  authorizedCES: [],
  securityLog: [],
  agreements: [],
};

function readStorageKey<K extends StorageKey>(key: K): StorageState[K] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw === null) return DEFAULT_STATE[key];
    return JSON.parse(raw) as StorageState[K];
  } catch {
    return DEFAULT_STATE[key];
  }
}

function writeStorageKey<K extends StorageKey>(key: K, value: StorageState[K]): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    console.warn('Storage write failed for', key);
  }
}

// ── Context ──

interface StorageContextValue {
  state: StorageState;
  getProfiles: () => CreatorRecord[];
  getPending: () => CreatorRecord[];
  getApproved: () => CreatorRecord[];
  getReturned: () => CreatorRecord[];
  addProfile: (profile: CreatorRecord, queue?: 'pending' | 'approved' | 'returned') => void;
  updateProfile: (profile: CreatorRecord) => void;
  removeProfile: (id: string, queue: StorageKey) => void;
  moveProfile: (id: string, from: 'pending' | 'approved' | 'returned', to: 'pending' | 'approved' | 'returned') => void;
  findProfileByCES: (ces: string) => CreatorRecord | undefined;
  findProfileById: (id: string) => CreatorRecord | undefined;
  addSecurityLog: (entry: SecurityLogEntry) => void;
  getSecurityLog: () => SecurityLogEntry[];
  addSteward: (entry: AuthorizedStewardEntry) => void;
  getStewards: () => AuthorizedStewardEntry[];
}

const StorageContext = createContext<StorageContextValue | null>(null);

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StorageState>(() => {
    const initial: StorageState = {
      pending: readStorageKey('pending'),
      approved: readStorageKey('approved'),
      returned: readStorageKey('returned'),
      authorizedCES: readStorageKey('authorizedCES'),
      securityLog: readStorageKey('securityLog'),
      agreements: readStorageKey('agreements'),
    };
    // Seed Atlas as founding steward if no stewards exist
    if (initial.authorizedCES.length === 0) {
      initial.authorizedCES = [
        {
          id: 'steward_atlas',
          name: 'Atlas Morphoenix',
          ces: '111111111',
          passphrase: 'sovereign42',
          role: 'Founding Steward',
          createdAt: new Date().toISOString(),
          status: 'active',
        },
      ];
    }
    return initial;
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // Persist to localStorage whenever state changes
  useEffect(() => {
    (Object.keys(state) as StorageKey[]).forEach((key) => {
      writeStorageKey(key, state[key]);
    });
  }, [state]);

  const getProfiles = useCallback(() => {
    return [...stateRef.current.pending, ...stateRef.current.approved, ...stateRef.current.returned];
  }, []);

  const getPending = useCallback(() => stateRef.current.pending, []);
  const getApproved = useCallback(() => stateRef.current.approved, []);
  const getReturned = useCallback(() => stateRef.current.returned, []);

  const addProfile = useCallback((profile: CreatorRecord, queue: 'pending' | 'approved' | 'returned' = 'pending') => {
    setState((prev) => ({
      ...prev,
      [queue]: [...prev[queue], profile],
    }));
  }, []);

  const updateProfile = useCallback((profile: CreatorRecord) => {
    setState((prev) => {
      const next = { ...prev };
      (['pending', 'approved', 'returned'] as const).forEach((key) => {
        const list = next[key];
        const index = list.findIndex((p) => p.id === profile.id || (p.cesNumber && p.cesNumber === profile.cesNumber));
        if (index >= 0) {
          next[key] = [...list.slice(0, index), profile, ...list.slice(index + 1)];
        }
      });
      return next;
    });
  }, []);

  const removeProfile = useCallback((id: string, queue: StorageKey) => {
    if (queue !== 'pending' && queue !== 'approved' && queue !== 'returned') return;
    setState((prev) => ({
      ...prev,
      [queue]: prev[queue].filter((p) => p.id !== id),
    }));
  }, []);

  const moveProfile = useCallback((id: string, from: 'pending' | 'approved' | 'returned', to: 'pending' | 'approved' | 'returned') => {
    if (from === to) return;
    setState((prev) => {
      const profile = prev[from].find((p) => p.id === id);
      if (!profile) return prev;
      return {
        ...prev,
        [from]: prev[from].filter((p) => p.id !== id),
        [to]: [...prev[to], profile],
      };
    });
  }, []);

  const findProfileByCES = useCallback((ces: string) => {
    return getProfiles().find((p) => p.cesNumber === ces);
  }, [getProfiles]);

  const findProfileById = useCallback((id: string) => {
    return getProfiles().find((p) => p.id === id);
  }, [getProfiles]);

  const addSecurityLog = useCallback((entry: SecurityLogEntry) => {
    setState((prev) => ({
      ...prev,
      securityLog: [entry, ...prev.securityLog].slice(0, 500), // keep last 500
    }));
  }, []);

  const getSecurityLog = useCallback(() => stateRef.current.securityLog, []);

  const addSteward = useCallback((entry: AuthorizedStewardEntry) => {
    setState((prev) => ({
      ...prev,
      authorizedCES: [...prev.authorizedCES, entry],
    }));
  }, []);

  const getStewards = useCallback(() => stateRef.current.authorizedCES, []);

  const value: StorageContextValue = {
    state,
    getProfiles,
    getPending,
    getApproved,
    getReturned,
    addProfile,
    updateProfile,
    removeProfile,
    moveProfile,
    findProfileByCES,
    findProfileById,
    addSecurityLog,
    getSecurityLog,
    addSteward,
    getStewards,
  };

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}

export function useStorage() {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error('useStorage must be used within a StorageProvider');
  return ctx;
}
