import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, PenLine, CheckCircle2, Heart, Eye, EyeOff, Printer, Send, ChevronRight, FileText, Lock, Unlock, Sparkles, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ExchangeJourney, CodeLogEntry, JourneyPhase } from '../types/ces'

/* ─── Codes Data (inline for render, synced with Codes.tsx) ─── */
const CODES_DATA = [
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
    selectedCodes: [1, 3, 6, 9, 10],
    logs: [
      {
        id: 'log_01',
        exchangeId: 'journey_01',
        authorCes: '987654321',
        authorName: 'Seren Nova',
        ray: 'Red',
        codeNumber: 1,
        timestamp: '2026-06-01T14:30:00Z',
        content: 'Feeling clear about my boundaries entering this reading. I am open to what arrives but also know I can pause at any time.',
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
        content: 'Sat with Seren\'s chart for a week before our session. Intentional pacing feels aligned with the Blue Ray. I will share reflections as they arise.',
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
        content: 'The reading yesterday brought me such authentic joy. Seeing my chart reflected back to me felt like coming home. I wrote pages of notes and feel so seen.',
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
        content: 'Integration day. Consciously noticing how the insights are weaving into my daily life. Not forcing it. Just watching.',
        visibility: 'private',
        phase: 'during',
        moodEnergy: 'Gentle, observant',
      },
    ],
    fulfillmentNotes: '',
    fulfillmentSignedAt: null,
    fulfillmentSignedBy: [],
    adaptationConsent: false,
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
    selectedCodes: [1, 3, 6, 7, 9, 10],
    logs: [
      {
        id: 'log_10',
        exchangeId: 'journey_02',
        authorCes: '333333333',
        authorName: 'Web Weaver',
        ray: 'Indigo',
        codeNumber: 7,
        timestamp: '2026-05-15T10:00:00Z',
        content: 'Aligned on the vision: a warm, welcoming portal that feels like stepping into a sanctuary. No urgency, only resonance.',
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
        content: 'Consent check-in: The midway review felt good. Both of us had space to say what was working and what needed adjustment. The design shifted based on what felt true.',
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
        content: 'Communication has been flowing well. We check in about once per week, sometimes more when there is momentum. It never feels forced.',
        visibility: 'public',
        phase: 'during',
        moodEnergy: 'Flowing, communicative',
      },
    ],
    fulfillmentNotes: 'The portal is complete and feels like a true sanctuary. Atlas and I both feel this exchange was aligned and joyful. Ready to sign off.',
    fulfillmentSignedAt: null,
    fulfillmentSignedBy: [],
    adaptationConsent: false,
    createdAt: '2026-05-10T09:00:00Z',
    updatedAt: '2026-05-25T18:00:00Z',
  },
]

/* ─── Journey Card ─── */
function JourneyCard({ journey, isActive, onSelect }: { journey: ExchangeJourney; isActive: boolean; onSelect: () => void }) {
  const statusColors: Record<ExchangeJourney['status'], string> = {
    agreement_pending: 'border-lavender/20 text-lavender/60',
    active: 'border-gold-400/30 text-gold-400',
    fulfillment_review: 'border-magenta-400/30 text-magenta-400',
    complete: 'border-green-400/30 text-green-400',
    adapted: 'border-blue-400/30 text-blue-300',
  }
  const statusLabels: Record<ExchangeJourney['status'], string> = {
    agreement_pending: 'Agreement Pending',
    active: 'Active Co-Creation',
    fulfillment_review: 'Fulfillment Review',
    complete: 'Complete',
    adapted: 'Adapted',
  }

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        isActive
          ? 'border-gold-400/30 bg-gold-400/5'
          : 'border-white/5 bg-white/[0.03] hover:border-lavender/20 hover:bg-white/[0.05]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-serif text-sm text-cream leading-snug">{journey.title}</h3>
        <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border whitespace-nowrap ${statusColors[journey.status]}`}>
          {statusLabels[journey.status]}
        </span>
      </div>
      <p className="text-xs text-lavender/40 mt-1.5 line-clamp-1">{journey.description}</p>
      <div className="flex items-center gap-3 mt-2 text-[10px] text-lavender/30">
        <span>🌱 {journey.wishingName}</span>
        <span>→</span>
        <span>✨ {journey.coCreatorName}</span>
      </div>
    </button>
  )
}

/* ─── Present Codes Log Entry ─── */
function LogEntry({ entry, isAuthor }: { entry: CodeLogEntry; isAuthor: boolean }) {
  const code = CODES_DATA.find(c => c.number === entry.codeNumber) ?? CODES_DATA[0]
  const [showPrivateToggle, setShowPrivateToggle] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/5 bg-white/[0.03] p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: code.color }} />
          <span className="text-[10px] uppercase tracking-widest font-sans" style={{ color: code.color }}>
            Code {entry.codeNumber} · {code.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isAuthor && (
            <button
              onClick={() => setShowPrivateToggle(!showPrivateToggle)}
              className="text-lavender/30 hover:text-lavender/60 transition-colors"
              title={entry.visibility === 'private' ? 'Private entry' : 'Public entry'}
            >
              {entry.visibility === 'private' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          )}
          <span className="text-[10px] text-lavender/30">
            {new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-cream/80 font-medium">{entry.authorName}</span>
        {entry.moodEnergy && (
          <span className="text-[10px] text-lavender/40 italic">· {entry.moodEnergy}</span>
        )}
      </div>
      <p className="text-sm text-lavender/60 leading-relaxed">{entry.content}</p>
      {showPrivateToggle && isAuthor && (
        <div className="mt-3 flex items-center gap-2 text-xs text-lavender/50">
          {entry.visibility === 'private' ? (
            <span className="flex items-center gap-1"><EyeOff className="w-3 h-3" /> Only you can see this entry</span>
          ) : (
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Visible to all co-creators</span>
          )}
        </div>
      )}
    </motion.div>
  )
}

/* ─── Phase Tab ─── */
function PhaseTab({ label, phase, current, onClick }: { label: string; phase: JourneyPhase; current: JourneyPhase; onClick: () => void }) {
  const isActive = phase === current
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 text-sm transition-all ${
        isActive ? 'text-gold-300' : 'text-lavender/40 hover:text-lavender/70'
      }`}
    >
      <div className="flex items-center gap-1.5">
        {phase === 'before' && <FileText className={`w-3.5 h-3.5 ${isActive ? 'text-gold-400' : ''}`} />}
        {phase === 'during' && <PenLine className={`w-3.5 h-3.5 ${isActive ? 'text-gold-400' : ''}`} />}
        {phase === 'after' && <CheckCircle2 className={`w-3.5 h-3.5 ${isActive ? 'text-gold-400' : ''}`} />}
        {label}
      </div>
      {isActive && <motion.div layoutId="phaseTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold-400/60" />}
    </button>
  )
}

/* ─── Main Page ─── */
export default function Flow() {
  const [selectedJourneyId, setSelectedJourneyId] = useState<string>(MOCK_JOURNEYS[0].id)
  const [activePhase, setActivePhase] = useState<JourneyPhase>('during')
  const [newLogContent, setNewLogContent] = useState('')
  const [selectedCodeNum, setSelectedCodeNum] = useState(1)
  const [logVisibility, setLogVisibility] = useState<'private' | 'public'>('public')

  const journey = useMemo(() => MOCK_JOURNEYS.find(j => j.id === selectedJourneyId) || MOCK_JOURNEYS[0], [selectedJourneyId])

  // Filter logs by phase + visibility (show public logs + the author's private logs)
  const visibleLogs = useMemo(() => {
    return journey.logs
      .filter(l => l.phase === activePhase)
      .filter(l => l.visibility === 'public' || l.authorCes === '987654321') // Mock: pretend viewer is wishingCes
  }, [journey, activePhase])

  const addLogEntry = useCallback(() => {
    if (!newLogContent.trim()) return
    const newLog: CodeLogEntry = {
      id: `log_${Date.now()}`,
      exchangeId: journey.id,
      authorCes: '987654321',
      authorName: 'Seren Nova', // Mock current user
      ray: CODES_DATA.find(c => c.number === selectedCodeNum)?.ray.split(' ')[0] as any ?? 'Red',
      codeNumber: selectedCodeNum,
      timestamp: new Date().toISOString(),
      content: newLogContent.trim(),
      visibility: logVisibility,
      phase: activePhase,
      moodEnergy: 'Clear, intentional',
    }
    // In real implementation, this would go through storage
    journey.logs.push(newLog)
    setNewLogContent('')
  }, [newLogContent, selectedCodeNum, logVisibility, activePhase, journey])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

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
        <h1 className="font-serif text-2xl md:text-3xl text-cream mb-2">Codes Co-Creation Journey</h1>
        <p className="text-lavender/60 max-w-lg mx-auto text-sm">
          Document, reflect, and navigate your co-creation exchanges through the 12 Codes of ALL.
          Private notes and shared logs bring awareness to the journey.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar: Journey List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xs uppercase tracking-widest text-lavender/40 font-sans">Your Co-Creations</h2>
            <span className="text-[10px] text-lavender/30">{MOCK_JOURNEYS.length} active</span>
          </div>
          {MOCK_JOURNEYS.map(j => (
            <JourneyCard
              key={j.id}
              journey={j}
              isActive={j.id === selectedJourneyId}
              onSelect={() => { setSelectedJourneyId(j.id); setActivePhase(j.currentPhase) }}
            />
          ))}
          <button
            className="w-full py-2.5 rounded-xl border border-dashed border-lavender/10 text-lavender/40 hover:text-lavender/60 hover:border-lavender/20 transition-all text-sm"
            onClick={() => alert('Creating a new journey will begin with crafting an Agreement. Coming in Wave I.')}
          >
            + Begin New Journey
          </button>
        </div>

        {/* Main: Journey Detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={journey.id + activePhase}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Journey Title Row */}
            <div className="mb-4">
              <h2 className="font-serif text-xl text-cream mb-1">{journey.title}</h2>
              <div className="flex items-center gap-3 text-xs text-lavender/50">
                <span>🌱 {journey.wishingName}</span>
                <ChevronRight className="w-3 h-3" />
                <span>✨ {journey.coCreatorName}</span>
              </div>
            </div>

            {/* Selected Codes Chips */}
            <div className="flex flex-wrap gap-2 mb-5">
              {journey.selectedCodes.map(num => {
                const code = CODES_DATA.find(c => c.number === num)!
                return (
                  <span
                    key={num}
                    className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border"
                    style={{ borderColor: code.color + '30', color: code.color }}
                  >
                    {num}. {code.name}
                  </span>
                )
              })}
            </div>

            {/* Phase Tabs */}
            <div className="flex gap-1 mb-6 border-b border-lavender/10">
              <PhaseTab label="Agreement" phase="before" current={activePhase} onClick={() => setActivePhase('before')} />
              <PhaseTab label="Present Log" phase="during" current={activePhase} onClick={() => setActivePhase('during')} />
              <PhaseTab label="Fulfillment" phase="after" current={activePhase} onClick={() => setActivePhase('after')} />
            </div>

            {/* ─── Phase: Agreement (Before) ─── */}
            {activePhase === 'before' && (
              <div className="space-y-5">
                <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-5">
                  <h3 className="font-serif text-lg text-cream mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gold-400" /> The Exchange Agreement
                  </h3>
                  <p className="text-sm text-lavender/60 mb-4 leading-relaxed">
                    Before co-creation begins, beings craft and co-sign an Agreement. This document captures
                    roles, boundaries, communication preferences, and the Codes most relevant to this exchange.
                  </p>

                  <div className="space-y-3 text-sm">
                    <div className="flex gap-3">
                      <div className="w-24 text-right text-lavender/30 text-xs pt-1">What</div>
                      <div className="text-cream/80">{journey.description}</div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-24 text-right text-lavender/30 text-xs pt-1">Wishing</div>
                      <div className="text-cream/80">{journey.wishingName} <span className="text-lavender/30">(C.E.S. {journey.wishingCes})</span></div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-24 text-right text-lavender/30 text-xs pt-1">Co-Creating</div>
                      <div className="text-cream/80">{journey.coCreatorName} <span className="text-lavender/30">(C.E.S. {journey.coCreatorCes})</span></div>
                    </div>
                  </div>

                  <div className="mt-5 p-4 rounded-lg border border-gold-400/10 bg-gold-400/[0.03]">
                    <p className="text-xs text-gold-400/70 italic">
                      In a live system, this Agreement is co-signed by both beings before work begins.
                      This prototype displays the journey scaffold.
                    </p>
                  </div>
                </div>

                {visibleLogs.length > 0 && (
                  <div className="space-y-3 mt-6">
                    <h4 className="text-xs uppercase tracking-widest text-lavender/40 font-sans">Agreement Phase Reflections</h4>
                    {visibleLogs.filter(l => l.phase === 'before').map(log => (
                      <LogEntry key={log.id} entry={log} isAuthor={log.authorCes === '987654321'} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── Phase: Present Codes Log (During) ─── */}
            {activePhase === 'during' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-serif text-lg text-cream flex items-center gap-2">
                    <PenLine className="w-4 h-4 text-gold-400" /> Present Codes Log
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
                  Document the living journey of your co-creation. Shared entries are visible to all co-creators.
                  Private entries are yours alone. Toggle any entry between the two.
                </p>

                {/* New Log Composer */}
                <div className="rounded-xl border border-lavender/15 bg-void-800/60 p-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {journey.selectedCodes.map(num => {
                      const code = CODES_DATA.find(c => c.number === num)!
                      const isSelected = num === selectedCodeNum
                      return (
                        <button
                          key={num}
                          onClick={() => setSelectedCodeNum(num)}
                          className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border transition-all ${
                            isSelected ? 'bg-white/10 text-cream' : 'border-white/5 text-lavender/40 hover:text-lavender/60'
                          }`}
                          style={{ borderColor: isSelected ? code.color + '60' : 'rgba(255,255,255,0.05)' }}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full inline-block mr-1" style={{ background: code.color }} />}
                          {code.name}
                        </button>
                      )
                    })}
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
                      <Send className="w-3 h-3" /> Log Entry
                    </button>
                  </div>
                </div>

                {/* Log Feed */}
                <div className="space-y-3">
                  {visibleLogs.filter(l => l.phase === 'during').map(log => (
                    <LogEntry key={log.id} entry={log} isAuthor={log.authorCes === '987654321'} />
                  ))}
                  {visibleLogs.filter(l => l.phase === 'during').length === 0 && (
                    <p className="text-sm text-lavender/30 italic text-center py-8">No log entries yet. This is a new journey. Begin with your first reflection.</p>
                  )}
                </div>
              </div>
            )}

            {/* ─── Phase: Fulfillment (After) ─── */}
            {activePhase === 'after' && (
              <div className="space-y-5">
                <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-5">
                  <h3 className="font-serif text-lg text-cream mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold-400" /> Fulfillment
                  </h3>
                  <p className="text-sm text-lavender/60 mb-4 leading-relaxed">
                    Fulfillment is a shared consensus, not a solo declaration. Every being involved affirms
                    that the exchange is complete as it is. There is no pressure to declare perfection.
                    Only to acknowledge what is.
                  </p>

                  <div className="p-4 rounded-lg border border-lavender/10 bg-white/[0.02] mb-4">
                    <h4 className="text-xs uppercase tracking-widest text-lavender/40 font-sans mb-2">Shared Fulfillment Notes</h4>
                    {journey.fulfillmentNotes ? (
                      <p className="text-sm text-cream/80 leading-relaxed">{journey.fulfillmentNotes}</p>
                    ) : (
                      <p className="text-sm text-lavender/30 italic">No fulfillment notes yet. When the exchange reaches its natural conclusion, co-creators write shared reflections here.</p>
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
                      if (!journey.fulfillmentSignedBy.includes('987654321')) {
                        journey.fulfillmentSignedBy.push('987654321')
                        alert('You have signed off on fulfillment. The exchange is complete as it is in your view.')
                      }
                    }}
                    disabled={journey.status !== 'fulfillment_review' || journey.fulfillmentSignedBy.includes('987654321')}
                  >
                    Sign Fulfillment (Affirm this exchange is complete as it is)
                  </button>

                  <div className="p-4 rounded-lg border border-turquoise-400/10 bg-turquoise-400/[0.03]">
                    <h4 className="text-xs uppercase tracking-widest text-turquoise-400/60 font-sans mb-1">Adaptation Pathway</h4>
                    <p className="text-xs text-lavender/50 leading-relaxed mb-2">
                      If this exchange wants to evolve, reshape, or become something new, all original co-creators
                      must give consent. Adaptation is welcome when sovereignty is shared.
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
                  {visibleLogs.filter(l => l.phase === 'after').map(log => (
                    <LogEntry key={log.id} entry={log} isAuthor={log.authorCes === '987654321'} />
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
                      This exchange has been witnessed. What began as a wish has become a shared miracle in form.
                      The Codes have been lived, the journey has been honored, and ALL beings are held in the field.
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
