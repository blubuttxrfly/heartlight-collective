import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUnifiedStorage } from '../hooks/useUnifiedStorage';
import type { CreatorRecord } from '../types/ces';

export default function Directory() {
  const unified = useUnifiedStorage();
  const [profiles, setProfiles] = useState<CreatorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'accepting' | 'closed'>('all');

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    console.log('[Directory] Loading profiles...');
    setLoading(true);
    try {
      console.log('[Directory] Calling unified.getApproved()...');
      const all = await unified.getApproved();
      console.log('[Directory] Profiles loaded:', all.length, all.map(p => ({ name: p.name, ces: p.cesNumber, stewardship: p.stewardship })));
      setProfiles(all);
    } catch (err: any) {
      console.error('[Directory] Failed to load profiles:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = profiles.filter((p) => {
    if (filter === 'all') return true;
    return p.wishAvailability === filter;
  });

  return (
    <div className="px-4 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="font-serif text-4xl text-heartlight-green mb-4">
          Creator Directory ✦
        </h1>
        <p className="text-lavender/70 text-lg">
          Discover the sovereign beings of the Heartlight Collective
        </p>
      </div>

      {/* Filter */}
      <div className="flex justify-center gap-3 mb-8">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-sm border transition-all ${
            filter === 'all'
              ? 'border-gold-400/40 bg-gold-400/10 text-gold-300'
              : 'border-lavender/20 text-lavender/60 hover:border-lavender/40'
          }`}
        >
          All Creators
        </button>
        <button
          onClick={() => setFilter('accepting')}
          className={`px-4 py-2 rounded-full text-sm border transition-all ${
            filter === 'accepting'
              ? 'border-green-400/40 bg-green-400/10 text-green-300'
              : 'border-lavender/20 text-lavender/60 hover:border-lavender/40'
          }`}
        >
          🌱 Accepting Wishes
        </button>
        <button
          onClick={() => setFilter('closed')}
          className={`px-4 py-2 rounded-full text-sm border transition-all ${
            filter === 'closed'
              ? 'border-orange-400/40 bg-orange-400/10 text-orange-300'
              : 'border-lavender/20 text-lavender/60 hover:border-lavender/40'
          }`}
        >
          🍂 Not Accepting
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-lavender/50">Loading creators...</p>
        </div>
      )}

      {/* Grid */}
      {!loading && filteredProfiles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lavender/50">No creators found.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfiles.map((profile) => (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-lavender/10 bg-void-900/40 p-6 hover:border-gold-400/30 hover:bg-void-900/60 transition-all"
          >
            {/* Avatar + Name */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full border-2 border-lavender/20 overflow-hidden bg-void-800 flex items-center justify-center">
                {profile.photo ? (
                  <img
                    src={profile.photo}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-serif text-cream/80">
                    {profile.emoji || '✦'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-lg text-cream truncate">
                  {profile.name}
                </h3>
                {profile.title && (
                  <p className="text-sm text-lavender/60 truncate">
                    {profile.title}
                  </p>
                )}
                {/* C.E.S. Number */}
                <p className="text-xs font-mono text-gold-400/80 mt-1">
                  C.E.S. {profile.cesNumber}
                </p>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-lavender/70 mb-4 line-clamp-3">
                {profile.bio}
              </p>
            )}

            {/* Astrology */}
            {(profile.sunPlacement || profile.moonPlacement) && (
              <div className="flex gap-3 text-xs text-lavender/50 mb-4">
                {profile.sunPlacement && (
                  <span>☀️ {profile.sunPlacement}</span>
                )}
                {profile.moonPlacement && (
                  <span>🌙 {profile.moonPlacement}</span>
                )}
              </div>
            )}

            {/* Wish Availability Badge */}
            <div className="flex items-center justify-between mb-4">
              <span
                className={`text-xs px-3 py-1 rounded-full ${
                  profile.wishAvailability === 'accepting'
                    ? 'bg-green-400/10 text-green-300'
                    : 'bg-orange-400/10 text-orange-300'
                }`}
              >
                {profile.wishAvailability === 'accepting'
                  ? '🌱 Accepting Wishes'
                  : '🍂 Not Accepting'}
              </span>
              {profile.guideGuardianStatus === 'active' && (
                <span className="text-xs px-3 py-1 rounded-full bg-gold-400/10 text-gold-300 border border-gold-400/20">
                  🛡️ Guide & Guardian
                </span>
              )}
            </div>

            {/* Contact Methods (if public) */}
            {profile.publicContactVisibility && profile.contactMethods && (
              <div className="border-t border-lavender/10 pt-4 mt-4">
                <p className="text-xs text-lavender/50 mb-2">Connect:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(profile.contactMethods)
                    .filter(([key]) => (profile.contactVisibility as any)[key])
                    .map(([key]) => (
                      <span
                        key={key}
                        className="text-xs px-2 py-1 rounded-lg bg-void-800/60 border border-lavender/10 text-lavender/60"
                      >
                        {key}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Action */}
            <div className="mt-4">
              <Link
                to={`/profile/${profile.cesNumber}`}
                className="block w-full text-center px-4 py-2 rounded-full border border-heartlight-green/30 bg-heartlight-green/10 text-heartlight-green hover:bg-heartlight-green/20 transition-all text-sm"
              >
                View Profile
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
