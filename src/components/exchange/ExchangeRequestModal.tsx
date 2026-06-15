import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { X, Heart, ArrowRight, Store, MessageSquare, ScrollText, CreditCard, UsersRound, AlertCircle } from 'lucide-react'
import { useStorage } from '../../lib/storage'
import type { OfferingItem, VendorRecord, ExchangeAgreement, ExchangeRole, PaymentMethodType } from '../../types/ces'
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

interface ExchangeRequestModalProps {
  offering: OfferingItem
  vendor: VendorRecord
  requesterCes: string
  requesterName: string
  onClose: () => void
  onAgreementCreated: (agreement: ExchangeAgreement) => void
}

function newQuestId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export function ExchangeRequestModal({
  offering,
  vendor,
  requesterCes,
  requesterName,
  onClose,
  onAgreementCreated,
}: ExchangeRequestModalProps) {
  const { addExchangeAgreement, findProfileByCES } = useStorage()
  const [message, setMessage] = useState('')
  const [proposedTerms, setProposedTerms] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType | ''>('')
  const [collectiveFundingRequested, setCollectiveFundingRequested] = useState(false)
  const [error, setError] = useState('')

  const enabledMethods = useMemo(
    () => vendor.paymentMethods.filter((m) => m.enabled),
    [vendor.paymentMethods]
  )

  // Default preferred payment method if only one is enabled
  const effectivePaymentMethod: PaymentMethodType | undefined = paymentMethod || enabledMethods[0]?.type

  const providerName = vendor.ownerName || findProfileByCES(vendor.ownerCes)?.name || vendor.name

  const hasPriceDiscussion = offering.priceType === 'fixed' || offering.priceType === 'negotiable'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) {
      setError('Please share a resonance message so the provider can feel your intention.')
      return
    }

    const now = new Date().toISOString()
    const agreementId = `agreement_${Date.now()}`

    const mainQuest = {
      id: newQuestId('main'),
      title: offering.title,
      description: offering.description,
      status: 'open' as const,
      verifications: [],
      createdAt: now,
    }

    const agreement: ExchangeAgreement = {
      id: agreementId,
      offeringId: offering.id,
      vendorId: vendor.id,
      requesterCes,
      requesterName,
      providerCes: vendor.ownerCes,
      providerName,
      message: message.trim(),
      requesterRole: 'Recipient',
      providerRole: 'Guide',
      mainQuest,
      sideQuests: [],
      proposedPriceCents: offering.priceCents,
      agreedPriceCents: undefined,
      paymentMethod: effectivePaymentMethod,
      communicationPrefs: '',
      status: 'draft',
      requesterConsented: false,
      providerConsented: false,
      collectiveFundingRequested,
      collectiveFundingApproved: undefined,
      versions: [],
      pendingUpdate: undefined,
      createdAt: now,
      updatedAt: now,
    }

    addExchangeAgreement(agreement)
    onAgreementCreated(agreement)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-gold-400/20 bg-void-900/95 p-6 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-lavender/40 hover:text-cream transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="w-12 h-12 rounded-full bg-gold-400/10 border border-gold-400/20 flex items-center justify-center mx-auto mb-3">
            <Heart className="w-6 h-6 text-gold-400" />
          </div>
          <h2 className="font-serif text-xl text-cream text-center mb-1">Request Aligned Exchange</h2>
          <p className="text-sm text-lavender/50 text-center">
            Let {vendor.name} feel your resonance with this offering.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-xl border border-blue-400/10 bg-blue-400/5 p-4">
            <div className="flex items-start gap-3">
              <Store className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-cream font-medium">{offering.title}</p>
                <p className="text-xs text-lavender/50 mt-0.5">{vendor.name}</p>
                {hasPriceDiscussion && (
                  <p className="text-xs text-gold-400 mt-1">
                    Aligned exchange value: {offering.priceCents != null ? `$${(offering.priceCents / 100).toFixed(2)}` : 'To be discussed'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-lavender/70 mb-1.5">
              <MessageSquare className="w-4 h-4 text-gold-400" /> Resonance Message
            </label>
            <textarea
              value={message}
              onChange={(e) => { setMessage(e.target.value); setError('') }}
              placeholder="What draws you to this offering? How do you feel called to co-create?"
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none resize-none"
            />
          </div>

          {hasPriceDiscussion && (
            <div>
              <label className="flex items-center gap-2 text-sm text-lavender/70 mb-1.5">
                <ScrollText className="w-4 h-4 text-gold-400" /> Proposed Terms (optional)
              </label>
              <textarea
                value={proposedTerms}
                onChange={(e) => setProposedTerms(e.target.value)}
                placeholder="Any shifts to the value, format, or timing you would like to name?"
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none resize-none"
              />
              <p className="text-xs text-lavender/40 mt-1">
                The final exchange value is co-created and only becomes real when both beings consent.
              </p>
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 text-sm text-lavender/70 mb-1.5">
              <CreditCard className="w-4 h-4 text-gold-400" /> Preferred Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType | '')}
              className="w-full px-4 py-2.5 rounded-xl bg-void-800/50 border border-lavender/10 text-cream focus:border-gold-400/40 focus:outline-none appearance-none"
            >
              <option value="">Select a method the provider accepts</option>
              {enabledMethods.map((m) => (
                <option key={m.type} value={m.type}>
                  {PAYMENT_METHOD_LABELS[m.type]?.label || m.type}
                </option>
              ))}
            </select>
            {enabledMethods.length === 0 && (
              <p className="text-xs text-lavender/40 mt-1">This provider has not enabled any payment methods yet.</p>
            )}
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={collectiveFundingRequested}
              onChange={(e) => setCollectiveFundingRequested(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-lavender/20 bg-void-800 accent-gold-400"
            />
            <span className="text-sm text-lavender/70">
              <span className="flex items-center gap-1.5 text-cream">
                <UsersRound className="w-3.5 h-3.5 text-green-400" /> Request Collective Funding
              </span>
              <span className="block text-xs text-lavender/40 mt-0.5">
                Ask the Collective to support this exchange so the value can flow through our shared treasury.
              </span>
            </span>
          </label>

          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all inline-flex items-center justify-center gap-2"
            >
              Open Resonance <ArrowRight className="w-4 h-4" />
            </motion.button>
            <p className="text-xs text-lavender/40 text-center mt-3">
              This creates a private draft agreement between you and the provider.
            </p>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
