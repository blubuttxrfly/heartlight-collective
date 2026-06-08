import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, User, Sparkles } from 'lucide-react';
import { useSession } from '../lib/session';
import { useUnifiedStorage } from '../hooks/useUnifiedStorage';
import type { CreatorRecord } from '../types/ces';

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, signIn, signOut } = useSession();
  const unified = useUnifiedStorage();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [profile, setProfile] = useState<CreatorRecord | null>(null);
  
  // Profile form state
  const [name, setName] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [sunPlacement, setSunPlacement] = useState('');
  const [moonPlacement, setMoonPlacement] = useState('');
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState('');
  const [wishAvailability, setWishAvailability] = useState<'accepting' | 'closed'>('accepting');

  // Load full profile on mount
  useEffect(() => {
    if (!user?.ces) return;
    
    const loadProfile = async () => {
      const p = await unified.findProfileByCES(user.ces);
      if (p) {
        setProfile(p);
        setName(p.name);
        setPronouns(p.pronouns || '');
        setTitle(p.title || '');
        setLocation(p.location || '');
        setSunPlacement(p.sunPlacement || '');
        setMoonPlacement(p.moonPlacement || '');
        setBio(p.bio || '');
        setPhoto(p.photo || '');
        setWishAvailability(p.wishAvailability === 'closed' ? 'closed' : 'accepting');
      }
    };
    
    loadProfile();
  }, [user?.ces, unified]);

  const handleSave = async () => {
    if (!user || !profile) {
      setError('No profile found. Please sign in again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const updated: CreatorRecord = {
        ...profile,
        name: name.trim(),
        pronouns: pronouns.trim().toLowerCase(),
        title: title.trim(),
        location: location.trim(),
        sunPlacement: sunPlacement.trim(),
        moonPlacement: moonPlacement.trim(),
        bio: bio.trim(),
        photo,
        wishAvailability,
        directoryWishStatus: wishAvailability,
      };

      // Update in unified storage (Supabase + localStorage)
      await unified.updateProfile(updated);
      
      // Update session
      await signIn(updated);
      
      setSuccess(true);
      setTimeout(() => {
        navigate(`/profile/${updated.cesNumber}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <User className="w-16 h-16 text-lavender/20 mx-auto mb-4" />
          <h2 className="text-xl font-serif text-cream mb-2">Not Signed In</h2>
          <p className="text-sm text-lavender/50 mb-6">Please sign in to edit your profile.</p>
          <Link
            to="/sign-in"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-400/20 border border-gold-400/30 text-gold-400 hover:bg-gold-400/30 transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-16 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="text-lavender/40 hover:text-cream transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-serif text-2xl text-cream">Edit Your Profile</h1>
          <p className="text-xs text-lavender/50">C.E.S. {user.ces}</p>
        </div>
      </div>

      {/* Success State */}
      {success ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center py-12"
        >
          <Sparkles className="w-16 h-16 text-gold-400 mx-auto mb-4" />
          <h2 className="text-xl font-serif text-cream mb-2">Profile Updated ✦</h2>
          <p className="text-sm text-lavender/50">Redirecting to your profile...</p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 rounded-xl border border-magenta-400/20 bg-magenta-400/5 text-magenta-300 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Profile Photo */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full border-2 border-lavender/20 overflow-hidden bg-void-800 flex items-center justify-center">
              {photo ? (
                <img src={photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-serif text-cream/80">
                  {name.split(' ').map(n => n[0]).join('').slice(0, 3).toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-xs text-lavender/50">Photo updates coming soon</p>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-lavender/40 font-sans mb-2">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-void-900/60 border border-lavender/10 text-cream focus:border-gold-400/30 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-lavender/40 font-sans mb-2">
                Pronouns
              </label>
              <input
                type="text"
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value.toLowerCase())}
                placeholder="they/them"
                className="w-full px-4 py-2.5 rounded-lg bg-void-900/60 border border-lavender/10 text-cream focus:border-gold-400/30 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-lavender/40 font-sans mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Conscious Co-Creator"
                className="w-full px-4 py-2.5 rounded-lg bg-void-900/60 border border-lavender/10 text-cream focus:border-gold-400/30 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-lavender/40 font-sans mb-2">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Earth, Solar System"
                className="w-full px-4 py-2.5 rounded-lg bg-void-900/60 border border-lavender/10 text-cream focus:border-gold-400/30 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Astro Placements */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-lavender/40 font-sans mb-2">
                Sun Placement
              </label>
              <input
                type="text"
                value={sunPlacement}
                onChange={(e) => setSunPlacement(e.target.value)}
                placeholder="Leo"
                className="w-full px-4 py-2.5 rounded-lg bg-void-900/60 border border-lavender/10 text-cream focus:border-gold-400/30 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-lavender/40 font-sans mb-2">
                Moon Placement
              </label>
              <input
                type="text"
                value={moonPlacement}
                onChange={(e) => setMoonPlacement(e.target.value)}
                placeholder="Cancer"
                className="w-full px-4 py-2.5 rounded-lg bg-void-900/60 border border-lavender/10 text-cream focus:border-gold-400/30 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-lavender/40 font-sans mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share your resonance, offerings, and journey..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-lg bg-void-900/60 border border-lavender/10 text-cream focus:border-gold-400/30 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Wish Availability */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-lavender/40 font-sans mb-2">
              Wish Availability
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setWishAvailability('accepting')}
                className={`flex-1 py-3 rounded-lg border transition-all ${
                  wishAvailability === 'accepting'
                    ? 'bg-green-500/10 border-green-400/30 text-green-300'
                    : 'bg-void-800 border-lavender/10 text-lavender/40 hover:border-lavender/20'
                }`}
              >
                🌱 Accepting
              </button>
              <button
                type="button"
                onClick={() => setWishAvailability('closed')}
                className={`flex-1 py-3 rounded-lg border transition-all ${
                  wishAvailability === 'closed'
                    ? 'bg-amber-500/10 border-amber-400/30 text-amber-300'
                    : 'bg-void-800 border-lavender/10 text-lavender/40 hover:border-lavender/20'
                }`}
              >
                🍂 Not Accepting
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={loading}
              className="flex-1 py-3 rounded-full border border-lavender/20 text-lavender/60 hover:text-cream hover:bg-lavender/5 transition-all disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-3 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {loading ? 'Saving...' : 'Save Changes'}
              {!loading && <Save className="w-4 h-4" />}
            </button>
          </div>

          {/* Sign Out */}
          <div className="pt-6 border-t border-lavender/10">
            <button
              onClick={() => {
                signOut();
                navigate('/');
              }}
              className="w-full py-3 rounded-full border border-magenta-400/20 text-magenta-300 hover:bg-magenta-400/5 transition-all text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
