import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUnifiedStorage } from '../hooks/useUnifiedStorage';
import { isSupabaseConfigured } from '../lib/supabase';
import type { CreatorRecord } from '../types/ces';

export default function Diagnostics() {
  const unified = useUnifiedStorage();
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [pending, setPending] = useState<CreatorRecord[]>([]);
  const [approved, setApproved] = useState<CreatorRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSupabaseConfigured(isSupabaseConfigured());
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const [pendingProfiles, approvedProfiles] = await Promise.all([
        unified.getPending(),
        unified.getApproved(),
      ]);
      setPending(pendingProfiles);
      setApproved(approvedProfiles);
    } catch (err) {
      console.error('Failed to load profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 pb-16 max-w-4xl mx-auto">
      <h1 className="font-serif text-3xl text-gold-shimmer mb-8 text-center">
        System Diagnostics ✦
      </h1>

      {/* Supabase Status */}
      <div className={`rounded-xl border p-4 mb-6 ${
        supabaseConfigured 
          ? 'border-green-400/20 bg-green-400/5' 
          : 'border-orange-400/20 bg-orange-400/5'
      }`}>
        <h2 className="font-serif text-xl text-cream mb-2">
          {supabaseConfigured ? '✓ Supabase Connected' : '⚠ Supabase Not Configured'}
        </h2>
        <p className="text-sm text-lavender/70">
          {supabaseConfigured 
            ? 'Cross-browser sync is enabled. Profiles will appear in the admin panel from any browser.' 
            : 'Profiles are stored in browser localStorage only. Run the Supabase migration and add env vars to Vercel.'}
        </p>
      </div>

      {/* Pending Profiles */}
      <div className="rounded-xl border border-lavender/10 bg-void-900/40 p-6 mb-6">
        <h2 className="font-serif text-xl text-cream mb-4">
          Pending Profiles ({pending.length})
        </h2>
        {loading ? (
          <p className="text-lavender/50">Loading...</p>
        ) : pending.length === 0 ? (
          <p className="text-lavender/50">No pending profiles.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((profile) => (
              <div key={profile.id} className="p-3 rounded-lg border border-lavender/10 bg-void-800/40">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-cream font-medium">{profile.name}</p>
                    <p className="text-xs text-lavender/50 font-mono">C.E.S. {profile.cesNumber}</p>
                    <p className="text-xs text-lavender/60 mt-1">{profile.location || 'No location'}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-gold-400/10 text-gold-300 border border-gold-400/20">
                    {profile.guideGuardianStatus === 'opted_in' ? '🛡️ Guide & Guardian' : 'Not opted in'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Profiles */}
      <div className="rounded-xl border border-lavender/10 bg-void-900/40 p-6 mb-6">
        <h2 className="font-serif text-xl text-cream mb-4">
          Approved Profiles ({approved.length})
        </h2>
        {loading ? (
          <p className="text-lavender/50">Loading...</p>
        ) : approved.length === 0 ? (
          <p className="text-lavender/50">No approved profiles.</p>
        ) : (
          <div className="space-y-3">
            {approved.map((profile) => (
              <div key={profile.id} className="p-3 rounded-lg border border-lavender/10 bg-void-800/40">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-cream font-medium">{profile.name}</p>
                    <p className="text-xs text-lavender/50 font-mono">C.E.S. {profile.cesNumber}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-400/10 text-green-300 border border-green-400/20">
                    Live in Directory
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          to="/steward"
          className="flex-1 text-center px-4 py-3 rounded-full border border-gold-400/30 bg-gold-400/10 text-gold-300 hover:bg-gold-400/20 transition-all"
        >
          Go to Admin Panel
        </Link>
        <Link
          to="/"
          className="flex-1 text-center px-4 py-3 rounded-full border border-lavender/20 text-lavender/70 hover:bg-lavender/5 transition-all"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
