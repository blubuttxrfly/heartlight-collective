import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, CheckCircle, FileSignature, ArrowRight, ArrowLeft, Plus, Trash2, Users, ScrollText, MessageSquare, CreditCard, AlertCircle, PenLine } from 'lucide-react'
import { useStorage } from '../../lib/storage'
import { useSession } from '../../lib/session'
import type { ExchangeAgreement, ExchangeRole, QuestItem, PaymentMethodType, ExchangeJourney } from '../../types/ces'
import { PAYMENT_METHOD_LABELS } from '../../lib/constants'

const EXCHANGE_ROLES: ExchangeRole[] = [
  'Vision Holder',
  'Guide',
  'Learner',
  'Builder',
  'Facilitator',
  'Recipient',
  'Steward',
  'Contributor',
  'Observer',
  'Co-Creator',
]

const PAYMENT_METHODS: PaymentMethodType[] = ['stripe', 'venmo', 'cashapp', 'zelle', 'collective']

interface ExchangeAgreementEditorProps {
  agreement: ExchangeAgreement
  onClose: () => void
  onSigned: () => void
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function emptySideQuest(): QuestItem {
  const now = new Date().toISOString()
  return {
    id: newId('side'),
    title: '',
    description: '',
    status: 'open',
    createdAt: now,
  }
}

export function ExchangeAgreementEditor({ agreement: initialAgreement, onClose, onSigned }: ExchangeAgreementEditorProps) {
  const storage = useStorage()
  const { user } = useSession()
  const { updateExchangeAgreement, findVendorById, findProfileByCES } = storage
  const [agreement, setAgreement] = useState<ExchangeAgreement>(initialAgreement)
  const [error, setError] = useState('')
  const [changeSummary, setChangeSummary] = useState('')

  const isRequester = useCallback((ces?: string) => ces === agreement.requesterCes, [agreement.requesterCes])
  const isProvider = useCallback((ces?: string) => ces === agreement.providerCes, [agreement.providerCes])
  const currentCes = user?.ces || ''

  const latestVersion = agreement.versions[agreement.versions.length - 1]
  const isProposed = agreement.status === 'proposed'
  const isAgreed = agreement.status === 'agreed'
  const bothConsented = agreement.requesterConsented && agreement.providerConsented

  const vendor = useMemo(() => (agreement.vendorId ? findVendorById(agreement.vendorId) : undefined), [agreement.vendorId, findVendorById])
  const enabledPaymentMethods = useMemo(
    () => vendor?.paymentMethods.filter((m) => m.enabled).map((m) => m.type) || PAYMENT_METHODS,
    [vendor?.paymentMethods]
  )

  const updateField = useCallback(
    <K extends keyof ExchangeAgreement>(key: K, value: ExchangeAgreement[K]) => {
      setAgreement((prev) => ({ ...prev, [key]: value, updatedAt: new Date().toISOString() }))
    },
    []
  )

  const updateMainQuest = useCallback((updates: Partial<QuestItem>) => {
    setAgreement((prev) => ({
      ...prev,
      mainQuest: { ...prev.mainQuest, ...updates },
      updatedAt: new Date().toISOString(),
    }))
  }, [])

  const addSideQuest = useCallback(() => {
    setAgreement((prev) => ({
      ...prev,
      sideQuests: [...prev.sideQuests, emptySideQuest()],
      updatedAt: new Date().toISOString(),
    }))
  }, [])

  const updateSideQuest = useCallback((id: string, updates: Partial<QuestItem>) => {
    setAgreement((prev) => ({
      ...prev,
      sideQuests: prev.sideQuests.map((q) => (q.id === id ? { ...q, ...updates } : q)),
      updatedAt: new Date().toISOString(),
    }))
  }, [])

  const removeSideQuest = useCallback((id: string) => {
    setAgreement((prev) => ({
      ...prev,
      sideQuests: prev.sideQuests.filter((q) => q.id !== id),
      updatedAt: new Date().toISOString(),
    }))
  }, [])

  function handlePropose() {
    if (!agreement.mainQuest.title.trim()) {
      setError('The main quest needs a title so both beings know what is being co-created.')
      return
    }

    const now = new Date().toISOString()
    const version = {
      version: 1,
      updatedAt: now,
      updatedByCes: agreement.requesterCes,
      updatedByName: agreement.requesterName,
      changeSummary: changeSummary.trim() || 'Initial proposal',
      approvedBy: [agreement.requesterCes],
    }

    const next: ExchangeAgreement = {
      ...agreement,
      status: 'proposed',
      requesterConsented: true,
      providerConsented: false,
      versions: [...agreement.versions, version],
      updatedAt: now,
    }

    setAgreement(next)
    updateExchangeAgreement(next)
  }

  function handleApproveConsent() {
    const now = new Date().toISOString()
    const nextVersion = latestVersion
      ? { ...latestVersion, approvedBy: Array.from(new Set([...latestVersion.approvedBy, agreement.providerCes])) }
      : undefined

    const providerConsented = true
    const requesterConsented = agreement.requesterConsented
    const status: ExchangeAgreement['status'] =
      requesterConsented && providerConsented ? 'agreed' : 'proposed'

    const next: ExchangeAgreement = {
      ...agreement,
      status,
      providerConsented,
      versions: nextVersion ? agreement.versions.map((v) => (v.version === nextVersion.version ? nextVersion : v)) : agreement.versions,
      updatedAt: now,
    }

    setAgreement(next)
    updateExchangeAgreement(next)
  }

  function handleRequestChanges() {
    // Mark provider has not consented and keep status proposed.
    const now = new Date().toISOString()
    const next: ExchangeAgreement = {
      ...agreement,
      status: 'proposed',
      providerConsented: false,
      updatedAt: now,
    }
    setAgreement(next)
    updateExchangeAgreement(next)
    alert('The provider has requested changes. The requester can refine the proposal.')
  }

  function persistJourneyLocally(journey: ExchangeJourney) {
    try {
      const key = 'hlc_exchange_journeys'
      const raw = localStorage.getItem(key) || '[]'
      const existing: ExchangeJourney[] = JSON.parse(raw)
      const next = [journey, ...existing]
      localStorage.setItem(key, JSON.stringify(next))
    } catch (err) {
      console.warn('Failed to persist exchange journey locally:', err)
    }
  }

  function handleSign() {
    const now = new Date().toISOString()
    const journey: ExchangeJourney = {
      id: `journey_${Date.now()}`,
      agreementId: agreement.id,
      title: agreement.mainQuest.title,
      description: agreement.mainQuest.description || '',
      wishingCes: agreement.requesterCes,
      wishingName: agreement.requesterName,
      coCreatorCes: agreement.providerCes,
      coCreatorName: agreement.providerName,
      status: 'active',
      currentPhase: 'before',
      selectedCodes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      logs: [],
      mainQuest: agreement.mainQuest,
      sideQuests: agreement.sideQuests,
      fulfillmentNotes: '',
      fulfillmentSignedAt: null,
      fulfillmentSignedBy: [],
      adaptationConsent: false,
      createdAt: now,
      updatedAt: now,
    }

    // Prefer storage hook if available; otherwise localStorage
    if ('addExchangeJourney' in storage && typeof (storage as any).addExchangeJourney === 'function') {
      ;(storage as any).addExchangeJourney(journey)
    } else {
      persistJourneyLocally(journey)
    }

    const next: ExchangeAgreement = { ...agreement, status: 'active', updatedAt: now }
    updateExchangeAgreement(next)
    onSigned()
  }

  const providerProfile = findProfileByCES(agreement.providerCes)
  const requesterProfile = findProfileByCES(agreement.requesterCes)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gold-400/20 bg-void-900/95 p-6 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-lavender/40 hover:text-cream transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gold-400/10 border border-gold-400/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-gold-400" />
            </div>
            <ArrowRight className="w-4 h-4 text-lavender/30" />
            <div className="w-10 h-10 rounded-full bg-blue-400/10 border border-blue-400/20 flex items-center justify-center">
              <FileSignature className="w-5 h-5 text-blue-300" />
            </div>
          </div>
          <h2 className="font-serif text-xl text-cream text-center mb-1">Co-Create the Agreement</h2>
          <p className="text-sm text-lavender/50 text-center">
            Refine roles, quests, and terms together before signing.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-magenta-400" />
              <span className="text-xs uppercase tracking-wider text-lavender/40">Requester</span>
            </div>
            <p className="text-sm text-cream">{agreement.requesterName}</p>
            <p className="text-xs text-lavender/40">C.E.S. {agreement.requesterCes}</p>
            {requesterProfile?.emoji && (
              <p className="text-xs text-lavender/50 mt-1">{requesterProfile.emoji} {requesterProfile.title}</p>
            )}
            <div className="mt-3">
              <label className="text-xs text-lavender/50 mb-1 block">Role in this exchange</label>
              <select
                value={agreement.requesterRole}
                onChange={(e) => updateField('requesterRole', e.target.value as ExchangeRole)}
                disabled={isProposed && !isRequester(currentCes)}
                className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream focus:border-gold-400/40 focus:outline-none appearance-none disabled:opacity-50"
              >
                {EXCHANGE_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-xs uppercase tracking-wider text-lavender/40">Provider</span>
            </div>
            <p className="text-sm text-cream">{agreement.providerName || vendor?.name}</p>
            <p className="text-xs text-lavender/40">C.E.S. {agreement.providerCes}</p>
            {providerProfile?.emoji && (
              <p className="text-xs text-lavender/50 mt-1">{providerProfile.emoji} {providerProfile.title}</p>
            )}
            <div className="mt-3">
              <label className="text-xs text-lavender/50 mb-1 block">Role in this exchange</label>
              <select
                value={agreement.providerRole}
                onChange={(e) => updateField('providerRole', e.target.value as ExchangeRole)}
                disabled={isProposed && !isProvider(currentCes)}
                className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream focus:border-gold-400/40 focus:outline-none appearance-none disabled:opacity-50"
              >
                {EXCHANGE_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gold-400/10 bg-gold-400/[0.03] p-4">
            <label className="flex items-center gap-2 text-sm text-gold-400 mb-2">
              <ScrollText className="w-4 h-4" /> Main Quest
            </label>
            <input
              value={agreement.mainQuest.title}
              onChange={(e) => updateMainQuest({ title: e.target.value })}
              placeholder="What is the central shared intention?"
              disabled={isProposed && !isRequester(currentCes)}
              className="w-full px-4 py-2.5 rounded-xl bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none mb-3 disabled:opacity-50"
            />
            <textarea
              value={agreement.mainQuest.description || ''}
              onChange={(e) => updateMainQuest({ description: e.target.value })}
              placeholder="Describe the co-creation in a few sentences..."
              rows={3}
              disabled={isProposed && !isRequester(currentCes)}
              className="w-full px-4 py-2.5 rounded-xl bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none resize-none disabled:opacity-50"
            />
          </div>

          <div className="rounded-xl border border-lavender/10 bg-void-800/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm text-lavender/70">
                <PenLine className="w-4 h-4 text-gold-400" /> Side Quests
              </label>
              {(!isProposed || isRequester(currentCes)) && (
                <button
                  onClick={addSideQuest}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              )}
            </div>
            <AnimatePresence initial={false}>
              {agreement.sideQuests.length === 0 && (
                <p className="text-xs text-lavender/40 italic">No side quests yet. Add supporting intentions if they serve the exchange.</p>
              )}
              {agreement.sideQuests.map((q, idx) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-lg border border-lavender/10 bg-void-900/40 p-3 mb-2"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-lavender/30 mt-2">{idx + 1}.</span>
                    <div className="flex-1 space-y-2">
                      <input
                        value={q.title}
                        onChange={(e) => updateSideQuest(q.id, { title: e.target.value })}
                        placeholder="Side quest title"
                        disabled={isProposed && !isRequester(currentCes)}
                        className="w-full px-3 py-2 rounded-lg bg-void-800/50 border border-lavender/10 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none disabled:opacity-50"
                      />
                      <textarea
                        value={q.description || ''}
                        onChange={(e) => updateSideQuest(q.id, { description: e.target.value })}
                        placeholder="Optional details"
                        rows={2}
                        disabled={isProposed && !isRequester(currentCes)}
                        className="w-full px-3 py-2 rounded-lg bg-void-800/50 border border-lavender/10 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none resize-none disabled:opacity-50"
                      />
                    </div>
                    {(!isProposed || isRequester(currentCes)) && (
                      <button
                        onClick={() => removeSideQuest(q.id)}
                        className="p-1.5 rounded-md text-lavender/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-4">
              <label className="flex items-center gap-2 text-sm text-lavender/70 mb-2">
                <CreditCard className="w-4 h-4 text-gold-400" /> Exchange Value
              </label>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lavender/30">$</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={agreement.proposedPriceCents != null ? (agreement.proposedPriceCents / 100).toFixed(2) : ''}
                  onChange={(e) => {
                    const dollars = parseFloat(e.target.value)
                    updateField('proposedPriceCents', !isNaN(dollars) ? Math.round(dollars * 100) : undefined)
                  }}
                  placeholder="0.00"
                  disabled={isProposed && !isRequester(currentCes)}
                  className="flex-1 px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none disabled:opacity-50"
                />
              </div>
              <select
                value={agreement.paymentMethod || ''}
                onChange={(e) => updateField('paymentMethod', (e.target.value as PaymentMethodType) || undefined)}
                disabled={isProposed && !isRequester(currentCes)}
                className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream focus:border-gold-400/40 focus:outline-none appearance-none disabled:opacity-50"
              >
                <option value="">Select payment method</option>
                {enabledPaymentMethods.map((m) => (
                  <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m]?.label || m}</option>
                ))}
              </select>
              {agreement.collectiveFundingRequested && (
                <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Collective funding requested
                </p>
              )}
            </div>

            <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-4">
              <label className="flex items-center gap-2 text-sm text-lavender/70 mb-2">
                <MessageSquare className="w-4 h-4 text-gold-400" /> Communication Preferences
              </label>
              <textarea
                value={agreement.communicationPrefs || ''}
                onChange={(e) => updateField('communicationPrefs', e.target.value)}
                placeholder="e.g., Weekly check-ins via Signal, async updates through the Collective..."
                rows={4}
                disabled={isProposed && !isRequester(currentCes)}
                className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none resize-none disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-lavender/10">
          {!isProposed ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-lavender/10 bg-void-800/30 p-3">
                <label className="text-xs text-lavender/50 mb-1 block">Change Summary (optional)</label>
                <input
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  placeholder="Briefly describe what changed in this proposal"
                  className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePropose}
                className="w-full py-3.5 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all inline-flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" /> Propose Agreement
              </motion.button>
              <p className="text-xs text-lavender/40 text-center">
                Proposing records version 1 and signals your initial consent as requester.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-4 mb-4">
                <ConsentBadge
                  label="Requester"
                  consented={agreement.requesterConsented}
                  name={agreement.requesterName}
                />
                <ConsentBadge
                  label="Provider"
                  consented={agreement.providerConsented}
                  name={agreement.providerName}
                />
              </div>

              {isProvider(currentCes) && !agreement.providerConsented && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleApproveConsent}
                    className="w-full py-3.5 rounded-xl bg-green-400/10 border border-green-400/30 text-green-300 hover:bg-green-400/20 transition-all inline-flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve & Consent
                  </motion.button>
                  <button
                    onClick={handleRequestChanges}
                    className="w-full py-3 rounded-xl border border-lavender/10 text-lavender/60 hover:text-cream hover:border-lavender/20 transition-all"
                  >
                    Request Changes
                  </button>
                </>
              )}

              {isProvider(currentCes) && agreement.providerConsented && (
                <p className="text-center text-xs text-green-400 flex items-center justify-center gap-1">
                  <CheckCircle className="w-3 h-3" /> You have consented. Awaiting the requester to sign.
                </p>
              )}

              {bothConsented && isRequester(currentCes) && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSign}
                  className="w-full py-3.5 rounded-xl bg-magenta-400/10 border border-magenta-400/30 text-magenta-300 hover:bg-magenta-400/20 transition-all inline-flex items-center justify-center gap-2"
                >
                  <FileSignature className="w-4 h-4" /> Sign Agreement & Begin Journey
                </motion.button>
              )}

              {bothConsented && !isRequester(currentCes) && (
                <p className="text-center text-xs text-lavender/50">
                  Both beings have consented. The requester may now sign and begin the journey.
                </p>
              )}

              {!isProvider(currentCes) && !isRequester(currentCes) && (
                <p className="text-center text-xs text-lavender/50">
                  You are viewing this agreement as a witness.
                </p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function ConsentBadge({ label, consented, name }: { label: string; consented: boolean; name: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${
      consented ? 'bg-green-400/10 border-green-400/30 text-green-300' : 'bg-lavender/5 border-lavender/10 text-lavender/40'
    }`}>
      {consented ? <CheckCircle className="w-3 h-3" /> : <ArrowLeft className="w-3 h-3" />}
      <span>{label}: {name} {consented ? 'consented' : 'pending'}</span>
    </div>
  )
}
