import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { X, Heart, ArrowRight, Store, MessageSquare, ScrollText, CreditCard, UsersRound, AlertCircle, Clock, Calendar as CalendarIcon, CalendarDays, MapPin, Video, Sparkles } from 'lucide-react'
import { useStorage } from '../../lib/storage'
import type { OfferingItem, VendorRecord, ExchangeAgreement, ExchangeRequest, ExchangeRole, PaymentMethodType, ScheduledMeeting, AvailabilityBlock, AgreementParty, QuestItem, ProposedMeetingSlot, HybridPaymentConfig } from '../../types/ces'
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

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const lastDate = new Date(year, month + 1, 0).getDate()
  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= lastDate; d++) days.push(d)
  return days
}

function isSameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10)
}

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
  const { addExchangeAgreement, addExchangeRequest, findProfileByCES, getExchangeCalendar, addScheduledMeeting, vendors } = useStorage()
  const [message, setMessage] = useState('')
  const [proposedTerms, setProposedTerms] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType | ''>('')
  const [collectiveFundingRequested, setCollectiveFundingRequested] = useState(false)
  const [error, setError] = useState('')

  const needsScheduling = offering.requiresScheduling || offering.offeringType === 'virtual_session' || offering.offeringType === 'work_study_exchange'
  const providerCalendar = useMemo(() => getExchangeCalendar(vendor.ownerCes), [getExchangeCalendar, vendor.ownerCes])
  const providerAvailability = useMemo(
    () => providerCalendar?.availabilityBlocks.filter((b) => b.type === 'available') || [],
    [providerCalendar]
  )

  const [includeSchedule, setIncludeSchedule] = useState(needsScheduling)
  const [selectedSlotId, setSelectedSlotId] = useState('')
  const [customDate, setCustomDate] = useState('')
  const [customStartTime, setCustomStartTime] = useState('')
  const [customEndTime, setCustomEndTime] = useState('')
  const [customTimeZone, setCustomTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [scheduleNotes, setScheduleNotes] = useState('')
  const [viewMonth, setViewMonth] = useState(new Date())

  // Hybrid payment state
  const [hybridEnabled, setHybridEnabled] = useState(false)
  const [monetaryAmount, setMonetaryAmount] = useState('')
  const [serviceOfferingId, setServiceOfferingId] = useState('')
  const [serviceFallback, setServiceFallback] = useState('')
  const requesterVendors = useMemo(() => vendors.filter((v) => v.ownerCes === requesterCes), [vendors, requesterCes])
  const requesterOfferings = useMemo(
    () => requesterVendors.flatMap((v) => v.offerings.map((o) => ({ ...o, vendorName: v.name, vendorId: v.id }))),
    [requesterVendors]
  )

  const enabledMethods = useMemo(
    () => vendor.paymentMethods.filter((m) => m.enabled),
    [vendor.paymentMethods]
  )

  // Default preferred payment method if only one is enabled
  const effectivePaymentMethod: PaymentMethodType | undefined = paymentMethod || enabledMethods[0]?.type

  const providerName = vendor.ownerName || findProfileByCES(vendor.ownerCes)?.name || vendor.name

  const hasPriceDiscussion = offering.priceType === 'fixed' || offering.priceType === 'negotiable'

  const selectedSlot: AvailabilityBlock | undefined = useMemo(
    () => providerAvailability.find((b) => b.id === selectedSlotId),
    [providerAvailability, selectedSlotId]
  )

  const selectedDate = useMemo(() => {
    if (selectedSlot) return nextOccurrenceForBlock(selectedSlot)
    return customDate
  }, [selectedSlot, customDate])

  const slotsForSelectedDate = useMemo(() => {
    const target = selectedDate
    if (!target) return []
    return providerAvailability.filter((b) => {
      if (b.date && isSameDay(b.date, target)) return true
      const blockDate = nextOccurrenceForBlock(b)
      return blockDate === target
    })
  }, [providerAvailability, selectedDate])

  function buildProposedSlot(): ProposedMeetingSlot | undefined {
    if (!includeSchedule) return undefined
    let startAt: string
    let endAt: string
    const timeZone = selectedSlot?.timeZone || customTimeZone

    if (selectedSlot) {
      const date = nextOccurrenceForBlock(selectedSlot)
      startAt = toISODateTime(date, selectedSlot.startTime)
      endAt = toISODateTime(date, selectedSlot.endTime)
    } else if (customDate && customStartTime && customEndTime) {
      startAt = toISODateTime(customDate, customStartTime)
      endAt = toISODateTime(customDate, customEndTime)
    } else {
      return undefined
    }

    if (!startAt || !endAt || new Date(endAt) <= new Date(startAt)) return undefined

    return {
      startAt,
      endAt,
      timeZone,
      platform: offering.virtualSession?.platform || 'other',
    }
  }

  function buildScheduledMeeting(): ScheduledMeeting | undefined {
    const slot = buildProposedSlot()
    if (!slot) return undefined

    const link = offering.virtualSession?.meetingLink || offering.virtualSession?.platformNote || `[${offering.virtualSession?.platform || 'platform'} link to be shared]`
    const location = offering.offeringType === 'virtual_session'
      ? link
      : offering.location?.label || offering.location?.address || 'TBD'

    return {
      id: newQuestId('meeting'),
      title: `${offering.title} — ${requesterName} × ${providerName}`,
      startAt: slot.startAt,
      endAt: slot.endAt,
      timeZone: slot.timeZone,
      location,
      status: 'proposed',
      proposedByCes: requesterCes,
      proposedByName: requesterName,
      confirmedByCes: [requesterCes],
      notes: scheduleNotes.trim() || undefined,
    }
  }

  function buildHybridPayment(): HybridPaymentConfig | undefined {
    if (!hybridEnabled) return undefined
    const dollars = parseFloat(monetaryAmount)
    const cents = !isNaN(dollars) && dollars > 0 ? Math.round(dollars * 100) : 0
    const selectedOffering = requesterOfferings.find((o) => o.id === serviceOfferingId)
    return {
      monetaryCents: cents,
      serviceExchangeOfferingId: selectedOffering?.id,
      serviceExchangeFallback: serviceFallback.trim() || undefined,
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) {
      setError('Please share a resonance message so the provider can feel your intention.')
      return
    }

    const hybridPayment = buildHybridPayment()
    const monetaryCents = hybridPayment?.monetaryCents || 0

    if (hybridEnabled) {
      if (monetaryCents <= 0 && !serviceOfferingId && !serviceFallback.trim()) {
        setError('Please include either a monetary amount or a service exchange contribution.')
        return
      }
    }

    if (includeSchedule) {
      const slot = buildProposedSlot()
      if (!slot) {
        setError('Please choose a date and time from the provider calendar, or propose a custom slot.')
        return
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
    const proposedSlot = buildProposedSlot()
    const scheduledMeetings: ScheduledMeeting[] = meeting ? [meeting] : []

    const dedicationOfProfits = monetaryCents > 0
      ? {
          enabled: true,
          percentage: 99,
          destinations: [
            'Earth Conscious Initiatives & Technology 🌍',
            'Preserving Ancient Wisdom of our Ancestors 📜',
            'Sovereign Interdependent Communities 🏠',
            'Healing & Art 💗',
            'ALL the Living ♾️',
          ],
          customNotes: '1% covers operational costs. This is our unanimous living agreement.',
        }
      : {
          enabled: true,
          percentage: 99,
          destinations: [
            'Earth Conscious Initiatives & Technology 🌍',
            'Preserving Ancient Wisdom of our Ancestors 📜',
            'Sovereign Interdependent Communities 🏠',
            'Healing & Art 💗',
            'ALL the Living ♾️',
          ],
          customNotes: 'No monetary component in this exchange. Dedication held for future monetary flows.',
        }

    const agreement: ExchangeAgreement = {
      id: agreementId,
      offeringId: offering.id,
      vendorId: vendor.id,
      requesterCes,
      requesterName,
      isRequesterUnregistered: false,
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
      hybridPayment,
      confirmedMeetingSlot: proposedSlot,
      communicationPrefs: '',
      dedicationOfProfits,
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
      hybridPayment,
      proposedMeetingSlot: proposedSlot,
      status: 'pending',
      collectivePetitionId: undefined,
      consentAcknowledged: true,
      createdAt: now,
      updatedAt: now,
    }
    addExchangeRequest(exchangeRequest)

    onAgreementCreated(agreement)
  }

  const previewMeeting = useMemo(() => buildScheduledMeeting(), [includeSchedule, selectedSlot, customDate, customStartTime, customEndTime, customTimeZone, scheduleNotes])

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
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gold-400/20 bg-void-900/95 p-6 shadow-2xl"
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
                {offering.offeringType === 'virtual_session' && offering.virtualSession && (
                  <p className="text-xs text-blue-300 mt-1 flex items-center gap-1">
                    <Video className="w-3 h-3" /> {offering.virtualSession.durationMinutes} min virtual session · {offering.virtualSession.platform.replace('_', ' ')}
                  </p>
                )}
                {offering.offeringType === 'work_study_exchange' && offering.workStudyExchange && (
                  <p className="text-xs text-green-300 mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {offering.workStudyExchange.durationWeeks} week work/study · {offering.workStudyExchange.hoursPerWeek} hrs/week
                  </p>
                )}
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

          {needsScheduling && (
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
                    This offering requires scheduling. Pick from the provider's availability or propose your own.
                  </span>
                </span>
              </label>

              {includeSchedule && (
                <>
                  {/* Month navigator */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                      className="text-xs text-lavender/60 hover:text-cream px-2 py-1 rounded-lg border border-lavender/10"
                    >
                      ← Prev
                    </button>
                    <span className="text-sm text-cream font-medium">
                      {viewMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                      className="text-xs text-lavender/60 hover:text-cream px-2 py-1 rounded-lg border border-lavender/10"
                    >
                      Next →
                    </button>
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-lavender/40 mb-1">
                    {DAYS.map((d) => <div key={d}>{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {getMonthDays(viewMonth.getFullYear(), viewMonth.getMonth()).map((day, idx) => {
                      if (!day) return <div key={idx} />
                      const dateStr = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                      const hasAvailability = providerAvailability.some((b) => {
                        if (b.date && isSameDay(b.date, dateStr)) return true
                        return nextOccurrenceForBlock(b) === dateStr
                      })
                      const isSelected = selectedDate === dateStr
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setCustomDate(dateStr)
                            setSelectedSlotId('')
                          }}
                          className={`aspect-square rounded-lg text-xs flex flex-col items-center justify-center transition-all ${
                            isSelected
                              ? 'ring-2 ring-gold-400 bg-gold-400/15 text-cream'
                              : hasAvailability
                                ? 'border border-green-400/40 bg-green-400/10 text-green-300 hover:bg-green-400/20'
                                : 'border border-lavender/5 bg-void-800/40 text-lavender/40 hover:border-lavender/20'
                          }`}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>

                  {/* Slots for selected day */}
                  {selectedDate && slotsForSelectedDate.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-wider text-lavender/40">
                        Available windows 🌿
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {slotsForSelectedDate.map((block) => {
                          const isSelected = selectedSlotId === block.id
                          return (
                            <button
                              key={block.id}
                              type="button"
                              onClick={() => {
                                setSelectedSlotId(isSelected ? '' : block.id)
                                setCustomDate(nextOccurrenceForBlock(block))
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
                              {block.startTime}–{block.endTime} {block.timeZone}
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
                    value={scheduleNotes}
                    onChange={(e) => setScheduleNotes(e.target.value)}
                    placeholder="Notes or preparation requests"
                    className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
                  />

                  {previewMeeting && (
                    <div className="rounded-lg border border-lavender/10 bg-void-900/40 p-3">
                      <p className="text-xs text-cream flex items-center gap-2">
                        <CalendarDays className="w-3.5 h-3.5 text-lavender/40" /> Proposed preview
                      </p>
                      <p className="text-xs text-lavender/60 mt-1">{formatMeetingTime(previewMeeting)}</p>
                      {previewMeeting.location && previewMeeting.location !== 'TBD' && (
                        <p className="text-xs text-lavender/60 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {previewMeeting.location}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <a
                          href={googleCalendarEventUrl(previewMeeting)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] px-2 py-1 rounded-full bg-blue-400/10 border border-blue-400/30 text-blue-300 hover:bg-blue-400/20 transition-all"
                        >
                          Google 📅
                        </a>
                        <button
                          type="button"
                          onClick={() => downloadICS(previewMeeting)}
                          className="text-[10px] px-2 py-1 rounded-full bg-lavender/10 border border-lavender/30 text-lavender/70 hover:bg-lavender/20 transition-all"
                        >
                          .ics 📥
                        </button>
                      </div>
                    </div>
                  )}
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

          {/* Hybrid Payment Composer */}
          <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-4 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hybridEnabled}
                onChange={(e) => setHybridEnabled(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-lavender/20 bg-void-800 accent-gold-400"
              />
              <span className="text-sm text-lavender/70">
                <span className="flex items-center gap-1.5 text-cream">
                  <Sparkles className="w-3.5 h-3.5 text-gold-400" /> Compose a hybrid exchange
                </span>
                <span className="block text-xs text-lavender/40 mt-0.5">
                  Mix monetary mutual aid with a service exchange from your own offerings.
                </span>
              </span>
            </label>

            {hybridEnabled && (
              <div className="space-y-4 pl-7">
                <div>
                  <label className="block text-xs text-lavender/50 mb-1">Monetary amount (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lavender/30">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={monetaryAmount}
                      onChange={(e) => setMonetaryAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-lavender/30 mt-1">
                    99% of monetary profits auto-dedicate to the Heartlight Collective.
                  </p>
                </div>

                <div>
                  <label className="block text-xs text-lavender/50 mb-1">Service exchange offering</label>
                  <select
                    value={serviceOfferingId}
                    onChange={(e) => setServiceOfferingId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-cream focus:border-gold-400/40 focus:outline-none appearance-none"
                  >
                    <option value="">Select one of your offerings (optional)</option>
                    {requesterOfferings.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.title} · {o.vendorName}
                      </option>
                    ))}
                  </select>
                  {requesterOfferings.length === 0 && (
                    <p className="text-[10px] text-lavender/30 mt-1">You have no published offerings yet. Use the free-text field below.</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-lavender/50 mb-1">Or describe a service exchange</label>
                  <textarea
                    value={serviceFallback}
                    onChange={(e) => setServiceFallback(e.target.value)}
                    placeholder="e.g., I will design a landing page for your community program"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}
          </div>

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
