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
  const row: Record<string, unknown> = {
    ces_number: profile.cesNumber,
    name: profile.name,
    pronouns: profile.pronouns || '',
    title: profile.title || '',
    location: profile.location || '',
    emoji: profile.emoji || '✨',
    photo_url: profile.photo || '',
    bio: profile.bio || '',
    tags: profile.tags || [],
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
    peer_payment_methods: profile.peerPaymentMethods || [],
    location_data: profile.locationData || null,
    is_private: profile.isPrivate ?? false,
    created_at: profile.createdAt || null,
    updated_at: profile.updatedAt || new Date().toISOString(),
  };
  return row;
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
    tags: Array.isArray(row.tags) ? row.tags : [],
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
    peerPaymentMethods: Array.isArray(row.peer_payment_methods) ? row.peer_payment_methods : [],
    locationData: row.location_data || undefined,
    isPrivate: Boolean(row.is_private),
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || undefined,
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

      // Final fallback: authorized stewards (dev / founding steward mode)
      const steward = local.getStewards().find((s) => s.ces === ces && s.passphrase === passphrase)
      console.log('[UnifiedStorage] steward fallback lookup:', { found: !!steward });
      if (steward) {
        console.log('[UnifiedStorage] Steward sign-in SUCCESS');
        setLoading(false)
        // Return a synthetic CreatorRecord so the rest of the app receives a consistent shape
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

    // Try Supabase if configured — with fallback retry for missing columns
    if (isSupabaseConfigured()) {
      try {
        const { error: supaError } = await supabase
          .from('profiles')
          .insert(recordToRow(profileWithTimestamps) as any)

        if (supaError) {
          // If a column is missing (e.g., tags), retry with only known-safe fields
          const msg = supaError.message?.toLowerCase() || '';
          if (msg.includes('column') && msg.includes('does not exist')) {
            console.warn('[UnifiedStorage] Supabase missing column — retrying without tags:', supaError.message);
            const safeRow = recordToRow(profileWithTimestamps);
            delete safeRow.tags;
            const { error: retryErr } = await supabase.from('profiles').insert(safeRow as any);
            if (retryErr) {
              console.warn('[UnifiedStorage] Supabase retry insert failed:', retryErr.message);
            } else {
              console.log('[UnifiedStorage] Supabase insert succeeded after retry (tags omitted)');
            }
          } else {
            console.warn('[UnifiedStorage] Supabase insert failed:', supaError.message);
          }
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
          const remote = rowToRecord(data);
          const localProfile = local.findProfileByCES(ces);

          // Wave 8.3 follow-up: prefer the newest version, whether it lives in Supabase or localStorage
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
      }
    } catch (err) {
      console.warn('[UnifiedStorage] Supabase fetch failed, using localStorage')
    }

    setLoading(false)
    return local.findProfileByCES(ces)
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

    // Verify localStorage save
    const localSaved = local.findProfileByCES(profile.cesNumber || '');
    console.log('[UnifiedStorage] localStorage verification:', localSaved ? 'FOUND' : 'NOT FOUND', localSaved?.name);

    // Try Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        console.log('[UnifiedStorage] Attempting Supabase update...');
        const row = recordToRow(updatedProfile);

        const { error: supaError } = await supabase
          .from('profiles')
          .update(row as any)
          .eq('ces_number', profile.cesNumber ?? '')

        if (supaError) {
          const msg = supaError.message?.toLowerCase() || '';
          const missingColumnMatch = msg.match(/column ['\"]?([^'\"\s]+)['\"]? of relation ['\"]?profiles['\"]? does not exist/)
            || msg.match(/could not identify an equality operator.*type\s+([\w_]+)/);
          if (missingColumnMatch) {
            const missingCol = missingColumnMatch[1];
            console.warn(`[UnifiedStorage] Supabase missing column "${missingCol}" — retrying without it:`, supaError.message);
            const safeRow = recordToRow(updatedProfile);
            delete safeRow[missingCol];
            const { error: retryErr } = await supabase
              .from('profiles')
              .update(safeRow as any)
              .eq('ces_number', profile.cesNumber ?? '');
            if (retryErr) {
              console.error('[UnifiedStorage] Supabase retry update FAILED:', retryErr);
              return { success: false, error: `Supabase update failed: ${retryErr.message}` };
            }
            console.log('[UnifiedStorage] Supabase update succeeded after retry (column "' + missingCol + '" omitted)');
            return { success: true };
          }

          console.error('[UnifiedStorage] Supabase update FAILED:', supaError);
          return { success: false, error: `Supabase update failed: ${supaError.message}` };
        }

        console.log('[UnifiedStorage] Supabase update SUCCESS');
        return { success: true };
      } catch (err: any) {
        console.error('[UnifiedStorage] Supabase update error:', err.message);
        return { success: false, error: `Supabase update error: ${err.message}` };
      }
    }

    return { success: true };
  }, [local]);

  /* ── Get Profiles by Stewardship Status ── */
  const getProfilesByStewardship = useCallback(async (status: string): Promise<CreatorRecord[]> => {
    console.log('[UnifiedStorage] getProfilesByStewardship called for status:', status);
    setLoading(true)
    try {
      if (isSupabaseConfigured()) {
        console.log('[UnifiedStorage] Querying Supabase for stewardship:', status);
        
        // Add timeout to prevent hanging
        const queryPromise = supabase
          .from('profiles')
          .select('*')
          .eq('stewardship', status)
          .order('created_at', { ascending: false });
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Supabase query timeout after 10s')), 10000);
        });
        
        const { data, error: qErr } = await Promise.race([queryPromise, timeoutPromise]) as any;

        console.log('[UnifiedStorage] Supabase query result:', {
          hasData: !!data,
          dataLength: data?.length || 0,
          hasError: !!qErr,
          error: qErr?.message || null,
          errorCode: (qErr as any)?.code || null,
          fullError: qErr,
        });

        if (!qErr && data) {
          console.log('[UnifiedStorage] Supabase returned', data.length, 'profiles');
          setLoading(false)
          const localProfiles = local.getProfiles()
          console.log('[UnifiedStorage] localStorage profiles:', localProfiles.length, localProfiles.map(p => ({
            name: p.name,
            ces: p.cesNumber,
            tags: p.tags || [],
            stewardship: p.stewardship,
          })));
          // Build a map of Supabase CES numbers for deduping
          const supaCesSet = new Set<string>()
          const merged = (data || []).map((r: any) => {
            const rec = rowToRecord(r)
            supaCesSet.add(rec.cesNumber)
            const localMatch = localProfiles.find((p) => p.cesNumber === rec.cesNumber)
            console.log('[UnifiedStorage] Merging', rec.cesNumber, 'localMatch tags:', localMatch?.tags || 'none', 'supabase tags:', rec.tags || 'none');
            // Merge: prefer localStorage tags if Supabase doesn't have them
            if (localMatch && (!rec.tags || rec.tags.length === 0) && localMatch.tags && localMatch.tags.length > 0) {
              console.log('[UnifiedStorage] Using localStorage tags for', rec.cesNumber);
              return { ...rec, tags: localMatch.tags }
            }
            return rec
          })
          // Append localStorage profiles that are NOT in Supabase but match stewardship
          const extraLocal = localProfiles.filter((p) =>
            p.stewardship === status && !supaCesSet.has(p.cesNumber)
          )
          if (extraLocal.length > 0) {
            console.log('[UnifiedStorage] Appending', extraLocal.length, 'localStorage-only profiles');
          }
          return [...merged, ...extraLocal]
        }
        
        if (qErr) {
          console.error('[UnifiedStorage] Supabase stewardship query FAILED:', qErr);
        } else {
          console.log('[UnifiedStorage] Supabase returned no results for stewardship:', status);
        }
      } else {
        console.warn('[UnifiedStorage] Supabase NOT configured');
      }
    } catch (err: any) {
      console.error('[UnifiedStorage] Stewardship query exception:', err.message, err);
    }

    // Fallback: filter localStorage by stewardship
    console.log('[UnifiedStorage] Falling back to localStorage');
    setLoading(false)
    const allLocal = local.getProfiles()
    const filtered = allLocal.filter((p) => p.stewardship === status)
    console.log('[UnifiedStorage] localStorage returned', filtered.length, 'profiles');
    return filtered
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

    // Wave 6.9 — multi-being exchange methods
    getExchangeAgreements: local.getExchangeAgreements,
    getExchangeAlerts: local.getExchangeAlerts,
    markExchangeAlertReviewed: local.markExchangeAlertReviewed,
    submitAgreementWithdrawal: local.submitAgreementWithdrawal,
    approveAgreementWithdrawal: local.approveAgreementWithdrawal,
    updateAgreementPartyPrivacy: local.updateAgreementPartyPrivacy,
  }
}
