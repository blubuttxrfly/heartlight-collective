import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { X, Heart, ArrowRight, Store, MessageSquare, ScrollText, CreditCard, UsersRound, AlertCircle, Clock, Calendar as CalendarIcon, CalendarDays, MapPin } from 'lucide-react'
import { useStorage } from '../../lib/storage'
import type { OfferingItem, VendorRecord, ExchangeAgreement, ExchangeRequest, ExchangeRole, PaymentMethodType, ScheduledMeeting, AvailabilityBlock, AgreementParty, QuestItem } from '../../types/ces'
import { PAYMENT_METHOD_LABELS } from '../../lib/constants'
import { googleCalendarEventUrl, downloadICS, formatMeetingTime } from '../../lib/calendar'

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

const SCHEDULING_KEYWORDS = ['healing', 'wellness', 'reading', 'session', 'consultation', 'mentorship', 'coaching', 'breathwork', 'astrology', 'guidance', 'facilitation', 'event', 'workshop']

function offeringSuggestsScheduling(offering: OfferingItem): boolean {
  const text = `${offering.title} ${offering.description} ${offering.category}`.toLowerCase()
  return SCHEDULING_KEYWORDS.some((kw) => text.includes(kw))
}

function toISODateTime(date: string, time: string): string {
  if (!date || !time) return ''
  const [hours, minutes] = time.split(':').map(Number)
  const d = new Date(`${date}T00:00:00`)
  d.setHours(hours, minutes, 0, 0)
  return d.toISOString()
}

function nextOccurrenceForBlock(block: AvailabilityBlock): string {
  if (block.date) return block.date
  if (block.dayOfWeek == null) return ''
  const today = new Date()
  const currentDay = today.getDay()
  const diff = (block.dayOfWeek - currentDay + 7) % 7 || 7
  const target = new Date(today)
  target.setDate(today.getDate() + diff)
  return target.toISOString().slice(0, 10)
}

export function ExchangeRequestModal({
  offering,
  vendor,
  requesterCes,
  requesterName,
  onClose,
  onAgreementCreated,
}: ExchangeRequestModalProps) {
  const { addExchangeAgreement, addExchangeRequest, findProfileByCES, getExchangeCalendar, addScheduledMeeting } = useStorage()
  const [message, setMessage] = useState('')
  const [proposedTerms, setProposedTerms] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType | ''>('')
  const [collectiveFundingRequested, setCollectiveFundingRequested] = useState(false)
  const [error, setError] = useState('')

  const wantsScheduling = useMemo(() => offeringSuggestsScheduling(offering), [offering])
  const providerCalendar = useMemo(() => getExchangeCalendar(vendor.ownerCes), [getExchangeCalendar, vendor.ownerCes])
  const providerAvailability = useMemo(
    () => providerCalendar?.availabilityBlocks.filter((b) => b.type === 'available') || [],
    [providerCalendar]
  )

  const [includeSchedule, setIncludeSchedule] = useState(wantsScheduling)
  const [selectedSlotId, setSelectedSlotId] = useState('')
  const [customDate, setCustomDate] = useState('')
  const [customStartTime, setCustomStartTime] = useState('')
  const [customEndTime, setCustomEndTime] = useState('')
  const [customTimeZone, setCustomTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [customLocation, setCustomLocation] = useState('')
  const [scheduleNotes, setScheduleNotes] = useState('')

  const enabledMethods = useMemo(
    () => vendor.paymentMethods.filter((m) => m.enabled),
    [vendor.paymentMethods]
  )

  // Default preferred payment method if only one is enabled
  const effectivePaymentMethod: PaymentMethodType | undefined = paymentMethod || enabledMethods[0]?.type

  const providerName = vendor.ownerName || findProfileByCES(vendor.ownerCes)?.name || vendor.name

  const hasPriceDiscussion = offering.priceType === 'fixed' || offering.priceType === 'negotiable'

  function buildScheduledMeeting(): ScheduledMeeting | undefined {
    if (!includeSchedule) return undefined
    const slot = providerAvailability.find((b) => b.id === selectedSlotId)
    const timeZone = slot?.timeZone || customTimeZone

    let startAt: string
    let endAt: string
    let title = `Session for ${offering.title}`

    if (slot) {
      const date = nextOccurrenceForBlock(slot)
      startAt = toISODateTime(date, slot.startTime)
      endAt = toISODateTime(date, slot.endTime)
      if (slot.dayOfWeek != null) {
        title = `${offering.title} — ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][slot.dayOfWeek]}`
      }
    } else if (customDate && customStartTime && customEndTime) {
      startAt = toISODateTime(customDate, customStartTime)
      endAt = toISODateTime(customDate, customEndTime)
    } else {
      return undefined
    }

    return {
      id: newQuestId('meeting'),
      title,
      startAt,
      endAt,
      timeZone,
      location: customLocation.trim() || 'TBD',
      status: 'proposed',
      proposedByCes: requesterCes,
      proposedByName: requesterName,
      confirmedByCes: [requesterCes],
      notes: scheduleNotes.trim() || undefined,
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) {
      setError('Please share a resonance message so the provider can feel your intention.')
      return
    }

    if (includeSchedule) {
      if (selectedSlotId) {
        const slot = providerAvailability.find((b) => b.id === selectedSlotId)
        if (!slot) {
          setError('Please choose an available slot from the provider, or propose a custom time.')
          return
        }
      } else {
        if (!customDate || !customStartTime || !customEndTime) {
          setError('Please pick a date and time for the proposed session, or select an available slot.')
          return
        }
        if (new Date(toISODateTime(customDate, customEndTime)) <= new Date(toISODateTime(customDate, customStartTime))) {
          setError('The session end time must be after the start time.')
          return
        }
      }
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

    const mainQuestDirective: QuestItem = {
      ...mainQuest,
      id: newQuestId('directive'),
      title: `${offering.title} — shared directive`,
    }

    const parties: AgreementParty[] = [
      {
        ces: requesterCes,
        name: requesterName,
        role: 'Recipient',
        privacyAssurance: '',
        privacyAgreed: false,
        joinedAt: now,
      },
      {
        ces: vendor.ownerCes,
        name: providerName,
        role: 'Guide',
        privacyAssurance: '',
        privacyAgreed: false,
        joinedAt: now,
      },
    ]

    const meeting = buildScheduledMeeting()
    const scheduledMeetings: ScheduledMeeting[] = meeting ? [meeting] : []

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
      parties,
      mainQuest,
      mainQuestDirective,
      mainQuests: [mainQuest],
      sideQuests: [],
      scheduledMeetings,
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
    if (meeting) {
      addScheduledMeeting(vendor.ownerCes, meeting)
      addScheduledMeeting(requesterCes, { ...meeting, title: `${meeting.title} (with ${providerName})` })
    }

    // Persist the inbound request for the vendor inbox
    const exchangeRequest: ExchangeRequest = {
      id: `request_${Date.now()}`,
      offeringId: offering.id,
      vendorId: vendor.id,
      requesterCes,
      requesterName,
      providerCes: vendor.ownerCes,
      providerName,
      message: message.trim(),
      priceType: offering.priceType,
      paymentMethod: effectivePaymentMethod,
      status: 'pending',
      collectivePetitionId: undefined,
      consentAcknowledged: true,
      createdAt: now,
      updatedAt: now,
    }
    addExchangeRequest(exchangeRequest)

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

          {wantsScheduling && (
            <div className="rounded-xl border border-gold-400/10 bg-gold-400/[0.03] p-4 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSchedule}
                  onChange={(e) => setIncludeSchedule(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-lavender/20 bg-void-800 accent-gold-400"
                />
                <span className="text-sm text-lavender/70">
                  <span className="flex items-center gap-1.5 text-cream">
                    <CalendarIcon className="w-3.5 h-3.5 text-gold-400" /> Include a proposed session time
                  </span>
                  <span className="block text-xs text-lavender/40 mt-0.5">
                    This offering feels like it wants to be scheduled. Pick from the provider's availability or propose your own.
                  </span>
                </span>
              </label>

              {includeSchedule && (
                <>
                  {providerAvailability.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-wider text-lavender/40">
                        Provider availability 🌿
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {providerAvailability.map((block) => {
                          const isSelected = selectedSlotId === block.id
                          const date = nextOccurrenceForBlock(block)
                          const label = block.date
                            ? `${block.date}`
                            : block.dayOfWeek != null
                              ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][block.dayOfWeek]
                              : 'Any day'
                          return (
                            <button
                              key={block.id}
                              type="button"
                              onClick={() => {
                                setSelectedSlotId(isSelected ? '' : block.id)
                                setCustomDate(date)
                                setCustomStartTime(block.startTime)
                                setCustomEndTime(block.endTime)
                                setCustomTimeZone(block.timeZone)
                              }}
                              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                                isSelected
                                  ? 'bg-gold-400/10 border-gold-400/30 text-gold-300'
                                  : 'border-lavender/10 text-lavender/50 hover:border-lavender/30'
                              }`}
                            >
                              {label} {block.startTime}–{block.endTime} {block.timeZone}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] uppercase tracking-wider text-lavender/40">Or propose a custom time 📅</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => { setCustomDate(e.target.value); setSelectedSlotId('') }}
                      className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream focus:border-gold-400/40 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={customTimeZone}
                      onChange={(e) => setCustomTimeZone(e.target.value)}
                      placeholder="Time zone"
                      className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-lavender/40 mb-1 block">Start</label>
                      <input
                        type="time"
                        value={customStartTime}
                        onChange={(e) => { setCustomStartTime(e.target.value); setSelectedSlotId('') }}
                        className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream focus:border-gold-400/40 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-lavender/40 mb-1 block">End</label>
                      <input
                        type="time"
                        value={customEndTime}
                        onChange={(e) => { setCustomEndTime(e.target.value); setSelectedSlotId('') }}
                        className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream focus:border-gold-400/40 focus:outline-none"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    placeholder="Location or video link"
                    className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
                  />
                  <textarea
                    value={scheduleNotes}
                    onChange={(e) => setScheduleNotes(e.target.value)}
                    placeholder="Notes or preparation requests"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none resize-none"
                  />

                  {(() => {
                    const preview = buildScheduledMeeting()
                    if (!preview) return null
                    return (
                      <div className="rounded-lg border border-lavender/10 bg-void-900/40 p-3">
                        <p className="text-xs text-cream flex items-center gap-2">
                          <CalendarDays className="w-3.5 h-3.5 text-lavender/40" /> Proposed preview
                        </p>
                        <p className="text-xs text-lavender/60 mt-1">{formatMeetingTime(preview)}</p>
                        {preview.location && preview.location !== 'TBD' && (
                          <p className="text-xs text-lavender/60 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {preview.location}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <a
                            href={googleCalendarEventUrl(preview)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] px-2 py-1 rounded-full bg-blue-400/10 border border-blue-400/30 text-blue-300 hover:bg-blue-400/20 transition-all"
                          >
                            Google 📅
                          </a>
                          <button
                            type="button"
                            onClick={() => downloadICS(preview)}
                            className="text-[10px] px-2 py-1 rounded-full bg-lavender/10 border border-lavender/30 text-lavender/70 hover:bg-lavender/20 transition-all"
                          >
                            .ics 📥
                          </button>
                        </div>
                      </div>
                    )
                  })()}
                </>
              )}
            </div>
          )}

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
