import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Sparkles, Eye, EyeOff, Upload, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStorage } from '../lib/storage';
import { generateCESNumberValue, cesEncrypt } from '../lib/ces';
import type { CreatorRecord, SeasonState, ContactMethods, ContactVisibility, PortfolioItem } from '../types/ces';
import {
  RAY_DATA,
  OFFERING_PRESETS,
  EXCHANGE_PATHWAYS,
  SEASONS,
  NUMEROLOGY_PRESETS,
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
  return { instagram: '', email: '', phone: '', discord: '', signal: '', whatsapp: '' };
}
function emptyContactVisibility(): ContactVisibility {
  return { instagram: false, email: false, phone: false, discord: false, signal: false, whatsapp: false };
}

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
  const [avatarMark, setAvatarMark] = useState('');

  const [selectedRays, setSelectedRays] = useState<string[]>([]);
  const [offerings, setOfferings] = useState<string[]>([]);
  const [customOffering, setCustomOffering] = useState('');
  const [exchanges, setExchanges] = useState<string[]>([]);
  const [heartlight, setHeartlight] = useState('');

  const [seasons, setSeasons] = useState<SeasonState>({ Winter: false, Spring: false, Summer: false, Fall: false });
  const [timeline, setTimeline] = useState('');
  const [numerology, setNumerology] = useState<string[]>([]);
  const [accessibility, setAccessibility] = useState<string[]>([]);
  const [portfolioItems, _setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [contactMethods, setContactMethods] = useState<ContactMethods>(emptyContact());
  const [contactVisibility, setContactVisibility] = useState<ContactVisibility>(emptyContactVisibility());

  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [oathSigned, setOathSigned] = useState(false);

  // ── Helpers ──
  const toggleRay = useCallback((key: string) => {
    setSelectedRays((prev) => {
      const idx = prev.indexOf(key);
      if (idx > -1) return prev.filter((_, i) => i !== idx);
      if (prev.length >= 3) return prev;
      return [...prev, key];
    });
  }, []);

  const toggleOffering = useCallback((o: string) => {
    setOfferings((prev) => (prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]));
  }, []);

  const addCustomOffering = useCallback(() => {
    const val = customOffering.trim();
    if (!val || offerings.includes(val)) return;
    setOfferings((prev) => [...prev, val]);
    setCustomOffering('');
  }, [customOffering, offerings]);

  const toggleExchange = useCallback((label: string) => {
    setExchanges((prev) => (prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]));
  }, []);

  const toggleSeason = useCallback((key: keyof SeasonState) => {
    setSeasons((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleNumerology = useCallback((n: string) => {
    setNumerology((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  }, []);

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
        return name.trim().length >= 2 && avatarMark.trim().length > 0;
      case 2:
        return selectedRays.length > 0 && offerings.length > 0 && exchanges.length > 0 && heartlight.trim().length >= 10;
      case 3:
        return Object.values(seasons).some(Boolean) && timeline.trim().length > 0;
      case 4:
        return passphrase.length >= 6 && oathSigned;
      default:
        return false;
    }
  }, [step, name, avatarMark, selectedRays, offerings, exchanges, heartlight, seasons, timeline, passphrase, oathSigned]);

  // ── Submit ──
  const handleSubmit = useCallback(() => {
    const used = new Set(getProfiles().map((p) => p.cesNumber || '').filter(Boolean));
    const ces = generatedCES || generateCESNumberValue(used);
    if (!generatedCES) setGeneratedCES(ces);

    const primaryRay = selectedRays[0] || '';
    const record: CreatorRecord = {
      id: `profile_${Date.now()}`,
      name: name.trim(),
      pronouns: pronouns.trim(),
      title: title.trim(),
      location: location.trim(),
      sunPlacement: sun,
      moonPlacement: moon,
      emoji: avatarMark.slice(0, 3),
      photo: null,
      ray: primaryRay,
      primaryRay: `${primaryRay} Ray`,
      primaryRayKey: primaryRay,
      rays: selectedRays,
      heartlight: heartlight.trim(),
      offerings,
      exchanges,
      seasons,
      timeline: timeline.trim(),
      numerology,
      accessibility,
      consent: '',
      portfolioLink: '',
      portfolioItems,
      contactMethods,
      contactVisibility,
      publicContactVisibility: false,
      contactMethod: '',
      season_current: '',
      cesNumber: ces,
      passphrase,
      wishAvailability: 'accepting',
      directoryWishStatus: 'accepting',
      stewardship: 'active',
      stewardshipNote: '',
    };

    addProfile(record, 'pending');
    setSubmitted(true);
  }, [name, pronouns, title, location, sun, moon, avatarMark, selectedRays, heartlight, offerings, exchanges, seasons, timeline, numerology, accessibility, portfolioItems, contactMethods, contactVisibility, passphrase, generatedCES, getProfiles, addProfile]);

  // ── Steps ──
  const steps = [
    /* Step 1: Personal */
    <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h2 className="font-serif text-2xl text-cream mb-6 text-center">Step 1 — Your Resonance</h2>

      <div className="space-y-4 max-w-md mx-auto">
        <Field label="Name *" value={name} onChange={setName} placeholder="Your name as you wish it to appear" />
        <Field label="Pronouns" value={pronouns} onChange={setPronouns} placeholder="e.g. they/them, she/her" />
        <Field label="Title / Role" value={title} onChange={setTitle} placeholder="e.g. Astrologer, Web Developer" />
        <Field label="Location" value={location} onChange={setLocation} placeholder="City, Region, or Earth" />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Sun Placement" value={sun} onChange={setSun} options={ASTROLOGY_SIGNS} />
          <Select label="Moon Placement" value={moon} onChange={setMoon} options={ASTROLOGY_SIGNS} />
        </div>

        <div>
          <label className="block text-sm text-lavender/70 mb-1">Avatar Mark *</label>
          <input
            type="text"
            value={avatarMark}
            onChange={(e) => setAvatarMark(e.target.value.slice(0, 3))}
            placeholder="Up to 3 letters, symbols, or emoji"
            className="w-full px-4 py-2.5 rounded-xl bg-void-800/60 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
          />
          <p className="text-xs text-lavender/40 mt-1">This appears when no photo is uploaded. {avatarMark ? `${avatarMark} will be your mark.` : ''}</p>
        </div>
      </div>
    </motion.div>,

    /* Step 2: Ray & Offerings */
    <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h2 className="font-serif text-2xl text-cream mb-6 text-center">Step 2 — Ray & Offerings</h2>

      <div className="space-y-6 max-w-lg mx-auto">
        {/* Ray Selector */}
        <div>
          <label className="block text-sm text-lavender/70 mb-2">Ray Frequencies * <span className="text-lavender/40">(select up to 3, first is primary)</span></label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {RAY_DATA.map((r) => {
              const idx = selectedRays.indexOf(r.key);
              const selected = idx > -1;
              const isPrimary = idx === 0;
              return (
                <button
                  key={r.key}
                  onClick={() => toggleRay(r.key)}
                  className={`relative rounded-xl border p-3 text-center transition-all ${
                    selected
                      ? 'border-gold-400/50 bg-gold-400/10'
                      : 'border-white/5 hover:border-white/15 bg-void-800/40'
                  }`}
                >
                  {selected && (
                    <span className={`absolute top-1 right-1 text-xs ${isPrimary ? 'text-gold-400' : 'text-lavender/60'}`}>
                      {isPrimary ? '★' : idx + 1}
                    </span>
                  )}
                  <div className="w-4 h-4 rounded-full mx-auto mb-1" style={{ backgroundColor: r.color }} />
                  <div className="text-xs text-cream/80">{r.key}</div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-lavender/40 mt-2">
            {selectedRays.length === 0 && 'Select up to 3 Ray frequencies'}
            {selectedRays.length > 0 && selectedRays.length < 3 && `${3 - selectedRays.length} more available`}
            {selectedRays.length === 3 && '✓ Three Rays selected — your full resonance field is set'}
          </p>
        </div>

        {/* Heartlight Statement */}
        <div>
          <label className="block text-sm text-lavender/70 mb-1">Heartlight Statement *</label>
          <textarea
            value={heartlight}
            onChange={(e) => setHeartlight(e.target.value)}
            placeholder="A single sentence that captures why you are here and what you bring to the Heartlight Exchange."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-void-800/60 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none resize-none"
          />
        </div>

        {/* Offerings */}
        <div>
          <label className="block text-sm text-lavender/70 mb-2">Offerings * <span className="text-lavender/40">(select all that apply)</span></label>
          <div className="flex flex-wrap gap-2">
            {OFFERING_PRESETS.map((o) => (
              <button
                key={o}
                onClick={() => toggleOffering(o)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                  offerings.includes(o)
                    ? 'border-magenta-500/40 bg-magenta-500/10 text-magenta-300'
                    : 'border-white/10 text-lavender/60 hover:border-white/20'
                }`}
              >
                {o}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={customOffering}
              onChange={(e) => setCustomOffering(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomOffering()}
              placeholder="Add custom offering..."
              className="flex-1 px-3 py-2 rounded-xl bg-void-800/60 border border-lavender/10 text-cream text-sm placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
            />
            <button onClick={addCustomOffering} className="px-4 py-2 rounded-xl bg-void-800 border border-lavender/10 text-lavender/70 hover:text-cream text-sm">Add</button>
          </div>
        </div>

        {/* Exchange Pathways */}
        <div>
          <label className="block text-sm text-lavender/70 mb-2">Exchange Pathways * <span className="text-lavender/40">(how you welcome reciprocity)</span></label>
          <div className="grid sm:grid-cols-2 gap-2">
            {EXCHANGE_PATHWAYS.map((ep) => (
              <button
                key={ep.label}
                onClick={() => toggleExchange(ep.label)}
                className={`text-left rounded-xl border p-3 transition-all ${
                  exchanges.includes(ep.label)
                    ? 'border-gold-400/40 bg-gold-400/10'
                    : 'border-white/5 hover:border-white/15 bg-void-800/40'
                }`}
              >
                <div className="text-sm text-cream mb-1">{ep.label}</div>
                <div className="text-xs text-lavender/50">{ep.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>,

    /* Step 3: Seasonal & Portfolio */
    <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h2 className="font-serif text-2xl text-cream mb-6 text-center">Step 3 — Seasonal & Portfolio</h2>

      <div className="space-y-6 max-w-lg mx-auto">
        {/* Seasons */}
        <div>
          <label className="block text-sm text-lavender/70 mb-2">Seasonal Availability * <span className="text-lavender/40">(when you are open to exchange)</span></label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SEASONS.map((s) => (
              <button
                key={s.key}
                onClick={() => toggleSeason(s.key)}
                className={`rounded-xl border p-3 text-center transition-all ${
                  seasons[s.key]
                    ? 'border-gold-400/40 bg-gold-400/10'
                    : 'border-white/5 hover:border-white/15 bg-void-800/40'
                }`}
              >
                <div className="text-lg mb-1">{s.emoji}</div>
                <div className="text-xs text-cream/80">{s.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <label className="block text-sm text-lavender/70 mb-1">Typical Timeline *</label>
          <input
            type="text"
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            placeholder="e.g. 2–3 days for readings, 1–2 weeks for custom art"
            className="w-full px-4 py-2.5 rounded-xl bg-void-800/60 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
          />
        </div>

        {/* Numerology */}
        <div>
          <label className="block text-sm text-lavender/70 mb-2">Numerology <span className="text-lavender/40">(optional)</span></label>
          <div className="flex flex-wrap gap-2">
            {NUMEROLOGY_PRESETS.map((n) => (
              <button
                key={n}
                onClick={() => toggleNumerology(n)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                  numerology.includes(n)
                    ? 'border-violet-400/40 bg-violet-400/10 text-violet-300'
                    : 'border-white/10 text-lavender/60 hover:border-white/20'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Accessibility */}
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

        {/* Portfolio (simplified — file upload can be Phase 2C) */}
        <div className="border border-dashed border-lavender/10 rounded-xl p-6 text-center">
          <Upload className="w-6 h-6 text-lavender/40 mx-auto mb-2" />
          <p className="text-sm text-lavender/60 mb-1">Portfolio uploads coming in Phase 2C</p>
          <p className="text-xs text-lavender/30">You will be able to add photos and videos to showcase your offerings.</p>
        </div>

        {/* Contact Methods */}
        <div>
          <label className="block text-sm text-lavender/70 mb-2">Contact Methods <span className="text-lavender/40">(optional, toggle visibility for each)</span></label>
          <div className="space-y-2">
            {CONTACT_FIELDS.map((cf) => (
              <div key={cf.key} className="flex items-center gap-2">
                <input
                  type="text"
                  value={contactMethods[cf.key]}
                  onChange={(e) => updateContact(cf.key, e.target.value)}
                  placeholder={cf.placeholder}
                  className="flex-1 px-3 py-2 rounded-xl bg-void-800/60 border border-lavender/10 text-cream text-sm placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
                />
                <button
                  onClick={() => toggleContactVisibility(cf.key)}
                  className={`p-2 rounded-xl border transition-all ${
                    contactVisibility[cf.key]
                      ? 'border-gold-400/30 text-gold-400'
                      : 'border-white/10 text-lavender/30'
                  }`}
                  title={contactVisibility[cf.key] ? 'Visible in directory' : 'Hidden'}
                >
                  {contactVisibility[cf.key] ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>,

    /* Step 4: Oath & Submit */
    <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h2 className="font-serif text-2xl text-cream mb-6 text-center">Step 4 — Oath & Signature</h2>

      <div className="space-y-6 max-w-md mx-auto">
        {/* C.E.S. Display */}
        <div className="rounded-xl border border-gold-400/20 bg-gold-400/5 p-4 text-center">
          <p className="text-xs text-lavender/60 mb-1">Your Core Energetic Signature</p>
          <div className="font-serif text-3xl text-gold-300 tracking-widest">
            {generatedCES || '··· ··· ···'}
          </div>
          {generatedCES && (
            <>
              <p className="text-xs text-lavender/40 mt-1">Hidden: {cesEncrypt(generatedCES)}</p>
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
            </>
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

        {/* Oath */}
        <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-4">
          <p className="text-sm text-lavender/70 leading-relaxed mb-4">
            I enter the Heartlight Exchange as a sovereign being. I carry the 12 Codes of ALL 
            in every offering, every wish, and every co-creation. I agree to exchange with care, 
            truth, and full consent. I honor the seasonal rhythms of my own capacity and the 
            capacity of others.
          </p>
          <label className="flex items-start gap-3 cursor-pointer">
            <div
              onClick={() => setOathSigned(!oathSigned)}
              className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                oathSigned
                  ? 'border-gold-400 bg-gold-400/20'
                  : 'border-lavender/30 hover:border-lavender/50'
              }`}
            >
              {oathSigned && <Check className="w-3.5 h-3.5 text-gold-400" />}
            </div>
            <span className="text-sm text-cream/80">I sign this oath with my full resonance ✦</span>
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

      <StepDots step={step} total={4} />

      <AnimatePresence mode="wait">
        {steps[step - 1]}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-8 max-w-lg mx-auto">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className={`px-5 py-2.5 rounded-full border text-sm transition-all ${
            step === 1
              ? 'border-white/5 text-lavender/20 cursor-not-allowed'
              : 'border-lavender/20 text-lavender/70 hover:border-lavender/40 hover:text-cream'
          }`}
        >
          <ChevronLeft className="w-4 h-4 inline mr-1" /> Back
        </button>

        {step < 4 ? (
          <button
            onClick={() => setStep((s) => Math.min(4, s + 1))}
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
