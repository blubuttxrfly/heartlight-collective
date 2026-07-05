// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Unified Storage (Vercel Serverless)
//  Redis-backed API first, localStorage as sovereign backup
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react'
import { useStorage } from '../lib/storage'
import {
  fetchProfiles,
  fetchProfileByCes,
  fetchProfilesByStewardship,
  createProfileApi,
  updateProfileApi,
  verifyCesPassphrase,
} from '../lib/profileApi'
import type { CreatorRecord } from '../types/ces'

/* ═══ Types ═══ */
interface UnifiedStorageState {
  loading: boolean
  error: string | null
}

/* ═══ Unified Storage Hook ═══ */
export function useUnifiedStorage() {
  const local = useStorage()
  const [state, setState] = useState<UnifiedStorageState>({
    loading: false,
    error: null,
  })

  const setLoading = useCallback((v: boolean) => setState(s => ({ ...s, loading: v })), [])
  const setError = useCallback((msg: string | null) => setState(s => ({ ...s, error: msg })), [])

  /* ── Validate Sign-In (CES + Passphrase) ── */
  const validateSignIn = useCallback(async (ces: string, passphrase: string): Promise<CreatorRecord | null> => {
    console.log('[UnifiedStorage] validateSignIn called:', { ces, hasPassphrase: !!passphrase });
    setLoading(true)
    setError(null)

    try {
      // Try Vercel API first
      console.log('[UnifiedStorage] Trying Vercel API sign-in for CES:', ces);
      const result = await verifyCesPassphrase(ces, passphrase)
      if (result.success && result.data) {
        console.log('[UnifiedStorage] Vercel API sign-in SUCCESS');
        setLoading(false)
        return result.data
      }
      console.warn('[UnifiedStorage] Vercel API sign-in failed:', result.error)
    } catch (err: any) {
      console.warn('[UnifiedStorage] Vercel API error, falling back:', err.message)
    }

    // Fall back to localStorage
    const localProfile = local.findProfileByCES(ces)
    console.log('[UnifiedStorage] localStorage lookup:', { found: !!localProfile });
    if (localProfile?.passphrase === passphrase) {
      console.log('[UnifiedStorage] localStorage sign-in SUCCESS');
      setLoading(false)
      return localProfile
    }

    // Final fallback: authorized stewards (dev / founding steward mode)
    const steward = local.getStewards().find((s) => s.ces === ces && s.passphrase === passphrase)
    console.log('[UnifiedStorage] steward fallback lookup:', { found: !!steward });
    if (steward) {
      console.log('[UnifiedStorage] Steward sign-in SUCCESS');
      setLoading(false)
      const synthetic: CreatorRecord = {
        id: `profile_${steward.ces}`,
        name: steward.name,
        pronouns: 'they/them',
        title: steward.role || 'Steward',
        location: 'Earth, Milky Way',
        emoji: '🌟',
        photo: null,
        bio: `Sovereign steward profile for ${steward.name}.`,
        tags: ['steward'],
        numerology: [],
        accessibility: [],
        consent: 'I consent to co-create in alignment with our Greatest & Highest Good.',
        portfolioLink: '',
        portfolioItems: [],
        contactMethods: { email: '', phone: '', instagram: '', youtube: '', threads: '', spotify: '', discord: '', telegram: '', signal: '' },
        contactVisibility: { email: false, phone: false, instagram: false, youtube: false, threads: false, spotify: false, discord: false, telegram: false, signal: false },
        publicContactVisibility: false,
        contactMethod: 'other',
        cesNumber: steward.ces,
        passphrase: steward.passphrase,
        wishAvailability: 'accepting',
        directoryWishStatus: 'accepting',
        stewardship: 'active',
        stewardshipNote: '',
        guideGuardianStatus: 'not_opted_in',
        locationData: { raw: 'Earth, Milky Way', city: 'Earth', region: 'Milky Way', country: 'Gaia', continent: 'Gaia', lat: 0, lon: 0 },
      }
      return synthetic
    }

    console.log('[UnifiedStorage] Sign-in FAILED - no matching profile found');
    setLoading(false)
    return null
  }, [local, setLoading, setError])

  /* ── Create Profile ── */
  const createProfile = useCallback(async (profile: CreatorRecord, queue: 'pending' | 'approved' | 'returned' = 'pending') => {
    console.log('[UnifiedStorage] Creating profile:', {
      ces: profile.cesNumber,
      name: profile.name,
      queue,
      stewardship: profile.stewardship,
    });
    
    const now = new Date().toISOString();
    const profileWithTimestamps = {
      ...profile,
      createdAt: profile.createdAt || now,
      updatedAt: now,
    };

    // Always save to localStorage
    local.addProfile(profileWithTimestamps, queue);
    console.log('[UnifiedStorage] Profile saved to localStorage');
    
    // Verify it was saved
    const saved = local.findProfileByCES(profileWithTimestamps.cesNumber || '');
    console.log('[UnifiedStorage] Verification - profile found:', !!saved, saved?.cesNumber);

    // Try Vercel API
    try {
      const result = await createProfileApi(profileWithTimestamps);
      if (!result.success) {
        console.warn('[UnifiedStorage] API createProfile failed:', result.error);
      } else {
        console.log('[UnifiedStorage] API createProfile SUCCESS');
      }
    } catch (err: any) {
      console.warn('[UnifiedStorage] API unavailable:', err.message);
    }
  }, [local])

  /* ── List All Profiles ── */
  const getProfiles = useCallback(async (): Promise<CreatorRecord[]> => {
    setLoading(true)

    try {
      const remote = await fetchProfiles();
      if (remote.length > 0) {
        setLoading(false)
        return remote;
      }
    } catch (err) {
      console.warn('[UnifiedStorage] API list failed, using localStorage')
    }

    setLoading(false)
    return local.getProfiles()
  }, [local, setLoading])

  /* ── Find Profile by CES ── */
  const findProfileByCES = useCallback(async (ces: string): Promise<CreatorRecord | undefined> => {
    setLoading(true)

    try {
      const remote = await fetchProfileByCes(ces);
      if (remote) {
        const localProfile = local.findProfileByCES(ces);
        // Prefer the newest version
        if (localProfile && localProfile.updatedAt) {
          const remoteTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
          const localTime = new Date(localProfile.updatedAt).getTime();
          if (localTime > remoteTime) {
            setLoading(false)
            return localProfile;
          }
        }
        setLoading(false)
        return remote;
      }
    } catch (err) {
      console.warn('[UnifiedStorage] API fetch failed, using localStorage')
    }

    // Try localStorage via hook
    const localProfile = local.findProfileByCES(ces);
    if (localProfile) {
      setLoading(false)
      return localProfile;
    }

    // Deep fallback: read localStorage directly in case StorageProvider state is stale
    try {
      const pending = JSON.parse(localStorage.getItem('hlc_pending') || '[]')
      const approved = JSON.parse(localStorage.getItem('hlc_approved') || '[]')
      const returned = JSON.parse(localStorage.getItem('hlc_returned') || '[]')
      const allProfiles = [...pending, ...approved, ...returned]
      const match = allProfiles.find((p: any) => p.cesNumber === ces || p.ces_number === ces)
      if (match) {
        console.log('[UnifiedStorage] Found profile in localStorage fallback:', match.name, ces)
        setLoading(false)
        return match as CreatorRecord;
      }
    } catch {
      // ignore
    }

    setLoading(false)
    return undefined
  }, [local, setLoading])

  /* ── Update Profile ── */
  const updateProfile = useCallback(async (profile: CreatorRecord): Promise<{ success: boolean; error?: string }> => {
    console.log('[UnifiedStorage] updateProfile called for CES:', profile.cesNumber, 'Name:', profile.name);

    const now = new Date().toISOString();
    const updatedProfile = {
      ...profile,
      updatedAt: now,
    };

    // Always save to localStorage
    local.updateProfile(updatedProfile);
    console.log('[UnifiedStorage] Profile saved to localStorage');

    // Try Vercel API
    try {
      const result = await updateProfileApi(profile.cesNumber || '', updatedProfile);
      if (result.success) {
        console.log('[UnifiedStorage] API update SUCCESS');
        return { success: true };
      }
      console.warn('[UnifiedStorage] API update failed:', result.error);
      return { success: false, error: result.error };
    } catch (err: any) {
      console.warn('[UnifiedStorage] API unavailable:', err.message);
      return { success: true }; // localStorage succeeded
    }
  }, [local]);

  /* ── Get Profiles by Stewardship Status ── */
  const getProfilesByStewardship = useCallback(async (status: string): Promise<CreatorRecord[]> => {
    console.log('[UnifiedStorage] getProfilesByStewardship called for status:', status);
    setLoading(true)
    try {
      const remote = await fetchProfilesByStewardship(status);
      if (remote.length > 0) {
        setLoading(false)
        const localProfiles = local.getProfiles()
        const remoteCes = new Set(remote.map(p => p.cesNumber))
        const extraLocal = localProfiles.filter(p => p.stewardship === status && !remoteCes.has(p.cesNumber))
        return [...remote, ...extraLocal]
      }
    } catch (err: any) {
      console.error('[UnifiedStorage] API stewardship query exception:', err.message)
    }

    console.log('[UnifiedStorage] Falling back to localStorage');
    setLoading(false)
    const allLocal = local.getProfiles()
    return allLocal.filter((p) => p.stewardship === status)
  }, [local, setLoading])

  /* ── Move Profile (with API sync) ── */
  const moveProfile = useCallback(async (id: string, from: 'pending' | 'approved' | 'returned', to: 'pending' | 'approved' | 'returned') => {
    if (from === to) return

    // Update localStorage first
    local.moveProfile(id, from, to)

    // Update API if possible
    const profile = local.findProfileById(id)
    if (profile?.cesNumber) {
      try {
        const newStewardship = to === 'approved' ? 'active' : 'suspended' as CreatorRecord['stewardship']
        const updated = { ...profile, stewardship: newStewardship }
        const result = await updateProfileApi(profile.cesNumber, updated);
        if (!result.success) {
          console.warn('[UnifiedStorage] API moveProfile failed:', result.error);
        }
      } catch (err: any) {
        console.warn('[UnifiedStorage] API moveProfile error:', err.message)
      }
    }
  }, [local])

  return {
    // State
    loading: state.loading,
    error: state.error,
    clearError: () => setError(null),

    // Operations
    validateSignIn,
    createProfile,
    getProfiles,
    findProfileByCES,
    updateProfile,

    // Pass-through localStorage-only methods
    removeProfile: local.removeProfile,
    findProfileById: local.findProfileById,
    addSecurityLog: local.addSecurityLog,
    getSecurityLog: local.getSecurityLog,
    addSteward: local.addSteward,
    getStewards: local.getStewards,

    // Stewardship methods
    getPending: () => getProfilesByStewardship('pending'),
    getApproved: () => getProfilesByStewardship('active'),
    getReturned: () => getProfilesByStewardship('suspended'),
    moveProfile,

    // Vendor methods (localStorage-only for now)
    getVendors: local.getVendors,
    addVendor: local.addVendor,
    updateVendor: local.updateVendor,
    removeVendor: local.removeVendor,
    findVendorById: local.findVendorById,
    findVendorByOwner: local.findVendorByOwner,
    getVendorInvites: local.getVendorInvites,
    addVendorInvite: local.addVendorInvite,
    updateVendorInvite: local.updateVendorInvite,
    getExchangeRequests: local.getExchangeRequests,
    addExchangeRequest: local.addExchangeRequest,
    updateExchangeRequest: local.updateExchangeRequest,
    getCollectivePetitions: local.getCollectivePetitions,
    addCollectivePetition: local.addCollectivePetition,
    updateCollectivePetition: local.updateCollectivePetition,

    // Wave 6.9 — multi-being exchange methods
    getExchangeAgreements: local.getExchangeAgreements,
    getExchangeAlerts: local.getExchangeAlerts,
    markExchangeAlertReviewed: local.markExchangeAlertReviewed,
    submitAgreementWithdrawal: local.submitAgreementWithdrawal,
    approveAgreementWithdrawal: local.approveAgreementWithdrawal,
    updateAgreementPartyPrivacy: local.updateAgreementPartyPrivacy,
  }
}
