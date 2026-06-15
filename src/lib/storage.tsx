// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Sovereign Storage Engine
//  Pure localStorage — no serverless backend
//  Brings the dual-layer pattern home: localStorage for data, React state for UI speed
// ─────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { CreatorRecord, AuthorizedStewardEntry, SecurityLogEntry, AgreementRecord, VendorRecord, VendorInvite, ExchangeRequest, CollectivePetition, VendorJoinRequest, ExchangeAgreement, ExchangeCalendar, AvailabilityBlock, ScheduledMeeting, AgreementParty, AgreementPartyWithdrawal, SafetyReport, ExchangeAlert } from '../types/ces';
import { seedDevData } from './seedData';

const STORAGE_PREFIX = 'hlc_';

type StorageKey = keyof StorageState;

const DEFAULT_STATE: StorageState = {
  pending: [],
  approved: [],
  returned: [],
  authorizedCES: [],
  securityLog: [],
  agreements: [],
  vendors: [],
  vendorInvites: [],
  vendorJoinRequests: [],
  exchangeRequests: [],
  exchangeAgreements: [],
  collectivePetitions: [],
  exchangeAlerts: [],
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
  // ── Vendor / Marketplace (Wave B+) ──
  getVendors: () => VendorRecord[];
  addVendor: (vendor: VendorRecord) => void;
  updateVendor: (vendor: VendorRecord) => void;
  removeVendor: (id: string) => void;
  findVendorById: (id: string) => VendorRecord | undefined;
  findVendorByOwner: (ces: string) => VendorRecord[];
  getVendorInvites: () => VendorInvite[];
  addVendorInvite: (invite: VendorInvite) => void;
  updateVendorInvite: (invite: VendorInvite) => void;
  getVendorJoinRequests: (vendorId: string) => VendorJoinRequest[];
  addVendorJoinRequest: (req: VendorJoinRequest) => void;
  updateVendorJoinRequest: (req: VendorJoinRequest) => void;
  getExchangeRequests: () => ExchangeRequest[];
  addExchangeRequest: (req: ExchangeRequest) => void;
  updateExchangeRequest: (req: ExchangeRequest) => void;
  getExchangeAgreements: () => ExchangeAgreement[];
  addExchangeAgreement: (ag: ExchangeAgreement) => void;
  updateExchangeAgreement: (ag: ExchangeAgreement) => void;
  // Quest / Agreement Versioning (Wave 2+)
  updateAgreementQuest: (agreementId: string, questId: string, updates: Partial<import('../types/ces').QuestItem>) => void;
  addAgreementVersion: (agreementId: string, version: import('../types/ces').AgreementVersion) => void;
  approveAgreementUpdate: (agreementId: string, cesNumber: string) => void;
  // Wave 6.9 — Multi-being consent, privacy, withdrawal
  migrateAgreementToParties: (ag: ExchangeAgreement) => ExchangeAgreement;
  getAgreementParties: (agreementId: string) => AgreementParty[];
  updateAgreementPartyPrivacy: (agreementId: string, ces: string, assurance: string, agreed: boolean) => void;
  addAgreementParty: (agreementId: string, party: AgreementParty) => void;
  removeAgreementParty: (agreementId: string, ces: string) => void;
  updateAgreementPartyRole: (agreementId: string, ces: string, role: import('../types/ces').ExchangeRole) => void;
  submitAgreementWithdrawal: (agreementId: string, ces: string, withdrawal: AgreementPartyWithdrawal, safetyReport?: SafetyReport) => void;
  approveAgreementWithdrawal: (agreementId: string, ces: string, stewardCes?: string) => void;
  getExchangeAlerts: () => ExchangeAlert[];
  addExchangeAlert: (alert: ExchangeAlert) => void;
  updateExchangeAlert: (alert: ExchangeAlert) => void;
  markExchangeAlertReviewed: (alertId: string, stewardCes: string) => void;
  getCollectivePetitions: () => CollectivePetition[];
  addCollectivePetition: (petition: CollectivePetition) => void;
  updateCollectivePetition: (petition: CollectivePetition) => void;
  // ── Calendar / Scheduling (Wave 6.75) ──
  getExchangeCalendar: (ces: string) => ExchangeCalendar | undefined;
  saveExchangeCalendar: (calendar: ExchangeCalendar) => void;
  addAvailabilityBlock: (ces: string, block: AvailabilityBlock) => void;
  removeAvailabilityBlock: (ces: string, blockId: string) => void;
  addScheduledMeeting: (ces: string, meeting: ScheduledMeeting) => void;
  updateScheduledMeeting: (ces: string, meetingId: string, updates: Partial<ScheduledMeeting>) => void;
  removeScheduledMeeting: (ces: string, meetingId: string) => void;
  getScheduledMeetingsForCes: (ces: string) => ScheduledMeeting[];
}

export interface StorageState {
  pending: CreatorRecord[];
  approved: CreatorRecord[];
  returned: CreatorRecord[];
  authorizedCES: AuthorizedStewardEntry[];
  securityLog: SecurityLogEntry[];
  agreements: AgreementRecord[];
  vendors: VendorRecord[];
  vendorInvites: VendorInvite[];
  vendorJoinRequests: VendorJoinRequest[];
  exchangeRequests: ExchangeRequest[];
  exchangeAgreements: ExchangeAgreement[];
  collectivePetitions: CollectivePetition[];
  exchangeAlerts: ExchangeAlert[];
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
      vendors: readStorageKey('vendors'),
      vendorInvites: readStorageKey('vendorInvites'),
      vendorJoinRequests: readStorageKey('vendorJoinRequests'),
      exchangeRequests: readStorageKey('exchangeRequests'),
      exchangeAgreements: readStorageKey('exchangeAgreements'),
      collectivePetitions: readStorageKey('collectivePetitions'),
      exchangeAlerts: readStorageKey('exchangeAlerts'),
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

    // Dev-only: seed interconnected mock exchange data when storage is empty
    const seeded = seedDevData(initial);
    return seeded;
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
      const updated = { ...profile };
      if (to === 'approved') {
        updated.stewardship = 'active';
      } else if (to === 'returned' || to === 'pending') {
        updated.stewardship = 'suspended';
      }
      return {
        ...prev,
        [from]: prev[from].filter((p) => p.id !== id),
        [to]: [...prev[to], updated],
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

  // ── Vendor / Marketplace methods (Wave B+) ──

  const getVendors = useCallback(() => stateRef.current.vendors, []);

  const addVendor = useCallback((vendor: VendorRecord) => {
    setState((prev) => ({
      ...prev,
      vendors: [...prev.vendors, vendor],
    }));
  }, []);

  const updateVendor = useCallback((vendor: VendorRecord) => {
    setState((prev) => ({
      ...prev,
      vendors: prev.vendors.map((v) => (v.id === vendor.id ? vendor : v)),
    }));
  }, []);

  const removeVendor = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      vendors: prev.vendors.filter((v) => v.id !== id),
    }));
  }, []);

  const findVendorById = useCallback((id: string) => {
    return stateRef.current.vendors.find((v) => v.id === id);
  }, []);

  const findVendorByOwner = useCallback((ces: string) => {
    return stateRef.current.vendors.filter((v) => v.ownerCes === ces);
  }, []);

  const getVendorInvites = useCallback(() => stateRef.current.vendorInvites, []);

  const addVendorInvite = useCallback((invite: VendorInvite) => {
    setState((prev) => ({
      ...prev,
      vendorInvites: [...prev.vendorInvites, invite],
    }));
  }, []);

  const updateVendorInvite = useCallback((invite: VendorInvite) => {
    setState((prev) => ({
      ...prev,
      vendorInvites: prev.vendorInvites.map((i) => (i.id === invite.id ? invite : i)),
    }));
  }, []);

  const getVendorJoinRequests = useCallback((vendorId: string) => {
    return stateRef.current.vendorJoinRequests.filter((r) => r.vendorId === vendorId);
  }, []);

  const addVendorJoinRequest = useCallback((req: VendorJoinRequest) => {
    setState((prev) => ({
      ...prev,
      vendorJoinRequests: [...prev.vendorJoinRequests, req],
    }));
  }, []);

  const updateVendorJoinRequest = useCallback((req: VendorJoinRequest) => {
    setState((prev) => ({
      ...prev,
      vendorJoinRequests: prev.vendorJoinRequests.map((r) => (r.id === req.id ? req : r)),
    }));
  }, []);

  const getExchangeRequests = useCallback(() => stateRef.current.exchangeRequests, []);

  const addExchangeRequest = useCallback((req: ExchangeRequest) => {
    setState((prev) => ({
      ...prev,
      exchangeRequests: [...prev.exchangeRequests, req],
    }));
  }, []);

  const updateExchangeRequest = useCallback((req: ExchangeRequest) => {
    setState((prev) => ({
      ...prev,
      exchangeRequests: prev.exchangeRequests.map((r) => (r.id === req.id ? req : r)),
    }));
  }, []);

  const getExchangeAgreements = useCallback(() => stateRef.current.exchangeAgreements, []);

  const addExchangeAgreement = useCallback((ag: ExchangeAgreement) => {
    setState((prev) => ({
      ...prev,
      exchangeAgreements: [...prev.exchangeAgreements, ag],
    }));
  }, []);

  const updateExchangeAgreement = useCallback((ag: ExchangeAgreement) => {
    setState((prev) => ({
      ...prev,
      exchangeAgreements: prev.exchangeAgreements.map((a) => (a.id === ag.id ? migrateAgreementToParties(ag) : a)),
    }));
  }, []);

  // ── Wave 6.9 — Multi-being consent, privacy, withdrawal helpers ──

  const migrateAgreementToParties = useCallback((ag: ExchangeAgreement): ExchangeAgreement => {
    if (ag.parties && ag.parties.length > 0) return ag;
    const now = new Date().toISOString();
    const requesterParty: AgreementParty = {
      ces: ag.requesterCes,
      name: ag.requesterName,
      role: ag.requesterRole,
      privacyAssurance: '',
      privacyAgreed: ag.requesterConsented,
      joinedAt: ag.createdAt || now,
    };
    const providerParty: AgreementParty = {
      ces: ag.providerCes,
      name: ag.providerName,
      role: ag.providerRole,
      privacyAssurance: '',
      privacyAgreed: ag.providerConsented,
      joinedAt: ag.createdAt || now,
    };
    return {
      ...ag,
      parties: [requesterParty, providerParty],
      mainQuestDirective: ag.mainQuestDirective || ag.mainQuest,
      mainQuests: ag.mainQuests && ag.mainQuests.length > 0 ? ag.mainQuests : [ag.mainQuest],
      safetyReports: ag.safetyReports || [],
    };
  }, []);

  const getAgreementParties = useCallback((agreementId: string): AgreementParty[] => {
    const ag = stateRef.current.exchangeAgreements.find((a) => a.id === agreementId);
    return migrateAgreementToParties(ag || { id: agreementId } as ExchangeAgreement).parties || [];
  }, []);

  const updateAgreementPartyPrivacy = useCallback((agreementId: string, ces: string, assurance: string, agreed: boolean) => {
    setState((prev) => ({
      ...prev,
      exchangeAgreements: prev.exchangeAgreements.map((ag) => {
        if (ag.id !== agreementId) return ag;
        const next = migrateAgreementToParties(ag);
        return {
          ...next,
          parties: (next.parties || []).map((p) =>
            p.ces === ces ? { ...p, privacyAssurance: assurance, privacyAgreed: agreed, joinedAt: p.joinedAt || new Date().toISOString() } : p
          ),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  const addAgreementParty = useCallback((agreementId: string, party: AgreementParty) => {
    setState((prev) => ({
      ...prev,
      exchangeAgreements: prev.exchangeAgreements.map((ag) => {
        if (ag.id !== agreementId) return ag;
        const next = migrateAgreementToParties(ag);
        if (next.parties?.some((p) => p.ces === party.ces)) return next;
        return {
          ...next,
          parties: [...(next.parties || []), { ...party, joinedAt: party.joinedAt || new Date().toISOString() }],
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  const removeAgreementParty = useCallback((agreementId: string, ces: string) => {
    setState((prev) => ({
      ...prev,
      exchangeAgreements: prev.exchangeAgreements.map((ag) => {
        if (ag.id !== agreementId) return ag;
        const next = migrateAgreementToParties(ag);
        return {
          ...next,
          parties: (next.parties || []).filter((p) => p.ces !== ces),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  const updateAgreementPartyRole = useCallback((agreementId: string, ces: string, role: import('../types/ces').ExchangeRole) => {
    setState((prev) => ({
      ...prev,
      exchangeAgreements: prev.exchangeAgreements.map((ag) => {
        if (ag.id !== agreementId) return ag;
        const next = migrateAgreementToParties(ag);
        return {
          ...next,
          parties: (next.parties || []).map((p) => (p.ces === ces ? { ...p, role } : p)),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  const submitAgreementWithdrawal = useCallback((agreementId: string, ces: string, withdrawal: AgreementPartyWithdrawal, safetyReport?: SafetyReport) => {
    const now = new Date().toISOString();
    setState((prev) => {
      const nextAgreements = prev.exchangeAgreements.map((ag) => {
        if (ag.id !== agreementId) return ag;
        const next = migrateAgreementToParties(ag);
        const withdrawing = next.parties?.find((p) => p.ces === ces);
        const updatedParties = (next.parties || []).map((p) =>
          p.ces === ces
            ? { ...p, withdrawal: { ...withdrawal, requestedAt: withdrawal.requestedAt || now, status: 'submitted' as const }, withdrewAt: undefined }
            : p
        );
        return {
          ...next,
          parties: updatedParties,
          safetyReports: safetyReport ? [...(next.safetyReports || []), safetyReport] : next.safetyReports,
          updatedAt: now,
        };
      });

      const agreement = nextAgreements.find((a) => a.id === agreementId);
      const withdrawingParty = agreement?.parties?.find((p) => p.ces === ces);
      const nextAlerts = safetyReport
        ? [
            ...prev.exchangeAlerts,
            {
              id: `alert_${Date.now()}`,
              exchangeId: agreementId,
              exchangeTitle: agreement?.mainQuest?.title || 'Untitled Exchange',
              type: 'safety_report' as const,
              fromCes: ces,
              fromName: withdrawingParty?.name || 'Unknown being',
              message: safetyReport.feelsUnsafe
                ? `Safety report submitted. ${safetyReport.unsafeBeingName || safetyReport.unsafeBeingCes || 'A being'} was named as feeling unsafe. Contact Guide preference: ${safetyReport.contactGuide}.`
                : 'Safety report submitted.',
              status: 'open' as const,
              createdAt: now,
              metadata: { safetyReport },
            },
          ]
        : [
            ...prev.exchangeAlerts,
            {
              id: `alert_${Date.now()}`,
              exchangeId: agreementId,
              exchangeTitle: agreement?.mainQuest?.title || 'Untitled Exchange',
              type: 'withdrawal' as const,
              fromCes: ces,
              fromName: withdrawingParty?.name || 'Unknown being',
              message: `Withdrawal requested. Reason: ${withdrawal.reason}${withdrawal.otherReason ? ` — ${withdrawal.otherReason}` : ''}.`,
              status: 'open' as const,
              createdAt: now,
              metadata: { withdrawal },
            },
          ];

      return { ...prev, exchangeAgreements: nextAgreements, exchangeAlerts: nextAlerts };
    });
  }, []);

  const approveAgreementWithdrawal = useCallback((agreementId: string, ces: string, stewardCes?: string) => {
    const now = new Date().toISOString();
    setState((prev) => {
      const nextAgreements = prev.exchangeAgreements.map((ag) => {
        if (ag.id !== agreementId) return ag;
        const next = migrateAgreementToParties(ag);
        const updatedParties = (next.parties || []).map((p) =>
          p.ces === ces
            ? { ...p, withdrewAt: now, withdrawal: p.withdrawal ? { ...p.withdrawal, status: 'approved' as const, approvedBy: stewardCes || 'system' } : p.withdrawal }
            : p
        );
        const activeParties = updatedParties.filter((p) => !p.withdrewAt);
        const newStatus: ExchangeAgreement['status'] = activeParties.length === 0 ? 'withdrawn' : ag.status;
        return {
          ...next,
          parties: updatedParties,
          status: newStatus,
          updatedAt: now,
        };
      });

      const agreement = nextAgreements.find((a) => a.id === agreementId);
      const withdrawingParty = agreement?.parties?.find((p) => p.ces === ces);

      const nextAlerts = prev.exchangeAlerts.map((alert) =>
        alert.exchangeId === agreementId && alert.type === 'withdrawal' && alert.fromCes === ces
          ? { ...alert, status: 'resolved' as const, reviewedBy: stewardCes, reviewedAt: now }
          : alert
      );

      return {
        ...prev,
        exchangeAgreements: nextAgreements,
        exchangeAlerts: nextAlerts,
      };
    });
  }, []);

  const getExchangeAlerts = useCallback(() => stateRef.current.exchangeAlerts, []);

  const addExchangeAlert = useCallback((alert: ExchangeAlert) => {
    setState((prev) => ({
      ...prev,
      exchangeAlerts: [...prev.exchangeAlerts, alert],
    }));
  }, []);

  const updateExchangeAlert = useCallback((alert: ExchangeAlert) => {
    setState((prev) => ({
      ...prev,
      exchangeAlerts: prev.exchangeAlerts.map((a) => (a.id === alert.id ? alert : a)),
    }));
  }, []);

  const markExchangeAlertReviewed = useCallback((alertId: string, stewardCes: string) => {
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      exchangeAlerts: prev.exchangeAlerts.map((a) =>
        a.id === alertId ? { ...a, status: 'reviewed' as const, reviewedBy: stewardCes, reviewedAt: now } : a
      ),
    }));
  }, []);

  // ── Quest / Agreement Versioning (Wave 2+) ──

  const updateAgreementQuest = useCallback((agreementId: string, questId: string, updates: Partial<import('../types/ces').QuestItem>) => {
    setState((prev) => ({
      ...prev,
      exchangeAgreements: prev.exchangeAgreements.map((ag) => {
        if (ag.id !== agreementId) return ag;
        const next = { ...ag, mainQuest: { ...ag.mainQuest }, sideQuests: [...ag.sideQuests] };
        if (next.mainQuest.id === questId) {
          Object.assign(next.mainQuest, updates);
        } else {
          const idx = next.sideQuests.findIndex((q) => q.id === questId);
          if (idx >= 0) {
            next.sideQuests[idx] = { ...next.sideQuests[idx], ...updates };
          }
        }
        next.updatedAt = new Date().toISOString();
        return next;
      }),
    }));
  }, []);

  const addAgreementVersion = useCallback((agreementId: string, version: import('../types/ces').AgreementVersion) => {
    setState((prev) => ({
      ...prev,
      exchangeAgreements: prev.exchangeAgreements.map((ag) => {
        if (ag.id !== agreementId) return ag;
        return {
          ...ag,
          versions: [...ag.versions, version],
          pendingUpdate: undefined,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  const approveAgreementUpdate = useCallback((agreementId: string, cesNumber: string) => {
    setState((prev) => ({
      ...prev,
      exchangeAgreements: prev.exchangeAgreements.map((ag) => {
        if (ag.id !== agreementId || !ag.pendingUpdate) return ag;
        const nextPending = {
          ...ag.pendingUpdate,
          approvedBy: [...ag.pendingUpdate.approvedBy, cesNumber],
        };
        // If all parties approved (requester + provider), apply the update
        const allApproved = nextPending.approvedBy.includes(ag.requesterCes) && nextPending.approvedBy.includes(ag.providerCes);
        return {
          ...ag,
          pendingUpdate: allApproved ? undefined : nextPending,
          versions: allApproved ? [...ag.versions, nextPending] : ag.versions,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  // ── Calendar / Scheduling (Wave 6.75) ──
  const EXCHANGE_CALENDARS_KEY = 'hlc_exchange_calendars';

  const readCalendars = useCallback((): ExchangeCalendar[] => {
    try {
      const raw = localStorage.getItem(EXCHANGE_CALENDARS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as ExchangeCalendar[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const writeCalendars = useCallback((calendars: ExchangeCalendar[]) => {
    try {
      localStorage.setItem(EXCHANGE_CALENDARS_KEY, JSON.stringify(calendars));
    } catch (err) {
      console.warn('Failed to write exchange calendars to localStorage:', err);
    }
  }, []);

  const getExchangeCalendar = useCallback((ces: string): ExchangeCalendar | undefined => {
    return readCalendars().find((c) => c.ces === ces);
  }, [readCalendars]);

  const saveExchangeCalendar = useCallback((calendar: ExchangeCalendar) => {
    const calendars = readCalendars();
    const next = calendars.filter((c) => c.ces !== calendar.ces);
    next.push({ ...calendar, updatedAt: new Date().toISOString() });
    writeCalendars(next);
  }, [readCalendars, writeCalendars]);

  const addAvailabilityBlock = useCallback((ces: string, block: AvailabilityBlock) => {
    const existing = getExchangeCalendar(ces);
    const now = new Date().toISOString();
    const calendar: ExchangeCalendar = existing
      ? { ...existing, availabilityBlocks: [...existing.availabilityBlocks, block], updatedAt: now }
      : { ces, availabilityBlocks: [block], scheduledMeetings: [], updatedAt: now };
    saveExchangeCalendar(calendar);
  }, [getExchangeCalendar, saveExchangeCalendar]);

  const removeAvailabilityBlock = useCallback((ces: string, blockId: string) => {
    const existing = getExchangeCalendar(ces);
    if (!existing) return;
    saveExchangeCalendar({
      ...existing,
      availabilityBlocks: existing.availabilityBlocks.filter((b) => b.id !== blockId),
      updatedAt: new Date().toISOString(),
    });
  }, [getExchangeCalendar, saveExchangeCalendar]);

  const addScheduledMeeting = useCallback((ces: string, meeting: ScheduledMeeting) => {
    const existing = getExchangeCalendar(ces);
    const now = new Date().toISOString();
    const calendar: ExchangeCalendar = existing
      ? { ...existing, scheduledMeetings: [...existing.scheduledMeetings, meeting], updatedAt: now }
      : { ces, availabilityBlocks: [], scheduledMeetings: [meeting], updatedAt: now };
    saveExchangeCalendar(calendar);
  }, [getExchangeCalendar, saveExchangeCalendar]);

  const updateScheduledMeeting = useCallback((ces: string, meetingId: string, updates: Partial<ScheduledMeeting>) => {
    const existing = getExchangeCalendar(ces);
    if (!existing) return;
    saveExchangeCalendar({
      ...existing,
      scheduledMeetings: existing.scheduledMeetings.map((m) => (m.id === meetingId ? { ...m, ...updates } : m)),
      updatedAt: new Date().toISOString(),
    });
  }, [getExchangeCalendar, saveExchangeCalendar]);

  const removeScheduledMeeting = useCallback((ces: string, meetingId: string) => {
    const existing = getExchangeCalendar(ces);
    if (!existing) return;
    saveExchangeCalendar({
      ...existing,
      scheduledMeetings: existing.scheduledMeetings.filter((m) => m.id !== meetingId),
      updatedAt: new Date().toISOString(),
    });
  }, [getExchangeCalendar, saveExchangeCalendar]);

  const getScheduledMeetingsForCes = useCallback((ces: string): ScheduledMeeting[] => {
    return getExchangeCalendar(ces)?.scheduledMeetings || [];
  }, [getExchangeCalendar]);

  const getCollectivePetitions = useCallback(() => stateRef.current.collectivePetitions, []);

  const addCollectivePetition = useCallback((petition: CollectivePetition) => {
    setState((prev) => ({
      ...prev,
      collectivePetitions: [...prev.collectivePetitions, petition],
    }));
  }, []);

  const updateCollectivePetition = useCallback((petition: CollectivePetition) => {
    setState((prev) => ({
      ...prev,
      collectivePetitions: prev.collectivePetitions.map((p) => (p.id === petition.id ? petition : p)),
    }));
  }, []);

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
    // ── Vendor / Marketplace ──
    getVendors,
    addVendor,
    updateVendor,
    removeVendor,
    findVendorById,
    findVendorByOwner,
    getVendorInvites,
    addVendorInvite,
    updateVendorInvite,
    getVendorJoinRequests,
    addVendorJoinRequest,
    updateVendorJoinRequest,
    getExchangeRequests,
    addExchangeRequest,
    updateExchangeRequest,
    getExchangeAgreements,
    addExchangeAgreement,
    updateExchangeAgreement,
    // Quest / Agreement Versioning (Wave 2+)
    updateAgreementQuest,
    addAgreementVersion,
    approveAgreementUpdate,
    // Wave 6.9 — Multi-being consent, privacy, withdrawal
    migrateAgreementToParties,
    getAgreementParties,
    updateAgreementPartyPrivacy,
    addAgreementParty,
    removeAgreementParty,
    updateAgreementPartyRole,
    submitAgreementWithdrawal,
    approveAgreementWithdrawal,
    getExchangeAlerts,
    addExchangeAlert,
    updateExchangeAlert,
    markExchangeAlertReviewed,
    getCollectivePetitions,
    addCollectivePetition,
    updateCollectivePetition,
    // Calendar / Scheduling (Wave 6.75)
    getExchangeCalendar,
    saveExchangeCalendar,
    addAvailabilityBlock,
    removeAvailabilityBlock,
    addScheduledMeeting,
    updateScheduledMeeting,
    removeScheduledMeeting,
    getScheduledMeetingsForCes,
  };

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}

export function useStorage() {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error('useStorage must be used within a StorageProvider');
  return ctx;
}
