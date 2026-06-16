import { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, CheckCircle, FileSignature, ArrowRight, ArrowLeft, Plus, Trash2, Users, ScrollText, MessageSquare, CreditCard, AlertCircle, PenLine, Mail, Smartphone, MessageCircle, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStorage } from '../../lib/storage'
import { useSession } from '../../lib/session'
import type { ExchangeAgreement, ExchangeRole, QuestItem, PaymentMethodType, PaymentMethodConfig, ExchangeJourney, AgreementVersion, ContactMethods, ContactVisibility, ScheduledMeeting, AvailabilityBlock, AgreementParty, SafetyReport, AgreementPartyWithdrawal } from '../../types/ces'
import { getPaymentUrl, formatPaymentLabel, paymentTypeIcon } from '../../lib/payments'
import { WithdrawalModal } from './WithdrawalModal'
import { googleCalendarEventUrl, downloadICS, formatMeetingTime } from '../../lib/calendar'
import { Clock, Calendar as CalendarIcon, MapPin, CalendarDays, Check, ExternalLink } from 'lucide-react'
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

const SACRED_PROMPT = `This co-creates a space of conscious awareness of how sacred and special this exchange is.

This Privacy Assurance space is meant for every individual being to share boundaries and consent for sharing and/or communicating information of the beings within this Exchange Agreement. This privacy assurance may be as expansive and detail-oriented as you prefer.

This Exchange Agreement may also change, shift, update and/or be revoked at any time by any being within the Exchange Agreement before, during, or after the exchange as approved by ALL beings within the Exchange Agreement.`

const PAYMENT_METHODS: PaymentMethodType[] = ['stripe', 'venmo', 'cashapp', 'zelle', 'chime', 'collective']

interface ExchangeAgreementEditorProps {
  agreement: ExchangeAgreement
  onClose: () => void
  onSigned: () => void
}

  function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function toISODateTime(date: string, time: string): string {
  if (!date || !time) return ''
  const [hours, minutes] = time.split(':').map(Number)
  const d = new Date(`${date}T00:00:00`)
  d.setHours(hours, minutes, 0, 0)
  return d.toISOString()
}

function parseDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

function parseTime(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(11, 16)
}

function emptySideQuest(): QuestItem {
  const now = new Date().toISOString()
  return {
    id: newId('side'),
    title: '',
    description: '',
    status: 'open',
    verifications: [],
    createdAt: now,
  }
}

interface PeerPaymentActionsProps {
  agreement: ExchangeAgreement
}

function PeerPaymentActions({ agreement }: PeerPaymentActionsProps) {
  const { findProfileByCES, findVendorById } = useStorage()
  const providerProfile = useMemo(() => findProfileByCES(agreement.providerCes), [findProfileByCES, agreement.providerCes])
  const vendor = useMemo(() => (agreement.vendorId ? findVendorById(agreement.vendorId) : undefined), [findVendorById, agreement.vendorId])

  const selectedType = agreement.paymentMethod
  const amountCents = agreement.agreedPriceCents ?? agreement.proposedPriceCents

  const availableMethods = useMemo(() => {
    const all: PaymentMethodConfig[] = []
    const seen = new Set<PaymentMethodType>()
    const add = (method?: PaymentMethodConfig) => {
      if (!method || !method.enabled) return
      if (seen.has(method.type)) return
      seen.add(method.type)
      all.push(method)
    }
    ;(providerProfile?.peerPaymentMethods || []).forEach(add)
    ;(vendor?.paymentMethods || []).forEach(add)
    return all
  }, [providerProfile, vendor])

  const selectedMethod = availableMethods.find((m) => m.type === selectedType)

  if (!selectedType) return null

  if (selectedType === 'collective') {
    return (
      <div className="mt-3 p-3 rounded-lg border border-green-400/20 bg-green-400/10 text-sm text-green-300">
        Collective funding path. Request will route through Heartlight treasury review.
      </div>
    )
  }

  if (!selectedMethod) {
    return (
      <div className="mt-3 p-3 rounded-lg border border-lavender/10 bg-void-800/40 text-sm text-lavender/60">
        {PAYMENT_METHOD_LABELS[selectedType]?.label || selectedType} details are not yet configured by the provider.
      </div>
    )
  }

  const url = getPaymentUrl(selectedMethod, amountCents)
  const label = formatPaymentLabel(selectedMethod)

  return (
    <div className="mt-3 p-3 rounded-lg border border-gold-400/20 bg-gold-400/5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{paymentTypeIcon(selectedMethod.type)}</span>
        <span className="text-sm font-medium text-cream">{label}</span>
      </div>
      {selectedMethod.note && <p className="text-xs text-lavender/70 mb-2">{selectedMethod.note}</p>}
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-400/20 text-gold-300 hover:bg-gold-400/30 transition-all text-sm"
        >
          <ExternalLink className="w-4 h-4" />
          {amountCents != null && amountCents > 0
            ? `Pay ${(amountCents / 100).toFixed(2)} ${selectedMethod.preferredCurrency || 'USD'}`
            : `Open ${PAYMENT_METHOD_LABELS[selectedType]?.label || selectedType}`}
        </a>
      ) : (
        <p className="text-xs text-lavender/50">No direct link configured for this method.</p>
      )}
    </div>
  )
}

function normalizeQuestStatus(status?: QuestItem['status']): QuestItem['status'] {
  if (!status) return 'open'
  // backward compatibility: legacy "completed" stays completed; anything else defaults to open
  return status === 'completed' ? 'completed' : status
}

function getAssignedNames(quest: QuestItem): string[] {
  if (quest.assignedToNames && quest.assignedToNames.length > 0) return quest.assignedToNames
  if (quest.assignedToName) return [quest.assignedToName]
  return []
}

function getAssignedCesList(quest: QuestItem): string[] {
  if (quest.assignedToCesList && quest.assignedToCesList.length > 0) return quest.assignedToCesList
  if (quest.assignedToCes) return [quest.assignedToCes]
  return []
}

const CONTACT_ICON: Record<keyof ContactMethods, typeof Mail> = {
  email: Mail,
  phone: Smartphone,
  instagram: MessageCircle,
  youtube: MessageCircle,
  threads: MessageCircle,
  spotify: MessageCircle,
  discord: MessageCircle,
  telegram: MessageCircle,
  signal: MessageCircle,
}

const CONTACT_LABEL: Record<keyof ContactMethods, string> = {
  email: 'Email',
  phone: 'Phone',
  instagram: 'Instagram',
  youtube: 'YouTube',
  threads: 'Threads',
  spotify: 'Spotify',
  discord: 'Discord',
  telegram: 'Telegram',
  signal: 'Signal',
}

function visibleContactMethods(
  profile: { contactMethods: ContactMethods; contactVisibility: ContactVisibility } | null | undefined,
  currentCes: string,
  partyCes: string
): Array<{ key: keyof ContactMethods; value: string; label: string; icon: typeof Mail }> {
  if (!profile) return []
  const isParty = currentCes === partyCes
  return (Object.keys(profile.contactMethods) as (keyof ContactMethods)[])
    .filter((key) => {
      const visible = profile.contactVisibility?.[key]
      const hasValue = !!profile.contactMethods[key]?.trim()
      return hasValue && (isParty || visible)
    })
    .map((key) => ({ key, value: profile.contactMethods[key], label: CONTACT_LABEL[key], icon: CONTACT_ICON[key] }))
}

function ContactMethodRow({
  method,
  href,
}: {
  method: { key: keyof ContactMethods; value: string; label: string; icon: typeof Mail }
  href?: string
}) {
  const Icon = method.icon
  const body = (
    <div className="flex items-center gap-2 text-xs text-lavender/70">
      <Icon className="w-3.5 h-3.5 text-lavender/40" />
      <span className="font-medium">{method.label}:</span>
      <span className="truncate">{method.value}</span>
    </div>
  )
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className="block hover:bg-white/[0.03] rounded-lg p-2 -mx-2 transition-colors">
      {body}
    </a>
  ) : (
    <div className="p-2 -mx-2">{body}</div>
  )
}

function ContactHref(method: keyof ContactMethods, value: string): string | undefined {
  switch (method) {
    case 'email':
      return `mailto:${value}`
    case 'phone':
      return `tel:${value.replace(/\s/g, '')}`
    case 'instagram':
      return `https://instagram.com/${value.replace(/^@/, '')}`
    case 'threads':
      return `https://threads.net/@${value.replace(/^@/, '')}`
    case 'youtube':
      return value.startsWith('http') ? value : `https://youtube.com/@${value.replace(/^@/, '')}`
    case 'spotify':
      return value.startsWith('http') ? value : `https://open.spotify.com/user/${value}`
    case 'discord':
      return undefined
    case 'telegram':
      return `https://t.me/${value.replace(/^@/, '')}`
    case 'signal':
      return undefined
  }
}

function PartyContactCard({
  label,
  ces,
  name,
  profile,
  currentCes,
}: {
  label: string
  ces: string
  name: string
  profile: { contactMethods: ContactMethods; contactVisibility: ContactVisibility } | null | undefined
  currentCes: string
}) {
  const methods = visibleContactMethods(profile, currentCes, ces)
  const isCurrentUser = currentCes === ces
  return (
    <div className="rounded-xl border border-lavender/10 bg-void-900/30 p-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-gold-400" />
        <span className="text-xs uppercase tracking-wider text-lavender/40">{label} Preferred Contact</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Link to={`/profile/${ces}`} className="text-sm text-cream hover:text-gold-300 transition-colors underline underline-offset-2">
          {name} {isCurrentUser ? '(you)' : ''} 🌟
        </Link>
      </div>
      {methods.length === 0 ? (
        <p className="text-xs text-lavender/40 italic">
          {isCurrentUser
            ? 'You have not shared any contact methods for this exchange.'
            : 'No public contact methods are visible for this being.'}
        </p>
      ) : (
        <div className="space-y-1">
          {methods.map((m) => (
            <ContactMethodRow key={m.key} method={m} href={ContactHref(m.key, m.value)} />
          ))}
        </div>
      )}
    </div>
  )
}

export function ExchangeAgreementEditor({ agreement: initialAgreement, onClose, onSigned }: ExchangeAgreementEditorProps) {
  const storage = useStorage()
  const { user } = useSession()
  const { updateExchangeAgreement, findVendorById, findProfileByCES, getExchangeCalendar, addScheduledMeeting, updateScheduledMeeting, submitAgreementWithdrawal, approveAgreementWithdrawal, updateAgreementPartyPrivacy } = storage
  const [agreement, setAgreement] = useState<ExchangeAgreement>(() => ({
    ...initialAgreement,
    scheduledMeetings: initialAgreement.scheduledMeetings || [],
    mainQuest: {
      ...initialAgreement.mainQuest,
      status: normalizeQuestStatus(initialAgreement.mainQuest.status),
      verifications: initialAgreement.mainQuest.verifications || [],
    },
    sideQuests: initialAgreement.sideQuests.map((q) => ({
      ...q,
      status: normalizeQuestStatus(q.status),
      verifications: q.verifications || [],
    })),
    parties: initialAgreement.parties || [
      { ces: initialAgreement.requesterCes, name: initialAgreement.requesterName, role: initialAgreement.requesterRole, privacyAgreed: initialAgreement.requesterConsented, privacyAssurance: '' },
      { ces: initialAgreement.providerCes, name: initialAgreement.providerName, role: initialAgreement.providerRole, privacyAgreed: initialAgreement.providerConsented, privacyAssurance: '' },
    ],
    mainQuestDirective: initialAgreement.mainQuestDirective || initialAgreement.mainQuest,
    mainQuests: initialAgreement.mainQuests?.length ? initialAgreement.mainQuests : [initialAgreement.mainQuest],
    safetyReports: initialAgreement.safetyReports || [],
  }))
  const [error, setError] = useState('')
  const [changeSummary, setChangeSummary] = useState('')
  const [scheduleMode, setScheduleMode] = useState<false | 'new' | 'reschedule'>(false)
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null)
  const [meetingTitle, setMeetingTitle] = useState('')
  const [meetingStartDate, setMeetingStartDate] = useState('')
  const [meetingStartTime, setMeetingStartTime] = useState('')
  const [meetingEndTime, setMeetingEndTime] = useState('')
  const [meetingTimeZone, setMeetingTimeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [meetingLocation, setMeetingLocation] = useState('')
  const [meetingNotes, setMeetingNotes] = useState('')

  const isRequester = useCallback((ces?: string) => ces === agreement.requesterCes, [agreement.requesterCes])
  const isProvider = useCallback((ces?: string) => ces === agreement.providerCes, [agreement.providerCes])
  const currentCes = user?.ces || ''

  const latestVersion = agreement.versions[agreement.versions.length - 1]
  const isProposed = agreement.status === 'proposed'
  const isAgreed = agreement.status === 'agreed' || agreement.status === 'active'
  const bothConsented = agreement.requesterConsented && agreement.providerConsented
  const isParty = isRequester(currentCes) || isProvider(currentCes)
  const pendingUpdate = agreement.pendingUpdate
  const hasPendingUpdate = Boolean(pendingUpdate)
  const isPendingApprover = pendingUpdate ? !pendingUpdate.approvedBy.includes(currentCes) : false

  const [amendMode, setAmendMode] = useState(false)
  const [amendSummary, setAmendSummary] = useState('')
  const [amendNote, setAmendNote] = useState('')
  const [showWithdrawal, setShowWithdrawal] = useState(false)
  const [mainQuestDirectiveTitle, setMainQuestDirectiveTitle] = useState(agreement.mainQuestDirective?.title || agreement.mainQuest.title || '')
  const [mainQuestDirectiveDescription, setMainQuestDirectiveDescription] = useState(agreement.mainQuestDirective?.description || '')

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

  const defaultDedication = {
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

  const updateDedication = useCallback((patch: Partial<ExchangeAgreement['dedicationOfProfits']>) => {
    setAgreement((prev) => {
      const current = prev.dedicationOfProfits || defaultDedication
      return { ...prev, dedicationOfProfits: { ...current, ...patch }, updatedAt: new Date().toISOString() }
    })
  }, [])

  const toggleDestination = useCallback((destination: string) => {
    setAgreement((prev) => {
      const current = prev.dedicationOfProfits || defaultDedication
      const destinations = current.destinations.includes(destination)
        ? current.destinations.filter((d) => d !== destination)
        : [...current.destinations, destination]
      return { ...prev, dedicationOfProfits: { ...current, destinations }, updatedAt: new Date().toISOString() }
    })
  }, [])

  const ensureDedication = useCallback(() => {
    setAgreement((prev) => (prev.dedicationOfProfits ? prev : { ...prev, dedicationOfProfits: defaultDedication, updatedAt: new Date().toISOString() }))
  }, [])

  useEffect(() => {
    ensureDedication()
  }, [ensureDedication])

  const updateMainQuestDirective = useCallback(() => {
    const now = new Date().toISOString()
    const directive: QuestItem = {
      ...(agreement.mainQuestDirective || agreement.mainQuest),
      id: agreement.mainQuestDirective?.id || agreement.mainQuest.id,
      title: mainQuestDirectiveTitle,
      description: mainQuestDirectiveDescription,
      status: 'open',
      createdAt: agreement.mainQuestDirective?.createdAt || now,
      verifications: [],
    }
    setAgreement((prev) => ({
      ...prev,
      mainQuestDirective: directive,
      mainQuest: { ...prev.mainQuest, title: mainQuestDirectiveTitle, description: mainQuestDirectiveDescription },
      updatedAt: now,
    }))
  }, [mainQuestDirectiveTitle, mainQuestDirectiveDescription, agreement.mainQuestDirective, agreement.mainQuest])

  const handlePrivacyAssuranceChange = useCallback((ces: string, text: string, agreed: boolean) => {
    setAgreement((prev) => ({
      ...prev,
      parties: (prev.parties || []).map((p) =>
        p.ces === ces ? { ...p, privacyAssurance: text, privacyAgreed: agreed } : p
      ),
      updatedAt: new Date().toISOString(),
    }))
  }, [])

  const persistPrivacyAssurance = useCallback((ces: string) => {
    const party = agreement.parties?.find((p) => p.ces === ces)
    if (!party) return
    updateAgreementPartyPrivacy(agreement.id, ces, party.privacyAssurance || '', party.privacyAgreed)
  }, [agreement.parties, agreement.id, updateAgreementPartyPrivacy])

  const handleAddParty = useCallback(() => {
    setAgreement((prev) => ({
      ...prev,
      parties: [...(prev.parties || []), { ces: '', name: '', role: 'Co-Creator', privacyAgreed: false, privacyAssurance: '' }],
      updatedAt: new Date().toISOString(),
    }))
  }, [])

  const handleUpdateParty = useCallback((index: number, updates: Partial<AgreementParty>) => {
    setAgreement((prev) => ({
      ...prev,
      parties: (prev.parties || []).map((p, i) => (i === index ? { ...p, ...updates } : p)),
      updatedAt: new Date().toISOString(),
    }))
  }, [])

  const handleRemoveParty = useCallback((index: number) => {
    setAgreement((prev) => ({
      ...prev,
      parties: (prev.parties || []).filter((_, i) => i !== index),
      updatedAt: new Date().toISOString(),
    }))
  }, [])

  const handleWithdraw = useCallback(
    (withdrawal: AgreementPartyWithdrawal, safetyReport?: SafetyReport) => {
      submitAgreementWithdrawal(agreement.id, currentCes, withdrawal, safetyReport)
      setShowWithdrawal(false)
      // Refresh local state from storage
      const refreshed = storage.getExchangeAgreements().find((a) => a.id === agreement.id)
      if (refreshed) setAgreement(refreshed)
    },
    [agreement.id, currentCes, submitAgreementWithdrawal, storage]
  )

  const handleApproveWithdrawal = useCallback(
    (ces: string) => {
      approveAgreementWithdrawal(agreement.id, ces, currentCes)
      const refreshed = storage.getExchangeAgreements().find((a) => a.id === agreement.id)
      if (refreshed) setAgreement(refreshed)
    },
    [agreement.id, currentCes, approveAgreementWithdrawal, storage]
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
      parties: agreement.parties,
      mainQuestDirective: agreement.mainQuestDirective,
      mainQuests: agreement.mainQuests,
      sideQuests: agreement.sideQuests,
      safetyReports: agreement.safetyReports,
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

  function handleProposeAmendment() {
    if (!agreement.mainQuest.title.trim()) {
      setError('The main quest needs a title so both beings know what is being co-created.')
      return
    }
    if (!amendSummary.trim()) {
      setError('Please describe what is changing in this amendment.')
      return
    }

    const now = new Date().toISOString()
    const previousVersion = latestVersion?.version ?? 0
    const version: AgreementVersion = {
      version: previousVersion + 1,
      updatedAt: now,
      updatedByCes: currentCes,
      updatedByName: user?.name || 'Unknown being',
      changeSummary: amendSummary.trim(),
      approvedBy: [currentCes],
      parties: agreement.parties,
      mainQuestDirective: agreement.mainQuestDirective,
      mainQuests: agreement.mainQuests,
      sideQuests: agreement.sideQuests,
      safetyReports: agreement.safetyReports,
    }

    const next: ExchangeAgreement = {
      ...agreement,
      status: 'proposed',
      pendingUpdate: version,
      updatedAt: now,
    }

    setAgreement(next)
    updateExchangeAgreement(next)
    setAmendMode(false)
    setAmendSummary('')
    setAmendNote('')
  }

  function handleApproveAmendment() {
    if (!pendingUpdate) return
    const now = new Date().toISOString()
    const approvedBy = Array.from(new Set([...pendingUpdate.approvedBy, currentCes]))
    const otherCes = isRequester(currentCes) ? agreement.providerCes : agreement.requesterCes
    const fullyApproved = approvedBy.includes(agreement.requesterCes) && approvedBy.includes(agreement.providerCes)

    if (!fullyApproved) {
      // Partial approval: just update pendingUpdate approvedBy
      const next: ExchangeAgreement = {
        ...agreement,
        pendingUpdate: { ...pendingUpdate, approvedBy },
        updatedAt: now,
      }
      setAgreement(next)
      updateExchangeAgreement(next)
      return
    }

    // Fully approved: copy pendingUpdate into versions, clear pendingUpdate, restore active
    const next: ExchangeAgreement = {
      ...agreement,
      status: 'active',
      versions: [...agreement.versions, { ...pendingUpdate, parties: agreement.parties, mainQuestDirective: agreement.mainQuestDirective, mainQuests: agreement.mainQuests, sideQuests: agreement.sideQuests, safetyReports: agreement.safetyReports }],
      pendingUpdate: undefined,
      updatedAt: now,
    }

    setAgreement(next)
    updateExchangeAgreement(next)

    // Sync updated quests + scheduled meetings to linked journey
    try {
      const raw = localStorage.getItem('hlc_exchange_journeys') || '[]'
      const journeys: ExchangeJourney[] = JSON.parse(raw)
      const nextJourneys = journeys.map((j) => {
        if (j.agreementId !== agreement.id) return j
        return {
          ...j,
          mainQuest: next.mainQuest,
          sideQuests: next.sideQuests,
          scheduledMeetings: next.scheduledMeetings,
          updatedAt: now,
        }
      })
      localStorage.setItem('hlc_exchange_journeys', JSON.stringify(nextJourneys))
    } catch (err) {
      console.warn('Failed to sync amendment to journey:', err)
    }
  }

  function handleEditAndResubmitAmendment() {
    if (!pendingUpdate || !amendSummary.trim()) {
      setError('Please update the change summary before resubmitting.')
      return
    }
    const now = new Date().toISOString()
    const version: AgreementVersion = {
      ...pendingUpdate,
      updatedAt: now,
      updatedByCes: currentCes,
      updatedByName: user?.name || 'Unknown being',
      changeSummary: amendSummary.trim(),
      approvedBy: [currentCes],
      parties: agreement.parties,
      mainQuestDirective: agreement.mainQuestDirective,
      mainQuests: agreement.mainQuests,
      sideQuests: agreement.sideQuests,
      safetyReports: agreement.safetyReports,
    }
    const next: ExchangeAgreement = {
      ...agreement,
      pendingUpdate: version,
      updatedAt: now,
    }
    setAgreement(next)
    updateExchangeAgreement(next)
    setAmendMode(false)
    setAmendSummary('')
  }

  function handleRequestChanges() {
    const now = new Date().toISOString()
    const next: ExchangeAgreement = {
      ...agreement,
      status: 'proposed',
      providerConsented: false,
      updatedAt: now,
    }
    setAgreement(next)
    updateExchangeAgreement(next)
    alert('Changes requested. The proposing being can refine the amendment and resubmit.')
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

  const syncScheduledMeetingsToJourney = useCallback((agreementId: string, meetings: import('../../types/ces').ScheduledMeeting[]) => {
    try {
      const key = 'hlc_exchange_journeys'
      const raw = localStorage.getItem(key) || '[]'
      const journeys: ExchangeJourney[] = JSON.parse(raw)
      const next = journeys.map((j) =>
        j.agreementId === agreementId ? { ...j, scheduledMeetings: meetings, updatedAt: new Date().toISOString() } : j
      )
      localStorage.setItem(key, JSON.stringify(next))
    } catch (err) {
      console.warn('Failed to sync scheduled meetings to journey:', err)
    }
  }, [])

  const handleToggleMainCes = useCallback((ces: string, name: string) => {
    setAgreement((prev) => {
      const currentCesList = getAssignedCesList(prev.mainQuest)
      const currentNames = getAssignedNames(prev.mainQuest)
      const hasCes = currentCesList.includes(ces)
      const nextCesList = hasCes ? currentCesList.filter((c) => c !== ces) : [...currentCesList, ces]
      const nextNames = hasCes ? currentNames.filter((n) => n !== name) : [...currentNames, name]
      return {
        ...prev,
        mainQuest: {
          ...prev.mainQuest,
          assignedToCes: nextCesList.length === 1 ? nextCesList[0] : undefined,
          assignedToName: nextNames.length === 1 ? nextNames[0] : undefined,
          assignedToCesList: nextCesList,
          assignedToNames: nextNames,
        },
        updatedAt: new Date().toISOString(),
      }
    })
  }, [])

  const handleToggleMainRole = useCallback((role: ExchangeRole) => {
    setAgreement((prev) => {
      const currentRoles = prev.mainQuest.assignedToRoles || []
      const hasRole = currentRoles.includes(role)
      const nextRoles = hasRole ? currentRoles.filter((r) => r !== role) : [...currentRoles, role]
      return {
        ...prev,
        mainQuest: { ...prev.mainQuest, assignedToRoles: nextRoles },
        updatedAt: new Date().toISOString(),
      }
    })
  }, [])

  const handleToggleSideCes = useCallback((questId: string, ces: string, name: string) => {
    updateSideQuest(questId, {})
    setAgreement((prev) => {
      const q = prev.sideQuests.find((sq) => sq.id === questId)
      if (!q) return prev
      const currentCesList = getAssignedCesList(q)
      const currentNames = getAssignedNames(q)
      const hasCes = currentCesList.includes(ces)
      const nextCesList = hasCes ? currentCesList.filter((c) => c !== ces) : [...currentCesList, ces]
      const nextNames = hasCes ? currentNames.filter((n) => n !== name) : [...currentNames, name]
      return {
        ...prev,
        sideQuests: prev.sideQuests.map((sq) =>
          sq.id === questId
            ? {
                ...sq,
                assignedToCes: nextCesList.length === 1 ? nextCesList[0] : undefined,
                assignedToName: nextNames.length === 1 ? nextNames[0] : undefined,
                assignedToCesList: nextCesList,
                assignedToNames: nextNames,
              }
            : sq
        ),
        updatedAt: new Date().toISOString(),
      }
    })
  }, [])

  const handleToggleSideRole = useCallback((questId: string, role: ExchangeRole) => {
    setAgreement((prev) => ({
      ...prev,
      sideQuests: prev.sideQuests.map((sq) => {
        if (sq.id !== questId) return sq
        const currentRoles = sq.assignedToRoles || []
        const hasRole = currentRoles.includes(role)
        const nextRoles = hasRole ? currentRoles.filter((r) => r !== role) : [...currentRoles, role]
        return { ...sq, assignedToRoles: nextRoles }
      }),
      updatedAt: new Date().toISOString(),
    }))
  }, [])

  function AssignmentChips({
    quest,
    onToggleRole,
    onToggleCes,
  }: {
    quest: QuestItem
    onToggleRole: (role: ExchangeRole) => void
    onToggleCes: (ces: string, name: string) => void
  }) {
    const partyOptions = [
      { ces: agreement.requesterCes, name: agreement.requesterName, role: agreement.requesterRole },
      { ces: agreement.providerCes, name: agreement.providerName, role: agreement.providerRole },
    ]
    const assignedCesList = getAssignedCesList(quest)
    const assignedNames = getAssignedNames(quest)
    const assignedRoles = quest.assignedToRoles || []

    return (
      <div className="space-y-3 mt-3">
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-lavender/40">Assign by Being 🌱</p>
          <div className="flex flex-wrap gap-2">
            {partyOptions.map((p) => {
              const selected = assignedCesList.includes(p.ces)
              return (
                <button
                  key={p.ces}
                  type="button"
                  onClick={() => onToggleCes(p.ces, p.name)}
                  disabled={isProposed && !isRequester(currentCes)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all disabled:opacity-50 ${
                    selected
                      ? 'bg-blue-400/10 border-blue-400/30 text-blue-300'
                      : 'bg-void-900/40 border-lavender/10 text-lavender/50 hover:border-lavender/30'
                  }`}
                >
                  {selected && <Check className="w-3 h-3 inline" />} {p.name} · {p.role} ✨
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => {
                const cleared = {
                  assignedToCes: undefined,
                  assignedToName: undefined,
                  assignedToCesList: [],
                  assignedToNames: [],
                  assignedToRoles: [],
                }
                // Apply via the caller's update helpers
                if (quest.id === agreement.mainQuest.id) {
                  setAgreement((prev) => ({
                    ...prev,
                    mainQuest: { ...prev.mainQuest, ...cleared },
                    updatedAt: new Date().toISOString(),
                  }))
                } else {
                  setAgreement((prev) => ({
                    ...prev,
                    sideQuests: prev.sideQuests.map((sq) => (sq.id === quest.id ? { ...sq, ...cleared } : sq)),
                    updatedAt: new Date().toISOString(),
                  }))
                }
              }}
              disabled={isProposed && !isRequester(currentCes)}
              className="text-xs px-2.5 py-1 rounded-full border border-lavender/10 text-lavender/40 hover:text-lavender/60 transition-all disabled:opacity-50"
            >
              Clear assignment 🌌
            </button>
          </div>
          {assignedNames.length > 0 && (
            <p className="text-[10px] text-lavender/40">Assigned to: {assignedNames.join(', ')} 🧭</p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-lavender/40">Assign by Role 🌀</p>
          <div className="flex flex-wrap gap-2">
            {EXCHANGE_ROLES.map((role) => {
              const selected = assignedRoles.includes(role)
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => onToggleRole(role)}
                  disabled={isProposed && !isRequester(currentCes)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all disabled:opacity-50 ${
                    selected
                      ? 'bg-gold-400/10 border-gold-400/30 text-gold-300'
                      : 'bg-void-900/40 border-lavender/10 text-lavender/50 hover:border-lavender/30'
                  }`}
                >
                  {selected && <Check className="w-3 h-3 inline" />} {role} 🔮
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const handleSign = useCallback(() => {
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
      scheduledMeetings: agreement.scheduledMeetings || [],
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
  }, [agreement, storage, updateExchangeAgreement, onSigned])

  function resetMeetingForm() {
    setScheduleMode(false)
    setEditingMeetingId(null)
    setMeetingTitle('')
    setMeetingStartDate('')
    setMeetingStartTime('')
    setMeetingEndTime('')
    setMeetingTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
    setMeetingLocation('')
    setMeetingNotes('')
  }

  function openNewMeetingForm() {
    resetMeetingForm()
    setMeetingTitle(`Session for ${agreement.mainQuest.title || 'our exchange'}`)
    setScheduleMode('new')
  }

  function openRescheduleForm(meeting: ScheduledMeeting) {
    setScheduleMode('reschedule')
    setEditingMeetingId(meeting.id)
    setMeetingTitle(meeting.title)
    setMeetingStartDate(parseDate(meeting.startAt))
    setMeetingStartTime(parseTime(meeting.startAt))
    setMeetingEndTime(parseTime(meeting.endAt))
    setMeetingTimeZone(meeting.timeZone)
    setMeetingLocation(meeting.location)
    setMeetingNotes(meeting.notes || '')
  }

  function handleSaveMeeting() {
    if (!meetingTitle.trim() || !meetingStartDate || !meetingStartTime || !meetingEndTime) {
      setError('Please fill in title, date, start time, and end time for the meeting.')
      return
    }
    const startAt = toISODateTime(meetingStartDate, meetingStartTime)
    const endAt = toISODateTime(meetingStartDate, meetingEndTime)
    if (!startAt || !endAt || new Date(endAt) <= new Date(startAt)) {
      setError('The meeting end time must be after the start time.')
      return
    }

    const now = new Date().toISOString()
    let nextMeetings: ScheduledMeeting[]

    if (scheduleMode === 'reschedule' && editingMeetingId) {
      nextMeetings = agreement.scheduledMeetings.map((m) =>
        m.id === editingMeetingId
          ? {
              ...m,
              title: meetingTitle.trim(),
              startAt,
              endAt,
              timeZone: meetingTimeZone,
              location: meetingLocation.trim(),
              notes: meetingNotes.trim(),
              status: 'rescheduled' as const,
              proposedByCes: currentCes,
              proposedByName: user?.name || 'Unknown being',
              confirmedByCes: [currentCes],
            }
          : m
      )
    } else {
      const newMeeting: ScheduledMeeting = {
        id: newId('meeting'),
        title: meetingTitle.trim(),
        startAt,
        endAt,
        timeZone: meetingTimeZone,
        location: meetingLocation.trim(),
        status: 'proposed' as const,
        proposedByCes: currentCes,
        proposedByName: user?.name || 'Unknown being',
        confirmedByCes: [currentCes],
        notes: meetingNotes.trim(),
      }
      nextMeetings = [...agreement.scheduledMeetings, newMeeting]
    }

    const next: ExchangeAgreement = {
      ...agreement,
      scheduledMeetings: nextMeetings,
      updatedAt: now,
    }

    setAgreement(next)
    if (isAgreed) {
      // Active agreements go through amendment flow
      const previousVersion = latestVersion?.version ?? 0
      const version: AgreementVersion = {
        version: previousVersion + 1,
        updatedAt: now,
        updatedByCes: currentCes,
        updatedByName: user?.name || 'Unknown being',
        changeSummary:
          scheduleMode === 'reschedule'
            ? `Rescheduled meeting: ${meetingTitle.trim()}`
            : `Proposed new meeting: ${meetingTitle.trim()}`,
        approvedBy: [currentCes],
        parties: agreement.parties,
        mainQuestDirective: agreement.mainQuestDirective,
        mainQuests: agreement.mainQuests,
        sideQuests: agreement.sideQuests,
        safetyReports: agreement.safetyReports,
      }
      const withAmendment: ExchangeAgreement = { ...next, pendingUpdate: version, status: 'proposed' }
      setAgreement(withAmendment)
      updateExchangeAgreement(withAmendment)
    } else {
      updateExchangeAgreement(next)
    }

    syncScheduledMeetingsToJourney(agreement.id, nextMeetings)
    resetMeetingForm()
  }

  function handleConfirmMeeting(meetingId: string) {
    const nextMeetings = agreement.scheduledMeetings.map((m) =>
      m.id === meetingId ? { ...m, status: 'confirmed' as const, confirmedByCes: Array.from(new Set([...(m.confirmedByCes || []), currentCes])) } : m
    )
    const next: ExchangeAgreement = { ...agreement, scheduledMeetings: nextMeetings, updatedAt: new Date().toISOString() }
    setAgreement(next)
    updateExchangeAgreement(next)
    syncScheduledMeetingsToJourney(agreement.id, nextMeetings)
  }

  function handleCancelMeeting(meetingId: string) {
    const nextMeetings = agreement.scheduledMeetings.map((m) => (m.id === meetingId ? { ...m, status: 'cancelled' as const } : m))
    const next: ExchangeAgreement = { ...agreement, scheduledMeetings: nextMeetings, updatedAt: new Date().toISOString() }
    setAgreement(next)
    updateExchangeAgreement(next)
    syncScheduledMeetingsToJourney(agreement.id, nextMeetings)
  }

  function handleRemoveMeeting(meetingId: string) {
    const nextMeetings = agreement.scheduledMeetings.filter((m) => m.id !== meetingId)
    const next: ExchangeAgreement = { ...agreement, scheduledMeetings: nextMeetings, updatedAt: new Date().toISOString() }
    setAgreement(next)
    updateExchangeAgreement(next)
    syncScheduledMeetingsToJourney(agreement.id, nextMeetings)
  }

  const providerCalendar = getExchangeCalendar(agreement.providerCes)
  const providerAvailability = providerCalendar?.availabilityBlocks || []
  const requesterProfile = findProfileByCES(agreement.requesterCes)
  const providerProfile = findProfileByCES(agreement.providerCes)

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
            <PartyContactCard
              label="Requester"
              ces={agreement.requesterCes}
              name={agreement.requesterName}
              profile={requesterProfile}
              currentCes={currentCes}
            />
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
            <PartyContactCard
              label="Provider"
              ces={agreement.providerCes}
              name={agreement.providerName || vendor?.name || 'Provider'}
              profile={providerProfile}
              currentCes={currentCes}
            />
          </div>
        </div>

        <div className="space-y-6">
          {/* Main Quest Directive */}
          <div className="rounded-xl border border-gold-400/10 bg-gold-400/[0.03] p-4">
            <label className="flex items-center gap-2 text-sm text-gold-400 mb-2">
              <ScrollText className="w-4 h-4" /> Main Quest Directive
            </label>
            <input
              value={mainQuestDirectiveTitle}
              onChange={(e) => setMainQuestDirectiveTitle(e.target.value)}
              onBlur={updateMainQuestDirective}
              placeholder="What is the central shared intention?"
              disabled={isProposed && !isRequester(currentCes)}
              className="w-full px-4 py-2.5 rounded-xl bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none mb-3 disabled:opacity-50"
            />
            <textarea
              value={mainQuestDirectiveDescription}
              onChange={(e) => setMainQuestDirectiveDescription(e.target.value)}
              onBlur={updateMainQuestDirective}
              placeholder="Describe the co-creation in a few sentences..."
              rows={3}
              disabled={isProposed && !isRequester(currentCes)}
              className="w-full px-4 py-2.5 rounded-xl bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none resize-none disabled:opacity-50"
            />
          </div>

          {/* Privacy Assurance */}
          <div className="rounded-xl border border-lavender/10 bg-void-800/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-gold-400" />
              <span className="text-sm text-lavender/70">Privacy Assurance</span>
            </div>
            <p className="text-xs text-lavender/50 mb-4">
              Each being shares how they will honor confidentiality and sovereignty in this exchange. Only edit your own assurance.
            </p>
            {(agreement.parties || []).map((party, idx) => {
              const isMe = party.ces === currentCes
              return (
                <div key={party.ces || idx} className="rounded-lg border border-lavender/10 bg-void-900/40 p-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-cream">
                      {party.name || 'New being'} {isMe && '<span className="text-lavender/40">(you)</span>'} · {party.role}
                    </span>
                  </div>
                  <textarea
                    value={party.privacyAssurance || ''}
                    onChange={(e) => isMe && handlePrivacyAssuranceChange(party.ces, e.target.value, party.privacyAgreed)}
                    onBlur={() => isMe && persistPrivacyAssurance(party.ces)}
                    placeholder={SACRED_PROMPT}
                    rows={3}
                    disabled={!isMe}
                    className="w-full px-3 py-2 rounded-lg bg-void-800/50 border border-lavender/10 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none resize-none disabled:opacity-50 mb-2"
                  />
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={party.privacyAgreed}
                      onChange={(e) => {
                        handlePrivacyAssuranceChange(party.ces, party.privacyAssurance || '', e.target.checked)
                        if (isMe) persistPrivacyAssurance(party.ces)
                      }}
                      disabled={!isMe}
                      className="mt-0.5 accent-gold-400 disabled:opacity-50"
                    />
                    <span className={`text-sm ${isMe ? 'text-lavender/70' : 'text-lavender/40'}`}>
                      I agree to honor the privacy and sovereignty of all beings.
                    </span>
                  </label>
                </div>
              )
            })}
          </div>

          {/* Manage Parties */}
          <div className="rounded-xl border border-lavender/10 bg-void-800/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gold-400" />
                <span className="text-sm text-lavender/70">Manage Parties</span>
              </div>
              {(!isProposed || isRequester(currentCes)) && (
                <button
                  onClick={handleAddParty}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all"
                >
                  <Plus className="w-3 h-3" /> Add Being
                </button>
              )}
            </div>
            {(agreement.parties || []).map((party, idx) => (
              <div key={party.ces || idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-2 items-start">
                <input
                  value={party.name}
                  onChange={(e) => handleUpdateParty(idx, { name: e.target.value })}
                  placeholder="Name"
                  disabled={isProposed && !isRequester(currentCes)}
                  className="sm:col-span-3 px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none disabled:opacity-50"
                />
                <input
                  value={party.ces}
                  onChange={(e) => handleUpdateParty(idx, { ces: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                  placeholder="C.E.S."
                  disabled={isProposed && !isRequester(currentCes)}
                  className="sm:col-span-3 px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none disabled:opacity-50"
                />
                <select
                  value={party.role}
                  onChange={(e) => handleUpdateParty(idx, { role: e.target.value as ExchangeRole })}
                  disabled={isProposed && !isRequester(currentCes)}
                  className="sm:col-span-4 px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream focus:border-gold-400/40 focus:outline-none appearance-none disabled:opacity-50"
                >
                  {EXCHANGE_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {(!isProposed || isRequester(currentCes)) && (
                  <button
                    onClick={() => handleRemoveParty(idx)}
                    className="sm:col-span-2 p-2 rounded-lg text-lavender/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mx-auto" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Main Quest */}
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
            <AssignmentChips
              quest={agreement.mainQuest}
              onToggleRole={handleToggleMainRole}
              onToggleCes={handleToggleMainCes}
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
                      <AssignmentChips
                        quest={q}
                        onToggleRole={(role) => handleToggleSideRole(q.id, role)}
                        onToggleCes={(ces, name) => handleToggleSideCes(q.id, ces, name)}
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
              <PeerPaymentActions agreement={agreement} />
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

          {/* ─── Dedication of Profits ─── */}
          <div className="rounded-xl border border-green-400/20 bg-green-400/5 p-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm text-lavender/70">
                <Heart className="w-4 h-4 text-green-400" /> Dedication of Profits
              </label>
              <button
                type="button"
                onClick={() => updateDedication({ enabled: !agreement.dedicationOfProfits?.enabled })}
                className={`px-3 py-1 rounded-full text-xs border transition-all ${
                  agreement.dedicationOfProfits?.enabled
                    ? 'bg-green-400/20 border-green-400/40 text-green-300'
                    : 'border-lavender/10 text-lavender/50 hover:border-lavender/30'
                }`}
              >
                {agreement.dedicationOfProfits?.enabled ? 'Enabled' : 'Enable'}
              </button>
            </div>
            {agreement.dedicationOfProfits?.enabled && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-lavender/60">Percentage dedicated:</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={agreement.dedicationOfProfits?.percentage ?? 99}
                    onChange={(e) => updateDedication({ percentage: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                    disabled={isProposed && !isRequester(currentCes)}
                    className="w-20 px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream focus:border-gold-400/40 focus:outline-none disabled:opacity-50"
                  />
                  <span className="text-sm text-lavender/60">%</span>
                </div>
                <div>
                  <p className="text-xs text-lavender/50 mb-2">Destinations:</p>
                  <div className="flex flex-wrap gap-2">
                    {defaultDedication.destinations.map((destination) => (
                      <button
                        key={destination}
                        type="button"
                        onClick={() => toggleDestination(destination)}
                        disabled={isProposed && !isRequester(currentCes)}
                        className={`px-3 py-1.5 rounded-full border text-xs transition-all ${
                          agreement.dedicationOfProfits?.destinations.includes(destination)
                            ? 'bg-green-400/20 border-green-400/40 text-green-300'
                            : 'border-lavender/10 text-lavender/50 hover:border-lavender/30'
                        } disabled:opacity-50`}
                      >
                        {destination}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-lavender/50 mb-1">Custom notes</label>
                  <textarea
                    value={agreement.dedicationOfProfits?.customNotes || ''}
                    onChange={(e) => updateDedication({ customNotes: e.target.value })}
                    placeholder="Any additional dedication intentions..."
                    rows={2}
                    disabled={isProposed && !isRequester(currentCes)}
                    className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none resize-none disabled:opacity-50"
                  />
                </div>
              </div>
            )}
            {!agreement.dedicationOfProfits?.enabled && (
              <p className="text-xs text-lavender/50 italic mt-2">
                The Heartlight Collective dedicates 99% of profits to Earth-Conscious Initiatives and Advanced Technology, Preserving Ancient Wisdom, Sovereign Interdependent Communities, Healing & Art, and ALL the Living. 1% covers operational costs.
              </p>
            )}
          </div>

          {/* ─── Schedule Section ─── */}
          <div className="rounded-xl border border-lavender/10 bg-void-800/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm text-lavender/70">
                <CalendarIcon className="w-4 h-4 text-gold-400" /> Schedule
              </label>
              {!scheduleMode && (
                <button
                  onClick={openNewMeetingForm}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all"
                >
                  <Clock className="w-3 h-3" /> Propose Session
                </button>
              )}
            </div>

            {providerAvailability.length > 0 && !scheduleMode && (
              <div className="mb-3 rounded-lg border border-lavender/10 bg-void-900/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-lavender/40 mb-2">Provider Availability 🌿</p>
                <div className="flex flex-wrap gap-2">
                  {providerAvailability.map((block) => (
                    <span key={block.id} className="text-xs px-2 py-1 rounded-full border border-lavender/10 text-lavender/50 bg-void-900/40">
                      {block.recurring && block.dayOfWeek != null
                        ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][block.dayOfWeek]
                        : block.date || 'Any day'}
                      : {block.startTime}–{block.endTime} {block.timeZone}
                      {block.type === 'unavailable' && ' · unavailable'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {agreement.scheduledMeetings.length === 0 && !scheduleMode && (
              <p className="text-xs text-lavender/40 italic">No sessions scheduled yet. Propose a time that honors both beings. 📅</p>
            )}

            {!scheduleMode && (
              <div className="space-y-2">
                {agreement.scheduledMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className={`rounded-lg border p-3 ${
                      meeting.status === 'confirmed'
                        ? 'border-green-400/20 bg-green-400/5'
                        : meeting.status === 'cancelled'
                          ? 'border-lavender/10 bg-void-900/40 opacity-50'
                          : meeting.status === 'rescheduled'
                            ? 'border-magenta-400/20 bg-magenta-400/5'
                            : 'border-lavender/10 bg-void-900/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-cream flex items-center gap-2 flex-wrap">
                          <CalendarDays className="w-3.5 h-3.5 text-lavender/40" />
                          {meeting.title}
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                              meeting.status === 'confirmed'
                                ? 'border-green-400/20 text-green-300 bg-green-400/10'
                                : meeting.status === 'cancelled'
                                  ? 'border-lavender/10 text-lavender/40 bg-lavender/5'
                                  : meeting.status === 'rescheduled'
                                    ? 'border-magenta-400/20 text-magenta-300 bg-magenta-400/10'
                                    : 'border-gold-400/20 text-gold-300 bg-gold-400/10'
                            }`}
                          >
                            {meeting.status} 🕐
                          </span>
                        </p>
                        <p className="text-xs text-lavender/50 mt-1">{formatMeetingTime(meeting)}</p>
                        {meeting.location && (
                          <p className="text-xs text-lavender/50 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {meeting.location}
                          </p>
                        )}
                        {meeting.notes && <p className="text-xs text-lavender/40 mt-1">{meeting.notes}</p>}
                      </div>
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {meeting.status !== 'cancelled' && meeting.status !== 'completed' && (
                          <>
                            {meeting.status === 'proposed' || meeting.status === 'rescheduled' ? (
                              <>
                                {(isRequester(currentCes) || isProvider(currentCes)) && !meeting.confirmedByCes?.includes(currentCes) && (
                                  <button
                                    onClick={() => handleConfirmMeeting(meeting.id)}
                                    className="text-[10px] px-2 py-1 rounded-full bg-green-400/10 border border-green-400/30 text-green-300 hover:bg-green-400/20 transition-all"
                                  >
                                    Confirm ✓
                                  </button>
                                )}
                                <button
                                  onClick={() => openRescheduleForm(meeting)}
                                  className="text-[10px] px-2 py-1 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all"
                                >
                                  Reschedule ⏳
                                </button>
                              </>
                            ) : null}
                            <button
                              onClick={() => window.open(googleCalendarEventUrl(meeting), '_blank', 'noopener,noreferrer')}
                              className="text-[10px] px-2 py-1 rounded-full bg-blue-400/10 border border-blue-400/30 text-blue-300 hover:bg-blue-400/20 transition-all"
                            >
                              Google 📅
                            </button>
                            <button
                              onClick={() => downloadICS(meeting)}
                              className="text-[10px] px-2 py-1 rounded-full bg-lavender/10 border border-lavender/30 text-lavender/70 hover:bg-lavender/20 transition-all"
                            >
                              .ics 📥
                            </button>
                            <button
                              onClick={() => handleCancelMeeting(meeting.id)}
                              className="text-[10px] px-2 py-1 rounded-full bg-magenta-400/10 border border-magenta-400/30 text-magenta-300 hover:bg-magenta-400/20 transition-all"
                            >
                              Cancel ✕
                            </button>
                            <button
                              onClick={() => handleRemoveMeeting(meeting.id)}
                              className="text-[10px] px-2 py-1 rounded-full bg-red-400/10 border border-red-400/30 text-red-300 hover:bg-red-400/20 transition-all"
                            >
                              Remove 🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {scheduleMode && (
              <div className="rounded-xl border border-gold-400/10 bg-gold-400/[0.03] p-4 space-y-3">
                <p className="text-sm text-gold-300 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" /> {scheduleMode === 'reschedule' ? 'Reschedule Session' : 'Propose New Session'}
                </p>
                <input
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="Session title"
                  className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={meetingStartDate}
                    onChange={(e) => setMeetingStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream focus:border-gold-400/40 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={meetingTimeZone}
                    onChange={(e) => setMeetingTimeZone(e.target.value)}
                    placeholder="Time zone (e.g. America/New_York)"
                    className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-lavender/40 mb-1 block">Start</label>
                    <input
                      type="time"
                      value={meetingStartTime}
                      onChange={(e) => setMeetingStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream focus:border-gold-400/40 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-lavender/40 mb-1 block">End</label>
                    <input
                      type="time"
                      value={meetingEndTime}
                      onChange={(e) => setMeetingEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream focus:border-gold-400/40 focus:outline-none"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                  placeholder="Location or video link"
                  className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
                />
                <textarea
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  placeholder="Notes or preparation requests"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none resize-none"
                />
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSaveMeeting}
                    className="flex-1 py-2 rounded-lg bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all text-xs"
                  >
                    {scheduleMode === 'reschedule' ? 'Save Reschedule' : 'Propose Session'} ✨
                  </button>
                  <button
                    onClick={resetMeetingForm}
                    className="px-4 py-2 rounded-lg border border-lavender/10 text-lavender/60 hover:text-cream hover:border-lavender/20 transition-all text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Version ledger */}
        {agreement.versions.length > 0 && (
          <div className="mt-6 pt-6 border-t border-lavender/10">
            <h4 className="text-xs uppercase tracking-widest text-lavender/40 font-sans mb-3 flex items-center gap-2">
              <ScrollText className="w-3.5 h-3.5" /> Agreement Update Ledger
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {agreement.versions.map((v) => (
                <div
                  key={v.version}
                  className="rounded-lg border border-lavender/10 bg-void-800/30 p-3 text-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-cream font-medium">Version {v.version}</span>
                    <span className="text-[10px] text-lavender/40">{new Date(v.updatedAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-lavender/60 mb-2">{v.changeSummary}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-lavender/40">by {v.updatedByName}</span>
                    {v.approvedBy.includes(agreement.requesterCes) && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-400/10 text-green-300 border border-green-400/20">Requester approved</span>
                    )}
                    {v.approvedBy.includes(agreement.providerCes) && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-400/10 text-blue-300 border border-blue-400/20">Provider approved</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-lavender/10">
          <div className="flex items-center justify-center mb-4">
            {isParty && agreement.status !== 'withdrawn' && (
              <button
                onClick={() => setShowWithdrawal(true)}
                className="text-xs px-3 py-1.5 rounded-full border border-magenta-400/30 text-magenta-300 hover:bg-magenta-400/10 transition-all"
              >
                Withdraw from Exchange 🌙
              </button>
            )}
          </div>

          {/* Active / agreed agreement: amendment flow */}
          {!isAgreed ? (
            !isProposed ? (
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
            )
          ) : (
            /* Active / agreed agreement: amendment flow */
            <div className="space-y-3">
              {hasPendingUpdate && (
                <div className="rounded-lg border border-gold-400/20 bg-gold-400/5 p-3 mb-3">
                  <p className="text-sm text-gold-300 mb-1 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Amendment pending approval
                  </p>
                  <p className="text-xs text-lavender/60 mb-2">{pendingUpdate!.changeSummary}</p>
                  <p className="text-xs text-lavender/40">
                    Proposed by {pendingUpdate!.updatedByName} on {new Date(pendingUpdate!.updatedAt).toLocaleString()}
                  </p>
                </div>
              )}

              {amendMode ? (
                <>
                  <div className="rounded-lg border border-lavender/10 bg-void-800/30 p-3">
                    <label className="text-xs text-lavender/50 mb-1 block">Amendment Summary *</label>
                    <textarea
                      value={amendSummary}
                      onChange={(e) => setAmendSummary(e.target.value)}
                      placeholder="What is changing in this amendment?"
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none resize-none mb-2"
                    />
                    <label className="text-xs text-lavender/50 mb-1 block">Note for co-creator (optional)</label>
                    <input
                      value={amendNote}
                      onChange={(e) => setAmendNote(e.target.value)}
                      placeholder="Any context for the other being..."
                      className="w-full px-3 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
                    />
                  </div>
                  {hasPendingUpdate ? (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleEditAndResubmitAmendment}
                        className="w-full py-3.5 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all inline-flex items-center justify-center gap-2"
                      >
                        <ArrowRight className="w-4 h-4" /> Edit & Resubmit Amendment
                      </motion.button>
                      <button
                        onClick={() => setAmendMode(false)}
                        className="w-full py-3 rounded-xl border border-lavender/10 text-lavender/60 hover:text-cream hover:border-lavender/20 transition-all"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleProposeAmendment}
                        className="w-full py-3.5 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all inline-flex items-center justify-center gap-2"
                      >
                        <ArrowRight className="w-4 h-4" /> Propose Amendment
                      </motion.button>
                      <button
                        onClick={() => setAmendMode(false)}
                        className="w-full py-3 rounded-xl border border-lavender/10 text-lavender/60 hover:text-cream hover:border-lavender/20 transition-all"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  {isParty && !hasPendingUpdate && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setAmendMode(true)}
                      className="w-full py-3.5 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all inline-flex items-center justify-center gap-2"
                    >
                      <PenLine className="w-4 h-4" /> Propose Amendment
                    </motion.button>
                  )}

                  {isParty && hasPendingUpdate && isPendingApprover && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleApproveAmendment}
                        className="w-full py-3.5 rounded-xl bg-green-400/10 border border-green-400/30 text-green-300 hover:bg-green-400/20 transition-all inline-flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve & Apply Amendment
                      </motion.button>
                      <button
                        onClick={() => setAmendMode(true)}
                        className="w-full py-3 rounded-xl border border-lavender/10 text-lavender/60 hover:text-cream hover:border-lavender/20 transition-all"
                      >
                        Edit & Resubmit
                      </button>
                      <button
                        onClick={handleRequestChanges}
                        className="w-full py-3 rounded-xl border border-lavender/10 text-lavender/60 hover:text-cream hover:border-lavender/20 transition-all"
                      >
                        Request Changes
                      </button>
                    </>
                  )}

                  {isParty && hasPendingUpdate && !isPendingApprover && (
                    <p className="text-center text-xs text-gold-400 flex items-center justify-center gap-1">
                      <CheckCircle className="w-3 h-3" /> You approved this amendment. Awaiting the other being.
                    </p>
                  )}

                  {!isParty && (
                    <p className="text-center text-xs text-lavender/50">
                      You are viewing this agreement as a witness.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
      {showWithdrawal && (
        <WithdrawalModal
          agreement={agreement}
          onClose={() => setShowWithdrawal(false)}
          onSubmit={handleWithdraw}
        />
      )}
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
