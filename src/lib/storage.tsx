// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Sovereign Storage Engine
//  Pure localStorage — no serverless backend
//  Brings the dual-layer pattern home: localStorage for data, React state for UI speed
// ─────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { CreatorRecord, AuthorizedStewardEntry, SecurityLogEntry, AgreementRecord, VendorRecord, VendorInvite, ExchangeRequest, CollectivePetition, VendorJoinRequest, ExchangeAgreement, ExchangeCalendar, AvailabilityBlock, ScheduledMeeting, AgreementParty, AgreementPartyWithdrawal, SafetyReport, ExchangeAlert, ExchangeJourney } from '../types/ces';
import {
  syncVendor,
  deleteVendor,
  syncOfferingsForVendor,
  deleteOffering,
  syncExchangeAgreement,
  syncExchangeRequest,
  syncVendorInvite,
  syncVendorJoinRequest,
  syncCollectivePetition,
  syncExchangeAlert,
  syncExchangeCalendar,
  syncExchangeJourney,
  hydrateExchangeState,
} from './exchangeSync';

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
  exchangeJourneys: [],
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
  vendors: VendorRecord[];            // reactive state — prefer this for reads
  getVendors: () => VendorRecord[];
  addVendor: (vendor: VendorRecord) => Promise<{ success: boolean; error?: string }>;
  updateVendor: (vendor: VendorRecord) => Promise<{ success: boolean; error?: string }>;
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
  // Quest / Journey Sync (Wave H+)
  getExchangeJourneys: () => ExchangeJourney[];
  addExchangeJourney: (journey: ExchangeJourney) => void;
  updateExchangeJourney: (journey: ExchangeJourney) => void;
  removeExchangeJourney: (id: string) => void;
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
  exchangeJourneys: ExchangeJourney[];
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
      exchangeJourneys: readStorageKey('exchangeJourneys'),
      collectivePetitions: readStorageKey('collectivePetitions'),
      exchangeAlerts: readStorageKey('exchangeAlerts'),
    };
    // Seed Atlas as founding steward if no stewards exist
    if (initial.authorizedCES.length === 0) {
      initial.authorizedCES = [
        {
          id: 'steward_atlas',
          name: 'Atlas',
          ces: '111111111',
          passphrase: 'sovereign42',
          role: 'Founding Steward',
          createdAt: new Date().toISOString(),
          status: 'active',
        },
      ];
    }

    // Dev-mode: ensure Atlas profile exists for sign-in testing
    const hasAtlasProfile = [...initial.pending, ...initial.approved, ...initial.returned].some(
      (p) => p.cesNumber === '111111111'
    );
    if (!hasAtlasProfile) {
      const atlasProfile: CreatorRecord = {
        id: 'profile_111111111',
        name: 'Atlas',
        pronouns: 'they/them',
        title: 'Founding Steward',
        location: 'Earth, Milky Way',
        emoji: '🌟',
        photo: null,
        bio: 'Dev-mode founding steward profile for Atlas.',
        tags: ['steward', 'founder'],
        numerology: [],
        accessibility: [],
        consent: 'I consent to co-create in alignment with our Greatest & Highest Good.',
        portfolioLink: '',
        portfolioItems: [],
        contactMethods: { email: '', phone: '', instagram: '', youtube: '', threads: '', spotify: '', discord: '', telegram: '', signal: '' },
        contactVisibility: { email: false, phone: false, instagram: false, youtube: false, threads: false, spotify: false, discord: false, telegram: false, signal: false },
        publicContactVisibility: false,
        contactMethod: 'other',
        cesNumber: '111111111',
        passphrase: 'sovereign42',
        wishAvailability: 'accepting',
        directoryWishStatus: 'accepting',
        stewardship: 'active',
        stewardshipNote: 'Dev-only founding steward',
        guideGuardianStatus: 'not_opted_in',
        locationData: { raw: 'Earth, Milky Way', city: 'Earth', region: 'Milky Way', country: 'Gaia', continent: 'Gaia', lat: 0, lon: 0 },
      };
      initial.approved = [atlasProfile, ...initial.approved];
    }

    return initial;
  });

  // Hydrate from Supabase on mount (open collective transparency)
  useEffect(() => {
    hydrateExchangeState(true).then((hydrated) => {
      if (!hydrated || Object.keys(hydrated).length === 0) return;

      // Merge non-localStorage entities into StorageProvider state
      setState((prev) => ({
        ...prev,
        exchangeAgreements: hydrated.exchangeAgreements?.length ? hydrated.exchangeAgreements : prev.exchangeAgreements,
        exchangeRequests: hydrated.exchangeRequests?.length ? hydrated.exchangeRequests : prev.exchangeRequests,
        exchangeJourneys: hydrated.exchangeJourneys?.length ? hydrated.exchangeJourneys : prev.exchangeJourneys,
        vendors: hydrated.vendors?.length ? hydrated.vendors : prev.vendors,
        vendorInvites: hydrated.vendorInvites?.length ? hydrated.vendorInvites : prev.vendorInvites,
        vendorJoinRequests: hydrated.vendorJoinRequests?.length ? hydrated.vendorJoinRequests : prev.vendorJoinRequests,
        collectivePetitions: hydrated.collectivePetitions?.length ? hydrated.collectivePetitions : prev.collectivePetitions,
        exchangeAlerts: hydrated.exchangeAlerts?.length ? hydrated.exchangeAlerts : prev.exchangeAlerts,
      }));

      // Calendars live in their own localStorage key. Merge per-CES, keeping the most recent by updatedAt.
      if (hydrated.exchangeCalendars?.length) {
        try {
          const localRaw = localStorage.getItem('hlc_exchange_calendars');
          const localCals: ExchangeCalendar[] = localRaw ? JSON.parse(localRaw) : [];
          const mergedMap = new Map<string, ExchangeCalendar>();
          for (const cal of localCals) mergedMap.set(cal.ces, cal);
          for (const cal of hydrated.exchangeCalendars) {
            const existing = mergedMap.get(cal.ces);
            const serverNewer = !existing || new Date(cal.updatedAt).getTime() >= new Date(existing.updatedAt).getTime();
            if (serverNewer) {
              mergedMap.set(cal.ces, cal);
            }
          }
          localStorage.setItem('hlc_exchange_calendars', JSON.stringify(Array.from(mergedMap.values())));
        } catch (err) {
          console.warn('Failed to hydrate calendars to localStorage:', err);
        }
      }

      // Wishes live in their own localStorage key
      if (hydrated.wishes?.length) {
        try {
          localStorage.setItem('hlw_wishes', JSON.stringify(hydrated.wishes));
        } catch (err) {
          console.warn('Failed to hydrate wishes to localStorage:', err);
        }
      }
    });
  }, []);

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

  const addVendor = useCallback(async (vendor: VendorRecord): Promise<{ success: boolean; error?: string }> => {
    setState((prev) => ({
      ...prev,
      vendors: [...prev.vendors, vendor],
    }));
    const result = await syncVendor(vendor);
    if (!result.success) {
      return result;
    }
    // Sync offerings only after vendor succeeds
    if (vendor.offerings?.length > 0) {
      const offeringResults = await syncOfferingsForVendor(vendor);
      const failed = offeringResults.filter((r) => !r.success);
      if (failed.length > 0) {
        return { success: false, error: `${failed.length} offering sync(s) failed` };
      }
    }
    return { success: true };
  }, []);

  const updateVendor = useCallback(async (vendor: VendorRecord): Promise<{ success: boolean; error?: string }> => {
    setState((prev) => ({
      ...prev,
      vendors: prev.vendors.map((v) => (v.id === vendor.id ? vendor : v)),
    }));
    const result = await syncVendor(vendor);
    if (!result.success) {
      return result;
    }
    if (vendor.offerings?.length > 0) {
      const offeringResults = await syncOfferingsForVendor(vendor);
      const failed = offeringResults.filter((r) => !r.success);
      if (failed.length > 0) {
        return { success: false, error: `${failed.length} offering sync(s) failed` };
      }
    }
    return { success: true };
  }, []);

  const removeVendor = useCallback((id: string) => {
    const vendor = stateRef.current.vendors.find((v) => v.id === id);
    setState((prev) => ({
      ...prev,
      vendors: prev.vendors.filter((v) => v.id !== id),
    }));
    deleteVendor(id);
    if (vendor) {
      vendor.offerings.forEach((o) => deleteOffering(o.id));
    }
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
    syncVendorInvite(invite);
  }, []);

  const updateVendorInvite = useCallback((invite: VendorInvite) => {
    setState((prev) => ({
      ...prev,
      vendorInvites: prev.vendorInvites.map((i) => (i.id === invite.id ? invite : i)),
    }));
    syncVendorInvite(invite);
  }, []);

  const getVendorJoinRequests = useCallback((vendorId: string) => {
    return stateRef.current.vendorJoinRequests.filter((r) => r.vendorId === vendorId);
  }, []);

  const addVendorJoinRequest = useCallback((req: VendorJoinRequest) => {
    setState((prev) => ({
      ...prev,
      vendorJoinRequests: [...prev.vendorJoinRequests, req],
    }));
    syncVendorJoinRequest(req);
  }, []);

  const updateVendorJoinRequest = useCallback((req: VendorJoinRequest) => {
    setState((prev) => ({
      ...prev,
      vendorJoinRequests: prev.vendorJoinRequests.map((r) => (r.id === req.id ? req : r)),
    }));
    syncVendorJoinRequest(req);
  }, []);

  const getExchangeRequests = useCallback(() => stateRef.current.exchangeRequests, []);

  const addExchangeRequest = useCallback((req: ExchangeRequest) => {
    setState((prev) => ({
      ...prev,
      exchangeRequests: [...prev.exchangeRequests, req],
    }));
    syncExchangeRequest(req);
  }, []);

  const updateExchangeRequest = useCallback((req: ExchangeRequest) => {
    setState((prev) => ({
      ...prev,
      exchangeRequests: prev.exchangeRequests.map((r) => (r.id === req.id ? req : r)),
    }));
    syncExchangeRequest(req);
  }, []);

  const getExchangeAgreements = useCallback(() => stateRef.current.exchangeAgreements, []);

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

  const addExchangeAgreement = useCallback((ag: ExchangeAgreement) => {
    const migrated = migrateAgreementToParties(ag);
    setState((prev) => ({
      ...prev,
      exchangeAgreements: [...prev.exchangeAgreements, migrated],
    }));
    syncExchangeAgreement(migrated);
  }, [migrateAgreementToParties]);

  const updateExchangeAgreement = useCallback((ag: ExchangeAgreement) => {
    const migrated = migrateAgreementToParties(ag);
    setState((prev) => ({
      ...prev,
      exchangeAgreements: prev.exchangeAgreements.map((a) => (a.id === ag.id ? migrated : a)),
    }));
    syncExchangeAgreement(migrated);
  }, [migrateAgreementToParties]);

  // ── Exchange Journeys (Wave H+ Quest Tracker sync) ──
  const getExchangeJourneys = useCallback(() => stateRef.current.exchangeJourneys, []);

  const addExchangeJourney = useCallback((journey: ExchangeJourney) => {
    const now = new Date().toISOString();
    const next = { ...journey, createdAt: journey.createdAt || now, updatedAt: now };
    setState((prev) => ({
      ...prev,
      exchangeJourneys: [...prev.exchangeJourneys, next],
    }));
    syncExchangeJourney(next);
  }, []);

  const updateExchangeJourney = useCallback((journey: ExchangeJourney) => {
    const next = { ...journey, updatedAt: new Date().toISOString() };
    setState((prev) => ({
      ...prev,
      exchangeJourneys: prev.exchangeJourneys.map((j) => (j.id === journey.id ? next : j)),
    }));
    syncExchangeJourney(next);
  }, []);

  const removeExchangeJourney = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      exchangeJourneys: prev.exchangeJourneys.filter((j) => j.id !== id),
    }));
    // deleteExchangeJourney(id); // uncomment once soft-delete policy is confirmed
  }, []);

  const getAgreementParties = useCallback((agreementId: string): AgreementParty[] => {
    const ag = stateRef.current.exchangeAgreements.find((a) => a.id === agreementId);
    return migrateAgreementToParties(ag || { id: agreementId } as ExchangeAgreement).parties || [];
  }, []);

  const updateAgreementPartyPrivacy = useCallback((agreementId: string, ces: string, assurance: string, agreed: boolean) => {
    let updated: ExchangeAgreement | undefined;
    setState((prev) => ({
      ...prev,
      exchangeAgreements: prev.exchangeAgreements.map((ag) => {
        if (ag.id !== agreementId) return ag;
        const next = migrateAgreementToParties(ag);
        updated = {
          ...next,
          parties: (next.parties || []).map((p) =>
            p.ces === ces ? { ...p, privacyAssurance: assurance, privacyAgreed: agreed, joinedAt: p.joinedAt || new Date().toISOString() } : p
          ),
          updatedAt: new Date().toISOString(),
        };
        return updated;
      }),
    }));
    if (updated) syncExchangeAgreement(updated);
  }, [migrateAgreementToParties]);

  const addAgreementParty = useCallback((agreementId: string, party: AgreementParty) => {
    let updated: ExchangeAgreement | undefined;
    setState((prev) => ({
      ...prev,
      exchangeAgreements: prev.exchangeAgreements.map((ag) => {
        if (ag.id !== agreementId) return ag;
        const next = migrateAgreementToParties(ag);
        if (next.parties?.some((p) => p.ces === party.ces)) return next;
        updated = {
          ...next,
          parties: [...(next.parties || []), { ...party, joinedAt: party.joinedAt || new Date().toISOString() }],
          updatedAt: new Date().toISOString(),
        };
        return updated;
      }),
    }));
    if (updated) syncExchangeAgreement(updated);
  }, [migrateAgreementToParties]);

  const removeAgreementParty = useCallback((agreementId: string, ces: string) => {
    let updated: ExchangeAgreement | undefined;
    setState((prev) => ({
      ...prev,
      exchangeAgreements: prev.exchangeAgreements.map((ag) => {
        if (ag.id !== agreementId) return ag;
        const next = migrateAgreementToParties(ag);
        updated = {
          ...next,
          parties: (next.parties || []).filter((p) => p.ces !== ces),
          updatedAt: new Date().toISOString(),
        };
        return updated;
      }),
    }));
    if (updated) syncExchangeAgreement(updated);
  }, [migrateAgreementToParties]);

  const updateAgreementPartyRole = useCallback((agreementId: string, ces: string, role: import('../types/ces').ExchangeRole) => {
    let updated: ExchangeAgreement | undefined;
    setState((prev) => ({
      ...prev,
      exchangeAgreements: prev.exchangeAgreements.map((ag) => {
        if (ag.id !== agreementId) return ag;
        const next = migrateAgreementToParties(ag);
        updated = {
          ...next,
          parties: (next.parties || []).map((p) => (p.ces === ces ? { ...p, role } : p)),
          updatedAt: new Date().toISOString(),
        };
        return updated;
      }),
    }));
    if (updated) syncExchangeAgreement(updated);
  }, [migrateAgreementToParties]);

  const submitAgreementWithdrawal = useCallback((agreementId: string, ces: string, withdrawal: AgreementPartyWithdrawal, safetyReport?: SafetyReport) => {
    const now = new Date().toISOString();
    let updatedAgreement: ExchangeAgreement | undefined;
    let newAlert: ExchangeAlert | undefined;
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
        updatedAgreement = {
          ...next,
          parties: updatedParties,
          safetyReports: safetyReport ? [...(next.safetyReports || []), safetyReport] : next.safetyReports,
          updatedAt: now,
        };
        return updatedAgreement;
      });

      const agreement = nextAgreements.find((a) => a.id === agreementId);
      const withdrawingParty = agreement?.parties?.find((p) => p.ces === ces);
      newAlert = safetyReport
        ? {
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
          }
        : {
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
          };

      return { ...prev, exchangeAgreements: nextAgreements, exchangeAlerts: [...prev.exchangeAlerts, newAlert] };
    });
    if (updatedAgreement) syncExchangeAgreement(updatedAgreement);
    if (newAlert) syncExchangeAlert(newAlert);
  }, [migrateAgreementToParties]);

  const approveAgreementWithdrawal = useCallback((agreementId: string, ces: string, stewardCes?: string) => {
    const now = new Date().toISOString();
    let updatedAgreement: ExchangeAgreement | undefined;
    let updatedAlert: ExchangeAlert | undefined;
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
        updatedAgreement = {
          ...next,
          parties: updatedParties,
          status: newStatus,
          updatedAt: now,
        };
        return updatedAgreement;
      });

      const nextAlerts = prev.exchangeAlerts.map((alert) => {
        if (alert.exchangeId === agreementId && alert.type === 'withdrawal' && alert.fromCes === ces) {
          updatedAlert = { ...alert, status: 'resolved', reviewedBy: stewardCes, reviewedAt: now };
          return updatedAlert;
        }
        return alert;
      });

      return {
        ...prev,
        exchangeAgreements: nextAgreements,
        exchangeAlerts: nextAlerts,
      };
    });
    if (updatedAgreement) syncExchangeAgreement(updatedAgreement);
    if (updatedAlert) syncExchangeAlert(updatedAlert);
  }, [migrateAgreementToParties]);

  const getExchangeAlerts = useCallback(() => stateRef.current.exchangeAlerts, []);

  const addExchangeAlert = useCallback((alert: ExchangeAlert) => {
    setState((prev) => ({
      ...prev,
      exchangeAlerts: [...prev.exchangeAlerts, alert],
    }));
    syncExchangeAlert(alert);
  }, []);

  const updateExchangeAlert = useCallback((alert: ExchangeAlert) => {
    setState((prev) => ({
      ...prev,
      exchangeAlerts: prev.exchangeAlerts.map((a) => (a.id === alert.id ? alert : a)),
    }));
    syncExchangeAlert(alert);
  }, []);

  const markExchangeAlertReviewed = useCallback((alertId: string, stewardCes: string) => {
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      exchangeAlerts: prev.exchangeAlerts.map((a) =>
        a.id === alertId ? { ...a, status: 'reviewed' as const, reviewedBy: stewardCes, reviewedAt: now } : a
      ),
    }));
    const alert = stateRef.current.exchangeAlerts.find((a) => a.id === alertId);
    if (alert) syncExchangeAlert({ ...alert, status: 'reviewed', reviewedBy: stewardCes, reviewedAt: now });
  }, []);

  // ── Quest / Agreement Versioning (Wave 2+) ──

  const updateAgreementQuest = useCallback((agreementId: string, questId: string, updates: Partial<import('../types/ces').QuestItem>) => {
    let updated: ExchangeAgreement | undefined;
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
        updated = next;
        return next;
      }),
    }));
    if (updated) syncExchangeAgreement(updated);
  }, []);

  const addAgreementVersion = useCallback((agreementId: string, version: import('../types/ces').AgreementVersion) => {
    let updated: ExchangeAgreement | undefined;
    setState((prev) => ({
      ...prev,
      exchangeAgreements: prev.exchangeAgreements.map((ag) => {
        if (ag.id !== agreementId) return ag;
        updated = {
          ...ag,
          versions: [...ag.versions, version],
          pendingUpdate: undefined,
          updatedAt: new Date().toISOString(),
        };
        return updated;
      }),
    }));
    if (updated) syncExchangeAgreement(updated);
  }, []);

  const approveAgreementUpdate = useCallback((agreementId: string, cesNumber: string) => {
    let updated: ExchangeAgreement | undefined;
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
        updated = {
          ...ag,
          pendingUpdate: allApproved ? undefined : nextPending,
          versions: allApproved ? [...ag.versions, nextPending] : ag.versions,
          updatedAt: new Date().toISOString(),
        };
        return updated;
      }),
    }));
    if (updated) syncExchangeAgreement(updated);
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
    const updated = { ...calendar, updatedAt: new Date().toISOString() };
    const next = calendars.filter((c) => c.ces !== calendar.ces);
    next.push(updated);
    writeCalendars(next);
    syncExchangeCalendar(updated);
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
    syncCollectivePetition(petition);
  }, []);

  const updateCollectivePetition = useCallback((petition: CollectivePetition) => {
    setState((prev) => ({
      ...prev,
      collectivePetitions: prev.collectivePetitions.map((p) => (p.id === petition.id ? petition : p)),
    }));
    syncCollectivePetition(petition);
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
    vendors: state.vendors,
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
    // Quest / Journey Sync (Wave H+)
    getExchangeJourneys,
    addExchangeJourney,
    updateExchangeJourney,
    removeExchangeJourney,
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
