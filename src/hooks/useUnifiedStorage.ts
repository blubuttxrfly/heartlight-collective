// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Unified Dual-Mode Storage
//  Supabase first, localStorage as sovereign backup
//  Every write goes to both. Reads try Supabase, fall back.
// ─────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useStorage } from '../lib/storage'
import type { CreatorRecord } from '../types/ces'

/* ═══ Types ═══ */
interface UnifiedStorageState {
  loading: boolean
  error: string | null
}

/* ═══ Helper: map CreatorRecord → Supabase profile row ═══ */
function recordToRow(profile: CreatorRecord): Record<string, unknown> {
  return {
    ces_number: profile.cesNumber,
    name: profile.name,
    pronouns: profile.pronouns || '',
    title: profile.title || '',
    location: profile.location || '',
    emoji: profile.emoji || '✨',
    photo_url: profile.photo || '',
    bio: profile.bio || '',
    sun_placement: profile.sunPlacement,
    moon_placement: profile.moonPlacement,
    ces_passphrase_hash: profile.passphrase,
    wish_availability: profile.wishAvailability || 'accepting',
    directory_wish_status: profile.wishAvailability || 'accepting',
    stewardship: profile.stewardship || 'suspended',
    stewardship_note: profile.stewardshipNote || '',
    contact_methods: profile.contactMethods || {},
    contact_visibility: profile.contactVisibility || {},
    public_contact_visibility: profile.publicContactVisibility || false,
    portfolio_items: profile.portfolioItems || [],
    portfolio_link: profile.portfolioLink || '',
    accessibility: profile.accessibility || [],
    consent: profile.consent || '',
    numerology: profile.numerology || [],
    guide_guardian_status: profile.guideGuardianStatus || 'not_opted_in',
    guide_guardian_opted_in_at: profile.guideGuardianOptedInAt || null,
  }
}

/* ═══ Helper: map Supabase row → CreatorRecord ═══ */
function rowToRecord(row: any): CreatorRecord {
  return {
    id: String(row.id ?? row.uuid ?? ''),
    cesNumber: String(row.ces_number || ''),
    name: String(row.name || ''),
    pronouns: String(row.pronouns || ''),
    title: String(row.title || ''),
    location: String(row.location || ''),
    emoji: String(row.emoji || '✨'),
    photo: String(row.photo_url || ''),
    bio: String(row.bio || ''),
    sunPlacement: String(row.sun_placement || ''),
    moonPlacement: String(row.moon_placement || ''),
    passphrase: String(row.ces_passphrase_hash || ''),
    wishAvailability: row.wish_availability === 'closed' ? 'closed' : 'accepting',
    directoryWishStatus: row.wish_availability === 'closed' ? 'closed' : 'accepting',
    stewardship: row.stewardship === 'active' || row.stewardship === 'banned'
      ? row.stewardship
      : row.stewardship === 'pending' || row.stewardship === 'returned'
        ? row.stewardship
        : 'suspended',
    stewardshipNote: String(row.stewardship_note || ''),
    contactMethods: row.contact_methods ?? {},
    contactVisibility: row.contact_visibility ?? {},
    publicContactVisibility: Boolean(row.public_contact_visibility),
    portfolioItems: Array.isArray(row.portfolio_items) ? row.portfolio_items : [],
    portfolioLink: String(row.portfolio_link || ''),
    accessibility: Array.isArray(row.accessibility) ? row.accessibility : [],
    consent: String(row.consent || ''),
    numerology: Array.isArray(row.numerology) ? row.numerology : [],
    contactMethod: '',
    // Guide & Guardian journey tracking
    guideGuardianStatus: row.guide_guardian_status || 'not_opted_in',
    guideGuardianOptedInAt: row.guide_guardian_opted_in_at || undefined,
    // Legacy optional fields
    ray: undefined,
    rays: undefined,
    heartlight: undefined,
    offerings: undefined,
    exchanges: undefined,
    seasons: undefined,
    timeline: undefined,
    season_current: undefined,
    primaryRay: undefined,
    primaryRayKey: undefined,
  }
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
      // Try Supabase first
      const supabaseConfigured = isSupabaseConfigured();
      console.log('[UnifiedStorage] Supabase configured?', supabaseConfigured);
      
      if (supabaseConfigured) {
        console.log('[UnifiedStorage] Supabase is configured, attempting Supabase sign-in...');
        console.log('[UnifiedStorage] Querying for ces_number:', ces);
        
        const { data, error: qErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('ces_number', ces)
          .eq('ces_passphrase_hash', passphrase)
          .single()

        console.log('[UnifiedStorage] Supabase query result:', { 
          hasData: !!data, 
          hasError: !!qErr, 
          error: qErr?.message || null,
          errorCode: (qErr as any)?.code || null,
          profileName: data?.name,
          cesNumber: data?.ces_number,
          stewardship: data?.stewardship,
          fullError: qErr
        });

        if (!qErr && data) {
          console.log('[UnifiedStorage] Supabase sign-in SUCCESS');
          setLoading(false)
          return rowToRecord(data)
        }
        
        if (qErr) {
          console.warn('[UnifiedStorage] Supabase sign-in error:', qErr);
          console.warn('[UnifiedStorage] Error details:', JSON.stringify(qErr, null, 2));
        }
      } else {
        console.warn('[UnifiedStorage] Supabase NOT configured, falling back to localStorage');
      }

      // Fall back to localStorage
      const localProfile = local.findProfileByCES(ces)
      console.log('[UnifiedStorage] localStorage lookup:', { found: !!localProfile });
      if (localProfile?.passphrase === passphrase) {
        console.log('[UnifiedStorage] localStorage sign-in SUCCESS');
        setLoading(false)
        return localProfile
      }

      console.log('[UnifiedStorage] Sign-in FAILED - no matching profile found');
      setLoading(false)
      return null
    } catch (err: any) {
      console.error('[UnifiedStorage] validateSignIn exception:', err);
      setError(err?.message || 'Sign-in failed.')
      setLoading(false)
      return null
    }
  }, [local, setLoading, setError])

  /* ── Create Profile ── */
  const createProfile = useCallback(async (profile: CreatorRecord, queue: 'pending' | 'approved' | 'returned' = 'pending') => {
    console.log('[UnifiedStorage] Creating profile:', {
      ces: profile.cesNumber,
      name: profile.name,
      queue,
      stewardship: profile.stewardship,
    });
    
    // Always save to localStorage
    local.addProfile(profile, queue);
    console.log('[UnifiedStorage] Profile saved to localStorage');
    
    // Verify it was saved
    const saved = local.findProfileByCES(profile.cesNumber || '');
    console.log('[UnifiedStorage] Verification - profile found:', !!saved, saved?.cesNumber);

    // Try Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const { error: supaError } = await supabase
          .from('profiles')
          .insert(recordToRow(profile) as any)

        if (supaError) {
          console.warn('[UnifiedStorage] Supabase insert failed:', supaError.message)
        }
      } catch (err: any) {
        console.warn('[UnifiedStorage] Supabase unavailable:', err.message)
      }
    }
  }, [local])

  /* ── List All Profiles ── */
  const getProfiles = useCallback(async (): Promise<CreatorRecord[]> => {
    setLoading(true)

    try {
      if (isSupabaseConfigured()) {
        const { data, error: qErr } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (!qErr && data && data.length > 0) {
          setLoading(false)
          return data.map((r: any) => rowToRecord(r))
        }
      }
    } catch (err) {
      console.warn('[UnifiedStorage] Supabase list failed, using localStorage')
    }

    setLoading(false)
    return local.getProfiles()
  }, [local, setLoading])

  /* ── Find Profile by CES ── */
  const findProfileByCES = useCallback(async (ces: string): Promise<CreatorRecord | undefined> => {
    setLoading(true)

    try {
      if (isSupabaseConfigured()) {
        const { data, error: qErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('ces_number', ces)
          .single()

        if (!qErr && data) {
          setLoading(false)
          return rowToRecord(data)
        }
      }
    } catch (err) {
      console.warn('[UnifiedStorage] Supabase fetch failed, using localStorage')
    }

    setLoading(false)
    return local.findProfileByCES(ces)
  }, [local, setLoading])

  /* ── Update Profile ── */
  const updateProfile = useCallback(async (profile: CreatorRecord) => {
    // Always save to localStorage
    local.updateProfile(profile)

    // Try Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const { error: supaError } = await supabase
          .from('profiles')
          .update(recordToRow(profile) as any)
          .eq('ces_number', profile.cesNumber ?? '')

        if (supaError) {
          console.warn('[UnifiedStorage] Supabase update failed:', supaError.message)
        }
      } catch (err: any) {
        console.warn('[UnifiedStorage] Supabase update error:', err.message)
      }
    }
  }, [local])

  /* ── Get Profiles by Stewardship Status ── */
  const getProfilesByStewardship = useCallback(async (status: string): Promise<CreatorRecord[]> => {
    setLoading(true)
    try {
      if (isSupabaseConfigured()) {
        const { data, error: qErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('stewardship', status)
          .order('created_at', { ascending: false })

        if (!qErr && data && data.length > 0) {
          setLoading(false)
          return data.map((r: any) => rowToRecord(r))
        }
      }
    } catch (err) {
      console.warn('[UnifiedStorage] Stewardship query failed, using localStorage')
    }

    setLoading(false)
    // Fallback: filter localStorage by stewardship
    const allLocal = local.getProfiles()
    return allLocal.filter((p) => p.stewardship === status)
  }, [local, setLoading])

  /* ── Move Profile (with Supabase sync) ── */
  const moveProfile = useCallback(async (id: string, from: 'pending' | 'approved' | 'returned', to: 'pending' | 'approved' | 'returned') => {
    if (from === to) return

    // Update localStorage first
    local.moveProfile(id, from, to)

    // Update Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        // Find the profile to get its CES number
        const profile = local.findProfileById(id)
        if (!profile?.cesNumber) return

        const newStewardship = to === 'approved' ? 'active' : 'suspended'
        const { error: supaError } = await supabase
          .from('profiles')
          .update({ stewardship: newStewardship })
          .eq('ces_number', profile.cesNumber)

        if (supaError) {
          console.warn('[UnifiedStorage] Supabase moveProfile failed:', supaError.message)
        }
      } catch (err: any) {
        console.warn('[UnifiedStorage] Supabase moveProfile error:', err.message)
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

    // Pass-through localStorage-only methods (Supabase-aware versions below)
    removeProfile: local.removeProfile,
    findProfileById: local.findProfileById,
    addSecurityLog: local.addSecurityLog,
    getSecurityLog: local.getSecurityLog,
    addSteward: local.addSteward,
    getStewards: local.getStewards,

    // Supabase-aware steward methods
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
  }
}
