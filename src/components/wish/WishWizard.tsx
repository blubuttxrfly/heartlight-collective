// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Wish Wizard (Resonant Matching Gateway)
//  Multi-step wish casting with resonant match alignment
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Sparkles, ChevronLeft } from 'lucide-react'
import { PiShootingStar } from 'react-icons/pi'
import { Link } from 'react-router-dom'
import { useSession } from '../../lib/session'
import { useStorage } from '../../lib/storage'
import { findResonantMatches, ALIGNMENT_MESSAGES } from '../../lib/matchingEngine'
import type { Wish, ExchangeForm, LocationData, MatchResult } from '../../types/ces'
import { useSearchParams } from 'react-router-dom'

/* ─── Wizard Steps ─── */
type WizardStep =
  | 'welcome'
  | 'agreement'
  | 'identity'
  | 'wishDetails'
  | 'avenues'
  | 'confirmAgreement'
  | 'aligning'
  | 'matches'
  | 'sendRequest'
  | 'complete'

const STEP_LABELS: Record<WizardStep, string> = {
  welcome: 'Welcome',
  agreement: 'Sacred Agreement',
  identity: 'Who Are You?',
  wishDetails: 'Your Wish',
  avenues: 'Exchange Avenues',
  confirmAgreement: 'Confirm Alignment',
  aligning: 'Aligning Resonance...',
  matches: 'Resonant Matches',
  sendRequest: 'Send Request',
  complete: 'Complete',
}

/* ─── Agreement Text ─── */
const SACRED_AGREEMENT_TEXT = `The Heartlight Collective gives and receives with sovereignty, interdependence, authentic joy, conscious awareness, balance, harmony, justice, peace, and upholding the sanctity of our Earth and ALL the Living.

Since the Heartlight Collective has a unanimous agreement to 99% of profits flowing back into the Heartlight Collective, we want to co-create a being-first wish & gift exchange.

We co-operate following the 12 Codes of ALL which guides the resonance of aligned exchanges.`

/* ─── Step Progress ─── */
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-500 ${
            i < currentStep ? 'bg-gold-400' : i === currentStep ? 'bg-gold-400/50' : 'bg-lavender/10'
          }`}
        />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Main Wizard Component
   ═══════════════════════════════════════════════════════════════ */

export default function WishWizard() {
  const { user } = useSession()
  const storage = useStorage()
  const [searchParams] = useSearchParams()
  const urlType = searchParams.get('type') === 'gift' ? 'offer' : 'wish'
  const [step, setStep] = useState<WizardStep>('welcome')
  const [stepIndex, setStepIndex] = useState(0)

  // ── Step 1: Agreement state ──
  const [flowBackAgreed, setFlowBackAgreed] = useState(false)
  const [codesAcknowledged, setCodesAcknowledged] = useState(false)

  // ── Step 2: Identity state ──
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [unregName, setUnregName] = useState('')
  const [unregEmail, setUnregEmail] = useState('')
  const [unregPhone, setUnregPhone] = useState('')
  const [unregContactMethod, setUnregContactMethod] = useState<'email' | 'phone' | 'signal' | 'telegram' | 'discord' | 'other'>('email')
  const [unregLocation, setUnregLocation] = useState<LocationData | null>(null)
  const [unregBio, setUnregBio] = useState('')

  // ── Step 3: Wish details ──
  const [wishType, setWishType] = useState<'wish' | 'offer'>('wish')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [skillsNeeded, setSkillsNeeded] = useState<string[]>([])
  const [resourcesNeeded, setResourcesNeeded] = useState<string[]>([])
  const [preferredDelivery, setPreferredDelivery] = useState<'in_person' | 'virtual' | 'shipping'>('in_person')
  const [completionTimeline, setCompletionTimeline] = useState<'urgent' | 'week' | 'month' | 'ongoing'>('week')
  const [wishLocation, setWishLocation] = useState<LocationData | null>(null)
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | 'time-sensitive'>('low')

  // ── Step 4: Exchange avenues ──
  const [selectedAvenues, setSelectedAvenues] = useState<ExchangeForm[]>(['gift'])

  // ── Step 6: Alignment ──
  const [alignmentMessage, setAlignmentMessage] = useState('')
  const [matches, setMatches] = useState<MatchResult[]>([])

  // ── Step 7: Selected match ──
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null)
  const [requestMessage, setRequestMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Navigation ──
  const stepSequence: WizardStep[] = ['welcome', 'agreement', 'identity', 'wishDetails', 'avenues', 'confirmAgreement', 'aligning', 'matches', 'sendRequest', 'complete']
  const currentStepIndex = stepSequence.indexOf(step)

  const goTo = useCallback((target: WizardStep) => {
    setStep(target)
    setStepIndex(stepSequence.indexOf(target))
  }, [stepSequence])

  const goNext = useCallback(() => {
    const idx = stepSequence.indexOf(step)
    if (idx < stepSequence.length - 1) goTo(stepSequence[idx + 1])
  }, [step, stepSequence, goTo])

  const goBack = useCallback(() => {
    const idx = stepSequence.indexOf(step)
    if (idx > 0) goTo(stepSequence[idx - 1])
  }, [step, stepSequence, goTo])

  /* ── Build Wish from State ── */
  const buildWish = useCallback((): Wish => {
    const now = new Date().toISOString()
    return {
      id: `wish_${Date.now()}`,
      wishingCes: user?.ces || undefined,
      wishingName: isAnonymous ? 'Anonymous Being' : (user?.name || unregName || 'A Heartlight Being'),
      title,
      description,
      category: category as any,
      urgency,
      status: 'open',
      selectedCodes: [],
      skillsNeeded,
      resourcesNeeded,
      exchangeForms: selectedAvenues,
      preferredDeliveryMethod: preferredDelivery,
      completionTimeline,
      locationData: wishLocation || unregLocation || undefined,
      isUnregistered: !user?.ces,
      createdAt: now,
      updatedAt: now,
    }
  }, [user, isAnonymous, unregName, title, description, category, urgency, skillsNeeded, resourcesNeeded, selectedAvenues, preferredDelivery, completionTimeline, wishLocation, unregLocation])

  /* ── Run Alignment ── */
  const runAlignment = useCallback(async () => {
    goTo('aligning')

    const wish = buildWish()

    // Show warm messages
    for (const msg of ALIGNMENT_MESSAGES) {
      setAlignmentMessage(msg)
      await new Promise((r) => setTimeout(r, 1200))
    }

    // Gather candidates
    const allProfiles = storage.getProfiles()
    const allVendors = storage.getVendors()

    // Score matches
    const scored = findResonantMatches(wish, {
      profiles: allProfiles,
      vendors: allVendors,
    }, { topN: 10, minScore: 10 })

    setMatches(scored)
    setAlignmentMessage('')
    goTo('matches')
  }, [buildWish, storage, goTo])

  /* ── Send Request ── */
  const sendRequest = useCallback(async () => {
    if (!selectedMatch) return
    setIsSubmitting(true)

    // Build exchange request
    const now = new Date().toISOString()
    const wish = buildWish()

    // Save wish
    const existing = JSON.parse(localStorage.getItem('hlw_wishes') || '[]')
    existing.push(wish)
    localStorage.setItem('hlw_wishes', JSON.stringify(existing))

    // Create exchange request for selected match
    if (selectedMatch.candidateType === 'vendor' && selectedMatch.vendor) {
      // Find best offering from vendor
      const bestOffering = selectedMatch.vendor.offerings[0]
      if (bestOffering) {
        const request = {
          id: `req_${Date.now()}`,
          offeringId: bestOffering.id,
          vendorId: selectedMatch.vendor.id,
          requesterCes: user?.ces || 'unregistered',
          requesterName: isAnonymous ? 'Anonymous Being' : (user?.name || unregName),
          requesterUnregId: !user?.ces ? `unreg_${Date.now()}` : undefined,
          isRequesterUnregistered: !user?.ces,
          requesterContactEmail: unregEmail || undefined,
          requesterContactPhone: unregPhone || undefined,
          requesterPreferredContact: unregContactMethod,
          providerCes: selectedMatch.vendor.ownerCes,
          providerName: selectedMatch.vendor.ownerName,
          message: requestMessage || `Request from wish: "${title}"`,
          priceType: bestOffering.priceType,
          status: 'pending' as const,
          consentAcknowledged: true,
          createdAt: now,
          updatedAt: now,
        }
        storage.addExchangeRequest(request)
      }
    } else if (selectedMatch.candidateType === 'registered' && selectedMatch.profile) {
      // Direct being-to-being request
      const agreement = {
        id: `ag_${Date.now()}`,
        wishId: wish.id,
        requesterCes: user?.ces || 'unregistered',
        requesterName: isAnonymous ? 'Anonymous Being' : (user?.name || unregName),
        requesterUnregId: !user?.ces ? `unreg_${Date.now()}` : undefined,
        isRequesterUnregistered: !user?.ces,
        requesterContactEmail: unregEmail || undefined,
        requesterContactPhone: unregPhone || undefined,
        requesterPreferredContact: unregContactMethod,
        providerCes: selectedMatch.profile.cesNumber,
        providerName: selectedMatch.profile.name,
        message: requestMessage || `Request from wish: "${title}"`,
        requesterRole: 'Vision Holder' as const,
        providerRole: 'Co-Creator' as const,
        mainQuest: {
          id: `mq_${Date.now()}`,
          title: title,
          description: description,
          status: 'open' as const,
          createdAt: now,
        },
        sideQuests: [],
        proposedPriceCents: 0,
        scheduledMeetings: [],
        status: 'proposed' as const,
        requesterConsented: true,
        providerConsented: false,
        collectiveFundingRequested: false,
        versions: [],
        createdAt: now,
        updatedAt: now,
      }
      storage.addExchangeAgreement(agreement)
    }

    setIsSubmitting(false)
    goTo('complete')
  }, [selectedMatch, buildWish, user, isAnonymous, unregName, unregEmail, unregPhone, unregContactMethod, title, description, storage, goTo])

  /* ═══════════════════════════════════════════════════════════════
     Render Steps
     ═══════════════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-void-950 text-cream">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {step !== 'welcome' && step !== 'complete' && (
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-lavender/60 hover:text-cream transition-colors text-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          <div className="flex-1" />
          {step !== 'welcome' && step !== 'aligning' && step !== 'complete' && (
            <span className="text-lavender/40 text-sm">
              {STEP_LABELS[step]}
            </span>
          )}
        </div>

        {/* Progress */}
        {step !== 'welcome' && step !== 'aligning' && step !== 'complete' && (
          <StepIndicator
            currentStep={currentStepIndex}
            totalSteps={stepSequence.length - 3}
          />
        )}

        <AnimatePresence mode="wait">
          {/* ═══════ STEP: Welcome ═══════ */}
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 rounded-full bg-gold-400/10 border border-gold-400/20 flex items-center justify-center mx-auto mb-8 animate-pulse">
                <PiShootingStar className="w-12 h-12 text-gold-400" />
              </div>
              <h1 className="font-serif text-4xl md:text-5xl text-cream mb-6">
                Cast a Wish into the Field
              </h1>
              <p className="text-lavender/60 text-lg max-w-lg mx-auto mb-4">
                Welcome to the Heartlight Collective's Resonant Exchange Field.
              </p>
              <p className="text-lavender/40 max-w-md mx-auto mb-10">
                Here, your wishes find their way to aligned beings and communities through the sacred geometry of resonance.
              </p>
              <button
                onClick={goNext}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gold-500 hover:bg-gold-400 text-void-950 font-semibold rounded-full transition-all hover:scale-105"
              >
                Begin <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* ═══════ STEP: Agreement (Position A) ═══════ */}
          {step === 'agreement' && (
            <motion.div
              key="agreement"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="font-serif text-2xl text-cream mb-6">The Sacred Agreement</h2>
              <div className="bg-void-900/50 border border-lavender/10 rounded-xl p-6 mb-8 whitespace-pre-wrap text-lavender/70 text-sm leading-relaxed">
                {SACRED_AGREEMENT_TEXT}
              </div>

              <div className="space-y-4 mb-8">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={flowBackAgreed}
                    onChange={(e) => setFlowBackAgreed(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-lavender/30 text-gold-500 focus:ring-gold-500/30 bg-void-900"
                  />
                  <span className="text-lavender/80 group-hover:text-cream transition-colors">
                    I understand and align with the Heartlight Collective's unanimous agreement to 99% of profits flowing back into the Heartlight Collective.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={codesAcknowledged}
                    onChange={(e) => setCodesAcknowledged(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-lavender/30 text-gold-500 focus:ring-gold-500/30 bg-void-900"
                  />
                  <span className="text-lavender/80 group-hover:text-cream transition-colors">
                    I acknowledge the 12 Codes of ALL and commit to upholding them in all exchanges.
                  </span>
                </label>
              </div>

              <button
                onClick={goNext}
                disabled={!flowBackAgreed || !codesAcknowledged}
                className="w-full py-4 bg-gold-500 hover:bg-gold-400 disabled:bg-lavender/20 disabled:text-lavender/40 disabled:cursor-not-allowed text-void-950 font-semibold rounded-full transition-all"
              >
                Continue into the Field
              </button>
            </motion.div>
          )}

          {/* ═══════ STEP: Identity ═══════ */}
          {step === 'identity' && (
            <motion.div
              key="identity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="font-serif text-2xl text-cream mb-2">Who Are You?</h2>
              <p className="text-lavender/50 mb-6">The field recognizes every being. Share what feels aligned.</p>

              {user?.ces ? (
                <div className="bg-void-900/50 border border-lavender/10 rounded-xl p-6 mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gold-400/20 flex items-center justify-center text-xl">
                      {user.emoji || '✨'}
                    </div>
                    <div>
                      <p className="text-cream font-medium">{user.name}</p>
                      <p className="text-lavender/50 text-sm">C.E.S. #{user.ces}</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-4 h-4 rounded border-lavender/30 text-gold-500 bg-void-900"
                    />
                    <span className="text-lavender/60 text-sm">Cast this wish anonymously</span>
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-lavender/60 text-sm mb-2">Your Name *</label>
                    <input
                      type="text"
                      value={unregName}
                      onChange={(e) => setUnregName(e.target.value)}
                      placeholder="What shall the field call you?"
                      className="w-full px-4 py-3 bg-void-900 border border-lavender/20 rounded-xl text-cream placeholder:text-lavender/30 focus:border-gold-400 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-lavender/60 text-sm mb-2">Email</label>
                      <input
                        type="email"
                        value={unregEmail}
                        onChange={(e) => setUnregEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 bg-void-900 border border-lavender/20 rounded-xl text-cream placeholder:text-lavender/30 focus:border-gold-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-lavender/60 text-sm mb-2">Phone</label>
                      <input
                        type="tel"
                        value={unregPhone}
                        onChange={(e) => setUnregPhone(e.target.value)}
                        placeholder="+1 ..."
                        className="w-full px-4 py-3 bg-void-900 border border-lavender/20 rounded-xl text-cream placeholder:text-lavender/30 focus:border-gold-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-lavender/60 text-sm mb-2">Preferred Contact Method</label>
                    <select
                      value={unregContactMethod}
                      onChange={(e) => setUnregContactMethod(e.target.value as any)}
                      className="w-full px-4 py-3 bg-void-900 border border-lavender/20 rounded-xl text-cream focus:border-gold-400 focus:outline-none"
                    >
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="signal">Signal</option>
                      <option value="telegram">Telegram</option>
                      <option value="discord">Discord</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-lavender/60 text-sm mb-2">Location (optional)</label>
                    <p className="text-lavender/30 text-xs mb-2">Helps align local resonant matches</p>
                    {/* LocationSelect component placeholder — will use existing component */}
                    <input
                      type="text"
                      value={unregLocation?.raw || ''}
                      onChange={(e) => setUnregLocation(e.target.value ? { raw: e.target.value, lat: 0, lon: 0, city: null, region: null, country: null, continent: null } : null)}
                      placeholder="City, Region, Country"
                      className="w-full px-4 py-3 bg-void-900 border border-lavender/20 rounded-xl text-cream placeholder:text-lavender/30 focus:border-gold-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-lavender/60 text-sm mb-2">What brings you here? (optional)</label>
                    <textarea
                      value={unregBio}
                      onChange={(e) => setUnregBio(e.target.value)}
                      placeholder="A brief resonance statement..."
                      rows={3}
                      className="w-full px-4 py-3 bg-void-900 border border-lavender/20 rounded-xl text-cream placeholder:text-lavender/30 focus:border-gold-400 focus:outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={goNext}
                disabled={!user?.ces && !unregName.trim()}
                className="w-full mt-6 py-4 bg-gold-500 hover:bg-gold-400 disabled:bg-lavender/20 disabled:text-lavender/40 disabled:cursor-not-allowed text-void-950 font-semibold rounded-full transition-all"
              >
                Continue
              </button>
            </motion.div>
          )}

          {/* ═══════ STEP: Wish Details ═══════ */}
          {step === 'wishDetails' && (
            <motion.div
              key="wishDetails"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="font-serif text-2xl text-cream mb-2">What Do You Wish For?</h2>
              <p className="text-lavender/50 mb-6">Speak your intention clearly. The field listens.</p>

              {/* Wish type toggle */}
              <div className="flex gap-2 mb-6">
                {(['wish', 'offer'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setWishType(t)}
                    className={`flex-1 py-3 rounded-full border transition-all ${
                      wishType === t
                        ? 'bg-gold-500/20 border-gold-400 text-gold-400'
                        : 'border-lavender/20 text-lavender/60 hover:border-lavender/40'
                    }`}
                  >
                    {t === 'wish' ? '✨ Cast a Wish' : '🎁 Share a Gift'}
                  </button>
                ))}
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-lavender/60 text-sm mb-2">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={wishType === 'wish' ? "What is your heart calling for?" : "What gift are you offering?"}
                    className="w-full px-4 py-3 bg-void-900 border border-lavender/20 rounded-xl text-cream placeholder:text-lavender/30 focus:border-gold-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-lavender/60 text-sm mb-2">Description *</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your wish in detail. What does fulfillment look like?"
                    rows={4}
                    className="w-full px-4 py-3 bg-void-900 border border-lavender/20 rounded-xl text-cream placeholder:text-lavender/30 focus:border-gold-400 focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-lavender/60 text-sm mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-void-900 border border-lavender/20 rounded-xl text-cream focus:border-gold-400 focus:outline-none"
                  >
                    <option value="">Select a category...</option>
                    {['Tech & Development', 'Creative & Design', 'Writing & Content', 'Healing & Wellness', 'Astrology & Guidance', 'Music & Sound', 'Events & Facilitation', 'Mutual Aid', 'Climate Action', 'Co-Creation Partnership', 'Resources', 'Funds', 'Space & Place', 'Other'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-lavender/60 text-sm mb-2">Aligned Skills</label>
                    <TagInput
                      tags={skillsNeeded}
                      onChange={setSkillsNeeded}
                      placeholder="Add skills..."
                      suggestions={[
                        'Web Development',
                        'Mobile Development',
                        'UI/UX Design',
                        'Graphic Design',
                        'Illustration',
                        'Writing / Editing',
                        'Music Production',
                        'Sound Healing',
                        'Astrology',
                        'Tarot / Oracle',
                        'Energy Healing',
                        'Herbalism',
                        'Permaculture',
                        'Event Facilitation',
                        'Community Organizing',
                        'Accounting / Finance',
                        'Legal',
                        'Translation',
                        'Video Production',
                        'Photography',
                        'Social Media',
                        'Project Management',
                        'Teaching / Mentoring',
                        'Counseling',
                        'Carpentry / Building',
                        'Sewing / Textile',
                        'Cooking / Nutrition',
                        'Childcare',
                        'Animal Care',
                        'Driving / Transport',
                        'Other',
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-lavender/60 text-sm mb-2">Aligned Resources</label>
                    <TagInput
                      tags={resourcesNeeded}
                      onChange={setResourcesNeeded}
                      placeholder="Add resources..."
                      suggestions={[
                        'Funds / Currency',
                        'Space / Venue',
                        'Tools / Equipment',
                        'Transport / Vehicle',
                        'Materials / Supplies',
                        'Food / Water',
                        'Shelter / Housing',
                        'Technology / Devices',
                        'Internet Access',
                        'Solar / Renewable Energy',
                        'Seeds / Plants',
                        'Books / Knowledge',
                        'Art Supplies',
                        'Musical Instruments',
                        'Clothing / Textiles',
                        'Furniture',
                        'Land / Garden Space',
                        'Network / Connections',
                        'Time / Labor',
                        'Emotional Support',
                        'Childcare',
                        'Elder Care',
                        'Other',
                      ]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-lavender/60 text-sm mb-2">Delivery Method</label>
                    <select
                      value={preferredDelivery}
                      onChange={(e) => setPreferredDelivery(e.target.value as any)}
                      className="w-full px-4 py-3 bg-void-900 border border-lavender/20 rounded-xl text-cream focus:border-gold-400 focus:outline-none"
                    >
                      <option value="in_person">In-Person</option>
                      <option value="virtual">Virtual</option>
                      <option value="shipping">Shipping</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-lavender/60 text-sm mb-2">Timeline</label>
                    <select
                      value={completionTimeline}
                      onChange={(e) => setCompletionTimeline(e.target.value as any)}
                      className="w-full px-4 py-3 bg-void-900 border border-lavender/20 rounded-xl text-cream focus:border-gold-400 focus:outline-none"
                    >
                      <option value="urgent">Urgent (ASAP)</option>
                      <option value="week">Within a Week</option>
                      <option value="month">Within a Month</option>
                      <option value="ongoing">Ongoing / Open-Ended</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-lavender/60 text-sm mb-2">Urgency</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'low', label: 'Gentle Pace', color: 'text-green-400' },
                      { value: 'medium', label: 'Steady Flow', color: 'text-blue-400' },
                      { value: 'high', label: 'Urgent', color: 'text-magenta-400' },
                      { value: 'time-sensitive', label: 'Time Sensitive', color: 'text-red-400' },
                    ].map((u) => (
                      <button
                        key={u.value}
                        onClick={() => setUrgency(u.value as any)}
                        className={`flex-1 py-2 rounded-full border text-sm transition-all ${
                          urgency === u.value
                            ? 'border-gold-400 bg-gold-400/10 text-cream'
                            : 'border-lavender/20 text-lavender/60 hover:border-lavender/40'
                        }`}
                      >
                        <span className={urgency === u.value ? u.color : ''}>{u.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={goNext}
                disabled={!title.trim() || !description.trim()}
                className="w-full mt-6 py-4 bg-gold-500 hover:bg-gold-400 disabled:bg-lavender/20 disabled:text-lavender/40 disabled:cursor-not-allowed text-void-950 font-semibold rounded-full transition-all"
              >
                Continue
              </button>
            </motion.div>
          )}

          {/* ═══════ STEP: Exchange Avenues ═══════ */}
          {step === 'avenues' && (
            <motion.div
              key="avenues"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="font-serif text-2xl text-cream mb-2">Exchange Avenues</h2>
              <p className="text-lavender/50 mb-6">Which forms of exchange resonate with your wish?</p>

              <div className="space-y-3">
                {[
                  { value: 'gift', label: 'Wish & Gift Mutual Aid', desc: 'Freely given as aligned exchange. No expectation of return.' },
                  { value: 'barter', label: 'Barter / Trade / Skill Swap', desc: 'One offering exchanged directly for another.' },
                  { value: 'fixed', label: 'Fixed Heartlight Price', desc: 'A clear, agreed price. 99% of currency profit dedicated to the Heartlight Collective.' },
                  { value: 'negotiable', label: 'Negotiable / Open Offer', desc: 'Terms discovered together between beings.' },
                  { value: 'collective_funded', label: 'Collective-Funded', desc: 'Community resources stewarded through the Heartlight Collective.' },
                  { value: 'peer_payment', label: 'Peer Payment Methods', desc: 'Direct mutual aid between beings. 99% currency profit dedicated to the Heartlight Collective.' },
                ].map((av) => (
                  <label
                    key={av.value}
                    className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedAvenues.includes(av.value as ExchangeForm)
                        ? 'border-gold-400 bg-gold-400/10'
                        : 'border-lavender/20 hover:border-lavender/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAvenues.includes(av.value as ExchangeForm)}
                      onChange={() => {
                        setSelectedAvenues((prev) =>
                          prev.includes(av.value as ExchangeForm)
                            ? prev.length > 1 ? prev.filter((v) => v !== av.value) : prev
                            : [...prev, av.value as ExchangeForm]
                        )
                      }}
                      className="mt-1 w-5 h-5 rounded border-lavender/30 text-gold-500 bg-void-900"
                    />
                    <div>
                      <p className="text-cream font-medium">{av.label}</p>
                      <p className="text-lavender/50 text-sm">{av.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              <button
                onClick={goNext}
                disabled={selectedAvenues.length === 0}
                className="w-full mt-6 py-4 bg-gold-500 hover:bg-gold-400 disabled:bg-lavender/20 disabled:text-lavender/40 disabled:cursor-not-allowed text-void-950 font-semibold rounded-full transition-all"
              >
                Continue
              </button>
            </motion.div>
          )}

          {/* ═══════ STEP: Confirm Agreement (Position B) ═══════ */}
          {step === 'confirmAgreement' && (
            <motion.div
              key="confirmAgreement"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="font-serif text-2xl text-cream mb-2">Confirm Alignment</h2>
              <p className="text-lavender/50 mb-6">Before the field aligns your matches, confirm your sacred agreements.</p>

              <div className="bg-void-900/50 border border-lavender/10 rounded-xl p-6 mb-8">
                <p className="text-lavender/70 text-sm whitespace-pre-wrap mb-4">{SACRED_AGREEMENT_TEXT}</p>
              </div>

              <div className="space-y-4 mb-8">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={flowBackAgreed}
                    onChange={(e) => setFlowBackAgreed(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-lavender/30 text-gold-500 focus:ring-gold-500/30 bg-void-900"
                  />
                  <span className="text-lavender/80 group-hover:text-cream transition-colors">
                    I align with the 99% flow-back agreement.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={codesAcknowledged}
                    onChange={(e) => setCodesAcknowledged(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-lavender/30 text-gold-500 focus:ring-gold-500/30 bg-void-900"
                  />
                  <span className="text-lavender/80 group-hover:text-cream transition-colors">
                    I acknowledge the 12 Codes of ALL.
                  </span>
                </label>
              </div>

              <button
                onClick={runAlignment}
                disabled={!flowBackAgreed || !codesAcknowledged}
                className="w-full py-4 bg-gold-500 hover:bg-gold-400 disabled:bg-lavender/20 disabled:text-lavender/40 disabled:cursor-not-allowed text-void-950 font-semibold rounded-full transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Align Resonant Matches
              </button>
            </motion.div>
          )}

          {/* ═══════ STEP: Aligning ═══════ */}
          {step === 'aligning' && (
            <motion.div
              key="aligning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 rounded-full bg-gold-400/10 border border-gold-400/20 flex items-center justify-center mx-auto mb-8 animate-spin">
                <Sparkles className="w-10 h-10 text-gold-400" />
              </div>
              <h2 className="font-serif text-2xl text-cream mb-4">The Field Is Listening...</h2>
              <AnimatePresence mode="wait">
                <motion.p
                  key={alignmentMessage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-lavender/60 text-lg"
                >
                  {alignmentMessage || 'Aligning resonance...'}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          )}

          {/* ═══════ STEP: Matches ═══════ */}
          {step === 'matches' && (
            <motion.div
              key="matches"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="font-serif text-2xl text-cream mb-2">Resonant Matches</h2>
              <p className="text-lavender/50 mb-6">The field has aligned these beings and communities with your wish.</p>

              {matches.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lavender/40">The field is still gathering resonant beings. Check back soon.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {matches.map((match) => (
                    <button
                      key={match.candidateId}
                      onClick={() => {
                        setSelectedMatch(match)
                        goTo('sendRequest')
                      }}
                      className="w-full text-left p-4 bg-void-900/50 border border-lavender/10 hover:border-gold-400/30 rounded-xl transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gold-400/10 flex items-center justify-center text-xl shrink-0">
                          {match.candidateType === 'vendor' ? '🏪' : match.profile?.emoji || '✨'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-cream font-medium truncate">
                              {match.candidateType === 'vendor'
                                ? match.vendor?.name
                                : match.profile?.name}
                            </p>
                            <span className="text-gold-400 text-sm font-medium">
                              {match.scorePercent}% Resonant
                            </span>
                          </div>
                          <p className="text-lavender/50 text-sm truncate">
                            {match.candidateType === 'vendor'
                              ? match.vendor?.description
                              : match.profile?.title || match.profile?.bio}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {match.reasons.slice(0, 3).map((r, i) => (
                              <span key={i} className="text-xs px-2 py-1 rounded-full bg-gold-400/10 text-gold-400/80">
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════ STEP: Send Request ═══════ */}
          {step === 'sendRequest' && selectedMatch && (
            <motion.div
              key="sendRequest"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="font-serif text-2xl text-cream mb-2">Send Exchange Request</h2>
              <p className="text-lavender/50 mb-6">
                To: {selectedMatch.candidateType === 'vendor' ? selectedMatch.vendor?.name : selectedMatch.profile?.name}
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-lavender/60 text-sm mb-2">Your Message</label>
                  <textarea
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder={`What resonates about this match? Share your intention...`}
                    rows={4}
                    className="w-full px-4 py-3 bg-void-900 border border-lavender/20 rounded-xl text-cream placeholder:text-lavender/30 focus:border-gold-400 focus:outline-none resize-none"
                  />
                </div>

                {/* Position C: Final 99% agreement */}
                <div className="bg-void-900/50 border border-gold-400/20 rounded-xl p-4">
                  <p className="text-gold-400/80 text-sm mb-3">
                    Final Confirmation: 99% Flow-Back Agreement
                  </p>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={flowBackAgreed}
                      onChange={(e) => setFlowBackAgreed(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-lavender/30 text-gold-500 bg-void-900"
                    />
                    <span className="text-lavender/60 text-sm">
                      I confirm my alignment with the Heartlight Collective's 99% flow-back agreement and the 12 Codes of ALL.
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedMatch(null)
                    goTo('matches')
                  }}
                  className="flex-1 py-4 border border-lavender/20 text-lavender/60 rounded-full hover:border-lavender/40 transition-all"
                >
                  Back to Matches
                </button>
                <button
                  onClick={sendRequest}
                  disabled={isSubmitting || !flowBackAgreed}
                  className="flex-1 py-4 bg-gold-500 hover:bg-gold-400 disabled:bg-lavender/20 disabled:text-lavender/40 disabled:cursor-not-allowed text-void-950 font-semibold rounded-full transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Sending...' : <><Sparkles className="w-5 h-5" /> Send Request</>}
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══════ STEP: Complete ═══════ */}
          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-400/20 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="font-serif text-3xl text-cream mb-4">
                Your Request Is in the Field
              </h2>
              <p className="text-lavender/60 mb-8 max-w-md mx-auto">
                The Heartlight Collective is weaving your wish into the resonant exchange field.
                You will be notified when the being or community responds.
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  to="/exchange"
                  className="px-6 py-3 bg-gold-500 hover:bg-gold-400 text-void-950 font-semibold rounded-full transition-all"
                >
                  Browse the Exchange
                </Link>
                <button
                  onClick={() => {
                    // Reset all state
                    setStep('welcome')
                    setStepIndex(0)
                    setTitle('')
                    setDescription('')
                    setCategory('')
                    setSkillsNeeded([])
                    setResourcesNeeded([])
                    setSelectedAvenues(['gift'])
                    setFlowBackAgreed(false)
                    setCodesAcknowledged(false)
                    setMatches([])
                    setSelectedMatch(null)
                    setRequestMessage('')
                  }}
                  className="px-6 py-3 rounded-full border border-lavender/20 text-lavender/60 hover:border-lavender/40 transition-all"
                >
                  Cast Another Wish
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TagInput — Reusable tag component with suggestions
   ═══════════════════════════════════════════════════════════════ */

function TagInput({
  tags,
  onChange,
  placeholder,
  suggestions = [],
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder: string
  suggestions?: string[]
}) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
    setInput('')
    setShowSuggestions(false)
  }

  const filteredSuggestions = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(input.toLowerCase()) &&
      !tags.includes(s)
  )

  return (
    <div className="relative">
      <div className="bg-void-900 border border-lavender/20 rounded-xl p-3">
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gold-400/10 text-gold-400 text-sm"
            >
              {tag}
              <button
                onClick={() => onChange(tags.filter((t) => t !== tag))}
                className="hover:text-cream transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setShowSuggestions(true)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTag(input)
              }
              if (e.key === 'Escape') {
                setShowSuggestions(false)
              }
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-cream placeholder:text-lavender/30 focus:outline-none text-sm"
          />
          <button
            onClick={() => addTag(input)}
            aria-label="Add tag"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gold-500/20 text-gold-400 hover:bg-gold-500/30 transition-all shrink-0"
          >
            +
          </button>
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-void-900 border border-lavender/20 rounded-xl shadow-lg">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => addTag(suggestion)}
              className="w-full text-left px-3 py-2 text-lavender/70 hover:bg-gold-400/10 hover:text-cream transition-colors text-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
