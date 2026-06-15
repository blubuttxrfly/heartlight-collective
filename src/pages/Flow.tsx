import { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  PenLine,
  CheckCircle2,
  Heart,
  Eye,
  EyeOff,
  Printer,
  Send,
  ChevronRight,
  FileText,
  Lock,
  Unlock,
  Sparkles,
  AlertTriangle,
  BookOpen,
  Store,
  Inbox,
  ClipboardList,
  Check,
  ScrollText,
  Activity,
  Users,
  Calendar,
  Clock,
  Plus,
  X,
  Download,
  HandHeart,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStorage } from '../lib/storage.tsx'
import { useSession } from '../lib/session.ts'
import { ExchangeAgreementEditor } from '../components/exchange/ExchangeAgreementEditor.tsx'
import { WithdrawalModal } from '../components/exchange/WithdrawalModal.tsx'
import { VendorInbox } from '../components/VendorInbox.tsx'
import { googleCalendarEventUrl, downloadICS, formatMeetingTime } from '../lib/calendar.ts'
import type {
  ExchangeJourney,
  CodeLogEntry,
  JourneyPhase,
  QuestItem,
  AgreementVersion,
  RayKey,
  ExchangeAgreement,
  AvailabilityBlock,
  ScheduledMeeting,
  AgreementParty,
  AgreementPartyWithdrawal,
  SafetyReport,
} from '../types/ces'

/* ─── Codes Data (inline for render, synced with Codes.tsx) ─── */
const CODES_DATA: { number: number; name: string; ray: string; color: string }[] = [
  { number: 1, name: 'Consent', ray: 'Red Ray', color: '#ef4444' },
  { number: 2, name: 'Care', ray: 'Orange Ray', color: '#f97316' },
  { number: 3, name: 'Sovereignty', ray: 'Yellow Ray', color: '#eab308' },
  { number: 4, name: 'Thrival', ray: 'Green Ray', color: '#22c55e' },
  { number: 5, name: 'Discernment & Repair', ray: 'Turquoise Ray', color: '#2dd4bf' },
  { number: 6, name: 'Sustainability & Communication', ray: 'Blue Ray', color: '#3b82f6' },
  { number: 7, name: 'Vision', ray: 'Indigo Ray', color: '#6366f1' },
  { number: 8, name: 'Sanctity of Experience', ray: 'Violet Ray', color: '#8b5cf6' },
  { number: 9, name: 'Authentic Joy', ray: 'Magenta Ray', color: '#d946ef' },
  { number: 10, name: 'Conscious Awareness', ray: 'Omni Ray', color: '#c0c0d8' },
  { number: 11, name: 'Sacred Service', ray: 'Elemental Ray', color: '#7a9e5a' },
  { number: 12, name: 'Co-Creation', ray: 'ALL Ray', color: '#e8d4ff' },
]

const JOURNEYS_KEY = 'hlc_exchange_journeys'
const AGREEMENTS_KEY = 'hlc_exchange_agreements'

function rayKeyFromCodeNumber(n: number): RayKey {
  return (CODES_DATA.find((c) => c.number === n)?.ray.split(' ')[0] as RayKey) ?? 'ALL'
}

function readJourneysFromStorage(): ExchangeJourney[] | null {
  try {
    const raw = localStorage.getItem(JOURNEYS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ExchangeJourney[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null
  } catch {
    return null
  }
}

function readAgreementsFromStorage(): ExchangeAgreement[] {
  try {
    const raw = localStorage.getItem(AGREEMENTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ExchangeAgreement[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function getLinkedAgreement(journey: ExchangeJourney): ExchangeAgreement | undefined {
  try {
    const agreements = JSON.parse(localStorage.getItem(AGREEMENTS_KEY) || '[]') as ExchangeAgreement[]
    return agreements.find((a) => a.id === journey.agreementId)
  } catch {
    return undefined
  }
}

function saveLinkedAgreement(agreement: ExchangeAgreement) {
  try {
    const raw = localStorage.getItem(AGREEMENTS_KEY) || '[]'
    const agreements = JSON.parse(raw) as ExchangeAgreement[]
    const next = agreements.map((a) => (a.id === agreement.id ? agreement : a))
    localStorage.setItem(AGREEMENTS_KEY, JSON.stringify(next))
  } catch (err) {
    console.warn('Failed to save linked agreement locally:', err)
  }
}

function applyApprovedAmendment(
  journey: ExchangeJourney,
  agreement: ExchangeAgreement,
  persistAgreement: (ag: ExchangeAgreement) => void
): { updatedJourney: ExchangeJourney; appliedVersion: AgreementVersion | undefined } {
  const now = new Date().toISOString()
  const pending = agreement.pendingUpdate
  if (!pending) return { updatedJourney: journey, appliedVersion: undefined }
  const fullyApproved =
    pending.approvedBy.includes(agreement.requesterCes) && pending.approvedBy.includes(agreement.providerCes)
  if (!fullyApproved) return { updatedJourney: journey, appliedVersion: undefined }

  const nextAgreement: ExchangeAgreement = {
    ...agreement,
    status: agreement.status === 'proposed' ? 'active' : agreement.status,
    pendingUpdate: undefined,
    versions: [...agreement.versions, pending],
    updatedAt: now,
  }

  const nextJourney: ExchangeJourney = {
    ...journey,
    mainQuest: {
      ...agreement.mainQuest,
      status: normalizeQuestStatus(journey.mainQuest.status),
      verifications: journey.mainQuest.verifications || [],
    },
    sideQuests: agreement.sideQuests.map((sq) => {
      const existing = journey.sideQuests.find((j) => j.id === sq.id)
      return existing
        ? { ...sq, status: normalizeQuestStatus(existing.status), verifications: existing.verifications || [] }
        : { ...sq, status: normalizeQuestStatus(sq.status), verifications: sq.verifications || [] }
    }),
    scheduledMeetings: agreement.scheduledMeetings ?? journey.scheduledMeetings ?? [],
    updatedAt: now,
  }

  persistAgreement(nextAgreement)
  return { updatedJourney: nextJourney, appliedVersion: pending }
}

function writeJourneysToStorage(journeys: ExchangeJourney[]) {
  try {
    localStorage.setItem(JOURNEYS_KEY, JSON.stringify(journeys))
  } catch {
    console.warn('Failed to write exchange journeys to localStorage')
  }
}

/* ─── Mock Journeys for prototype ─── */
const MOCK_JOURNEYS: ExchangeJourney[] = [
  {
    id: 'journey_01',
    agreementId: 'agreement_01',
    title: 'Natal Chart Reading & Cosmic Guidance',
    description: 'A comprehensive astrology reading exploring soul purpose, current transits, and heart-aligned next steps.',
    wishingCes: '987654321',
    wishingName: 'Seren Nova',
    coCreatorCes: '222222222',
    coCreatorName: 'Cosmic Bloom',
    status: 'active',
    currentPhase: 'during',
    selectedCodes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduledMeetings: [],
    logs: [
      {
        id: 'log_01',
        exchangeId: 'journey_01',
        authorCes: '987654321',
        authorName: 'Seren Nova',
        ray: 'Red',
        codeNumber: 1,
        timestamp: '2026-06-01T14:30:00Z',
        content:
          'Feeling clear about my boundaries entering this reading. I am open to what arrives but also know I can pause at any time.',
        visibility: 'public',
        phase: 'before',
        moodEnergy: 'Clear, grounded',
      },
      {
        id: 'log_02',
        exchangeId: 'journey_01',
        authorCes: '222222222',
        authorName: 'Cosmic Bloom',
        ray: 'Blue',
        codeNumber: 6,
        timestamp: '2026-06-02T09:15:00Z',
        content:
          "Sat with Seren's chart for a week before our session. Intentional pacing feels aligned with the Blue Ray. I will share reflections as they arise.",
        visibility: 'public',
        phase: 'before',
        moodEnergy: 'Patient, intentional',
      },
      {
        id: 'log_03',
        exchangeId: 'journey_01',
        authorCes: '987654321',
        authorName: 'Seren Nova',
        ray: 'Magenta',
        codeNumber: 9,
        timestamp: '2026-06-04T16:45:00Z',
        content:
          'The reading yesterday brought me such authentic joy. Seeing my chart reflected back to me felt like coming home. I wrote pages of notes and feel so seen.',
        visibility: 'public',
        phase: 'during',
        moodEnergy: 'Joyful, expansive',
      },
      {
        id: 'log_04',
        exchangeId: 'journey_01',
        authorCes: '987654321',
        authorName: 'Seren Nova',
        ray: 'Omni',
        codeNumber: 10,
        timestamp: '2026-06-05T08:20:00Z',
        content:
          'Integration day. Consciously noticing how the insights are weaving into my daily life. Not forcing it. Just watching.',
        visibility: 'private',
        phase: 'during',
        moodEnergy: 'Gentle, observant',
      },
    ],
    fulfillmentNotes: '',
    fulfillmentSignedAt: null,
    fulfillmentSignedBy: [],
    adaptationConsent: false,
    mainQuest: {
      id: 'mq_j01',
      title: 'Complete a 90-minute evolutionary astrology reading with integration support',
      description:
        'Deliver a comprehensive natal chart reading covering soul purpose, current transits, and heart-aligned next steps. Include a follow-up integration call.',
      status: 'in_progress',
      createdAt: '2026-06-01T10:00:00Z',
    },
    sideQuests: [
      {
        id: 'sq_j01_1',
        title: 'Prepare natal chart analysis in advance',
        status: 'completed',
        createdAt: '2026-06-01T10:00:00Z',
        completedAt: '2026-06-03T14:00:00Z',
      },
      {
        id: 'sq_j01_2',
        title: 'Schedule follow-up integration session',
        status: 'open',
        createdAt: '2026-06-01T10:00:00Z',
      },
    ],
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-05T08:20:00Z',
  },
  {
    id: 'journey_02',
    agreementId: 'agreement_02',
    title: 'Website Design for Sanctuary Portals',
    description: 'Co-creating a sacred digital space for Atlas Island event coordination and community gathering.',
    wishingCes: '111111111',
    wishingName: 'Atlas Morphoenix',
    coCreatorCes: '333333333',
    coCreatorName: 'Web Weaver',
    status: 'fulfillment_review',
    currentPhase: 'after',
    selectedCodes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    scheduledMeetings: [],
    logs: [
      {
        id: 'log_10',
        exchangeId: 'journey_02',
        authorCes: '333333333',
        authorName: 'Web Weaver',
        ray: 'Indigo',
        codeNumber: 7,
        timestamp: '2026-05-15T10:00:00Z',
        content:
          'Aligned on the vision: a warm, welcoming portal that feels like stepping into a sanctuary. No urgency, only resonance.',
        visibility: 'public',
        phase: 'before',
        moodEnergy: 'Visionary, grounded',
      },
      {
        id: 'log_11',
        exchangeId: 'journey_02',
        authorCes: '111111111',
        authorName: 'Atlas Morphoenix',
        ray: 'Red',
        codeNumber: 1,
        timestamp: '2026-05-20T12:30:00Z',
        content:
          'Consent check-in: The midway review felt good. Both of us had space to say what was working and what needed adjustment. The design shifted based on what felt true.',
        visibility: 'public',
        phase: 'during',
        moodEnergy: 'Collaborative, clear',
      },
      {
        id: 'log_12',
        exchangeId: 'journey_02',
        authorCes: '333333333',
        authorName: 'Web Weaver',
        ray: 'Blue',
        codeNumber: 6,
        timestamp: '2026-05-22T15:00:00Z',
        content:
          'Communication has been flowing well. We check in about once per week, sometimes more when there is momentum. It never feels forced.',
        visibility: 'public',
        phase: 'during',
        moodEnergy: 'Flowing, communicative',
      },
    ],
    fulfillmentNotes:
      'The portal is complete and feels like a true sanctuary. Atlas and I both feel this exchange was aligned and joyful. Ready to sign off.',
    fulfillmentSignedAt: null,
    fulfillmentSignedBy: [],
    adaptationConsent: false,
    mainQuest: {
      id: 'mq_j02',
      title: 'Design and build the Sanctuary Portals website',
      description:
        'Create a warm, welcoming digital portal for Atlas Island event coordination. Include event listings, registration flow, and community gathering spaces.',
      status: 'in_progress',
      createdAt: '2026-05-10T09:00:00Z',
    },
    sideQuests: [
      {
        id: 'sq_j02_1',
        title: 'Create wireframes and design system',
        status: 'completed',
        createdAt: '2026-05-10T09:00:00Z',
        completedAt: '2026-05-14T18:00:00Z',
      },
      {
        id: 'sq_j02_2',
        title: 'Build core pages and navigation',
        status: 'completed',
        createdAt: '2026-05-10T09:00:00Z',
        completedAt: '2026-05-20T18:00:00Z',
      },
      {
        id: 'sq_j02_3',
        title: 'Event registration and RSVP flow',
        status: 'in_progress',
        createdAt: '2026-05-10T09:00:00Z',
      },
    ],
    createdAt: '2026-05-10T09:00:00Z',
    updatedAt: '2026-05-25T18:00:00Z',
  },
]

/* ─── Helpers ─── */
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

function hasOtherPartyApproved(quest: QuestItem, currentCes: string): boolean {
  const verifications = quest.verifications || []
  return verifications.some((v) => v.verifierCes !== currentCes && v.status === 'approved')
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  return `${weeks}w ago`
}

function codeColor(n: number) {
  return CODES_DATA.find((c) => c.number === n)?.color ?? '#c0c0d8'
}

/* ─── Journey Card ─── */
function JourneyCard({
  journey,
  isActive,
  onSelect,
}: {
  journey: ExchangeJourney
  isActive: boolean
  onSelect: () => void
}) {
  const lastLog = journey.logs[journey.logs.length - 1]
  const statusColor =
    journey.status === 'active'
      ? 'border-green-500/20 bg-green-500/5 text-green-400'
      : journey.status === 'fulfillment_review'
        ? 'border-magenta-400/20 bg-magenta-400/5 text-magenta-400'
        : journey.status === 'complete'
          ? 'border-gold-400/20 bg-gold-400/5 text-gold-400'
          : 'border-lavender/10 bg-lavender/5 text-lavender/40'

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl border p-3.5 transition-all ${
        isActive
          ? 'border-gold-400/30 bg-gold-400/5'
          : 'border-lavender/10 bg-void-800/40 hover:border-lavender/20 hover:bg-void-800/60'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColor}`}>
          {journey.status.replace('_', ' ')}
        </span>
        {lastLog && <span className="text-[10px] text-lavender/30">{timeAgo(lastLog.timestamp)}</span>}
      </div>
      <h4 className="text-sm font-medium text-cream mb-1 leading-snug">{journey.title}</h4>
      <div className="flex items-center gap-1.5 text-[10px] text-lavender/40">
        <span>{journey.wishingName}</span>
        <ChevronRight className="w-3 h-3" />
        <span>{journey.coCreatorName}</span>
      </div>
      <div className="mt-2 h-1 rounded-full w-full overflow-hidden flex">
        {CODES_DATA.map((code) => (
          <div key={code.number} className="flex-1 h-full" style={{ background: code.color + '80' }} />
        ))}
      </div>
      <p className="text-[10px] text-lavender/30 mt-1">12 Ray Frequencies of ALL</p>
    </button>
  )
}

/* ─── Phase Tab ─── */
function PhaseTab({
  label,
  phase,
  current,
  onClick,
}: {
  label: string
  phase: JourneyPhase
  current: JourneyPhase
  onClick: () => void
}) {
  const isActive = phase === current
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-xs font-medium transition-all relative ${
        isActive ? 'text-cream' : 'text-lavender/40 hover:text-lavender/70'
      }`}
    >
      {label}
      {isActive && (
        <motion.div layoutId="phase-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400 rounded-full" />
      )}
    </button>
  )
}

/* ─── Log Entry ─── */
function LogEntry({ entry, isAuthor }: { entry: CodeLogEntry; isAuthor: boolean }) {
  const isPrivate = entry.visibility === 'private'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 ${
        isPrivate ? 'border-lavender/10 bg-void-900/40' : 'border-lavender/10 bg-void-800/40'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border"
            style={{ borderColor: codeColor(entry.codeNumber) + '40', color: codeColor(entry.codeNumber) }}
          >
            {entry.codeNumber}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: codeColor(entry.codeNumber) }} />
            <span className="text-[10px] font-medium" style={{ color: codeColor(entry.codeNumber) + 'aa' }}>
              {entry.ray} Ray
            </span>
            <span className="text-xs text-cream font-medium">{entry.authorName}</span>
            {isPrivate && <EyeOff className="w-3 h-3 text-lavender/30" />}
            <span className="text-[10px] text-lavender/30">{timeAgo(entry.timestamp)}</span>
          </div>
          <p className="text-sm text-lavender/70 leading-relaxed">{entry.content}</p>
          {entry.moodEnergy && <span className="inline-block mt-2 text-[10px] text-lavender/30">{entry.moodEnergy}</span>}
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Quest Tracker ─── */
function QuestTracker({
  journey,
  currentCes,
  currentName,
  selectedCodeNum,
  storage,
  onJourneyUpdate,
  agreement,
  autoAppliedNotice,
  onClearAutoNotice,
}: {
  journey: ExchangeJourney
  currentCes: string
  currentName: string
  selectedCodeNum: number
  storage: ReturnType<typeof useStorage>
  onJourneyUpdate: (j: ExchangeJourney) => void
  agreement?: ExchangeAgreement
  autoAppliedNotice?: { summary: string; updatedAt: string } | null
  onClearAutoNotice?: () => void
}) {
  const allQuests = useMemo(() => [journey.mainQuest, ...journey.sideQuests], [journey])
  const completedCount = useMemo(() => allQuests.filter((q) => q.status === 'completed').length, [allQuests])
  const inVerificationCount = useMemo(() => allQuests.filter((q) => q.status === 'verification_pending').length, [allQuests])
  const percent = allQuests.length > 0 ? Math.round(((completedCount + inVerificationCount) / allQuests.length) * 100) : 0
  const isJourneyActive = journey.status === 'active'

  const pendingUpdate = agreement?.pendingUpdate
  const hasPendingUpdate = Boolean(pendingUpdate)
  const pendingApprovedBy = pendingUpdate?.approvedBy ?? []
  const remainingParty = pendingApprovedBy.includes(agreement?.requesterCes ?? '')
    ? agreement?.providerName || 'Provider'
    : agreement?.requesterName || 'Requester'

  const latestVersion = agreement?.versions?.[agreement.versions.length - 1]

  function canCompleteQuest(quest: QuestItem) {
    if (!isJourneyActive || !currentCes) return false
    const isInvolved = currentCes === journey.wishingCes || currentCes === journey.coCreatorCes
    if (!isInvolved) return false
    const assignedCes = getAssignedCesList(quest)
    // If unassigned, any involved party can start / mark done
    if (assignedCes.length > 0 && !assignedCes.includes(currentCes)) return false
    // Only allow moving open/in_progress to verification_pending
    return quest.status === 'open' || quest.status === 'in_progress'
  }

  function canVerifyQuest(quest: QuestItem) {
    if (!isJourneyActive || !currentCes) return false
    const isInvolved = currentCes === journey.wishingCes || currentCes === journey.coCreatorCes
    if (!isInvolved) return false
    // You cannot verify your own submission
    if (quest.completedByCes === currentCes) return false
    return quest.status === 'verification_pending'
  }

  function canRequestMoreWork(quest: QuestItem) {
    return canVerifyQuest(quest)
  }

  function handleMarkDone(quest: QuestItem) {
    if (!canCompleteQuest(quest)) return
    const now = new Date().toISOString()
    const markedQuest: QuestItem = {
      ...quest,
      status: 'verification_pending',
      completedAt: now,
      completedByCes: currentCes,
      completedByName: currentName,
      verifications: quest.verifications || [],
    }
    updateQuest(markedQuest)
  }

  function handleVerifyQuest(quest: QuestItem) {
    if (!canVerifyQuest(quest)) return
    const now = new Date().toISOString()
    const verification = {
      verifierCes: currentCes,
      verifierName: currentName,
      verifiedAt: now,
      status: 'approved' as const,
      note: '',
    }
    const approvedQuest: QuestItem = {
      ...quest,
      status: 'completed',
      verifications: [...(quest.verifications || []), verification],
    }
    updateQuest(approvedQuest, { mainQuestToFulfillmentReview: quest.id === journey.mainQuest.id })
  }

  function handleRequestMoreWork(quest: QuestItem) {
    if (!canRequestMoreWork(quest)) return
    const now = new Date().toISOString()
    const rejection = {
      verifierCes: currentCes,
      verifierName: currentName,
      verifiedAt: now,
      status: 'rejected' as const,
      note: '',
    }
    const reopenedQuest: QuestItem = {
      ...quest,
      status: 'in_progress',
      verifications: [...(quest.verifications || []), rejection],
    }
    updateQuest(reopenedQuest)
  }

  function updateQuest(updatedQuest: QuestItem, opts?: { mainQuestToFulfillmentReview?: boolean }) {
    const now = new Date().toISOString()
    const isMain = updatedQuest.id === journey.mainQuest.id

    const nextMainQuest = isMain ? updatedQuest : journey.mainQuest
    const nextSideQuests = journey.sideQuests.map((q) => (q.id === updatedQuest.id ? updatedQuest : q))

    let nextJourneyStatus = journey.status
    if (opts?.mainQuestToFulfillmentReview && updatedQuest.status === 'completed') {
      nextJourneyStatus = 'fulfillment_review'
    }

    const codeEntry = CODES_DATA.find((c) => c.number === selectedCodeNum)
    const selectedRay = rayKeyFromCodeNumber(selectedCodeNum)
    const actionLabel =
      updatedQuest.status === 'verification_pending'
        ? 'marked as ready for verification'
        : updatedQuest.status === 'completed'
          ? 'verified and completed'
          : updatedQuest.status === 'in_progress'
            ? 'returned to in progress'
            : 'updated'

    const newLog: CodeLogEntry = {
      id: `log_${Date.now()}`,
      exchangeId: journey.id,
      authorCes: currentCes,
      authorName: currentName,
      ray: selectedRay,
      codeNumber: codeEntry?.number ?? 12,
      timestamp: now,
      content: `Quest ${actionLabel}: ${updatedQuest.title} — by ${currentName} on ${new Date(now).toLocaleDateString()}`,
      visibility: 'public',
      phase: 'during',
      moodEnergy: 'Aligned, accountable',
    }

    const updatedJourney: ExchangeJourney = {
      ...journey,
      status: nextJourneyStatus,
      mainQuest: nextMainQuest,
      sideQuests: nextSideQuests,
      logs: [...journey.logs, newLog],
      updatedAt: now,
    }

    onJourneyUpdate(updatedJourney)
    syncQuestToAgreement(updatedQuest)
  }

  function syncQuestToAgreement(quest: QuestItem) {
    try {
      const hasAgreementHelpers =
        typeof (storage as any).updateAgreementQuest === 'function' &&
        typeof (storage as any).addAgreementVersion === 'function' &&
        typeof (storage as any).getExchangeAgreements === 'function'

      if (hasAgreementHelpers) {
        ;(storage as any).updateAgreementQuest(journey.agreementId, quest.id, {
          status: quest.status,
          completedAt: quest.completedAt,
          completedByCes: quest.completedByCes,
          completedByName: quest.completedByName,
          verifications: quest.verifications,
        })

        const agreements = (storage as any).getExchangeAgreements() as { id: string; versions: AgreementVersion[] }[]
        const linked = agreements.find((a) => a.id === journey.agreementId)
        const previousVersion = linked?.versions?.length ? linked.versions[linked.versions.length - 1].version : 0

        const version: AgreementVersion = {
          version: previousVersion + 1,
          updatedAt: new Date().toISOString(),
          updatedByCes: currentCes,
          updatedByName: currentName,
          changeSummary: `Quest ${quest.status}: ${quest.title}`,
          approvedBy: [currentCes],
        }
        ;(storage as any).addAgreementVersion(journey.agreementId, version)
      } else {
        const raw = localStorage.getItem(AGREEMENTS_KEY) || '[]'
        const agreements = JSON.parse(raw) as {
          id: string
          mainQuest?: QuestItem
          sideQuests?: QuestItem[]
          versions?: AgreementVersion[]
          updatedAt?: string
        }[]
        const nextAgreements = agreements.map((ag) => {
          if (ag.id !== journey.agreementId) return ag
          const next = { ...ag, updatedAt: new Date().toISOString() }
          if (next.mainQuest?.id === quest.id) {
            next.mainQuest = {
              ...next.mainQuest,
              status: quest.status,
              completedAt: quest.completedAt,
              completedByCes: quest.completedByCes,
              completedByName: quest.completedByName,
              verifications: quest.verifications,
            }
          } else if (next.sideQuests) {
            next.sideQuests = next.sideQuests.map((q) =>
              q.id === quest.id
                ? {
                    ...q,
                    status: quest.status,
                    completedAt: quest.completedAt,
                    completedByCes: quest.completedByCes,
                    completedByName: quest.completedByName,
                    verifications: quest.verifications,
                  }
                : q
            )
          }
          const versions = next.versions ?? []
          const previousVersion = versions.length > 0 ? versions[versions.length - 1].version : 0
          next.versions = [
            ...versions,
            {
              version: previousVersion + 1,
              updatedAt: new Date().toISOString(),
              updatedByCes: currentCes,
              updatedByName: currentName,
              changeSummary: `Quest ${quest.status}: ${quest.title}`,
              approvedBy: [currentCes],
            },
          ]
          return next
        })
        localStorage.setItem(AGREEMENTS_KEY, JSON.stringify(nextAgreements))
      }
    } catch (err) {
      console.warn('Failed to sync quest update to agreement:', err)
    }
  }

  function statusBadge(status: QuestItem['status']) {
    switch (status) {
      case 'completed':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-green-400/20 bg-green-400/10 text-green-300">
            ✓ Completed
          </span>
        )
      case 'verification_pending':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-magenta-400/20 bg-magenta-400/10 text-magenta-300">
            🔍 Verification Pending
          </span>
        )
      case 'in_progress':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-blue-400/20 bg-blue-400/10 text-blue-300">
            🌊 In Progress
          </span>
        )
      case 'open':
      default:
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-lavender/10 bg-lavender/5 text-lavender/50">
            🌌 Open
          </span>
        )
    }
  }

  function QuestRow({ quest, isMain }: { quest: QuestItem; isMain?: boolean }) {
    const status = normalizeQuestStatus(quest.status)
    const isCompleted = status === 'completed'
    const isVerificationPending = status === 'verification_pending'
    const canMark = canCompleteQuest(quest)
    const canVerify = canVerifyQuest(quest)
    const canReject = canRequestMoreWork(quest)
    const assignedNames = getAssignedNames(quest)

    return (
      <div
        className={`rounded-xl border p-4 transition-all ${
          isCompleted
            ? 'border-green-400/20 bg-green-400/5'
            : isVerificationPending
              ? 'border-magenta-400/20 bg-magenta-400/5'
              : isMain
                ? 'border-gold-400/30 bg-gold-400/5'
                : 'border-lavender/10 bg-void-800/40'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 pt-0.5">{statusBadge(status)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`font-medium leading-snug ${isMain ? 'text-cream' : 'text-lavender/80'}`}>
                {quest.title}
              </span>
              {assignedNames.length > 0 ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-lavender/10 text-lavender/50 bg-void-900/40">
                  🧭 {assignedNames.join(', ')}
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-lavender/10 text-lavender/50 bg-void-900/40">
                  🌐 Open
                </span>
              )}
              {isMain && (
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-gold-400/20 text-gold-400/70 bg-gold-400/10">
                  ☀ Main Quest
                </span>
              )}
            </div>
            {quest.description && <p className="text-xs text-lavender/50 leading-relaxed mb-2">{quest.description}</p>}

            {isVerificationPending && quest.completedByName && (
              <p className="text-[10px] text-lavender/40 mb-2">
                Marked ready by {quest.completedByName} · {quest.completedAt ? timeAgo(quest.completedAt) : 'recently'} 🕊️
              </p>
            )}

            {canMark && (
              <button
                onClick={() => handleMarkDone(quest)}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all mb-2"
              >
                <Check className="w-3 h-3" /> Mark as Done ✨
              </button>
            )}

            {isVerificationPending && (canVerify || canReject) && (
              <div className="flex flex-wrap gap-2 mb-2">
                {canVerify && (
                  <button
                    onClick={() => handleVerifyQuest(quest)}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-green-400/10 border border-green-400/30 text-green-300 hover:bg-green-400/20 transition-all"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Verify Completion 🌿
                  </button>
                )}
                {canReject && (
                  <button
                    onClick={() => handleRequestMoreWork(quest)}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-magenta-400/10 border border-magenta-400/30 text-magenta-300 hover:bg-magenta-400/20 transition-all"
                  >
                    <AlertTriangle className="w-3 h-3" /> Request More Work 🌀
                  </button>
                )}
              </div>
            )}

            {isCompleted && quest.verifications && quest.verifications.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider text-lavender/40">Verification History 🔮</p>
                {quest.verifications.map((v) => (
                  <div
                    key={`${v.verifierCes}-${v.verifiedAt}`}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                      v.status === 'approved'
                        ? 'border-green-400/20 bg-green-400/5 text-green-300'
                        : 'border-magenta-400/20 bg-magenta-400/5 text-magenta-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{v.verifierName}</span>
                      <span className="text-[10px] text-lavender/40">{timeAgo(v.verifiedAt)}</span>
                    </div>
                    <span className="text-[10px] text-lavender/60">
                      {v.status === 'approved' ? '✓ Verified' : '↩ Requested more work'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-lavender/10 bg-void-800/30 p-5 space-y-4">
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-serif text-lg text-cream flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-gold-400" /> Quest Tracker
        </h4>
        <span className="text-xs text-gold-400/70">{percent}% complete</span>
      </div>

      {autoAppliedNotice && (
        <div className="rounded-lg border border-green-400/20 bg-green-400/5 p-3 text-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="text-green-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Exchange Agreement amendment auto-applied
            </p>
            {onClearAutoNotice && (
              <button onClick={onClearAutoNotice} className="text-xs text-lavender/40 hover:text-cream">
                Dismiss
              </button>
            )}
          </div>
          <p className="text-lavender/60 mt-1">{autoAppliedNotice.summary}</p>
          <p className="text-[10px] text-lavender/40 mt-0.5">{new Date(autoAppliedNotice.updatedAt).toLocaleString()}</p>
        </div>
      )}

      {hasPendingUpdate && pendingUpdate && (
        <div className="rounded-lg border border-magenta-400/20 bg-magenta-400/5 p-3 text-sm">
          <p className="text-magenta-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Exchange Agreement update pending approval by {remainingParty}
          </p>
          <p className="text-lavender/60 mt-1">{pendingUpdate.changeSummary}</p>
          <p className="text-[10px] text-lavender/40 mt-0.5">{new Date(pendingUpdate.updatedAt).toLocaleString()}</p>
        </div>
      )}

      <div className="w-full h-1.5 rounded-full bg-lavender/10 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-gold-400/80 to-gold-300 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <QuestRow quest={journey.mainQuest} isMain />

      {journey.sideQuests.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-lavender/40 font-sans">Side Quests</p>
          {journey.sideQuests.map((quest) => (
            <QuestRow key={quest.id} quest={quest} />
          ))}
        </div>
      )}

      {!isJourneyActive && (
        <p className="text-xs text-lavender/40 italic">Quests can be completed once the journey is active.</p>
      )}

      {isJourneyActive && inVerificationCount > 0 && (
        <p className="text-xs text-magenta-300 italic">
          {inVerificationCount} quest{inVerificationCount !== 1 ? 's' : ''} awaiting verification from the other party.
        </p>
      )}

      {agreement && agreement.versions.length > 0 && (
        <div className="pt-4 border-t border-lavender/10">
          <p className="text-[10px] uppercase tracking-widest text-lavender/40 font-sans mb-2">Agreement Update Ledger</p>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {agreement.versions.map((v) => (
              <div key={v.version} className="rounded-lg border border-lavender/10 bg-void-900/40 p-2.5 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gold-400/70">v{v.version}</span>
                  <span className="text-[10px] text-lavender/40">{new Date(v.updatedAt).toLocaleString()}</span>
                </div>
                <p className="text-lavender/70">{v.changeSummary}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-lavender/50">by {v.updatedByName}</span>
                  <div className="flex gap-1">
                    {v.approvedBy.includes(agreement.requesterCes) && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-400/10 text-green-300 border border-green-400/20">
                        {agreement.requesterName}
                      </span>
                    )}
                    {v.approvedBy.includes(agreement.providerCes) && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-400/10 text-blue-300 border border-blue-400/20">
                        {agreement.providerName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Flow View Types ─── */
type FlowView = 'dashboard' | 'journeys' | 'vendor-inbox' | 'journey-detail' | 'agreements' | 'exchanges' | 'quest-tracker' | 'present-journal' | 'calendar'

/* ─── Dashboard Card ─── */
function AspectCard({
  icon: Icon,
  label,
  count,
  subtitle,
  color,
  onClick,
}: {
  icon: typeof BookOpen
  label: string
  count: number
  subtitle: string
  color: string
  onClick: () => void
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="text-left rounded-2xl border border-lavender/10 bg-void-800/40 p-5 hover:border-lavender/20 transition-all w-full"
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center border"
          style={{ borderColor: color + '30', background: color + '10' }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-cream">{label}</h3>
          <p className="text-xs text-lavender/40">{count} active</p>
        </div>
      </div>
      <p className="text-xs text-lavender/50">{subtitle}</p>
    </motion.button>
  )
}

/* ─── Main Page ─── */
export default function Flow() {
  const storage = useStorage()
  const { user } = useSession()
  const currentCes = user?.ces ?? ''
  const currentName = user?.name ?? 'Unknown being'

  const [journeys, setJourneys] = useState<ExchangeJourney[]>(() => {
    const real = readJourneysFromStorage()
    return real ?? MOCK_JOURNEYS
  })

  const agreements = useMemo<ExchangeAgreement[]>(() => {
    const fromStorage = storage.getExchangeAgreements()
    return fromStorage.length > 0 ? fromStorage : readAgreementsFromStorage()
  }, [storage])

  const myAgreements = useMemo(
    () => agreements.filter((a) => a.requesterCes === currentCes || a.providerCes === currentCes || a.parties?.some((p) => p.ces === currentCes)),
    [agreements, currentCes]
  )

  const [selectedJourneyId, setSelectedJourneyId] = useState<string>(journeys[0]?.id ?? '')
  const [view, setView] = useState<FlowView>('dashboard')
  const [activePhase, setActivePhase] = useState<JourneyPhase>('during')
  const [newLogContent, setNewLogContent] = useState('')
  const [selectedCodeNum, setSelectedCodeNum] = useState(1)
  const [logVisibility, setLogVisibility] = useState<'private' | 'public'>('public')
  const [autoAppliedNotice, setAutoAppliedNotice] = useState<{ summary: string; updatedAt: string } | null>(null)
  const [selectedAgreement, setSelectedAgreement] = useState<ExchangeAgreement | null>(null)
  const [withdrawingAgreement, setWithdrawingAgreement] = useState<ExchangeAgreement | null>(null)

  const persistAgreement = useCallback(
    (ag: ExchangeAgreement) => {
      if ('updateExchangeAgreement' in storage && typeof (storage as any).updateExchangeAgreement === 'function') {
        ;(storage as any).updateExchangeAgreement(ag)
      }
      saveLinkedAgreement(ag)
    },
    [storage]
  )

  const persistJourneys = useCallback((next: ExchangeJourney[]) => {
    setJourneys(next)
    writeJourneysToStorage(next)
  }, [])

  const maybeApplyAmendment = useCallback(
    (j: ExchangeJourney) => {
      const agreement = getLinkedAgreement(j)
      if (!agreement?.pendingUpdate) return j
      const { updatedJourney, appliedVersion } = applyApprovedAmendment(j, agreement, persistAgreement)
      if (appliedVersion) {
        setAutoAppliedNotice({ summary: appliedVersion.changeSummary, updatedAt: appliedVersion.updatedAt })
      }
      return updatedJourney
    },
    [persistAgreement]
  )

  useEffect(() => {
    // Auto-apply any fully-approved pending agreement updates on load or when the journey list changes.
    const updated = journeys.map(maybeApplyAmendment)
    const changed = updated.some((j, idx) => j !== journeys[idx])
    if (changed) {
      persistJourneys(updated)
    }
  }, [])

  const updateJourney = useCallback(
    (updated: ExchangeJourney) => {
      const next = journeys.map((j) => (j.id === updated.id ? updated : j))
      persistJourneys(next)
    },
    [journeys, persistJourneys]
  )

  useEffect(() => {
    // Keep selected journey valid if the list changes
    if (journeys.length > 0 && !journeys.find((j) => j.id === selectedJourneyId)) {
      setSelectedJourneyId(journeys[0].id)
    }
  }, [journeys, selectedJourneyId])

  const journey = useMemo(
    () => journeys.find((j) => j.id === selectedJourneyId) ?? journeys[0],
    [journeys, selectedJourneyId]
  )

  // Filter logs by phase + visibility (show public logs + the author's private logs)
  const visibleLogs = useMemo(() => {
    if (!journey) return []
    return journey.logs
      .filter((l) => l.phase === activePhase)
      .filter((l) => l.visibility === 'public' || l.authorCes === currentCes)
  }, [journey, activePhase, currentCes])

  const addLogEntry = useCallback(() => {
    if (!journey || !newLogContent.trim()) return
    const selectedRay = rayKeyFromCodeNumber(selectedCodeNum)
    const newLog: CodeLogEntry = {
      id: `log_${Date.now()}`,
      exchangeId: journey.id,
      authorCes: currentCes,
      authorName: currentName,
      ray: selectedRay,
      codeNumber: selectedCodeNum,
      timestamp: new Date().toISOString(),
      content: newLogContent.trim(),
      visibility: logVisibility,
      phase: activePhase,
      moodEnergy: 'Clear, intentional',
    }
    const updated = { ...journey, logs: [...journey.logs, newLog] }
    updateJourney(updated)
    setNewLogContent('')
  }, [newLogContent, selectedCodeNum, logVisibility, activePhase, journey, currentCes, currentName, updateJourney])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const selectJourney = useCallback(
    (id: string) => {
      let j = journeys.find((x) => x.id === id)
      if (!j) return
      j = maybeApplyAmendment(j)
      if (j !== journeys.find((x) => x.id === id)) {
        const next = journeys.map((existing) => (existing.id === id ? j! : existing))
        persistJourneys(next)
      }
      setSelectedJourneyId(id)
      setActivePhase(j.currentPhase)
      setView('journey-detail')
    },
    [journeys, maybeApplyAmendment, persistJourneys]
  )

  const handleAgreementWithdraw = useCallback(
    (agreement: ExchangeAgreement) => (withdrawal: AgreementPartyWithdrawal, safetyReport?: SafetyReport) => {
      storage.submitAgreementWithdrawal(agreement.id, currentCes, withdrawal, safetyReport)
      setWithdrawingAgreement(null)
    },
    [storage, currentCes]
  )

  return (
    <div className="px-4 pb-12 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-lavender/60 hover:text-gold-400 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Collective
        </Link>
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6 mb-4">
        <Heart className="w-8 h-8 text-gold-400 mx-auto mb-3" />
        <h1 className="font-serif text-2xl md:text-3xl text-cream mb-2">Flow</h1>
        <p className="text-lavender/60 max-w-lg mx-auto text-sm">
          Your living dashboard for all exchanges — agreements, active journeys, quest tracking, and present-moment
          reflection.
        </p>
      </motion.div>

      {/* ─── DASHBOARD VIEW ─── */}
      {view === 'dashboard' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <AspectCard
              icon={ScrollText}
              label="Agreements"
              count={myAgreements.length}
              subtitle="Co-created, consented, and living agreements you are part of"
              color="#eab308"
              onClick={() => setView('agreements')}
            />
            <AspectCard
              icon={Activity}
              label="Exchanges"
              count={journeys.length}
              subtitle="Overview of active co-creation journeys and quick stats"
              color="#22c55e"
              onClick={() => setView('exchanges')}
            />
            <AspectCard
              icon={ClipboardList}
              label="Quest Tracker"
              count={journeys.filter((j) => j.status === 'active').length}
              subtitle="Track quests across all your journeys in one place"
              color="#d946ef"
              onClick={() => setView('quest-tracker')}
            />
            <AspectCard
              icon={BookOpen}
              label="Present Journey Journal"
              count={journeys.reduce((acc, j) => acc + j.logs.filter((l) => l.phase === 'during').length, 0)}
              subtitle="Record reflections, presence, and Code awareness as you go"
              color="#3b82f6"
              onClick={() => setView('present-journal')}
            />
            <AspectCard
              icon={Calendar}
              label="Calendar"
              count={myAgreements.reduce((acc, a) => acc + (a.scheduledMeetings?.length ?? 0), 0) + journeys.reduce((acc, j) => acc + (j.scheduledMeetings?.length ?? 0), 0)}
              subtitle="Manage availability and view scheduled meetings across your exchanges"
              color="#f59e0b"
              onClick={() => setView('calendar')}
            />
            <Link to={`/resource-flow/${user?.ces || ''}`} className="contents">
              <AspectCard
                icon={HandHeart}
                label="Mutual Aid"
                count={myAgreements.filter((a) => a.status === 'active').length}
                subtitle="Your resource flow: gifts, offerings, wishes, vendors, and payments"
                color="#ec4899"
                onClick={() => {}}
              />
            </Link>
          </div>

          <VendorInbox />

          <div className="rounded-xl border border-lavender/10 bg-void-800/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-4 h-4 text-lavender/40" />
              <h3 className="text-xs uppercase tracking-widest text-lavender/40 font-sans">Recent Activity</h3>
            </div>
            {journeys.map((j) => (
              <button
                key={j.id}
                onClick={() => selectJourney(j.id)}
                className="w-full text-left rounded-lg border border-lavender/5 bg-void-900/20 p-3 mb-2 hover:border-lavender/15 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-cream">{j.title}</span>
                  <span className="text-[10px] text-lavender/30">{timeAgo(j.updatedAt)}</span>
                </div>
                <div className="text-[10px] text-lavender/40 mt-1">
                  {j.wishingName} ↔ {j.coCreatorName}
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── AGREEMENTS VIEW ─── */}
      {view === 'agreements' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setView('dashboard')} className="text-xs text-lavender/40 hover:text-cream transition-colors">
              ← Back to Flow Dashboard
            </button>
          </div>
          <div className="rounded-xl border border-lavender/10 bg-void-800/30 p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <ScrollText className="w-4 h-4 text-gold-400" />
              <h2 className="font-serif text-lg text-cream">Agreements</h2>
            </div>
            {myAgreements.length === 0 ? (
              <p className="text-sm text-lavender/40 italic">
                No agreements yet. When you co-create or receive an exchange proposal, it will appear here.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myAgreements.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-lavender/10 bg-void-900/40 p-4 hover:border-lavender/20 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          a.status === 'active' || a.status === 'agreed'
                            ? 'border-green-400/20 bg-green-400/10 text-green-300'
                            : a.status === 'proposed'
                              ? 'border-magenta-400/20 bg-magenta-400/10 text-magenta-300'
                              : 'border-lavender/10 bg-lavender/5 text-lavender/40'
                        }`}
                      >
                        {a.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-lavender/30">{timeAgo(a.updatedAt)}</span>
                    </div>
                    <h3 className="text-sm font-medium text-cream mb-1">{a.mainQuest.title || 'Untitled Agreement'}</h3>
                    <p className="text-xs text-lavender/50 mb-3 line-clamp-2">{a.mainQuest.description || a.message}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-lavender/40 mb-3">
                      <span>{a.requesterName}</span>
                      <ChevronRight className="w-3 h-3" />
                      <span>{a.providerName}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedAgreement(a)}
                        className="flex-1 min-w-[100px] py-2 rounded-lg border border-gold-400/20 text-gold-300 hover:bg-gold-400/10 transition-all text-xs"
                      >
                        Open Agreement ✨
                      </button>
                      {(a.requesterCes === currentCes || a.providerCes === currentCes || a.parties?.some((p) => p.ces === currentCes)) && a.status !== 'withdrawn' && (
                        <button
                          onClick={() => setWithdrawingAgreement(a)}
                          className="py-2 px-3 rounded-lg border border-magenta-400/30 text-magenta-300 hover:bg-magenta-400/10 transition-all text-xs"
                        >
                          Withdraw 🌙
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ─── EXCHANGES VIEW ─── */}
      {view === 'exchanges' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setView('dashboard')} className="text-xs text-lavender/40 hover:text-cream transition-colors">
              ← Back to Flow Dashboard
            </button>
          </div>
          <div className="rounded-xl border border-lavender/10 bg-void-800/30 p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-green-400" />
              <h2 className="font-serif text-lg text-cream">Exchanges</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="rounded-xl border border-lavender/10 bg-void-900/40 p-4 text-center">
                <p className="text-2xl font-serif text-cream">{journeys.length}</p>
                <p className="text-[10px] uppercase tracking-wider text-lavender/40">Total Journeys</p>
              </div>
              <div className="rounded-xl border border-green-400/10 bg-green-400/5 p-4 text-center">
                <p className="text-2xl font-serif text-green-300">{journeys.filter((j) => j.status === 'active').length}</p>
                <p className="text-[10px] uppercase tracking-wider text-lavender/40">Active</p>
              </div>
              <div className="rounded-xl border border-magenta-400/10 bg-magenta-400/5 p-4 text-center">
                <p className="text-2xl font-serif text-magenta-300">
                  {journeys.filter((j) => j.status === 'fulfillment_review').length}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-lavender/40">In Review</p>
              </div>
              <div className="rounded-xl border border-gold-400/10 bg-gold-400/5 p-4 text-center">
                <p className="text-2xl font-serif text-gold-300">{journeys.filter((j) => j.status === 'complete').length}</p>
                <p className="text-[10px] uppercase tracking-wider text-lavender/40">Complete</p>
              </div>
            </div>
            <div className="space-y-3">
              {journeys.map((j) => (
                <JourneyCard key={j.id} journey={j} isActive={j.id === selectedJourneyId} onSelect={() => selectJourney(j.id)} />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── QUEST TRACKER VIEW ─── */}
      {view === 'quest-tracker' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setView('dashboard')} className="text-xs text-lavender/40 hover:text-cream transition-colors">
              ← Back to Flow Dashboard
            </button>
          </div>
          <div className="grid md:grid-cols-[280px_1fr] gap-6">
            <div className="space-y-3">
              <h2 className="text-xs uppercase tracking-widest text-lavender/40 font-sans">Select Journey</h2>
              {journeys.map((j) => (
                <JourneyCard key={j.id} journey={j} isActive={j.id === selectedJourneyId} onSelect={() => setSelectedJourneyId(j.id)} />
              ))}
            </div>
            <div>
              {journey ? (
                <QuestTracker
                  journey={journey}
                  currentCes={currentCes}
                  currentName={currentName}
                  selectedCodeNum={selectedCodeNum}
                  storage={storage}
                  onJourneyUpdate={updateJourney}
                  agreement={getLinkedAgreement(journey)}
                  autoAppliedNotice={autoAppliedNotice}
                  onClearAutoNotice={() => setAutoAppliedNotice(null)}
                />
              ) : (
                <p className="text-sm text-lavender/40 text-center py-12">No journey selected.</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── PRESENT JOURNEY JOURNAL VIEW ─── */}
      {view === 'present-journal' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setView('dashboard')} className="text-xs text-lavender/40 hover:text-cream transition-colors">
              ← Back to Flow Dashboard
            </button>
          </div>
          <PresentJournalPanel
            journeys={journeys}
            selectedJourneyId={selectedJourneyId}
            onSelectJourney={setSelectedJourneyId}
            currentCes={currentCes}
            currentName={currentName}
            onJourneyUpdate={updateJourney}
          />
        </motion.div>
      )}

      {/* ─── JOURNEYS LIST VIEW ─── */}
      {view === 'journeys' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setView('dashboard')}
              className="text-xs text-lavender/40 hover:text-cream transition-colors"
            >
              ← Back to Flow Dashboard
            </button>
          </div>

          <div className="grid md:grid-cols-[280px_1fr] gap-6">
            {/* Sidebar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xs uppercase tracking-widest text-lavender/40 font-sans">Your Co-Creations</h2>
                <span className="text-[10px] text-lavender/30">{journeys.length} active</span>
              </div>
              {journeys.map((j) => (
                <JourneyCard
                  key={j.id}
                  journey={j}
                  isActive={j.id === selectedJourneyId}
                  onSelect={() => selectJourney(j.id)}
                />
              ))}
              <button
                className="w-full py-2.5 rounded-xl border border-dashed border-lavender/10 text-lavender/40 hover:text-lavender/60 hover:border-lavender/20 transition-all text-sm"
                onClick={() => alert('Creating a new journey will begin with crafting an Agreement. Coming in Wave I.')}
              >
                + Begin New Journey
              </button>
            </div>

            {/* Detail Panel */}
            <div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={journey?.id + activePhase}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {journey ? (
                    <JourneyDetailPanel
                      journey={journey}
                      activePhase={activePhase}
                      setActivePhase={setActivePhase}
                      visibleLogs={visibleLogs}
                      newLogContent={newLogContent}
                      setNewLogContent={setNewLogContent}
                      selectedCodeNum={selectedCodeNum}
                      setSelectedCodeNum={setSelectedCodeNum}
                      logVisibility={logVisibility}
                      setLogVisibility={setLogVisibility}
                      addLogEntry={addLogEntry}
                      handlePrint={handlePrint}
                      currentCes={currentCes}
                      currentName={currentName}
                      storage={storage}
                      onJourneyUpdate={updateJourney}
                      agreement={getLinkedAgreement(journey)}
                      autoAppliedNotice={autoAppliedNotice}
                      onClearAutoNotice={() => setAutoAppliedNotice(null)}
                    />
                  ) : (
                    <p className="text-sm text-lavender/40 text-center py-12">No journey selected.</p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── JOURNEY DETAIL VIEW (full-width) ─── */}
      {view === 'journey-detail' && journey && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setView('journeys')}
              className="text-xs text-lavender/40 hover:text-cream transition-colors"
            >
              ← Back to Journeys
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={journey.id + activePhase}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
            >
              <JourneyDetailPanel
                journey={journey}
                activePhase={activePhase}
                setActivePhase={setActivePhase}
                visibleLogs={visibleLogs}
                newLogContent={newLogContent}
                setNewLogContent={setNewLogContent}
                selectedCodeNum={selectedCodeNum}
                setSelectedCodeNum={setSelectedCodeNum}
                logVisibility={logVisibility}
                setLogVisibility={setLogVisibility}
                addLogEntry={addLogEntry}
                handlePrint={handlePrint}
                currentCes={currentCes}
                currentName={currentName}
                storage={storage}
                onJourneyUpdate={updateJourney}
                agreement={getLinkedAgreement(journey)}
                autoAppliedNotice={autoAppliedNotice}
                onClearAutoNotice={() => setAutoAppliedNotice(null)}
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}

      {/* ─── VENDOR INBOX VIEW ─── */}
      {view === 'vendor-inbox' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto text-center py-16"
        >
          <Inbox className="w-12 h-12 text-lavender/20 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-lavender/60 mb-2">Vendor Inbox</h2>
          <p className="text-sm text-lavender/40 max-w-md mx-auto mb-6">
            Exchange requests for your storefront offerings will appear here. This is where you manage incoming
            agreements, approve or decline requests, and track fulfillment.
          </p>
          <button
            onClick={() => setView('dashboard')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-400/20 border border-gold-400/30 text-gold-400 hover:bg-gold-400/30 transition-all text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Flow Dashboard
          </button>
        </motion.div>
      )}

      {/* ─── CALENDAR VIEW ─── */}
      {view === 'calendar' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <CalendarPanel
            currentCes={currentCes}
            myAgreements={myAgreements}
            journeys={journeys}
            onBack={() => setView('dashboard')}
          />
        </motion.div>
      )}

      {/* ─── Agreement Editor Modal ─── */}
      {selectedAgreement && (
        <ExchangeAgreementEditor
          agreement={selectedAgreement}
          onClose={() => setSelectedAgreement(null)}
          onSigned={() => setSelectedAgreement(null)}
        />
      )}

      {withdrawingAgreement && (
        <WithdrawalModal
          agreement={withdrawingAgreement}
          onClose={() => setWithdrawingAgreement(null)}
          onSubmit={handleAgreementWithdraw(withdrawingAgreement)}
        />
      )}
    </div>
  )
}

/* ─── Calendar Panel ─── */
function CalendarPanel({
  currentCes,
  myAgreements,
  journeys,
  onBack,
}: {
  currentCes: string
  myAgreements: ExchangeAgreement[]
  journeys: ExchangeJourney[]
  onBack: () => void
}) {
  const storage = useStorage()

  const [calendar, setCalendar] = useState(() => {
    let cal = storage.getExchangeCalendar(currentCes)
    if (!cal) {
      cal = { ces: currentCes, availabilityBlocks: [], scheduledMeetings: [], updatedAt: new Date().toISOString() }
      storage.saveExchangeCalendar(cal)
    }
    return cal
  })

  const refreshCalendar = useCallback(() => {
    const cal = storage.getExchangeCalendar(currentCes)
    setCalendar(cal ?? { ces: currentCes, availabilityBlocks: [], scheduledMeetings: [], updatedAt: new Date().toISOString() })
  }, [storage, currentCes])

  const allMeetings = useMemo(() => {
    const fromAgreements = myAgreements.flatMap((a) => (a.scheduledMeetings ?? []).map((m) => ({ ...m, sourceId: a.id, sourceTitle: a.mainQuest?.title || 'Agreement', otherName: a.requesterCes === currentCes ? a.providerName : a.requesterName, otherCes: a.requesterCes === currentCes ? a.providerCes : a.requesterCes })))
    const fromJourneys = journeys.flatMap((j) => (j.scheduledMeetings ?? []).map((m) => ({ ...m, sourceId: j.id, sourceTitle: j.title, otherName: j.wishingCes === currentCes ? j.coCreatorName : j.wishingName, otherCes: j.wishingCes === currentCes ? j.coCreatorCes : j.wishingCes })))
    // Deduplicate by id, prefer journey entries since they are synced live
    const map = new Map<string, ScheduledMeeting & { sourceId: string; sourceTitle: string; otherName: string; otherCes: string }>()
    ;[...fromJourneys, ...fromAgreements].forEach((m) => {
      if (!map.has(m.id)) map.set(m.id, m)
    })
    return Array.from(map.values()).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  }, [myAgreements, journeys, currentCes])

  const meetingDays = useMemo(() => {
    const days = new Set<number>()
    allMeetings.forEach((m) => {
      const d = new Date(m.startAt)
      if (!isNaN(d.getTime())) days.add(d.getDate())
    })
    return days
  }, [allMeetings])

  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today)
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval(monthStart, monthEnd)
  const startWeekday = monthStart.getDay()
  const blankDays = Array.from({ length: startWeekday }, (_, i) => i)
  const monthLabel = currentMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })

  const [form, setForm] = useState({
    dayOfWeek: 1,
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    allDay: false,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    type: 'available' as AvailabilityBlock['type'],
    recurring: false,
    title: '',
  })

  function handleAddBlock(e: React.FormEvent) {
    e.preventDefault()
    const block: AvailabilityBlock = {
      id: `block_${Date.now()}`,
      dayOfWeek: form.date ? undefined : Number(form.dayOfWeek),
      date: form.date || undefined,
      startTime: form.allDay ? undefined : form.startTime,
      endTime: form.allDay ? undefined : form.endTime,
      allDay: form.allDay || undefined,
      timeZone: form.timeZone,
      type: form.type,
      recurring: form.recurring,
      title: form.title || undefined,
    }
    storage.addAvailabilityBlock(currentCes, block)
    refreshCalendar()
  }

  function handleDeleteBlock(id: string) {
    storage.removeAvailabilityBlock(currentCes, id)
    refreshCalendar()
  }

  function formatISODate(d: Date): string {
    const tzOffset = d.getTimezoneOffset() * 60000
    return new Date(d.getTime() - tzOffset).toISOString().split('T')[0]
  }

  function dayAvailability(date: Date): 'available' | 'unavailable' | null {
    const dateStr = formatISODate(date)
    const dayIndex = date.getDay()
    const specificBlocks = calendar.availabilityBlocks.filter((b) => b.date === dateStr)
    if (specificBlocks.length > 0) return specificBlocks[specificBlocks.length - 1].type
    const recurringBlocks = calendar.availabilityBlocks.filter((b) => !b.date && b.dayOfWeek === dayIndex)
    if (recurringBlocks.length > 0) return recurringBlocks[recurringBlocks.length - 1].type
    return null
  }

  function handleDayClick(date: Date) {
    const dateStr = formatISODate(date)
    const existingIds = calendar.availabilityBlocks
      .filter((b) => b.date === dateStr)
      .map((b) => b.id)
    const currentType = dayAvailability(date)
    const nextType: AvailabilityBlock['type'] = currentType === 'available' ? 'unavailable' : 'available'
    existingIds.forEach((id) => storage.removeAvailabilityBlock(currentCes, id))
    storage.addAvailabilityBlock(currentCes, {
      id: `block_${Date.now()}`,
      date: dateStr,
      allDay: true,
      timeZone: form.timeZone,
      type: nextType,
      recurring: false,
      title: nextType === 'available' ? 'Available all day' : 'Unavailable all day',
    })
    refreshCalendar()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-xs text-lavender/40 hover:text-cream transition-colors">
          ← Back to Flow Dashboard
        </button>
      </div>

      <div className="rounded-xl border border-lavender/10 bg-void-800/30 p-5 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-5 h-5 text-gold-400" />
          <h2 className="font-serif text-xl text-cream">Calendar</h2>
        </div>
        <p className="text-sm text-lavender/60">
          Manage your availability and keep track of scheduled meetings across all your exchanges.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Left column: scheduled meetings + month grid */}
        <div className="space-y-6">
          {/* Month grid */}
          <div className="rounded-xl border border-lavender/10 bg-void-800/30 p-5">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                className="text-xs px-2 py-1 rounded-lg border border-lavender/10 text-lavender/40 hover:text-cream transition-colors"
              >
                ← Prev
              </button>
              <span className="text-sm font-medium text-cream">{monthLabel}</span>
              <button
                onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                className="text-xs px-2 py-1 rounded-lg border border-lavender/10 text-lavender/40 hover:text-cream transition-colors"
              >
                Next →
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-lavender/40 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {blankDays.map((i) => (
                <div key={`blank-${i}`} className="aspect-square rounded-lg" />
              ))}
              {daysInMonth.map((date) => {
                const isToday = date.toDateString() === today.toDateString()
                const hasMeeting = meetingDays.has(date.getDate())
                const availability = dayAvailability(date)
                const baseClasses = 'aspect-square rounded-lg border flex flex-col items-center justify-center text-xs transition-all cursor-pointer select-none'
                const colorClasses =
                  availability === 'available'
                    ? 'border-green-400/40 bg-green-400/15 text-green-100 hover:bg-green-400/25'
                    : availability === 'unavailable'
                      ? 'border-red-400/40 bg-red-400/15 text-red-100 hover:bg-red-400/25'
                      : isToday
                        ? 'border-gold-400/40 bg-gold-400/10 text-cream hover:border-gold-400/60'
                        : 'border-lavender/10 text-lavender/60 hover:border-lavender/30'
                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => handleDayClick(date)}
                    className={`${baseClasses} ${colorClasses}`}
                    title={availability ? `Click to toggle: currently ${availability}` : 'Click to mark available'}
                  >
                    <span>{date.getDate()}</span>
                    {hasMeeting && <span className="w-1 h-1 rounded-full bg-gold-400 mt-1" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Scheduled meetings */}
          <div className="rounded-xl border border-lavender/10 bg-void-800/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-gold-400" />
              <h3 className="font-serif text-lg text-cream">Scheduled Meetings</h3>
            </div>

            {allMeetings.length === 0 ? (
              <p className="text-sm text-lavender/40 italic">No scheduled meetings yet. They will appear here once agreed upon in your exchanges. 🌙</p>
            ) : (
              <div className="space-y-3">
                {(['proposed', 'confirmed', 'completed', 'rescheduled', 'cancelled'] as const).map((status) => {
                  const group = allMeetings.filter((m) => m.status === status)
                  if (group.length === 0) return null
                  return (
                    <div key={status}>
                      <p className="text-[10px] uppercase tracking-widest text-lavender/40 font-sans mb-2">
                        {status} {status === 'proposed' ? '🌙' : status === 'confirmed' ? '☀' : status === 'completed' ? '✨' : status === 'rescheduled' ? '🌀' : '✕'}
                      </p>
                      <div className="space-y-2">
                        {group.map((m) => (
                          <div
                            key={m.id}
                            className="rounded-xl border border-lavender/10 bg-void-900/40 p-4"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-cream">{m.title}</span>
                              {meetingStatusBadge(m.status)}
                            </div>
                            <p className="text-xs text-lavender/60 mb-1">{formatMeetingTime(m)} 🕯</p>
                            {m.location && <p className="text-xs text-lavender/50 mb-1">📍 {m.location}</p>}
                            <p className="text-xs text-lavender/50 mb-3">
                              with {m.otherName} · from {m.sourceTitle}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <a
                                href={googleCalendarEventUrl(m)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-blue-400/10 border border-blue-400/30 text-blue-300 hover:bg-blue-400/20 transition-all"
                              >
                                <Calendar className="w-3 h-3" /> Add to Google Calendar
                              </a>
                              <button
                                onClick={() => downloadICS(m)}
                                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-lavender/10 border border-lavender/20 text-lavender/70 hover:bg-lavender/20 transition-all"
                              >
                                <Download className="w-3 h-3" /> Download .ics
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column: availability management */}
        <div className="space-y-6">
          <div className="rounded-xl border border-lavender/10 bg-void-800/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-gold-400" />
              <h3 className="font-serif text-lg text-cream">Availability Management</h3>
            </div>
            <p className="text-xs text-lavender/50 mb-4">
              Set when you are open to meet. Others can propose times that overlap with your availability blocks.
            </p>

            <form onSubmit={handleAddBlock} className="space-y-3 mb-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-lavender/40">Day of week</label>
                  <select
                    value={form.dayOfWeek}
                    onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream focus:border-gold-400/30 focus:outline-none"
                  >
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d, i) => (
                      <option key={d} value={i}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-lavender/40">Specific date (optional)</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream focus:border-gold-400/30 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mb-1">
                <label className="flex items-center gap-2 text-xs text-lavender/60">
                  <input
                    type="checkbox"
                    checked={form.allDay}
                    onChange={(e) => setForm({ ...form, allDay: e.target.checked })}
                    className="rounded border-lavender/20 bg-void-900/60 text-gold-400 focus:ring-gold-400/30"
                  />
                  All day 🌅
                </label>
              </div>

              {!form.allDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-lavender/40">Start</label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream focus:border-gold-400/30 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-lavender/40">End</label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream focus:border-gold-400/30 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-lavender/40">Time zone</label>
                  <input
                    type="text"
                    value={form.timeZone}
                    onChange={(e) => setForm({ ...form, timeZone: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream focus:border-gold-400/30 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-lavender/40">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as AvailabilityBlock['type'] })}
                    className="w-full px-2.5 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream focus:border-gold-400/30 focus:outline-none"
                  >
                    <option value="available">Available ✨</option>
                    <option value="unavailable">Unavailable 🌑</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-lavender/60">
                  <input
                    type="checkbox"
                    checked={form.recurring}
                    onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
                    className="rounded border-lavender/20 bg-void-900/60 text-gold-400 focus:ring-gold-400/30"
                  />
                  Recurring weekly 🌀
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-lavender/40">Title (optional)</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Open office hours"
                  className="w-full px-2.5 py-2 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream placeholder:text-lavender/25 focus:border-gold-400/30 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-gold-400/10 border border-gold-400/30 text-gold-300 text-sm hover:bg-gold-400/20 transition-all"
              >
                <Plus className="w-4 h-4 inline-block mr-1.5" /> Add Availability Block
              </button>
            </form>

            <div className="space-y-2">
              {calendar.availabilityBlocks.length === 0 ? (
                <p className="text-sm text-lavender/40 italic">No availability blocks yet. Add your first so others can find time with you. 🌟</p>
              ) : (
                calendar.availabilityBlocks.map((block) => (
                  <div
                  key={block.id}
                  className={`rounded-xl border p-3 flex items-start justify-between ${
                    block.type === 'available'
                      ? 'border-green-400/20 bg-green-400/5'
                      : 'border-red-400/20 bg-red-400/5'
                  }`}
                  >
                  <div>
                    <p className="text-sm text-cream">
                      {block.title || (block.type === 'available' ? 'Available' : 'Unavailable')} {block.type === 'available' ? '🌿' : '🛡️'}
                    </p>
                    <p className="text-xs text-lavender/60">
                      {block.date
                        ? `Date: ${block.date}`
                        : `Every ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][block.dayOfWeek ?? 0]}`}
                      {' · '}
                      {block.allDay
                        ? 'All day 🌅'
                        : `${block.startTime} – ${block.endTime} (${block.timeZone})`}
                      {block.recurring && ' · Recurring'}
                    </p>
                  </div>
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="text-lavender/30 hover:text-magenta-300 transition-colors"
                      aria-label="Delete availability block"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function eachDayOfInterval(start: Date, end: Date): Date[] {
  const days: Date[] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

function meetingStatusBadge(status: ScheduledMeeting['status']) {
  const map: Record<ScheduledMeeting['status'], { class: string; label: string }> = {
    proposed: { class: 'border-magenta-400/20 bg-magenta-400/10 text-magenta-300', label: 'Pending' },
    confirmed: { class: 'border-green-400/20 bg-green-400/10 text-green-300', label: 'Confirmed' },
    completed: { class: 'border-gold-400/20 bg-gold-400/10 text-gold-300', label: 'Completed' },
    rescheduled: { class: 'border-blue-400/20 bg-blue-400/10 text-blue-300', label: 'Rescheduled' },
    cancelled: { class: 'border-lavender/10 bg-lavender/5 text-lavender/40', label: 'Cancelled' },
  }
  const { class: cls, label } = map[status]
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${cls}`}>
      {label} {status === 'proposed' ? '🌙' : status === 'confirmed' ? '☀' : status === 'completed' ? '✨' : status === 'rescheduled' ? '🌀' : '✕'}
    </span>
  )
}

/* ─── Present Journey Journal Panel ─── */
function PresentJournalPanel({
  journeys,
  selectedJourneyId,
  onSelectJourney,
  currentCes,
  currentName,
  onJourneyUpdate,
}: {
  journeys: ExchangeJourney[]
  selectedJourneyId: string
  onSelectJourney: (id: string) => void
  currentCes: string
  currentName: string
  onJourneyUpdate: (j: ExchangeJourney) => void
}) {
  const [selectedCodeNum, setSelectedCodeNum] = useState(1)
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState<'private' | 'public'>('public')

  const selectedJourney = useMemo(
    () => journeys.find((j) => j.id === selectedJourneyId) ?? journeys[0],
    [journeys, selectedJourneyId]
  )

  const visibleLogs = useMemo(() => {
    if (!selectedJourney) return []
    return selectedJourney.logs
      .filter((l) => l.phase === 'during')
      .filter((l) => l.visibility === 'public' || l.authorCes === currentCes)
      .slice()
      .reverse()
  }, [selectedJourney, currentCes])

  function addEntry() {
    if (!selectedJourney || !content.trim()) return
    const selectedRay = rayKeyFromCodeNumber(selectedCodeNum)
    const newLog: CodeLogEntry = {
      id: `log_${Date.now()}`,
      exchangeId: selectedJourney.id,
      authorCes: currentCes,
      authorName: currentName,
      ray: selectedRay,
      codeNumber: selectedCodeNum,
      timestamp: new Date().toISOString(),
      content: content.trim(),
      visibility,
      phase: 'during',
      moodEnergy: 'Present, reflective',
    }
    onJourneyUpdate({ ...selectedJourney, logs: [...selectedJourney.logs, newLog], updatedAt: newLog.timestamp })
    setContent('')
  }

  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-6">
      <div className="space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-lavender/40 font-sans">Select Journey</h2>
        {journeys.map((j) => (
          <JourneyCard key={j.id} journey={j} isActive={j.id === selectedJourneyId} onSelect={() => onSelectJourney(j.id)} />
        ))}
      </div>

      <div className="space-y-5">
        {selectedJourney ? (
          <>
            <div className="rounded-xl border border-lavender/10 bg-void-800/30 p-5">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <h3 className="font-serif text-lg text-cream">Present Journey Journal</h3>
              </div>
              <p className="text-xs text-lavender/50 mb-4">
                Recording for <span className="text-cream">{selectedJourney.title}</span> — shared entries are visible to
                all co-creators; private entries are yours alone.
              </p>

              <div className="rounded-xl border border-lavender/15 bg-void-800/60 p-4 space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-lavender/40 font-sans mb-2">
                    Which Ray Frequency is alive right now?
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                    {CODES_DATA.map((code) => (
                      <button
                        key={code.number}
                        onClick={() => setSelectedCodeNum(code.number)}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          selectedCodeNum === code.number
                            ? 'border-gold-400/40 bg-gold-400/10'
                            : 'border-white/5 bg-white/[0.03] hover:border-lavender/15 hover:bg-white/[0.06]'
                        }`}
                        title={`${code.number}. ${code.name} — ${code.ray}`}
                      >
                        <span className="block w-3 h-3 rounded-full mx-auto mb-1">
                          <span className="block w-full h-full rounded-full" style={{ background: code.color }} />
                        </span>
                        <span className="text-[10px] font-sans" style={{ color: code.color + 'cc' }}>
                          {code.ray.replace(' Ray', '')}
                        </span>
                      </button>
                    ))}
                  </div>
                  {selectedCodeNum > 0 && (
                    <div
                      className="mt-2 p-2.5 rounded-lg border flex items-start gap-2.5"
                      style={{ borderColor: CODES_DATA.find((c) => c.number === selectedCodeNum)?.color + '20' }}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5"
                        style={{ background: CODES_DATA.find((c) => c.number === selectedCodeNum)?.color }}
                      />
                      <div>
                        <p className="text-sm text-cream">{CODES_DATA.find((c) => c.number === selectedCodeNum)?.ray}</p>
                        <p className="text-xs text-lavender/50 mt-0.5">
                          Your entry resonates with this frequency. All 12 Ray Frequencies are alive in every exchange —
                          this is simply where your awareness is resting right now.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What is alive for you in this moment of co-creation..."
                  className="w-full px-3 py-2.5 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream placeholder:text-lavender/25 focus:border-gold-400/30 focus:outline-none resize-none"
                  rows={3}
                />

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setVisibility('public')}
                      className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all ${
                        visibility === 'public'
                          ? 'border-lavender/20 text-cream bg-white/[0.05]'
                          : 'border-transparent text-lavender/30 hover:text-lavender/50'
                      }`}
                    >
                      <Unlock className="w-3 h-3" /> Shared
                    </button>
                    <button
                      onClick={() => setVisibility('private')}
                      className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all ${
                        visibility === 'private'
                          ? 'border-lavender/20 text-cream bg-white/[0.05]'
                          : 'border-transparent text-lavender/30 hover:text-lavender/50'
                      }`}
                    >
                      <Lock className="w-3 h-3" /> Private
                    </button>
                  </div>
                  <button
                    onClick={addEntry}
                    disabled={!content.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 text-xs hover:bg-gold-400/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3 h-3" /> Record Entry
                  </button>
                </div>
              </div>

              <div className="space-y-3 mt-6">
                {visibleLogs.length > 0 ? (
                  visibleLogs.map((log) => <LogEntry key={log.id} entry={log} isAuthor={log.authorCes === currentCes} />)
                ) : (
                  <p className="text-sm text-lavender/30 italic text-center py-8">
                    No journal entries yet for this journey. Begin with your first reflection.
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-lavender/40 text-center py-12">No journey selected.</p>
        )}
      </div>
    </div>
  )
}

/* ─── Journey Detail Panel (shared between journeys + detail views) ─── */
function JourneyDetailPanel({
  journey,
  activePhase,
  setActivePhase,
  visibleLogs,
  newLogContent,
  setNewLogContent,
  selectedCodeNum,
  setSelectedCodeNum,
  logVisibility,
  setLogVisibility,
  addLogEntry,
  handlePrint,
  currentCes,
  currentName,
  storage,
  onJourneyUpdate,
  agreement,
  autoAppliedNotice,
  onClearAutoNotice,
}: {
  journey: ExchangeJourney
  activePhase: JourneyPhase
  setActivePhase: (p: JourneyPhase) => void
  visibleLogs: CodeLogEntry[]
  newLogContent: string
  setNewLogContent: (s: string) => void
  selectedCodeNum: number
  setSelectedCodeNum: (n: number) => void
  logVisibility: 'private' | 'public'
  setLogVisibility: (v: 'private' | 'public') => void
  addLogEntry: () => void
  handlePrint: () => void
  currentCes: string
  currentName: string
  storage: ReturnType<typeof useStorage>
  onJourneyUpdate: (j: ExchangeJourney) => void
  agreement?: ExchangeAgreement
  autoAppliedNotice?: { summary: string; updatedAt: string } | null
  onClearAutoNotice?: () => void
}) {
  return (
    <>
      {/* Journey Title Row */}
      <div className="mb-4">
        <h2 className="font-serif text-xl text-cream mb-1">{journey.title}</h2>
        <div className="flex items-center gap-3 text-xs text-lavender/50">
          <span>🌱 {journey.wishingName}</span>
          <ChevronRight className="w-3 h-3" />
          <span>✨ {journey.coCreatorName}</span>
        </div>
      </div>

      {/* All 12 Ray Frequencies — present in every exchange */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {CODES_DATA.map((code) => (
          <span
            key={code.number}
            className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border"
            style={{ borderColor: code.color + '25', color: code.color + 'cc' }}
            title={`${code.number}. ${code.name} — ${code.ray}`}
          >
            {code.ray.replace(' Ray', '')}
          </span>
        ))}
      </div>

      <div className="flex gap-1 mb-6 border-b border-lavender/10">
        <PhaseTab label="Agreement" phase="before" current={activePhase} onClick={() => setActivePhase('before')} />
        <PhaseTab label="Quest Tracker" phase="quests" current={activePhase} onClick={() => setActivePhase('quests')} />
        <PhaseTab label="Present Journal" phase="during" current={activePhase} onClick={() => setActivePhase('during')} />
        <PhaseTab label="Fulfillment" phase="after" current={activePhase} onClick={() => setActivePhase('after')} />
      </div>

      {/* Phase: Quest Tracker */}
      {activePhase === 'quests' && (
        <div className="space-y-5">
          <QuestTracker
            journey={journey}
            currentCes={currentCes}
            currentName={currentName}
            selectedCodeNum={selectedCodeNum}
            storage={storage}
            onJourneyUpdate={onJourneyUpdate}
            agreement={agreement}
            autoAppliedNotice={autoAppliedNotice}
            onClearAutoNotice={onClearAutoNotice}
          />
        </div>
      )}

      {/* Phase: Agreement */}
      {activePhase === 'before' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-5">
            <h3 className="font-serif text-lg text-cream mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gold-400" /> The Exchange Agreement
            </h3>
            <p className="text-sm text-lavender/60 mb-4 leading-relaxed">
              Before co-creation begins, beings craft and co-sign an Agreement. This document captures roles, boundaries,
              communication preferences, and the Codes most relevant to this exchange.
            </p>

            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="w-24 text-right text-lavender/30 text-xs pt-1">What</div>
                <div className="text-cream/80">{journey.description}</div>
              </div>
              <div className="flex gap-3">
                <div className="w-24 text-right text-lavender/30 text-xs pt-1">Wishing</div>
                <div className="text-cream/80">
                  {journey.wishingName} <span className="text-lavender/30">(C.E.S. {journey.wishingCes})</span>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-24 text-right text-lavender/30 text-xs pt-1">Co-Creating</div>
                <div className="text-cream/80">
                  {journey.coCreatorName} <span className="text-lavender/30">(C.E.S. {journey.coCreatorCes})</span>
                </div>
              </div>
            </div>

            <div className="mt-5 p-4 rounded-lg border border-gold-400/10 bg-gold-400/[0.03]">
              <p className="text-xs text-gold-400/70 italic">
                In a live system, this Agreement is co-signed by both beings before work begins. This prototype displays
                the journey scaffold.
              </p>
            </div>
          </div>

          {visibleLogs.length > 0 && (
            <div className="space-y-3 mt-6">
              <h4 className="text-xs uppercase tracking-widest text-lavender/40 font-sans">Agreement Phase Reflections</h4>
              {visibleLogs
                .filter((l) => l.phase === 'before')
                .map((log) => (
                  <LogEntry key={log.id} entry={log} isAuthor={log.authorCes === currentCes} />
                ))}
            </div>
          )}
        </div>
      )}

      {/* Phase: Present Journal */}
      {activePhase === 'during' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-serif text-lg text-cream flex items-center gap-2">
              <PenLine className="w-4 h-4 text-gold-400" /> Present Journey Journal
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-lavender/10 text-xs text-lavender/50 hover:text-lavender/80 hover:border-lavender/20 transition-all"
              >
                <Printer className="w-3 h-3" /> Print
              </button>
            </div>
          </div>

          <p className="text-sm text-lavender/50 mb-4">
            Document the living journey of your co-creation. Shared entries are visible to all co-creators. Private entries
            are yours alone. Toggle any entry between the two.
          </p>

          {/* Journal Composer */}
          <div className="rounded-xl border border-lavender/15 bg-void-800/60 p-4 space-y-3">
            {/* All 12 Ray Frequencies */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-lavender/40 font-sans mb-2">
                Which Ray Frequency is alive for you in this moment?
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {CODES_DATA.map((code) => (
                  <button
                    key={code.number}
                    onClick={() => setSelectedCodeNum(code.number)}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      selectedCodeNum === code.number
                        ? 'border-gold-400/40 bg-gold-400/10'
                        : 'border-white/5 bg-white/[0.03] hover:border-lavender/15 hover:bg-white/[0.06]'
                    }`}
                    title={`${code.number}. ${code.name} — ${code.ray}`}
                  >
                    <span className="block w-3 h-3 rounded-full mx-auto mb-1">
                      <span className="block w-full h-full rounded-full" style={{ background: code.color }} />
                    </span>
                    <span className="text-[10px] font-sans" style={{ color: code.color + 'cc' }}>
                      {code.ray.replace(' Ray', '')}
                    </span>
                  </button>
                ))}
              </div>
              {selectedCodeNum > 0 && (
                <div
                  className="mt-2 p-2.5 rounded-lg border flex items-start gap-2.5"
                  style={{ borderColor: CODES_DATA.find((c) => c.number === selectedCodeNum)?.color + '20' }}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5"
                    style={{ background: CODES_DATA.find((c) => c.number === selectedCodeNum)?.color }}
                  />
                  <div>
                    <p className="text-sm text-cream">{CODES_DATA.find((c) => c.number === selectedCodeNum)?.ray}</p>
                    <p className="text-xs text-lavender/50 mt-0.5">
                      Your entry resonates with this frequency. All 12 Ray Frequencies are alive in every exchange —
                      this is simply where your awareness is resting right now.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <textarea
              value={newLogContent}
              onChange={(e) => setNewLogContent(e.target.value)}
              placeholder="What is alive for you in this moment of co-creation..."
              className="w-full px-3 py-2.5 rounded-lg bg-void-900/60 border border-lavender/10 text-sm text-cream placeholder:text-lavender/25 focus:border-gold-400/30 focus:outline-none resize-none"
              rows={3}
            />

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setLogVisibility('public')}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all ${
                    logVisibility === 'public'
                      ? 'border-lavender/20 text-cream bg-white/[0.05]'
                      : 'border-transparent text-lavender/30 hover:text-lavender/50'
                  }`}
                >
                  <Unlock className="w-3 h-3" /> Shared
                </button>
                <button
                  onClick={() => setLogVisibility('private')}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all ${
                    logVisibility === 'private'
                      ? 'border-lavender/20 text-cream bg-white/[0.05]'
                      : 'border-transparent text-lavender/30 hover:text-lavender/50'
                  }`}
                >
                  <Lock className="w-3 h-3" /> Private
                </button>
              </div>
              <button
                onClick={addLogEntry}
                disabled={!newLogContent.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 text-xs hover:bg-gold-400/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Send className="w-3 h-3" /> Record Entry
              </button>
            </div>
          </div>

          {/* Journal Feed */}
          <div className="space-y-3">
            {visibleLogs
              .filter((l) => l.phase === 'during')
              .map((log) => (
                <LogEntry key={log.id} entry={log} isAuthor={log.authorCes === currentCes} />
              ))}
            {visibleLogs.filter((l) => l.phase === 'during').length === 0 && (
              <p className="text-sm text-lavender/30 italic text-center py-8">
                No journal entries yet. This is a new journey. Begin with your first reflection.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Phase: Fulfillment */}
      {activePhase === 'after' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-5">
            <h3 className="font-serif text-lg text-cream mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-gold-400" /> Fulfillment
            </h3>
            <p className="text-sm text-lavender/60 mb-4 leading-relaxed">
              Fulfillment is a shared consensus, not a solo declaration. Every being involved affirms that the exchange is
              complete as it is. There is no pressure to declare perfection. Only to acknowledge what is.
            </p>

            <div className="p-4 rounded-lg border border-lavender/10 bg-white/[0.02] mb-4">
              <h4 className="text-xs uppercase tracking-widest text-lavender/40 font-sans mb-2">Shared Fulfillment Notes</h4>
              {journey.fulfillmentNotes ? (
                <p className="text-sm text-cream/80 leading-relaxed">{journey.fulfillmentNotes}</p>
              ) : (
                <p className="text-sm text-lavender/30 italic">
                  No fulfillment notes yet. When the exchange reaches its natural conclusion, co-creators write shared
                  reflections here.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-lavender/40">Consensus Status:</span>
              {journey.fulfillmentSignedBy.length >= 2 ? (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Complete, signed by ALL beings
                </span>
              ) : journey.status === 'fulfillment_review' ? (
                <span className="text-xs text-magenta-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Awaiting consensus ({journey.fulfillmentSignedBy.length}/2)
                </span>
              ) : (
                <span className="text-xs text-lavender/30">Not yet in fulfillment phase</span>
              )}
            </div>

            <button
              className="w-full py-2.5 rounded-full border border-green-400/20 text-green-300 hover:bg-green-400/10 transition-all text-sm mb-3"
              onClick={() => {
                if (!journey.fulfillmentSignedBy.includes(currentCes)) {
                  const updated = { ...journey, fulfillmentSignedBy: [...journey.fulfillmentSignedBy, currentCes] }
                  onJourneyUpdate(updated)
                  alert('You have signed off on fulfillment. The exchange is complete as it is in your view.')
                }
              }}
              disabled={journey.status !== 'fulfillment_review' || journey.fulfillmentSignedBy.includes(currentCes)}
            >
              Sign Fulfillment (Affirm this exchange is complete as it is)
            </button>

            <div className="p-4 rounded-lg border border-turquoise-400/10 bg-turquoise-400/[0.03]">
              <h4 className="text-xs uppercase tracking-widest text-turquoise-400/60 font-sans mb-1">Adaptation Pathway</h4>
              <p className="text-xs text-lavender/50 leading-relaxed mb-2">
                If this exchange wants to evolve, reshape, or become something new, all original co-creators must give
                consent. Adaptation is welcome when sovereignty is shared.
              </p>
              <button
                className="text-xs text-turquoise-400/60 hover:text-turquoise-300 underline"
                onClick={() => alert('Adaptation consent flow coming in Wave I.')}
              >
                Request Adaptation
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-lavender/40 font-sans">Fulfillment Phase Reflections</h4>
            {visibleLogs
              .filter((l) => l.phase === 'after')
              .map((log) => (
                <LogEntry key={log.id} entry={log} isAuthor={log.authorCes === currentCes} />
              ))}
          </div>

          {/* Storyfire */}
          {journey.fulfillmentSignedBy.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 p-6 rounded-2xl border border-gold-400/20 bg-gold-400/5 text-center"
            >
              <Sparkles className="w-8 h-8 text-gold-400 mx-auto mb-3" />
              <p className="font-serif text-gold-300 mb-2">Storyfire Complete</p>
              <p className="text-sm text-lavender/60">
                This exchange has been witnessed. What began as a wish has become a shared miracle in form. The Codes have
                been lived, the journey has been honored, and ALL beings are held in the field.
              </p>
            </motion.div>
          )}
        </div>
      )}
    </>
  )
}
