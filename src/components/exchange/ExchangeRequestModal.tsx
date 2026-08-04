import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  X, Heart, ArrowRight, Store, MessageSquare, AlertCircle,
  Calendar as CalendarIcon, CalendarDays, MapPin, Video, Sparkles,
  RefreshCw, DollarSign, SlidersHorizontal, GraduationCap, User, Mail
} from 'lucide-react'
import { useStorage } from '../../lib/storage'
import type {
  OfferingItem, VendorRecord, ExchangeAgreement,
  ExchangeRequest, ExchangeRole, PaymentMethodType,
  ScheduledMeeting, AvailabilityBlock, ProposedMeetingSlot,
  GuestProfile
} from '../../types/ces'
import { PAYMENT_METHOD_LABELS } from '../../lib/constants'
import { formatMeetingTime } from '../../lib/calendar'

const EXCHANGE_ROLES: ExchangeRole[] = [
  'Vision Holder', 'Guide', 'Learner', 'Builder', 'Facilitator',
  'Recipient', 'Steward', 'Contributor', 'Observer', 'Co-Creator',
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const PATHWAYS = [
  { key: 'gift', label: 'Gift', icon: Heart, color: 'magenta' },
  { key: 'barter', label: 'Trade', icon: RefreshCw, color: 'gold' },
  { key: 'fixed', label: 'Fixed', icon: DollarSign, color: 'blue' },
  { key: 'negotiable', label: 'Sliding Scale', icon: SlidersHorizontal, color: 'green' },
  { key: 'collective_funded', label: 'Scholarship', icon: GraduationCap, color: 'violet' },
]

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

function newQuestId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

interface ExchangeRequestModalProps {
  offering: OfferingItem
  vendor: VendorRecord
  requesterCes: string
  requesterName: string
  onClose: () => void
  onAgreementCreated: (agreement: ExchangeAgreement) => void
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

  /* ── Step state ── */
  const [step, setStep] = useState<1 | 2 | 3>(1)

  /* ── Step 1: Exchange Methods ── */
  const [selectedPathway, setSelectedPathway] = useState<string>('')

  /* ── Step 2: Scheduling ── */
  const needsScheduling = offering.requiresScheduling || offering.offeringType === 'virtual_session' || offering.offeringType === 'work_study_exchange' || offering.offeringType === 'service' || offering.offeringType === 'commission'
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

  /* Wave 11 — Propose up to 3 ideal date/time options */
  interface ProposedDateOption {
    id: string
    date: string
    startTime?: string
    endTime?: string
    timeZone: string
    notes?: string
  }
  const [proposedDates, setProposedDates] = useState<ProposedDateOption[]>([])
  const [draftIndex, setDraftIndex] = useState<number | null>(null)
  const [draftOption, setDraftOption] = useState<ProposedDateOption>({
    id: '',
    date: '',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notes: '',
  })
  const [miniCalMonth, setMiniCalMonth] = useState(new Date())

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
      return nextOccurrenceForBlock(b) === target
    })
  }, [providerAvailability, selectedDate])

  /* ── Step 3: Resonance + Guest Profile ── */
  const [message, setMessage] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  const providerName = vendor.ownerName || findProfileByCES(vendor.ownerCes)?.name || vendor.name

  const enabledMethods = useMemo(
    () => vendor.paymentMethods.filter((m) => m.enabled),
    [vendor.paymentMethods]
  )

  const autoPaymentMethod: PaymentMethodType | undefined = enabledMethods[0]?.type

  function buildProposedSlot(index: number = 0): ProposedMeetingSlot | undefined {
    const opt = proposedDates[index]
    if (!opt || !opt.date) return undefined
    const timeZone = opt.timeZone
    const startAt = opt.startTime ? toISODateTime(opt.date, opt.startTime) : opt.date
    const endAt = opt.endTime ? toISODateTime(opt.date, opt.endTime) : opt.date
    if (!startAt || !endAt) return undefined
    if (opt.startTime && opt.endTime && new Date(endAt) <= new Date(startAt)) return undefined
    return { startAt, endAt, timeZone, platform: offering.virtualSession?.platform || 'other' }
  }

  function buildScheduledMeeting(index: number = 0): ScheduledMeeting | undefined {
    const slot = buildProposedSlot(index)
    if (!slot) return undefined
    const opt = proposedDates[index]
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
      notes: opt?.notes?.trim() || undefined,
    }
  }

  function validateStep1() {
    if (!selectedPathway) {
      setError('Please choose how you wish to exchange.')
      return false
    }
    setError('')
    return true
  }

  function validateStep2() {
    if (needsScheduling) {
      if (proposedDates.length === 0) {
        setError('Please add at least one ideal date/time option for the provider to review.')
        return false
      }
    }
    setError('')
    return true
  }

  function validateStep3() {
    if (!message.trim()) {
      setError('Please share a resonance message so the provider can feel your intention.')
      return false
    }
    if (requesterCes === 'guest' || requesterCes.startsWith('guest_')) {
      if (!guestName.trim() || !guestEmail.trim()) {
        setError('Please share your name and email so the provider can reach you.')
        return false
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(guestEmail.trim())) {
        setError('Please share a valid email address.')
        return false
      }
    }
    if (offering.customQuestions) {
      for (const q of offering.customQuestions) {
        if (q.required && !customAnswers[q.id]?.trim()) {
          setError(`Please answer the required question: "${q.question}"`)
          return false
        }
      }
    }
    setError('')
    return true
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateStep3()) return

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

    const mainQuestDirective = {
      ...mainQuest,
      id: newQuestId('directive'),
      title: `${offering.title} — shared directive`,
    }

    const parties = [
      {
        ces: requesterCes,
        name: requesterName,
        role: 'Recipient' as ExchangeRole,
        privacyAssurance: '',
        privacyAgreed: false,
        joinedAt: now,
      },
      {
        ces: vendor.ownerCes,
        name: providerName,
        role: 'Guide' as ExchangeRole,
        privacyAssurance: '',
        privacyAgreed: false,
        joinedAt: now,
      },
    ]

    const meetings = proposedDates.map((_, idx) => buildScheduledMeeting(idx)).filter((m): m is ScheduledMeeting => m !== undefined)
    const firstSlot = buildProposedSlot(0)
    const scheduledMeetings: ScheduledMeeting[] = meetings

    const dedicationOfProfits = {
      enabled: true,
      percentage: 99,
      destinations: [
        'Earth Conscious Initiatives & Technology',
        'Preserving Ancient Wisdom of our Ancestors',
        'Sovereign Interdependent Communities',
        'Healing & Art',
        'ALL the Living',
      ],
      customNotes: 'This is our unanimous living agreement.',
    }

    // Build guest profile if applicable
    let guestProfile: GuestProfile | undefined
    if ((requesterCes === 'guest' || requesterCes.startsWith('guest_')) && guestName.trim() && guestEmail.trim()) {
      guestProfile = {
        id: `guest_${Date.now()}`,
        name: guestName.trim(),
        email: guestEmail.trim(),
        preferredContactMethod: 'email',
        createdAt: now,
      }
    }

    const agreement: ExchangeAgreement = {
      id: agreementId,
      offeringId: offering.id,
      vendorId: vendor.id,
      requesterCes,
      requesterName,
      isRequesterUnregistered: requesterCes === 'guest' || requesterCes.startsWith('guest_'),
      guestProfile,
      customAnswers: offering.customQuestions
        ? offering.customQuestions
            .filter((q) => customAnswers[q.id]?.trim())
            .map((q) => ({ questionId: q.id, question: q.question, answer: customAnswers[q.id] }))
        : undefined,
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
      paymentMethod: autoPaymentMethod,
      hybridPayment: undefined,
      confirmedMeetingSlot: firstSlot,
      communicationPrefs: '',
      dedicationOfProfits,
      status: 'draft',
      requesterConsented: false,
      providerConsented: false,
      collectiveFundingRequested: selectedPathway === 'collective_funded',
      collectiveFundingApproved: undefined,
      versions: [],
      pendingUpdate: undefined,
      createdAt: now,
      updatedAt: now,
    }

    addExchangeAgreement(agreement)
    for (const mtg of meetings) {
      addScheduledMeeting(vendor.ownerCes, mtg)
      addScheduledMeeting(requesterCes, { ...mtg, title: `${mtg.title} (with ${providerName})` })
    }

    const exchangeRequest: ExchangeRequest = {
      id: `request_${Date.now()}`,
      offeringId: offering.id,
      vendorId: vendor.id,
      requesterCes,
      requesterName,
      isRequesterUnregistered: agreement.isRequesterUnregistered,
      guestProfile,
      providerCes: vendor.ownerCes,
      providerName,
      message: message.trim(),
      priceType: offering.priceType,
      paymentMethod: autoPaymentMethod,
      hybridPayment: undefined,
      proposedMeetingSlot: firstSlot,
      status: 'pending',
      collectivePetitionId: selectedPathway === 'collective_funded' ? undefined : undefined,
      consentAcknowledged: true,
      createdAt: now,
      updatedAt: now,
    }
    addExchangeRequest(exchangeRequest)

    onAgreementCreated(agreement)
  }

  const previewMeeting = useMemo(() => buildScheduledMeeting(0), [proposedDates])

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
        <button onClick={onClose} className="absolute top-4 right-4 text-lavender/40 hover:text-cream transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="w-12 h-12 rounded-full bg-gold-400/10 border border-gold-400/20 flex items-center justify-center mx-auto mb-3">
            <Heart className="w-6 h-6 text-gold-400" />
          </div>
          <h2 className="font-serif text-xl text-cream text-center mb-1">
            {step === 1 && 'Choose Your Exchange Pathway'}
            {step === 2 && (needsScheduling ? 'Choose a Time' : 'Confirm Exchange Details')}
            {step === 3 && 'Share Your Resonance'}
          </h2>
          <p className="text-sm text-lavender/50 text-center">
            Step {step} of 3 — {offering.title}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? 'w-6 bg-gold-400' : s < step ? 'w-3 bg-gold-400/50' : 'w-3 bg-lavender/10'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* ── Offering Summary (always visible) ── */}
        <div className="rounded-xl border border-blue-400/10 bg-blue-400/5 p-4 mb-6">
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
              {offering.priceCents != null && offering.priceType !== 'gift' && (
                <p className="text-xs text-gold-400 mt-1">
                  Aligned exchange value: ${(offering.priceCents / 100).toFixed(2)} · {offering.priceType}
                </p>
              )}
              {offering.priceType === 'gift' && (
                <p className="text-xs text-magenta-400 mt-1">Gift Economy — freely given</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Step 1: Exchange Pathways ── */}
        {step === 1 && (
          <div className="space-y-5">
            <p className="text-sm text-lavender/60 text-center">
              How do you wish to co-create this exchange?
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PATHWAYS.map((p) => {
                const Icon = p.icon
                const active = selectedPathway === p.key
                const colorMap: Record<string, string> = {
                  magenta: active ? 'bg-magenta-400/15 border-magenta-400/40 text-magenta-300' : 'border-lavender/10 text-lavender/50 hover:border-magenta-400/30 hover:text-magenta-300',
                  gold: active ? 'bg-gold-400/15 border-gold-400/40 text-gold-300' : 'border-lavender/10 text-lavender/50 hover:border-gold-400/30 hover:text-gold-300',
                  blue: active ? 'bg-blue-400/15 border-blue-400/40 text-blue-300' : 'border-lavender/10 text-lavender/50 hover:border-blue-400/30 hover:text-blue-300',
                  green: active ? 'bg-green-400/15 border-green-400/40 text-green-300' : 'border-lavender/10 text-lavender/50 hover:border-green-400/30 hover:text-green-300',
                  violet: active ? 'bg-violet-400/15 border-violet-400/40 text-violet-300' : 'border-lavender/10 text-lavender/50 hover:border-violet-400/30 hover:text-violet-300',
                }
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => { setSelectedPathway(active ? '' : p.key); setError('') }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-sm transition-all ${colorMap[p.color]}`}
                  >
                    <Icon className="w-6 h-6" />
                    <span>{p.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => { if (validateStep1()) setStep(2) }}
                className="w-full py-3.5 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all inline-flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        )}

        {/* ── Step 2: Scheduling ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="rounded-xl border border-gold-400/10 bg-gold-400/[0.03] p-4 space-y-4">
              {/* Offering-type-aware scheduling label */}
              <div className="flex items-start gap-3">
                <CalendarIcon className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-cream">
                    {offering.offeringType === 'virtual_session' && 'Choose ideal session times'}
                    {offering.offeringType === 'work_study_exchange' && 'Choose ideal start dates'}
                    {offering.offeringType === 'service' && 'Choose ideal appointment dates'}
                    {offering.offeringType === 'commission' && 'Choose ideal completion dates'}
                    {(!offering.offeringType || offering.offeringType === 'product') && 'Choose ideal completion or delivery dates'}
                  </p>
                  <p className="text-xs text-lavender/40 mt-0.5">
                    You may propose up to 3 options for the provider to review.
                  </p>
                </div>
              </div>

              {/* Compact system-native date picker — one row per option */}
              <div className="space-y-4">
                {/* Draft option form */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-cream">{draftIndex != null ? `Edit option ${draftIndex + 1}` : `Add option ${proposedDates.length + 1} of 3`}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Date input with calendar icon */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-void-900/60 border border-lavender/10">
                      <CalendarIcon className="w-4 h-4 text-gold-400 shrink-0" />
                      <input
                        type="date"
                        value={draftOption.date}
                        onChange={(e) => setDraftOption((prev) => ({ ...prev, date: e.target.value }))}
                        min={new Date().toISOString().slice(0, 10)}
                        className="bg-transparent text-sm text-cream focus:outline-none w-[140px] appearance-none [-webkit-appearance:none]"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>

                    {/* Time inputs for scheduled offerings */}
                    {(offering.offeringType === 'virtual_session' || offering.offeringType === 'service' || offering.offeringType === 'work_study_exchange') && (
                      <>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-lavender/50">Start</label>
                          <input
                            type="time"
                            value={draftOption.startTime || ''}
                            onChange={(e) => setDraftOption((prev) => ({ ...prev, startTime: e.target.value }))}
                            className="px-2 py-1.5 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream focus:border-gold-400/40 focus:outline-none w-[100px]"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-lavender/50">End</label>
                          <input
                            type="time"
                            value={draftOption.endTime || ''}
                            onChange={(e) => setDraftOption((prev) => ({ ...prev, endTime: e.target.value }))}
                            className="px-2 py-1.5 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream focus:border-gold-400/40 focus:outline-none w-[100px]"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <input
                    type="text"
                    value={draftOption.timeZone}
                    onChange={(e) => setDraftOption((prev) => ({ ...prev, timeZone: e.target.value }))}
                    placeholder="Time zone"
                    className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
                  />

                  <input
                    type="text"
                    value={draftOption.notes || ''}
                    onChange={(e) => setDraftOption((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Notes or preparation requests"
                    className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!draftOption.date) return
                        if (draftIndex != null) {
                          setProposedDates((prev) => prev.map((p, i) => i === draftIndex ? { ...draftOption, id: p.id } : p))
                          setDraftIndex(null)
                        } else {
                          if (proposedDates.length >= 3) return
                          setProposedDates((prev) => [...prev, { ...draftOption, id: `opt_${Date.now()}` }])
                        }
                        setDraftOption({ id: '', date: '', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, notes: '' })
                      }}
                      disabled={!draftOption.date || (draftIndex == null && proposedDates.length >= 3)}
                      className="flex-1 py-2 rounded-lg bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {draftIndex != null ? 'Update option' : 'Add option'}
                    </button>
                    {draftIndex != null && (
                      <button
                        type="button"
                        onClick={() => {
                          setDraftIndex(null)
                          setDraftOption({ id: '', date: '', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, notes: '' })
                        }}
                        className="px-4 py-2 rounded-lg border border-lavender/10 text-lavender/60 hover:border-lavender/30 transition-all text-sm"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Saved options list */}
                {proposedDates.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-lavender/40">Proposed options</p>
                    {proposedDates.map((opt, idx) => (
                      <div key={opt.id} className="rounded-lg border border-lavender/10 bg-void-900/40 p-3 flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-sm text-cream font-medium">
                            Option {idx + 1}: {new Date(opt.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                          {(opt.startTime || opt.endTime) && (
                            <p className="text-xs text-lavender/50 mt-0.5">
                              {opt.startTime}{opt.endTime ? `–${opt.endTime}` : ''} {opt.timeZone}
                            </p>
                          )}
                          {opt.notes && <p className="text-xs text-lavender/40 mt-0.5">{opt.notes}</p>}
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setDraftOption(opt)
                              setDraftIndex(idx)
                            }}
                            className="text-xs text-lavender/40 hover:text-cream px-2 py-1"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setProposedDates((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-xs text-red-400/50 hover:text-red-300 px-2 py-1"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl border border-lavender/10 text-lavender/60 hover:border-lavender/30 transition-all"
              >
                Back
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => { if (validateStep2()) setStep(3) }}
                className="flex-1 py-3.5 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all inline-flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        )}

        {/* ── Step 3: Resonance + Guest Profile ── */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-5">
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

            {/* Custom Booking Questions (if offering has them) */}
            {offering.customQuestions && offering.customQuestions.length > 0 && (
              <div className="rounded-xl border border-gold-400/10 bg-gold-400/[0.03] p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-gold-400" />
                  <span className="text-sm text-cream">Questions from {vendor.name}</span>
                </div>
                {offering.customQuestions.map((q) => (
                  <div key={q.id}>
                    <label className="block text-xs text-lavender/60 mb-1.5">
                      {q.question} {q.required && <span className="text-magenta-400">*</span>}
                    </label>
                    <textarea
                      value={customAnswers[q.id] || ''}
                      onChange={(e) => setCustomAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="Your response..."
                      rows={2}
                      className="w-full px-4 py-2.5 rounded-xl bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none resize-none"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Guest Profile (if not fully registered) */}
            {(requesterCes === 'guest' || requesterCes.startsWith('guest_')) && (
              <div className="rounded-xl border border-lavender/10 bg-void-800/30 p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gold-400" />
                  <span className="text-sm text-cream">Your Contact Details</span>
                  <span className="text-xs text-lavender/40">(required for the provider to reach you)</span>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs text-lavender/50 mb-1">
                    <User className="w-3 h-3" /> Name
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => { setGuestName(e.target.value); setError('') }}
                    placeholder="Your preferred name"
                    className="w-full px-4 py-2.5 rounded-xl bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs text-lavender/50 mb-1">
                    <Mail className="w-3 h-3" /> Email
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => { setGuestEmail(e.target.value); setError('') }}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="rounded-xl border border-lavender/10 bg-void-800/30 p-4 space-y-2">
              <p className="text-xs uppercase tracking-wider text-lavender/40">Exchange Summary</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-lavender/60">Pathway</span>
                <span className="text-cream">
                  {PATHWAYS.find((p) => p.key === selectedPathway)?.label || '—'}
                </span>
              </div>
              {offering.priceCents != null && offering.priceType !== 'gift' && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-lavender/60">Value</span>
                  <span className="text-gold-400">${(offering.priceCents / 100).toFixed(2)}</span>
                </div>
              )}
              {autoPaymentMethod && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-lavender/60">Payment</span>
                  <span className="text-cream">{PAYMENT_METHOD_LABELS[autoPaymentMethod]?.label || autoPaymentMethod}</span>
                </div>
              )}
              {previewMeeting && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-lavender/60">Time</span>
                  <span className="text-cream">{formatMeetingTime(previewMeeting)}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl border border-lavender/10 text-lavender/60 hover:border-lavender/30 transition-all"
              >
                Back
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="flex-1 py-3.5 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all inline-flex items-center justify-center gap-2"
              >
                Send Exchange Request <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
            <p className="text-xs text-lavender/40 text-center">
              This creates a private draft agreement between you and {vendor.name}.
            </p>
          </form>
        )}
      </motion.div>
    </motion.div>
  )
}