import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Sparkles, Eye, EyeOff, Upload, Check, X, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  FaEnvelope, FaPhone, FaInstagram, FaYoutube,
  FaSpotify, FaDiscord, FaTelegram,
} from 'react-icons/fa6';
import { FaThreads } from 'react-icons/fa6';
import { SiSignal } from 'react-icons/si';
import { useStorage } from '../lib/storage';
import { generateCESNumberValue } from '../lib/ces';
import type { CreatorRecord, ContactMethods, ContactVisibility, PortfolioItem } from '../types/ces';
import {
  ACCESSIBILITY_PRESETS,
  ASTROLOGY_SIGNS,
  CONTACT_FIELDS,
} from '../lib/constants';

/* ─── Step indicator ─── */
function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex justify-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            i + 1 === step
              ? 'bg-gold-400 scale-110'
              : i + 1 < step
              ? 'bg-gold-400/40'
              : 'bg-white/10'
          }`}
        />
      ))}
    </div>
  );
}

/* ─── Empty contact methods ─── */
function emptyContact(): ContactMethods {
  return { email: '', phone: '', instagram: '', youtube: '', threads: '', spotify: '', discord: '', telegram: '', signal: '' };
}
function emptyContactVisibility(): ContactVisibility {
  return { email: false, phone: false, instagram: false, youtube: false, threads: false, spotify: false, discord: false, telegram: false, signal: false };
}

/* ─── Icon map for contact methods ─── */
const CONTACT_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  email:     FaEnvelope,
  phone:     FaPhone,
  instagram: FaInstagram,
  youtube:   FaYoutube,
  threads:   FaThreads,
  spotify:   FaSpotify,
  discord:   FaDiscord,
  telegram:  FaTelegram,
  signal:    SiSignal,
};

/* ─── Main wizard ─── */
export default function CreateProfile() {
  const { addProfile, getProfiles } = useStorage();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [generatedCES, setGeneratedCES] = useState('');

  // ── Form state ──
  const [name, setName] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [sun, setSun] = useState('');
  const [moon, setMoon] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2
  const [bio, setBio] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [portfolioItems, _setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [contactMethods, setContactMethods] = useState<ContactMethods>(emptyContact());
  const [contactVisibility, setContactVisibility] = useState<ContactVisibility>(emptyContactVisibility());
  const [numerology, setNumerology] = useState<string[]>([]);
  const [accessibility, setAccessibility] = useState<string[]>([]);
  const [consent, setConsent] = useState('');

  // Step 3
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [wishAvailability, setWishAvailability] = useState<'accepting' | 'closed'>('accepting');
  const [agreeCodes, setAgreeCodes] = useState(false);
  const [agreeCharter, setAgreeCharter] = useState(false);

  // ── Helpers ──
  const toggleAccessibility = useCallback((a: string) => {
    setAccessibility((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }, []);

  const updateContact = useCallback((key: keyof ContactMethods, value: string) => {
    setContactMethods((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleContactVisibility = useCallback((key: keyof ContactVisibility) => {
    setContactVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ── Validation per step ──
  const canProceed = useCallback(() => {
    switch (step) {
      case 1:
        return name.trim().length >= 2;
      case 2:
        return true; // all optional
      case 3:
        return passphrase.length >= 6 && agreeCodes && agreeCharter;
      default:
        return false;
    }
  }, [step, name, passphrase, agreeCodes, agreeCharter]);

  // ── Submit ──
  const handleSubmit = useCallback(() => {
    const used = new Set(getProfiles().map((p) => p.cesNumber || '').filter(Boolean));
    const ces = generatedCES || generateCESNumberValue(used);
    if (!generatedCES) setGeneratedCES(ces);

    const initials = getInitials(name.trim());
    const record: CreatorRecord = {
      id: `profile_${Date.now()}`,
      name: name.trim(),
      pronouns: pronouns.trim(),
      title: title.trim(),
      location: location.trim(),
      sunPlacement: sun,
      moonPlacement: moon,
      emoji: initials,
      photo: photo,
      bio: bio.trim(),
      numerology,
      accessibility,
      consent: consent.trim(),
      portfolioLink: portfolioLink.trim(),
      portfolioItems,
      contactMethods,
      contactVisibility,
      publicContactVisibility: false,
      contactMethod: '',
      season_current: '',
      cesNumber: ces,
      passphrase,
      wishAvailability,
      directoryWishStatus: wishAvailability,
      stewardship: 'active',
      stewardshipNote: '',
    };

    addProfile(record, 'pending');
    setSubmitted(true);
  }, [name, pronouns, title, location, sun, moon, photo, bio, numerology, accessibility, consent, portfolioLink, wishAvailability, portfolioItems, contactMethods, contactVisibility, passphrase, generatedCES, getProfiles, addProfile]);

  // ── Steps ──
  const steps = [
    /* Step 1: Personal */
    <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h2 className="font-serif text-2xl text-cream mb-6 text-center">Step 1 — Your Resonance</h2>

      <div className="space-y-4 max-w-md mx-auto">
        {/* Profile Picture */}
        <div className="flex flex-col items-center gap-3">
          <label className="block text-sm text-lavender/70">Profile Picture</label>

          {/* Avatar preview */}
          <div className="relative w-24 h-24 rounded-full border-2 border-lavender/20 overflow-hidden bg-void-800 flex items-center justify-center">
            {photo ? (
              <img src={photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-serif text-cream/80">
                {getInitials(name)}
              </span>
            )}
            {photo && (
              <button
                onClick={() => setPhoto(null)}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                title="Remove photo"
              >
                <X className="w-5 h-5 text-cream" />
              </button>
            )}
          </div>

          {/* Upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => setPhoto(ev.target?.result as string);
              reader.readAsDataURL(file);
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-void-800 border border-lavender/10 text-lavender/70 hover:text-cream text-sm transition-all"
          >
            <Camera className="w-4 h-4" />
            {photo ? 'Change Picture' : 'Upload Picture'}
          </button>

          <p className="text-xs text-lavender/40 text-center">
            {photo
              ? 'Your picture will appear in the directory.'
              : `Without a photo, your initials (${getInitials(name)}) will be your avatar.`}
          </p>
        </div>

        <Field label="Name *" value={name} onChange={setName} placeholder="Your name as you wish it to appear" />
        <Field label="Pronouns" value={pronouns} onChange={setPronouns} placeholder="e.g. they/them, she/her" />
        <Field label="Title / Role" value={title} onChange={setTitle} placeholder="e.g. Astrologer, Web Developer" />
        <Field label="Location" value={location} onChange={setLocation} placeholder="City, Region, or Earth" />
      </div>
    </motion.div>,

    /* Step 2: Portfolio & Presence */
    <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h2 className="font-serif text-2xl text-cream mb-6 text-center">Step 2 — Your Presence</h2>

      <div className="space-y-6 max-w-lg mx-auto">
        {/* 1. Life Path Number */}
        <div>
          <label className="block text-sm text-lavender/70 mb-1">Life Path Number <span className="text-lavender/40">(optional)</span></label>
          <input
            type="text"
            value={numerology[0] || ''}
            onChange={(e) => setNumerology(e.target.value.trim() ? [e.target.value.trim()] : [])}
            placeholder="e.g. 7, 11, 22..."
            className="w-full px-4 py-2.5 rounded-xl bg-void-800/60 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
          />
          <p className="text-xs text-lavender/40 mt-1">Your numerological life path, if you resonate with sharing it.</p>
        </div>

        {/* 2. Sun & Moon Placements */}
        <div className="grid grid-cols-2 gap-3">
          <Select label="Sun Placement" value={sun} onChange={setSun} options={ASTROLOGY_SIGNS} />
          <Select label="Moon Placement" value={moon} onChange={setMoon} options={ASTROLOGY_SIGNS} />
        </div>

        {/* 3. Bio */}
        <div>
          <label className="block text-sm text-lavender/70 mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A brief statement about who you are as a being."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-void-800/60 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none resize-none"
          />
          <p className="text-xs text-lavender/40 mt-1">This appears on your directory profile.</p>
        </div>

        {/* 4. Connect & Contact — Icon Grid */}
        <div>
          <label className="block text-sm text-lavender/70 mb-3">Connect & Contact <span className="text-lavender/40">(optional — toggle 👁 to show on profile)</span></label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {CONTACT_FIELDS.map((cf) => {
              const Icon = CONTACT_ICON_MAP[cf.icon];
              const hasValue = !!contactMethods[cf.key]?.trim();
              const isVisible = contactVisibility[cf.key];
              return (
                <div
                  key={cf.key}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                    hasValue
                      ? isVisible
                        ? 'border-gold-400/20 bg-gold-400/5'
                        : 'border-lavender/10 bg-void-800/40'
                      : 'border-lavender/5 bg-void-800/30'
                  }`}
                >
                  <div className={`flex-shrink-0 ${hasValue ? 'text-cream/80' : 'text-lavender/20'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={contactMethods[cf.key]}
                    onChange={(e) => updateContact(cf.key as keyof ContactMethods, e.target.value)}
                    placeholder={cf.placeholder}
                    className="flex-1 min-w-0 bg-transparent text-cream text-sm placeholder:text-lavender/25 focus:outline-none"
                  />
                  <button
                    onClick={() => toggleContactVisibility(cf.key as keyof ContactVisibility)}
                    className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${
                      isVisible
                        ? 'text-gold-400 bg-gold-400/10'
                        : 'text-lavender/20 hover:text-lavender/50'
                    }`}
                    title={isVisible ? 'Visible on profile' : 'Hidden'}
                  >
                    {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Portfolio Link */}
        <Field label="Portfolio Link" value={portfolioLink} onChange={setPortfolioLink} placeholder="Website, Instagram, SoundCloud, or portfolio URL" />

        {/* 6. Portfolio Upload (Phase 2C placeholder) */}
        <div className="border border-dashed border-lavender/10 rounded-xl p-6 text-center">
          <Upload className="w-6 h-6 text-lavender/40 mx-auto mb-2" />
          <p className="text-sm text-lavender/60 mb-1">Portfolio uploads coming in Phase 2C</p>
          <p className="text-xs text-lavender/30">You will be able to add photos and videos to showcase your work.</p>
        </div>

        {/* 7. Accessibility */}
        <div>
          <label className="block text-sm text-lavender/70 mb-2">Accessibility <span className="text-lavender/40">(optional, select all that apply)</span></label>
          <div className="flex flex-wrap gap-2">
            {ACCESSIBILITY_PRESETS.map((a) => (
              <button
                key={a}
                onClick={() => toggleAccessibility(a)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                  accessibility.includes(a)
                    ? 'border-turquoise-400/40 bg-turquoise-400/10 text-turquoise-300'
                    : 'border-white/10 text-lavender/60 hover:border-white/20'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* 8. Consent & Boundaries */}
        <div>
          <label className="block text-sm text-lavender/70 mb-1">Consent & Boundaries <span className="text-lavender/40">(optional)</span></label>
          <textarea
            value={consent}
            onChange={(e) => setConsent(e.target.value)}
            placeholder="Describe your consent practices, boundaries, or anything participants should know before engaging with you."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-void-800/60 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none resize-none"
          />
        </div>
      </div>
    </motion.div>,

    /* Step 3: Oath & Submit */
    <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h2 className="font-serif text-2xl text-cream mb-6 text-center">Step 3 — Oath & Signature</h2>

      <div className="space-y-6 max-w-md mx-auto">
        {/* C.E.S. Display */}
        <div className="rounded-xl border border-gold-400/20 bg-gold-400/5 p-4 text-center">
          <p className="text-xs text-lavender/60 mb-1">Your Core Energetic Signature</p>
          <div className="font-serif text-3xl text-gold-300 tracking-widest">
            {generatedCES || '··· ··· ···'}
          </div>
          {generatedCES && (
            <button
              onClick={() => {
                const used = new Set(getProfiles().map((p) => p.cesNumber || '').filter(Boolean));
                if (generatedCES) used.add(generatedCES);
                setGeneratedCES(generateCESNumberValue(used));
              }}
              className="text-xs text-gold-400/60 hover:text-gold-400 mt-2 underline"
            >
              Regenerate C.E.S.
            </button>
          )}
          {!generatedCES && (
            <button
              onClick={() => {
                const used = new Set(getProfiles().map((p) => p.cesNumber || '').filter(Boolean));
                setGeneratedCES(generateCESNumberValue(used));
              }}
              className="mt-2 px-4 py-2 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 text-sm hover:bg-gold-400/20 transition-all"
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              Generate C.E.S.
            </button>
          )}
        </div>

        {/* Passphrase */}
        <div>
          <label className="block text-sm text-lavender/70 mb-1">Passphrase *</label>
          <div className="flex gap-2">
            <input
              type={showPassphrase ? 'text' : 'password'}
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Minimum 6 characters"
              className="flex-1 px-4 py-2.5 rounded-xl bg-void-800/60 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
            />
            <button
              onClick={() => setShowPassphrase(!showPassphrase)}
              className="px-3 py-2 rounded-xl border border-lavender/10 text-lavender/50 hover:text-cream"
            >
              {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-lavender/40 mt-1">This is your sovereign key. You will need it to sign in and edit your profile.</p>
        </div>

        {/* Wish Availability Toggle */}
        <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-4">
          <label className="block text-sm text-lavender/70 mb-3">Wish Availability</label>
          <div className="flex gap-2">
            <button
              onClick={() => setWishAvailability('accepting')}
              className={`flex-1 py-2.5 rounded-xl text-sm border transition-all ${
                wishAvailability === 'accepting'
                  ? 'border-green-400/30 bg-green-400/10 text-green-300'
                  : 'border-lavender/10 text-lavender/50 hover:border-lavender/20'
              }`}
            >
              🌱 Currently Accepting Wishes
            </button>
            <button
              onClick={() => setWishAvailability('closed')}
              className={`flex-1 py-2.5 rounded-xl text-sm border transition-all ${
                wishAvailability === 'closed'
                  ? 'border-orange-400/30 bg-orange-400/10 text-orange-300'
                  : 'border-lavender/10 text-lavender/50 hover:border-lavender/20'
              }`}
            >
              🍂 Not Currently Accepting
            </button>
          </div>
          <p className="text-xs text-lavender/40 mt-2">
            This controls whether other beings can cast wishes to you through the Exchange.
          </p>
        </div>

        {/* Agreement Checkboxes */}
        <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-4 space-y-4">
          {/* Checkbox 1 — Codes of ALL */}
          <label className="flex items-start gap-3 cursor-pointer">
            <div
              onClick={() => setAgreeCodes(!agreeCodes)}
              className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                agreeCodes
                  ? 'border-gold-400 bg-gold-400/20'
                  : 'border-lavender/30 hover:border-lavender/50'
              }`}
            >
              {agreeCodes && <Check className="w-3.5 h-3.5 text-gold-400" />}
            </div>
            <div className="text-sm text-cream/80 leading-relaxed">
              I have read the{' '}
              <Link to="/codes" target="_blank" className="text-gold-400/80 hover:text-gold-400 underline">
                Codes of ALL
              </Link>
              {' '}and agree to uphold consent, sovereignty, kindness, and the Codes in all exchanges.
            </div>
          </label>

          {/* Checkbox 2 — Privacy + Charter */}
          <label className="flex items-start gap-3 cursor-pointer">
            <div
              onClick={() => setAgreeCharter(!agreeCharter)}
              className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                agreeCharter
                  ? 'border-gold-400 bg-gold-400/20'
                  : 'border-lavender/30 hover:border-lavender/50'
              }`}
            >
              {agreeCharter && <Check className="w-3.5 h-3.5 text-gold-400" />}
            </div>
            <div className="text-sm text-cream/80 leading-relaxed">
              I have read the{' '}
              <Link to="/privacy" target="_blank" className="text-gold-400/80 hover:text-gold-400 underline">
                Privacy Assurance
              </Link>
              {' '}and{' '}
              <Link to="/charter" target="_blank" className="text-gold-400/80 hover:text-gold-400 underline">
                Charter
              </Link>
              , and offer my Core Energetic Signature in full resonance with the Heartlight Exchange.
            </div>
          </label>
        </div>
      </div>
    </motion.div>,
  ];

  // ── Render ──
  if (submitted) {
    return (
      <div className="px-4 py-16 max-w-md mx-auto text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
          <Sparkles className="w-12 h-12 text-gold-400 mx-auto mb-4" />
          <h2 className="font-serif text-3xl text-cream mb-3">Profile Submitted</h2>
          <p className="text-lavender/70 mb-2">Your C.E.S. is <span className="text-gold-300 font-serif">{generatedCES}</span></p>
          <p className="text-lavender/50 text-sm mb-6">
            Your profile is now in the pending queue. A Steward will review it for alignment with the 12 Codes of ALL.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all"
          >
            Return to Collective
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-12 max-w-3xl mx-auto">
      <div className="mb-4">
        <Link to="/" className="inline-flex items-center gap-2 text-lavender/60 hover:text-gold-400 transition-colors text-sm">
          <ChevronLeft className="w-4 h-4" /> Back to Collective
        </Link>
      </div>

      <StepDots step={step} total={3} />

      <AnimatePresence mode="wait">
        {steps[step - 1]}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-8 max-w-lg mx-auto">
        <button
          onClick={() => {
            setStep((s) => Math.max(1, s - 1));
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          disabled={step === 1}
          className={`px-5 py-2.5 rounded-full border text-sm transition-all ${
            step === 1
              ? 'border-white/5 text-lavender/20 cursor-not-allowed'
              : 'border-lavender/20 text-lavender/70 hover:border-lavender/40 hover:text-cream'
          }`}
        >
          <ChevronLeft className="w-4 h-4 inline mr-1" /> Back
        </button>

        {step < 3 ? (
          <button
            onClick={() => {
              setStep((s) => Math.min(3, s + 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={!canProceed()}
            className={`px-5 py-2.5 rounded-full text-sm transition-all ${
              canProceed()
                ? 'bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20'
                : 'border-white/5 text-lavender/20 cursor-not-allowed'
            }`}
          >
            Next <ChevronRight className="w-4 h-4 inline ml-1" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceed()}
            className={`px-6 py-2.5 rounded-full text-sm transition-all ${
              canProceed()
                ? 'bg-gold-400/20 border border-gold-400/40 text-gold-300 hover:bg-gold-400/30'
                : 'border-white/5 text-lavender/20 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4 inline mr-1" /> Submit Profile
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Reusable inputs ─── */
function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-lavender/70 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl bg-void-800/60 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none transition-colors"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-sm text-lavender/70 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl bg-void-800/60 border border-lavender/10 text-cream focus:border-gold-400/40 focus:outline-none appearance-none cursor-pointer"
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

/* ─── Avatar helpers ─── */
function getInitials(name: string): string {
  if (!name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  const chars = parts.map((p) => p[0].toUpperCase());
  return chars.slice(0, 3).join('');
}
