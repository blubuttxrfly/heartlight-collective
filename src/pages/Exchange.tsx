import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Sparkles, MapPin, Heart, X, ChevronRight, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStorage } from '../lib/storage';
import type { CreatorRecord } from '../types/ces';

/* ─── Helper: find user's profile and its queue ─── */
function getMyProfileStatus(): { profile: CreatorRecord; queue: 'pending' | 'approved' | 'returned' } | null {
  try {
    const queues: ('pending' | 'approved' | 'returned')[] = ['pending', 'approved', 'returned'];
    for (const q of queues) {
      const list = JSON.parse(localStorage.getItem(`hlc_${q}`) || '[]') as CreatorRecord[];
      if (list.length > 0) return { profile: list[0], queue: q };
    }
  } catch { /* silent */ }
  return null;
}

/* ─── Exchange Directory ─── */
export default function Exchange() {
  const { getApproved, getPending, getReturned } = useStorage();
  const approved = getApproved();
  const pending = getPending();
  const returned = getReturned();

  const [search, setSearch] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<CreatorRecord | null>(null);

  const myProfile = getMyProfileStatus();

  const filtered = useMemo(() => {
    let list = [...approved];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.bio?.toLowerCase().includes(q) ||
          p.title?.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [approved, search]);

  return (
    <div className="px-4 pb-12 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-lavender/60 hover:text-gold-400 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Collective
        </Link>
      </div>

      {/* ── My Profile Status Banner ── */}
      {myProfile && (
        <ProfileStatusBanner status={myProfile} />
      )}

      {/* ── Queue Summary ── */}
      <div className="flex items-center justify-center gap-4 mb-6 text-xs text-lavender/40">
        <span>{approved.length} approved</span>
        <span className="w-1 h-1 rounded-full bg-lavender/20" />
        <span>{pending.length} pending</span>
        <span className="w-1 h-1 rounded-full bg-lavender/20" />
        <span>{returned.length} returned</span>
      </div>

      {approved.length === 0 ? (
        <EmptyState hasProfile={!!myProfile} />
      ) : (
        <>
          {/* Search Bar */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lavender/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, bio, title, location…"
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <p className="text-xs text-lavender/40 mb-4">
            {filtered.length} resonant {filtered.length === 1 ? 'being' : 'beings'} in the field
          </p>

          {/* Directory Grid */}
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
                  <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">
                    {profile.directoryWishStatus === 'accepting' ? 'open' : 'full'}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-void-900 border border-lavender/10 flex items-center justify-center text-lg overflow-hidden">
                    {profile.photo ? (
                      <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{profile.emoji || '✦'}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-cream">{profile.name}</h3>
                    {profile.title && <p className="text-lavender/50 text-xs">{profile.title}</p>}
                  </div>
                </div>

                <p className="text-lavender/60 text-sm mb-3 line-clamp-2">
                  {profile.bio || profile.consent || 'A sovereign being of the Heartlight Collective.'}
                </p>

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
                Create Your Profile <Heart className="w-4 h-4" />
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

/* ─── Profile Status Banner ─── */
function ProfileStatusBanner({ status }: { status: { profile: CreatorRecord; queue: string } }) {
  const { profile, queue } = status;

  const config = {
    pending: {
      icon: Clock,
      border: 'border-gold-400/20',
      bg: 'bg-gold-400/5',
      text: 'text-gold-300',
      subtext: 'text-lavender/50',
      message: `Your profile (C.E.S. ${profile.cesNumber}) is awaiting steward review. You will appear here once approved.`,
    },
    approved: {
      icon: CheckCircle,
      border: 'border-green-400/20',
      bg: 'bg-green-400/5',
      text: 'text-green-300',
      subtext: 'text-lavender/50',
      message: `Your profile is live in the Exchange! C.E.S. ${profile.cesNumber}`,
    },
    returned: {
      icon: AlertCircle,
      border: 'border-orange-400/20',
      bg: 'bg-orange-400/5',
      text: 'text-orange-300',
      subtext: 'text-lavender/50',
      message: `Your profile was returned for revision. Update it and resubmit. C.E.S. ${profile.cesNumber}`,
    },
  };

  const c = config[queue as keyof typeof config] || config.pending;
  const Icon = c.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${c.border} ${c.bg} p-4 mb-6`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${c.text} mt-0.5 flex-shrink-0`} />
        <div>
          <p className={`text-sm ${c.text}`}>{c.message}</p>
          <p className={`text-xs ${c.subtext} mt-1`}>
            {queue === 'pending' && 'A Steward will review your resonance for alignment with the 12 Codes of ALL.'}
            {queue === 'approved' && 'You are now visible to all resonant beings in the field.'}
            {queue === 'returned' && 'Sign in to edit your profile and resubmit for review.'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Empty State ─── */
function EmptyState({ hasProfile }: { hasProfile: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-16 max-w-md mx-auto"
    >
      <Sparkles className="w-12 h-12 text-lavender/30 mx-auto mb-4" />
      <h2 className="font-serif text-2xl text-cream mb-3">The Exchange Awaits</h2>
      <p className="text-lavender/60 mb-6">
        {hasProfile
          ? 'Your profile is in review. Once a Steward approves it, you will appear here. In the meantime, explore the Charter and Codes.'
          : 'No resonant beings have entered the field yet. You can be the first to plant your heartlight here.'}
      </p>
      {!hasProfile && (
        <Link
          to="/create-profile"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all"
        >
          Create Your Profile <Heart className="w-4 h-4" />
        </Link>
      )}
      {hasProfile && (
        <div className="flex gap-3 justify-center">
          <Link
            to="/charter"
            className="px-4 py-2 rounded-full border border-lavender/20 text-lavender/60 text-sm hover:border-lavender/40 transition-all"
          >
            Read the Charter
          </Link>
          <Link
            to="/codes"
            className="px-4 py-2 rounded-full border border-lavender/20 text-lavender/60 text-sm hover:border-lavender/40 transition-all"
          >
            12 Codes of ALL
          </Link>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Profile Detail Modal ─── */
function ProfileDetailModal({ profile, onClose }: { profile: CreatorRecord; onClose: () => void }) {
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
          <div className="w-16 h-16 rounded-full bg-void-800 border border-gold-400/20 flex items-center justify-center text-2xl mx-auto mb-3 overflow-hidden">
            {profile.photo ? (
              <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <span>{profile.emoji || '✦'}</span>
            )}
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
          {/* Bio */}
          {profile.bio && (
            <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-4">
              <label className="block text-xs text-lavender/50 mb-1.5 uppercase tracking-wider">Bio</label>
              <p className="text-sm text-lavender/70">{profile.bio}</p>
            </div>
          )}

          {/* Consent */}
          {profile.consent && (
            <div className="rounded-xl border border-magenta-500/10 bg-magenta-500/5 p-4">
              <label className="block text-xs text-magenta-400/60 mb-1.5 uppercase tracking-wider">Consent & Boundaries</label>
              <p className="text-sm text-lavender/70">{profile.consent}</p>
            </div>
          )}

          {/* Portfolio */}
          {profile.portfolioLink && (
            <div>
              <label className="block text-xs text-lavender/50 mb-1.5 uppercase tracking-wider">Portfolio</label>
              <a
                href={profile.portfolioLink.startsWith('http') ? profile.portfolioLink : `https://${profile.portfolioLink}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gold-400 hover:text-gold-300 underline break-all"
              >
                {profile.portfolioLink}
              </a>
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

          {/* Life Path Number */}
          {profile.numerology?.length > 0 && (
            <div>
              <label className="block text-xs text-lavender/50 mb-1.5 uppercase tracking-wider">Life Path Number</label>
              <div className="flex flex-wrap gap-2">
                {profile.numerology.map((n) => (
                  <span key={n} className="px-2 py-0.5 rounded-full bg-violet-400/10 border border-violet-400/20 text-violet-300 text-xs">
                    {n}
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
