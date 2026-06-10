import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, User, Sparkles, Camera, X, Upload, Trash2 } from 'lucide-react';
import {
  FaEnvelope, FaPhone, FaInstagram, FaYoutube, FaSpotify, FaDiscord, FaTelegram,
} from 'react-icons/fa';
import { FaThreads } from 'react-icons/fa6';
import { SiSignal } from 'react-icons/si';
import { useSession } from '../lib/session';
import { useUnifiedStorage } from '../hooks/useUnifiedStorage';
import { ACCESSIBILITY_PRESETS, ASTROLOGY_SIGNS, CONTACT_FIELDS } from '../lib/constants';
import type { CreatorRecord, ContactMethods, ContactVisibility, PortfolioItem } from '../types/ces';

const CONTACT_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  email: FaEnvelope,
  phone: FaPhone,
  instagram: FaInstagram,
  youtube: FaYoutube,
  threads: FaThreads,
  spotify: FaSpotify,
  discord: FaDiscord,
  telegram: FaTelegram,
  signal: SiSignal,
};

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, signIn, signOut } = useSession();
  const unified = useUnifiedStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [profile, setProfile] = useState<CreatorRecord | null>(null);
  
  // Basic Info
  const [name, setName] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [sunPlacement, setSunPlacement] = useState('');
  const [moonPlacement, setMoonPlacement] = useState('');
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState('');
  const [wishAvailability, setWishAvailability] = useState<'accepting' | 'closed'>('accepting');
  
  // Contact Methods
  const [contactMethods, setContactMethods] = useState<ContactMethods>({
    email: '', phone: '', instagram: '', youtube: '', threads: '', spotify: '', discord: '', telegram: '', signal: ''
  });
  const [contactVisibility, setContactVisibility] = useState<ContactVisibility>({
    email: false, phone: false, instagram: false, youtube: false, threads: false, spotify: false, discord: false, telegram: false, signal: false
  });
  
  // Portfolio
  const [portfolioLink, setPortfolioLink] = useState('');
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  
  // Numerology & Accessibility
  const [numerology, setNumerology] = useState<string[]>([]);
  const [accessibility, setAccessibility] = useState<string[]>([]);
  
  // Guide & Guardian
  const [guideGuardianOptIn, setGuideGuardianOptIn] = useState(false);

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
        setContactMethods(p.contactMethods || { email: '', phone: '', instagram: '', youtube: '', threads: '', spotify: '', discord: '', telegram: '', signal: '' });
        setContactVisibility(p.contactVisibility || { email: false, phone: false, instagram: false, youtube: false, threads: false, spotify: false, discord: false, telegram: false, signal: false });
        setPortfolioLink(p.portfolioLink || '');
        setPortfolioItems(p.portfolioItems || []);
        setNumerology(p.numerology || []);
        setAccessibility(p.accessibility || []);
        setGuideGuardianOptIn(p.guideGuardianStatus === 'opted_in');
      }
    };
    
    loadProfile();
  }, [user?.ces, unified]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, GIF, WebP)');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPhoto(result);
      setError('');
    };
    reader.onerror = () => {
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handlePortfolioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      const newItem: PortfolioItem = {
        id: `pi_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: file.type.startsWith('video') ? 'video' : 'image',
        url,
        caption: '',
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
      };
      setPortfolioItems(prev => [...prev, newItem]);
    };
    reader.readAsDataURL(file);
    // Reset input
    if (portfolioInputRef.current) {
      portfolioInputRef.current.value = '';
    }
  };

  const removePortfolioItem = useCallback((id: string) => {
    setPortfolioItems(prev => prev.filter(p => p.id !== id));
  }, []);

  const updatePortfolioCaption = useCallback((id: string, caption: string) => {
    setPortfolioItems(prev => prev.map(p => p.id === id ? { ...p, caption } : p));
  }, []);

  const toggleNumerology = useCallback((num: string) => {
    setNumerology(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]);
  }, []);

  const toggleAccessibility = useCallback((preset: string) => {
    setAccessibility(prev => prev.includes(preset) ? prev.filter(a => a !== preset) : [...prev, preset]);
  }, []);

  const updateContact = useCallback((key: keyof ContactMethods, value: string) => {
    setContactMethods(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleContactVisibility = useCallback((key: keyof ContactVisibility) => {
    setContactVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

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
        contactMethods,
        contactVisibility,
        portfolioLink: portfolioLink.trim(),
        portfolioItems,
        numerology,
        accessibility,
        guideGuardianStatus: guideGuardianOptIn ? 'opted_in' : 'not_opted_in',
        guideGuardianOptedInAt: guideGuardianOptIn && profile.guideGuardianStatus !== 'opted_in' 
          ? new Date().toISOString() 
          : profile.guideGuardianOptedInAt,
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
    <div className="px-4 pb-16 max-w-3xl mx-auto">
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
        <div className="space-y-8">
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
            <div className="relative w-32 h-32 rounded-full border-2 border-lavender/20 overflow-hidden bg-void-800 flex items-center justify-center group">
              {photo ? (
                <img src={photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-serif text-cream/80">
                  {name.split(' ').map(n => n[0]).join('').slice(0, 3).toUpperCase()}
                </span>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera className="w-8 h-8 text-cream" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-gold-400 hover:text-gold-300 transition-colors flex items-center gap-1"
            >
              <Upload className="w-3 h-3" />
              {photo ? 'Change Photo' : 'Upload Photo'}
            </button>
            {photo && (
              <button
                onClick={() => setPhoto('')}
                className="text-xs text-lavender/40 hover:text-lavender/20 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Remove Photo
              </button>
            )}
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg text-cream">Basic Information</h3>
            
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
          <div className="space-y-4">
            <h3 className="font-serif text-lg text-cream">Astrology Placements</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-lavender/40 font-sans mb-2">
                  Sun Placement
                </label>
                <select
                  value={sunPlacement}
                  onChange={(e) => setSunPlacement(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-void-900/60 border border-lavender/10 text-cream focus:border-gold-400/30 focus:outline-none transition-colors"
                >
                  <option value="">Select...</option>
                  {ASTROLOGY_SIGNS.map(sign => (
                    <option key={sign} value={sign}>{sign}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-lavender/40 font-sans mb-2">
                  Moon Placement
                </label>
                <select
                  value={moonPlacement}
                  onChange={(e) => setMoonPlacement(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-void-900/60 border border-lavender/10 text-cream focus:border-gold-400/30 focus:outline-none transition-colors"
                >
                  <option value="">Select...</option>
                  {ASTROLOGY_SIGNS.map(sign => (
                    <option key={sign} value={sign}>{sign}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg text-cream">About You</h3>
            
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
          </div>

          {/* Contact Methods */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg text-cream">Contact Methods</h3>
            <p className="text-xs text-lavender/50">Choose how beings can connect with you</p>
            
            <div className="space-y-3">
              {CONTACT_FIELDS.map(({ key, placeholder }) => {
                const Icon = CONTACT_ICON_MAP[key];
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-lavender/40" />
                        <input
                          type="text"
                          value={contactMethods[key as keyof ContactMethods]}
                          onChange={(e) => updateContact(key as keyof ContactMethods, e.target.value)}
                          placeholder={placeholder}
                          className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-cream text-sm focus:border-gold-400/30 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-lavender/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contactVisibility[key as keyof ContactVisibility]}
                        onChange={() => toggleContactVisibility(key as keyof ContactVisibility)}
                        className="w-4 h-4 rounded border-lavender/20 bg-void-800 accent-gold-400"
                      />
                      Show in Directory
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Portfolio */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg text-cream">Portfolio</h3>
            
            <div>
              <label className="block text-xs uppercase tracking-widest text-lavender/40 font-sans mb-2">
                Portfolio Link
              </label>
              <input
                type="text"
                value={portfolioLink}
                onChange={(e) => setPortfolioLink(e.target.value)}
                placeholder="https://yourportfolio.com"
                className="w-full px-4 py-2.5 rounded-lg bg-void-900/60 border border-lavender/10 text-cream focus:border-gold-400/30 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-lavender/40 font-sans mb-2">
                Portfolio Items
              </label>
              <input
                ref={portfolioInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handlePortfolioUpload}
                className="hidden"
              />
              <button
                onClick={() => portfolioInputRef.current?.click()}
                className="w-full py-3 rounded-lg border border-lavender/10 text-lavender/40 hover:text-cream hover:border-lavender/20 transition-all text-sm flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Image or Video
              </button>
              
              {portfolioItems.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {portfolioItems.map(item => (
                    <div key={item.id} className="relative group rounded-lg overflow-hidden border border-lavender/10 bg-void-800/40">
                      {item.type === 'video' ? (
                        <video src={item.url} className="w-full h-32 object-cover" />
                      ) : (
                        <img src={item.url} alt={item.caption} className="w-full h-32 object-cover" />
                      )}
                      <input
                        type="text"
                        value={item.caption}
                        onChange={(e) => updatePortfolioCaption(item.id, e.target.value)}
                        placeholder="Add caption..."
                        className="absolute bottom-0 left-0 right-0 bg-black/70 text-cream text-xs px-2 py-1 focus:outline-none"
                      />
                      <button
                        onClick={() => removePortfolioItem(item.id)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Numerology */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg text-cream">Numerology</h3>
            <p className="text-xs text-lavender/50">Select numbers that resonate with you</p>
            
            <div className="flex flex-wrap gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '11', '22', '33'].map(num => (
                <button
                  key={num}
                  onClick={() => toggleNumerology(num)}
                  className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                    numerology.includes(num)
                      ? 'bg-gold-400/20 border-gold-400/30 text-gold-300'
                      : 'bg-void-800 border-lavender/10 text-lavender/40 hover:border-lavender/20'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Accessibility */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg text-cream">Accessibility</h3>
            <p className="text-xs text-lavender/50">Share how you prefer to communicate</p>
            
            <div className="flex flex-wrap gap-2">
              {ACCESSIBILITY_PRESETS.map(preset => (
                <button
                  key={preset}
                  onClick={() => toggleAccessibility(preset)}
                  className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                    accessibility.includes(preset)
                      ? 'bg-green-400/20 border-green-400/30 text-green-300'
                      : 'bg-void-800 border-lavender/10 text-lavender/40 hover:border-lavender/20'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Wish Availability & Guide/Guardian */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg text-cream">Preferences</h3>
            
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

            <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-lavender/10 bg-void-800/40 hover:border-gold-400/20 transition-all">
              <input
                type="checkbox"
                checked={guideGuardianOptIn}
                onChange={(e) => setGuideGuardianOptIn(e.target.checked)}
                className="w-5 h-5 rounded border-lavender/20 bg-void-800 accent-gold-400"
              />
              <div>
                <p className="text-sm text-cream font-medium">Opt in as Heartlight Guide & Guardian 🛡️</p>
                <p className="text-xs text-lavender/50">Support other beings in their journey and hold space for the Collective</p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-lavender/10">
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
