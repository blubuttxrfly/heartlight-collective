import { useState, useEffect } from 'react';
import { createProfileApi, fetchProfileByCes } from '../lib/profileApi';
import type { CreatorRecord } from '../types/ces';

interface DiscoveredProfile {
  source: string;
  profile: CreatorRecord;
  existsInRedis: boolean;
  ces: string;
}

interface MigrationResult {
  cesNumber: string;
  name: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
}

export function sessionToCreatorRecord(session: Record<string, unknown>, source?: string): CreatorRecord {
  const now = new Date().toISOString();
  return {
    id: `profile_${session.ces || session.cesNumber || session.ces_number || Date.now()}`,
    cesNumber: String(session.ces || session.cesNumber || session.ces_number || ''),
    name: String(session.name || ''),
    pronouns: String(session.pronouns || ''),
    title: String(session.title || ''),
    location: String(session.location || ''),
    emoji: String(session.emoji || session.initials || '✨'),
    photo: String(session.photo || session.photoUrl || session.photo_url || ''),
    bio: String(session.bio || ''),
    tags: Array.isArray(session.tags) ? (session.tags as string[]) : [],
    sunPlacement: String(session.sunPlacement || session.sun_placement || ''),
    moonPlacement: String(session.moonPlacement || session.moon_placement || ''),
    passphrase: String(session.passphrase || session.ces_passphrase_hash || ''),
    wishAvailability: (session.wishAvailability as CreatorRecord['wishAvailability']) || 'accepting',
    directoryWishStatus: (session.directoryWishStatus as CreatorRecord['directoryWishStatus']) || 'accepting',
    stewardship: (session.stewardship as CreatorRecord['stewardship']) || 'active',
    stewardshipNote: String(session.stewardshipNote || session.stewardship_note || ''),
    contactMethods: (session.contactMethods as CreatorRecord['contactMethods']) || {
      email: '', phone: '', instagram: '', youtube: '', threads: '', spotify: '', discord: '', telegram: '', signal: ''
    },
    contactVisibility: (session.contactVisibility as CreatorRecord['contactVisibility']) || {
      email: false, phone: false, instagram: false, youtube: false, threads: false, spotify: false, discord: false, telegram: false, signal: false
    },
    publicContactVisibility: Boolean(session.publicContactVisibility),
    portfolioItems: Array.isArray(session.portfolioItems) ? session.portfolioItems : [],
    portfolioLink: String(session.portfolioLink || session.portfolio_link || ''),
    accessibility: Array.isArray(session.accessibility) ? session.accessibility : [],
    consent: String(session.consent || ''),
    numerology: Array.isArray(session.numerology) ? session.numerology : [],
    contactMethod: '',
    guideGuardianStatus: (session.guideGuardianStatus as CreatorRecord['guideGuardianStatus']) || 'not_opted_in',
    guideGuardianOptedInAt: (session.guideGuardianOptedInAt as string | undefined) || undefined,
    peerPaymentMethods: Array.isArray(session.peerPaymentMethods) ? session.peerPaymentMethods : [],
    locationData: (session.locationData as CreatorRecord['locationData']) || undefined,
    isPrivate: Boolean(session.isPrivate),
    createdAt: (session.createdAt as string | undefined) || now,
    updatedAt: (session.updatedAt as string | undefined) || now,
    source,
  } as unknown as CreatorRecord;
}

export default function MigrateProfiles() {
  const [profiles, setProfiles] = useState<DiscoveredProfile[]>([]);
  const [rawStorage, setRawStorage] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<MigrationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const scan = async () => {
      setScanning(true);
      try {
        // Read every localStorage key
        const storageSnapshot: Record<string, string> = {};
        const discovered: DiscoveredProfile[] = [];

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key) continue;
          const raw = localStorage.getItem(key) || '';
          storageSnapshot[key] = raw.slice(0, 500); // preview only

          // Look for profiles inside known queues and any key that parses to a profile array/object
          let candidates: CreatorRecord[] = [];
          if (key === 'hlc_pending' || key === 'hlc_approved' || key === 'hlc_returned') {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) candidates = parsed;
            } catch {
              // ignore
            }
          } else if (key === 'hlc_session_v2' || key === 'hlc_session') {
            try {
              const parsed = JSON.parse(raw);
              if (parsed && typeof parsed === 'object' && (parsed.ces || parsed.cesNumber || parsed.ces_number)) {
                // Session holds the signed-in being — convert to CreatorRecord shape
                candidates = [sessionToCreatorRecord(parsed, key)];
              }
            } catch {
              // ignore
            }
          } else if (key.startsWith('hlc_') || key.includes('profile') || key.includes('ces')) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) candidates = parsed;
              else if (parsed && typeof parsed === 'object' && (parsed.cesNumber || parsed.ces_number)) {
                candidates = [parsed];
              }
            } catch {
              // ignore
            }
          }

          for (const p of candidates) {
            if (!p || typeof p !== 'object') continue;
            const ces = p.cesNumber || (p as any).ces_number;
            if (!ces) continue;
            // Avoid duplicates within the same CES
            if (discovered.some((d) => d.ces === ces)) continue;

            const existsInRedis = await checkRedis(ces);
            discovered.push({
              source: key,
              profile: p as CreatorRecord,
              existsInRedis,
              ces,
            });
          }
        }

        setProfiles(discovered);
        setRawStorage(storageSnapshot);
        setSelected(new Set(discovered.map((d) => d.ces).filter(Boolean)));
      } catch (err: any) {
        console.error('[MigrateProfiles] Scan failed:', err);
      } finally {
        setScanning(false);
      }
    };

    scan();
  }, []);

  const checkRedis = async (ces: string): Promise<boolean> => {
    if (!ces) return false;
    try {
      const remote = await fetchProfileByCes(ces);
      return !!remote;
    } catch {
      return false;
    }
  };

  const toggleSelected = (ces: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(ces)) next.delete(ces);
      else next.add(ces);
      return next;
    });
  };

  const runMigration = async () => {
    setLoading(true);
    setResults([]);
    const out: MigrationResult[] = [];

    for (const { profile, ces } of profiles) {
      if (!ces || !selected.has(ces)) continue;

      // Skip the dev-only Atlas steward profile
      if (ces === '111111111') {
        out.push({
          cesNumber: ces,
          name: profile.name,
          status: 'skipped',
          message: 'Dev-only Atlas steward profile skipped.',
        });
        continue;
      }

      try {
        const result = await createProfileApi(profile);
        if (result.success) {
          out.push({
            cesNumber: ces,
            name: profile.name,
            status: 'success',
            message: 'Migrated to Redis.',
          });
        } else if (result.error?.includes('already exists')) {
          out.push({
            cesNumber: ces,
            name: profile.name,
            status: 'skipped',
            message: 'Already exists in Redis.',
          });
        } else {
          out.push({
            cesNumber: ces,
            name: profile.name,
            status: 'error',
            message: result.error || 'Unknown error',
          });
        }
      } catch (err: any) {
        out.push({
          cesNumber: ces,
          name: profile.name,
          status: 'error',
          message: err.message || 'Network error',
        });
      }
    }

    setResults(out);
    setLoading(false);
    setDone(true);
  };

  const successCount = results.filter((r) => r.status === 'success').length;
  const errorCount = results.filter((r) => r.status === 'error').length;
  const skippedCount = results.filter((r) => r.status === 'skipped').length;

  const hlcKeys = Object.keys(rawStorage).filter((k) => k.startsWith('hlc_'));

  return (
    <div className="px-4 py-12 max-w-3xl mx-auto">
      <h1 className="font-serif text-3xl text-heartlight-green mb-2 text-center">Migrate Beings to Redis</h1>
      <p className="text-lavender/70 mb-8 text-center">
        This tool scans this browser's localStorage and uploads selected profiles to the Heartlight Collective's shared Redis memory so they appear across devices.
      </p>

      {scanning && (
        <div className="text-center py-8">
          <p className="text-lavender/50">Scanning localStorage for beings...</p>
        </div>
      )}

      {!scanning && (
        <>
          <div className="mb-6 rounded-2xl border border-lavender/10 bg-void-900/40 p-6">
            <h2 className="font-serif text-xl text-cream mb-4">Discovered Profiles</h2>
            {profiles.length === 0 ? (
              <p className="text-lavender/50">No profiles found in this browser's localStorage.</p>
            ) : (
              <ul className="space-y-3">
                {profiles.map((d) => {
                  const ces = d.ces;
                  const isSelected = selected.has(ces);
                  return (
                    <li
                      key={ces}
                      className={`flex items-start gap-3 rounded-lg border p-4 transition-all ${
                        isSelected ? 'border-heartlight-green/40 bg-heartlight-green/5' : 'border-lavender/10 bg-void-800/40 opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelected(ces)}
                        className="mt-1 accent-heartlight-green"
                      />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-cream">{d.profile.name || 'Unnamed Being'}</span>
                          <span className="text-xs font-mono text-gold-400">C.E.S. {ces}</span>
                          {ces === '111111111' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-lavender/10 text-lavender/50">dev steward</span>
                          )}
                          {d.existsInRedis && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-400/10 text-green-300">already in Redis</span>
                          )}
                        </div>
                        <p className="text-xs text-lavender/50 mt-1">
                          Source: <span className="font-mono">{d.source}</span>
                          {d.profile.stewardship ? ` · stewardship: ${d.profile.stewardship}` : ''}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={runMigration}
                disabled={loading || selected.size === 0}
                className="px-6 py-3 rounded-full bg-heartlight-green/20 text-heartlight-green border border-heartlight-green/40 hover:bg-heartlight-green/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Migrating...' : `Migrate ${selected.size} Being${selected.size === 1 ? '' : 's'} to Redis`}
              </button>
            </div>
          </div>

          {hlcKeys.length > 0 && (
            <details className="mb-8 rounded-xl border border-lavender/10 bg-void-900/20 p-4">
              <summary className="text-sm text-lavender/60 cursor-pointer">
                localStorage keys scanned ({hlcKeys.length})
              </summary>
              <ul className="mt-3 space-y-2 text-xs font-mono text-lavender/40">
                {hlcKeys.map((k) => (
                  <li key={k}>
                    <span className="text-gold-400/80">{k}</span>: {rawStorage[k].slice(0, 120)}
                    {rawStorage[k].length > 120 ? '...' : ''}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}

      {done && (
        <div className="mb-8 rounded-2xl border border-lavender/10 bg-void-900/40 p-6">
          <h2 className="font-serif text-xl text-cream mb-4 text-center">Migration Complete</h2>
          <div className="flex justify-center gap-6 text-sm mb-4">
            <span className="text-green-300">✅ Migrated: {successCount}</span>
            <span className="text-lavender/60">⏭ Skipped: {skippedCount}</span>
            <span className="text-red-300">❌ Errors: {errorCount}</span>
          </div>
          {results.length > 0 && (
            <ul className="text-left space-y-2 text-sm">
              {results.map((r) => (
                <li
                  key={r.cesNumber}
                  className={`rounded-lg border p-3 ${
                    r.status === 'success'
                      ? 'border-green-400/20 bg-green-400/5'
                      : r.status === 'error'
                      ? 'border-red-400/20 bg-red-400/5'
                      : 'border-lavender/10 bg-void-800/40'
                  }`}
                >
                  <span className="font-medium text-cream">{r.name}</span>
                  <span className="ml-2 text-xs font-mono text-gold-400">C.E.S. {r.cesNumber}</span>
                  <span className="block text-xs text-lavender/60 mt-1">{r.message}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-center gap-3 mt-6">
            <a
              href="/directory"
              className="px-6 py-2 rounded-full border border-heartlight-green/30 text-heartlight-green hover:bg-heartlight-green/10 transition-all"
            >
              Go to Directory
            </a>
            <a
              href={`/profile/${profiles.find((p) => selected.has(p.ces))?.ces || ''}`}
              className="px-6 py-2 rounded-full border border-gold-400/30 text-gold-300 hover:bg-gold-400/10 transition-all"
            >
              View Migrated Profile
            </a>
          </div>
        </div>
      )}

      <p className="text-xs text-lavender/40 mt-8 text-center">
        Run this page from the browser/device where your profile is saved. The dev-only Atlas steward profile (111111111) is skipped by default.
      </p>
    </div>
  );
}
