import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Filter, Sparkles, MapPin, Heart, X, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStorage } from '../lib/storage';
import { RAY_DATA } from '../lib/constants';
import type { CreatorRecord } from '../types/ces';

/* ─── Exchange Directory ─── */
export default function Exchange() {
  const { getApproved } = useStorage();
  const approved = getApproved();

  const [search, setSearch] = useState('');
  const [filterRay, setFilterRay] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<CreatorRecord | null>(null);

  const filtered = useMemo(() => {
    let list = [...approved];
    if (filterRay) {
      list = list.filter((p) => p.rays?.includes(filterRay) || p.ray === filterRay);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.offerings.some((o) => o.toLowerCase().includes(q)) ||
          p.location?.toLowerCase().includes(q) ||
          p.heartlight?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [approved, search, filterRay]);

  const rayColors: Record<string, string> = {};
  RAY_DATA.forEach((r) => (rayColors[r.key] = r.color));

  return (
    <div className="px-4 pb-12 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-lavender/60 hover:text-gold-400 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Collective
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
        <Sparkles className="w-10 h-10 text-magenta-400 mx-auto mb-4" />
        <h1 className="font-serif text-3xl md:text-4xl text-cream mb-3">Heartlight Exchange</h1>
        <p className="text-lavender/70 max-w-xl mx-auto mb-6">
          Where resonant beings find each other across the Heartlines.
          Browse offerings, cast wishes, and co-create in sacred reciprocity.
        </p>
        <Link
          to="/create-profile"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all text-sm"
        >
          <Heart className="w-4 h-4" />
          Create Your Profile
        </Link>
      </motion.div>

      {approved.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Search + Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lavender/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, offering, location…"
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-lavender/40" />
              <select
                value={filterRay || ''}
                onChange={(e) => setFilterRay(e.target.value || null)}
                className="px-3 py-2.5 rounded-full bg-void-800/50 border border-lavender/10 text-cream text-sm focus:border-gold-400/40 focus:outline-none cursor-pointer"
              >
                <option value="">All Rays</option>
                {RAY_DATA.map((r) => (
                  <option key={r.key} value={r.key}>{r.key} Ray</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results count */}
          <p className="text-xs text-lavender/40 mb-4">
            {filtered.length} resonant {filtered.length === 1 ? 'being' : 'beings'} in the field
            {filterRay && ` • filtered by ${filterRay} Ray`}
          </p>

          {/* Offerings Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((profile, i) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-magenta-500/15 bg-void-800/40 p-5 hover:border-magenta-500/30 transition-all cursor-pointer"
                onClick={() => setSelectedProfile(profile)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex gap-1.5 flex-wrap">
                    {(profile.rays?.length ? profile.rays : [profile.ray]).filter(Boolean).map((r) => (
                      <span
                        key={r}
                        className="px-2 py-1 rounded-full text-xs border"
                        style={{
                          borderColor: `${rayColors[r] || '#a5f3fc'}40`,
                          backgroundColor: `${rayColors[r] || '#a5f3fc'}15`,
                          color: rayColors[r] || '#a5f3fc',
                        }}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                  <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">
                    {profile.directoryWishStatus === 'accepting' ? 'open' : 'full'}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-void-900 border border-lavender/10 flex items-center justify-center text-lg">
                    {profile.emoji || '✦'}
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-cream">{profile.name}</h3>
                    {profile.title && <p className="text-lavender/50 text-xs">{profile.title}</p>}
                  </div>
                </div>

                <p className="text-lavender/60 text-sm mb-3 line-clamp-2">{profile.heartlight}</p>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {profile.offerings.slice(0, 3).map((o) => (
                    <span key={o} className="px-2 py-0.5 rounded-full bg-void-900/60 border border-lavender/10 text-lavender/50 text-xs">
                      {o}
                    </span>
                  ))}
                  {profile.offerings.length > 3 && (
                    <span className="px-2 py-0.5 rounded-full text-lavender/30 text-xs">+{profile.offerings.length - 3}</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-lavender/40 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {profile.location || 'Earth'}
                  </span>
                  <span className="text-gold-400 text-xs flex items-center gap-1">
                    View <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Sparkles className="w-8 h-8 text-lavender/30 mx-auto mb-3" />
              <p className="text-lavender/50 mb-4">No beings match your search. Try a different resonance.</p>
              <Link
                to="/create-profile"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold-400/30 text-gold-300 text-sm hover:bg-gold-400/10 transition-all"
              >
                <Heart className="w-4 h-4" /> Create Your Profile
              </Link>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {selectedProfile && (
          <ProfileDetailModal profile={selectedProfile} onClose={() => setSelectedProfile(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Empty State ─── */
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-16 max-w-md mx-auto"
    >
      <Sparkles className="w-12 h-12 text-lavender/30 mx-auto mb-4" />
      <h2 className="font-serif text-2xl text-cream mb-3">The Exchange Awaits</h2>
      <p className="text-lavender/60 mb-6">
        No resonant beings have entered the field yet. 
        You can be the first to plant your heartlight here.
      </p>
      <Link
        to="/create-profile"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all"
      >
        <Heart className="w-4 h-4" />
        Create Your Profile
      </Link>
    </motion.div>
  );
}

/* ─── Profile Detail Modal ─── */
function ProfileDetailModal({ profile, onClose }: { profile: CreatorRecord; onClose: () => void }) {
  const rayColors: Record<string, string> = {};
  RAY_DATA.forEach((r) => (rayColors[r.key] = r.color));

  const visibleContacts = Object.entries(profile.contactVisibility || {})
    .filter(([_, visible]) => visible)
    .map(([key]) => key);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-gold-400/20 bg-void-900/95 p-6 shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-lavender/40 hover:text-cream transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-void-800 border border-gold-400/20 flex items-center justify-center text-2xl mx-auto mb-3">
            {profile.emoji || '✦'}
          </div>
          <h2 className="font-serif text-2xl text-cream">{profile.name}</h2>
          {profile.title && <p className="text-lavender/60 text-sm">{profile.title}</p>}
          {profile.location && (
            <p className="text-xs text-lavender/40 mt-1 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3" /> {profile.location}
            </p>
          )}
        </div>

        <div className="space-y-5">
          {/* Rays */}
          <div>
            <label className="block text-xs text-lavender/50 mb-1.5 uppercase tracking-wider">Ray Frequencies</label>
            <div className="flex flex-wrap gap-2">
              {(profile.rays?.length ? profile.rays : [profile.ray]).filter(Boolean).map((r) => (
                <span
                  key={r}
                  className="px-3 py-1 rounded-full text-xs border"
                  style={{
                    borderColor: `${rayColors[r] || '#a5f3fc'}40`,
                    backgroundColor: `${rayColors[r] || '#a5f3fc'}15`,
                    color: rayColors[r] || '#a5f3fc',
                  }}
                >
                  {r} Ray
                </span>
              ))}
            </div>
          </div>

          {/* Heartlight */}
          <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-4">
            <label className="block text-xs text-lavender/50 mb-1.5 uppercase tracking-wider">Heartlight</label>
            <p className="text-sm text-lavender/70 italic">"{profile.heartlight}"</p>
          </div>

          {/* Offerings */}
          <div>
            <label className="block text-xs text-lavender/50 mb-1.5 uppercase tracking-wider">Offerings</label>
            <div className="flex flex-wrap gap-2">
              {profile.offerings.map((o) => (
                <span key={o} className="px-3 py-1 rounded-full bg-void-800/60 border border-lavender/10 text-cream text-xs">
                  {o}
                </span>
              ))}
            </div>
          </div>

          {/* Exchanges */}
          <div>
            <label className="block text-xs text-lavender/50 mb-1.5 uppercase tracking-wider">Exchange Pathways</label>
            <div className="flex flex-wrap gap-2">
              {profile.exchanges?.map((e) => (
                <span key={e} className="px-3 py-1 rounded-full bg-gold-400/10 border border-gold-400/20 text-gold-300 text-xs">
                  {e}
                </span>
              )) || <span className="text-xs text-lavender/30">Not specified</span>}
            </div>
          </div>

          {/* Seasons */}
          {profile.seasons && Object.values(profile.seasons).some(Boolean) && (
            <div>
              <label className="block text-xs text-lavender/50 mb-1.5 uppercase tracking-wider">Seasonal Availability</label>
              <div className="flex gap-2">
                {Object.entries(profile.seasons)
                  .filter(([_, active]) => active)
                  .map(([season]) => (
                    <span key={season} className="px-3 py-1 rounded-full bg-void-800/60 border border-lavender/10 text-lavender/60 text-xs">
                      {season}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          {profile.timeline && (
            <div>
              <label className="block text-xs text-lavender/50 mb-1.5 uppercase tracking-wider">Typical Timeline</label>
              <p className="text-sm text-lavender/60">{profile.timeline}</p>
            </div>
          )}

          {/* Accessibility */}
          {profile.accessibility?.length > 0 && (
            <div>
              <label className="block text-xs text-lavender/50 mb-1.5 uppercase tracking-wider">Accessibility</label>
              <div className="flex flex-wrap gap-2">
                {profile.accessibility.map((a) => (
                  <span key={a} className="px-2 py-0.5 rounded-full bg-turquoise-400/10 border border-turquoise-400/20 text-turquoise-300 text-xs">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contact (visible only) */}
          {visibleContacts.length > 0 && (
            <div className="rounded-xl border border-gold-400/10 bg-gold-400/5 p-4">
              <label className="block text-xs text-gold-400/60 mb-2 uppercase tracking-wider">Visible Contact Methods</label>
              <div className="space-y-1">
                {visibleContacts.map((key) => {
                  const val = ((profile.contactMethods as unknown) as Record<string, string>)[key];
                  if (!val) return null;
                  return (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <span className="text-lavender/40 capitalize w-20">{key}:</span>
                      <span className="text-cream">{val}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
