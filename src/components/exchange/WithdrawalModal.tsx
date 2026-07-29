import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { X, AlertTriangle, Shield, Heart, Send, FileText, MessageSquare } from 'lucide-react'
import { useSession } from '../../lib/session'
import type { ExchangeAgreement, AgreementParty, AgreementPartyWithdrawal, SafetyReport } from '../../types/ces'

interface WithdrawalModalProps {
  agreement: ExchangeAgreement
  onClose: () => void
  onSubmit: (withdrawal: AgreementPartyWithdrawal, safetyReport?: SafetyReport) => void
}

const WITHDRAWAL_REASONS = [
  { value: '', label: 'Choose a reason...', triggerSafety: false },
  { value: 'energy_misalignment', label: 'My energy no longer aligns with this exchange', triggerSafety: false },
  { value: 'safety_boundary', label: 'I feel unsafe or a boundary has been crossed', triggerSafety: true },
  { value: 'capacity_change', label: 'My capacity or circumstances have changed', triggerSafety: false },
  { value: 'values_shift', label: 'The exchange no longer reflects my values', triggerSafety: false },
  { value: 'other_being_withdrew', label: 'Another being withdrew and I wish to close my part', triggerSafety: false },
  { value: 'other', label: 'Other', triggerSafety: false },
]

const CONTACT_GUIDE_OPTIONS: { value: SafetyReport['contactGuide']; label: string }[] = [
  { value: 'yes', label: 'Yes — a Guide & Guardian may contact me' },
  { value: 'reach_out_first', label: 'I will reach out first, but keep the door open' },
  { value: 'no', label: 'No contact at this time' },
]

const SACRED_PROMPT = `Within the Heartlight Collective, every exchange is held as sacred. By sharing this privacy assurance, I commit to honoring the confidentiality, sovereignty, and dignity of all beings in this co-creation. I agree not to share, screenshot, or distribute private details outside the circle of consent. I understand that my withdrawal is honored without shame, and that any safety concern may be shared with a Guide & Guardian if I choose.`

export function WithdrawalModal({ agreement, onClose, onSubmit }: WithdrawalModalProps) {
  const { user } = useSession()
  const currentCes = user?.ces || ''

  const parties = useMemo(() => {
    const migrated = agreement.parties || []
    if (migrated.length > 0) return migrated
    return [
      { ces: agreement.requesterCes, name: agreement.requesterName },
      { ces: agreement.providerCes, name: agreement.providerName },
    ]
  }, [agreement])

  const myParty = parties.find((p) => p.ces === currentCes)
  const otherParties = parties.filter((p) => p.ces !== currentCes)

  const [reason, setReason] = useState('')
  const [otherReason, setOtherReason] = useState('')
  const [notes, setNotes] = useState('')
  const [includeSafety, setIncludeSafety] = useState(false)
  const [feelsUnsafe, setFeelsUnsafe] = useState<'yes' | 'no' | ''>('')
  const [unsafeBeingCes, setUnsafeBeingCes] = useState('')
  const [unsafeBeingOutside, setUnsafeBeingOutside] = useState('')
  const [contactGuide, setContactGuide] = useState<SafetyReport['contactGuide']>('yes')
  const [safetyDetails, setSafetyDetails] = useState('')
  const [privacyAssurance, setPrivacyAssurance] = useState('')
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [error, setError] = useState('')

  const selectedReason = WITHDRAWAL_REASONS.find((r) => r.value === reason)
  const safetyFlowActive = selectedReason?.triggerSafety || includeSafety

  function handleSubmit() {
    if (!reason) {
      setError('Please select a reason so the circle can hold your withdrawal with care.')
      return
    }
    if (reason === 'other' && !otherReason.trim()) {
      setError('Please share a few words about your reason.')
      return
    }
    if (!privacyAgreed) {
      setError('Please agree to the Privacy Assurance before withdrawing.')
      return
    }

    let safetyReport: SafetyReport | undefined
    if (safetyFlowActive) {
      if (!feelsUnsafe) {
        setError('Please indicate whether you feel unsafe so we can honor your needs.')
        return
      }
      safetyReport = {
        feelsUnsafe: feelsUnsafe === 'yes',
        unsafeBeingCes: unsafeBeingCes || undefined,
        unsafeBeingName: unsafeBeingCes ? parties.find((p) => p.ces === unsafeBeingCes)?.name : undefined,
        unsafeBeingOutside: unsafeBeingOutside.trim() || undefined,
        contactGuide,
        details: safetyDetails.trim() || undefined,
        submittedAt: new Date().toISOString(),
      }
    }

    const withdrawal: AgreementPartyWithdrawal = {
      reason,
      otherReason: reason === 'other' ? otherReason.trim() : undefined,
      notes: notes.trim() || undefined,
      requestedAt: new Date().toISOString(),
      status: 'submitted',
    }

    onSubmit(withdrawal, safetyReport)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-gold-400/20 bg-void-900/95 p-6 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-lavender/40 hover:text-cream transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5 text-center">
          <div className="w-12 h-12 rounded-full bg-magenta-400/10 border border-magenta-400/20 flex items-center justify-center mx-auto mb-3">
            <Heart className="w-6 h-6 text-magenta-400" />
          </div>
          <h2 className="font-serif text-xl text-cream mb-1">Withdraw from Exchange</h2>
          <p className="text-sm text-lavender/50">
            Your sovereignty is honored. Withdrawal is a sacred choice, not a failure.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="space-y-5">
          <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-4">
            <label className="flex items-center gap-2 text-sm text-lavender/70 mb-2">
              <FileText className="w-4 h-4 text-gold-400" /> Reason for withdrawal
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream focus:border-gold-400/40 focus:outline-none appearance-none mb-3"
            >
              {WITHDRAWAL_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            {reason === 'other' && (
              <input
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                placeholder="Briefly name your reason"
                className="w-full px-3 py-2.5 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none mb-3"
              />
            )}

            <label className="flex items-center gap-2 text-sm text-lavender/70 mb-2">
              <MessageSquare className="w-4 h-4 text-gold-400" /> Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything else you would like the other being or steward to know..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none resize-none"
            />
          </div>

          {(selectedReason?.triggerSafety || includeSafety) && (
            <div className="rounded-xl border border-red-400/15 bg-red-400/5 p-4 space-y-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-red-300 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-cream font-medium">Private safety flow</p>
                  <p className="text-xs text-lavender/50">
                    These details are only shared with a Guide & Guardian if you choose contact. They are not sent to the other being.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-lavender/50 mb-2">Do you feel unsafe in this exchange?</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFeelsUnsafe('yes')}
                    className={`flex-1 py-2 rounded-lg text-xs border transition-all ${
                      feelsUnsafe === 'yes'
                        ? 'bg-red-400/20 border-red-400/40 text-red-300'
                        : 'border-lavender/10 text-lavender/50 hover:text-lavender/70'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeelsUnsafe('no')}
                    className={`flex-1 py-2 rounded-lg text-xs border transition-all ${
                      feelsUnsafe === 'no'
                        ? 'bg-green-400/20 border-green-400/40 text-green-300'
                        : 'border-lavender/10 text-lavender/50 hover:text-lavender/70'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {feelsUnsafe === 'yes' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-lavender/50 mb-1 block">If you feel unsafe because of a being in this exchange, select them</label>
                    <select
                      value={unsafeBeingCes}
                      onChange={(e) => setUnsafeBeingCes(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream focus:border-gold-400/40 focus:outline-none appearance-none"
                    >
                      <option value="">Prefer not to name / outside this exchange</option>
                      {otherParties.map((p) => (
                        <option key={p.ces} value={p.ces}>
                          {p.name} ({p.ces})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-lavender/50 mb-1 block">Or name someone outside the exchange</label>
                    <input
                      value={unsafeBeingOutside}
                      onChange={(e) => setUnsafeBeingOutside(e.target.value)}
                      placeholder="Name, role, or identifier"
                      className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-lavender/50 mb-2 block">Guide & Guardian contact preference</label>
                <div className="space-y-2">
                  {CONTACT_GUIDE_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="contactGuide"
                        value={opt.value}
                        checked={contactGuide === opt.value}
                        onChange={() => setContactGuide(opt.value)}
                        className="mt-1 accent-gold-400"
                      />
                      <span className="text-sm text-lavender/70">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-lavender/50 mb-1 block">Safety details (optional)</label>
                <textarea
                  value={safetyDetails}
                  onChange={(e) => setSafetyDetails(e.target.value)}
                  placeholder="Share only what feels right. This is steward-facing."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none resize-none"
                />
              </div>
            </div>
          )}

          {!selectedReason?.triggerSafety && (
            <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-lavender/10 bg-void-800/40 p-4">
              <input
                type="checkbox"
                checked={includeSafety}
                onChange={(e) => setIncludeSafety(e.target.checked)}
                className="mt-0.5 accent-gold-400"
              />
              <span className="text-sm text-lavender/70">
                I would also like to include a private safety or boundary note for a Guide & Guardian.
              </span>
            </label>
          )}

          <div className="rounded-xl border border-gold-400/10 bg-gold-400/[0.03] p-4 space-y-3">
            <label className="flex items-center gap-2 text-sm text-gold-400 mb-1">
              <Shield className="w-4 h-4" /> Privacy Assurance
            </label>
            <textarea
              value={privacyAssurance}
              onChange={(e) => setPrivacyAssurance(e.target.value)}
              placeholder={SACRED_PROMPT}
              rows={5}
              className="w-full px-3 py-2.5 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none resize-none"
            />
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyAgreed}
                onChange={(e) => setPrivacyAgreed(e.target.checked)}
                className="mt-0.5 accent-gold-400"
              />
              <span className="text-sm text-lavender/70">
                I agree to honor the privacy and sovereignty of all beings in this exchange, even as I withdraw.
              </span>
            </label>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            className="w-full py-3.5 rounded-xl bg-magenta-400/10 border border-magenta-400/30 text-magenta-300 hover:bg-magenta-400/20 transition-all inline-flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> Submit Withdrawal
          </motion.button>

          <p className="text-xs text-lavender/40 text-center">
            Withdrawing creates an alert. If you chose the safety flow, only a Guide & Guardian will see those details.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
