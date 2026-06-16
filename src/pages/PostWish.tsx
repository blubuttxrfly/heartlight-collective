import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles, Heart, Clock, Repeat, Upload, X, MapPin, Globe } from 'lucide-react'
import { PiShootingStar } from 'react-icons/pi'
import { Link } from 'react-router-dom'
import LocationSelect from '../components/LocationSelect'
import { SolarGoldButton, SolarGoldLink } from '../components/SolarGoldButton'
import { useSession } from '../lib/session'
import { useStorage } from '../lib/storage'
import { syncWish } from '../lib/exchangeSync'
import { WISH_SCOPE_LABELS } from '../lib/constants'
import type { LocationData, WishScope, ExchangeForm } from '../types/ces'

const CATEGORIES = [
  'Tech & Development',
  'Creative & Design',
  'Writing & Content',
  'Healing & Wellness',
  'Astrology & Guidance',
  'Music & Sound',
  'Events & Facilitation',
  'Mutual Aid',
  'Climate Action',
  'Co-Creation Partnership',
  'Resources',
  'Funds',
  'Space & Place',
  'Other'
]

const URGENCY_LEVELS = [
  { value: 'low', label: 'Gentle Pace', color: 'text-green-400', border: 'border-green-400/30' },
  { value: 'medium', label: 'Steady Flow', color: 'text-blue-400', border: 'border-blue-400/30' },
  { value: 'high', label: 'Urgent', color: 'text-magenta-400', border: 'border-magenta-400/30' },
  { value: 'time-sensitive', label: 'Time Sensitive', color: 'text-red-400', border: 'border-red-400/30' }
]

/* ═══════════════════════════════════════════════════════════════
   Exchange Avenues — aligned with the Heartlight Exchange forms
   ═══════════════════════════════════════════════════════════════ */
const AVENUES: { value: ExchangeForm; label: string; desc: string }[] = [
  { value: 'gift', label: 'Gift Economy', desc: 'Freely given, no expectation of return' },
  { value: 'barter', label: 'Barter / Mutual Exchange', desc: 'Swap skills, resources, or time directly' },
  { value: 'collective_funded', label: 'Collective-Funded', desc: 'Community resources stewarded for our Greatest & Highest Good' },
  { value: 'fixed', label: 'Fixed Heartlight Price', desc: 'A clear, agreed price in sovereign exchange' },
  { value: 'negotiable', label: 'Negotiable / Open', desc: 'Terms discovered together between beings' },
  { value: 'peer_payment', label: 'Peer Payment Methods', desc: 'Venmo, Cash App, Zelle, Chime, Stripe — direct between beings' }
]

const RESOURCES = [
  'Funds', 'Time', 'Space/Room', 'Equipment', 'Materials',
  'Transportation', 'Food', 'Skills', 'Network', 'Other'
]

export default function PostWish() {
  const [wishType, setWishType] = useState('wish')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [skills, setSkills] = useState('')
  const [selectedResources, setSelectedResources] = useState([])
  const [roles, setRoles] = useState('')
  const [urgency, setUrgency] = useState('low')
  const [locationData, setLocationData] = useState<LocationData | null>(null)
  const [scope, setScope] = useState<WishScope>('universal')
  const [avenue, setAvenue] = useState<ExchangeForm>('gift')
  const [fundsRequired, setFundsRequired] = useState('')
  const [fundsAvailable, setFundsAvailable] = useState('')
  const [timeCommitment, setTimeCommitment] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [isContinualOffering, setIsContinualOffering] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const { user } = useSession()
  const { findProfileByCES } = useStorage()

  // Pre-fill location from signed-in user's profile
  useEffect(() => {
    if (user?.ces) {
      const profile = findProfileByCES(user.ces)
      if (profile?.locationData) {
        setLocationData(profile.locationData)
      }
    }
  }, [user?.ces, findProfileByCES])

  const handleResourceToggle = (resource: string) => {
    setSelectedResources(prev =>
      prev.includes(resource)
        ? prev.filter(r => r !== resource)
        : [...prev, resource]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const wish = {
      id: `wish_${Date.now()}`,
      type: wishType,
      title,
      description,
      category,
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      resources: selectedResources,
      roles: roles.split(',').map(s => s.trim()).filter(Boolean),
      urgency,
      location: locationData?.raw || '',
      locationData: locationData || null,
      scope,
      exchangeAvenue: avenue,
      fundsRequired: fundsRequired ? Math.round(parseFloat(fundsRequired) * 100) : undefined,
      fundsAvailable: fundsAvailable ? Math.round(parseFloat(fundsAvailable) * 100) : undefined,
      timeCommitment,
      images,
      isContinualOffering: wishType === 'offer' ? isContinualOffering : false,
      status: 'open',
      postedByCes: 'local_user',
      postedByName: 'Atlas Island Being',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const existing = JSON.parse(localStorage.getItem('hlw_wishes') || '[]')
    existing.push(wish)
    localStorage.setItem('hlw_wishes', JSON.stringify(existing))
    syncWish(wish)

    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
    }, 800)
  }

  const labelText = wishType === 'wish' ? 'Wish' : 'Gift'

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto px-4 py-16 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-400/20 flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="font-serif text-3xl text-cream mb-4">
          Your {labelText} Is Now in the Field
        </h2>
        <p className="text-lavender/60 mb-8 max-w-md mx-auto">
          The Heartlight Wish Exchange is matching your {labelText.toLowerCase()} 
          with resonant beings. You will receive a notification when someone feels called to connect.
        </p>
        <div className="flex gap-4 justify-center">
          <SolarGoldLink to="/exchange">
            Browse the Exchange
          </SolarGoldLink>
          <Link
            to="/cast-wish"
            className="px-6 py-3 rounded-full border border-lavender/20 text-lavender/60 hover:border-lavender/40 transition-all"
            onClick={() => {
              setSubmitted(false)
              setTitle('')
              setDescription('')
              setCategory('')
              setIsContinualOffering(false)
            }}
          >
            Cast Another
          </Link>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pb-16">
      <div className="mb-6">
        <Link to="/exchange" className="inline-flex items-center gap-2 text-lavender/60 hover:text-gold-400 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Exchange
        </Link>
      </div>

      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-full bg-gold-400/10 border border-gold-400/20 flex items-center justify-center mx-auto mb-4">
          <PiShootingStar className="w-8 h-8 text-gold-400" />
        </div>
        <h1 className="font-serif text-3xl text-cream mb-2">
          {wishType === 'wish' ? 'Cast Your Wish' : 'Cast Your Gift'}
        </h1>
        <p className="text-lavender/50">
          {wishType === 'wish' 
            ? 'What do you need? The Exchange will match you with resonant co-creators.'
            : 'What do you offer? Your gifts are needed by beings in the field.'}
        </p>
      </div>

      <div className="flex gap-2 mb-8 justify-center">
        <button
          onClick={() => setWishType('wish')}
          className={`px-6 py-3 rounded-full border transition-all inline-flex items-center gap-2 ${
            wishType === 'wish'
              ? 'bg-magenta-400/10 border-magenta-400/30 text-magenta-300'
              : 'border-lavender/10 text-lavender/50 hover:border-lavender/30'
          }`}
        >
          I Have a Wish <Heart className="w-4 h-4" />
        </button>
        <button
          onClick={() => setWishType('offer')}
          className={`px-6 py-3 rounded-full border transition-all inline-flex items-center gap-2 ${
            wishType === 'offer'
              ? 'bg-gold-400/10 border-gold-400/30 text-gold-300'
              : 'border-lavender/10 text-lavender/50 hover:border-lavender/30'
          }`}
        >
          I Have a Gift <Sparkles className="w-4 h-4" />
        </button>
      </div>

      {/* Continual Offering Toggle — only for Gifts */}
      {wishType === 'offer' && (
        <div className="mb-8 flex justify-center">
          <button
            type="button"
            onClick={() => setIsContinualOffering(prev => !prev)}
            className={`px-5 py-2.5 rounded-full border text-sm transition-all inline-flex items-center gap-2 ${
              isContinualOffering
                ? 'bg-green-400/10 border-green-400/30 text-green-300'
                : 'border-lavender/10 text-lavender/50 hover:border-lavender/30'
            }`}
            title="When on, this gift stays visible even after someone claims it. You can fulfill multiple times."
          >
            <Repeat className={`w-4 h-4 ${isContinualOffering ? 'text-green-300' : 'text-lavender/40'}`} />
            {isContinualOffering ? 'Continual Offering On' : 'Continual Offering Off'}
          </button>
          <span className="sr-only">
            Toggle whether this gift remains discoverable after a claim
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-sm text-lavender/60 mb-2">
            {wishType === 'wish' ? 'What do you wish for?' : 'What gift do you offer?'}
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={wishType === 'wish' ? "Help building a React + Supabase integration..." : "I offer astrology readings with the 12 Codes..."}
            className="w-full px-4 py-3 rounded-xl bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-lavender/60 mb-2">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe the full context. What does success look like? What boundaries do you have? The more detail, the better the resonance matching."
            className="w-full px-4 py-3 rounded-xl bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none transition-colors resize-none"
            required
          />
          <p className="text-xs text-lavender/30 mt-1">
            The system reads the nuance of your words to find resonant co-creators. Be specific and sincere.
          </p>

          {/* Image Upload */}
          <div className="mt-4">
            <label className="block text-sm text-lavender/60 mb-2">Images <span className="text-lavender/30">(optional)</span></label>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              id="wish-images"
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                files.forEach(file => {
                  const reader = new FileReader()
                  reader.onload = (ev) => {
                    const result = ev.target?.result as string
                    if (result) setImages(prev => [...prev, result])
                  }
                  reader.readAsDataURL(file)
                })
                ;(e.target as HTMLInputElement).value = ''
              }}
            />
            <label
              htmlFor="wish-images"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-lavender/10 bg-void-800/40 text-lavender/60 hover:text-cream hover:border-gold-400/30 cursor-pointer transition-all text-sm"
            >
              <Upload className="w-4 h-4" />
              Upload Images
            </label>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {images.map((img, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-lavender/10 group">
                    <img src={img} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove image"
                    >
                      <X className="w-5 h-5 text-cream" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm text-lavender/60 mb-2">Category</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-2 rounded-xl border text-sm transition-all ${
                  category === cat
                    ? 'bg-magenta-400/10 border-magenta-400/30 text-magenta-300'
                    : 'border-lavender/10 text-lavender/50 hover:border-lavender/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-lavender/60 mb-2">
            {wishType === 'wish' ? 'Skills Needed' : 'Skills You Offer'}
          </label>
          <input
            type="text"
            value={skills}
            onChange={e => setSkills(e.target.value)}
            placeholder="react, supabase, design, facilitation..."
            className="w-full px-4 py-3 rounded-xl bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none transition-colors"
          />
          <p className="text-xs text-lavender/30 mt-1">Comma-separated list. The system uses these for tag-based matching.</p>
        </div>

        <div>
          <label className="block text-sm text-lavender/60 mb-2">Resources Involved</label>
          <div className="flex flex-wrap gap-2">
            {RESOURCES.map(resource => (
              <button
                key={resource}
                type="button"
                onClick={() => handleResourceToggle(resource)}
                className={`px-3 py-1.5 rounded-full border text-xs transition-all ${
                  selectedResources.includes(resource)
                    ? 'bg-gold-400/10 border-gold-400/30 text-gold-300'
                    : 'border-lavender/10 text-lavender/50 hover:border-lavender/30'
                }`}
              >
                {resource}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-lavender/60 mb-2">Roles in the Exchange</label>
          <input
            type="text"
            value={roles}
            onChange={e => setRoles(e.target.value)}
            placeholder="learner, teacher, co-creator, facilitator..."
            className="w-full px-4 py-3 rounded-xl bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm text-lavender/60 mb-2">Urgency</label>
          <div className="grid grid-cols-2 gap-2">
            {URGENCY_LEVELS.map(level => (
              <button
                key={level.value}
                type="button"
                onClick={() => setUrgency(level.value)}
                className={`px-4 py-3 rounded-xl border text-sm transition-all inline-flex items-center gap-2 ${
                  urgency === level.value
                    ? `${level.border} ${level.color} bg-void-800`
                    : 'border-lavender/10 text-lavender/50 hover:border-lavender/30'
                }`}
              >
                <Clock className="w-4 h-4" />
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Location + Scope */}
        <div>
          <label className="block text-sm text-lavender/60 mb-2">
            Where is this {labelText.toLowerCase()} rooted?
          </label>
          <LocationSelect
            value={locationData}
            onChange={setLocationData}
            placeholder="Search city, town, or place…"
            allowRemote
          />

          {/* Scope Selector */}
          <div className="mt-4">
            <label className="block text-xs text-lavender/40 mb-2 uppercase tracking-wider">
              Visibility — Who can discover this {labelText.toLowerCase()}?
            </label>
            <div className="flex flex-wrap gap-2">
              {(['local', 'global', 'universal'] as WishScope[]).map(s => {
                const config = WISH_SCOPE_LABELS[s]
                const isActive = scope === s
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScope(s)}
                    className={`px-4 py-2.5 rounded-xl border text-sm transition-all text-left inline-flex items-center gap-2 ${
                      isActive
                        ? s === 'local'
                          ? 'bg-green-400/10 border-green-400/30 text-green-300'
                          : s === 'global'
                          ? 'bg-blue-400/10 border-blue-400/30 text-blue-300'
                          : 'bg-magenta-400/10 border-magenta-400/30 text-magenta-300'
                        : 'border-lavender/10 text-lavender/50 hover:border-lavender/30'
                    }`}
                  >
                    {s === 'local' && <MapPin className="w-3.5 h-3.5" />}
                    {s === 'global' && <Globe className="w-3.5 h-3.5" />}
                    {s === 'universal' && <Sparkles className="w-3.5 h-3.5" />}
                    <span className="font-medium">{config.label}</span>
                    <span className="text-xs opacity-70">{config.description}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-lavender/60 mb-2">
              {wishType === 'wish' ? 'Funds Needed (USD)' : 'Funds You Can Offer (USD)'}
            </label>
            <input
              type="number"
              value={wishType === 'wish' ? fundsRequired : fundsAvailable}
              onChange={e => wishType === 'wish' ? setFundsRequired(e.target.value) : setFundsAvailable(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full px-4 py-3 rounded-xl bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-lavender/60 mb-2">Time Commitment</label>
            <input
              type="text"
              value={timeCommitment}
              onChange={e => setTimeCommitment(e.target.value)}
              placeholder="2-3 hours, ongoing, one-time..."
              className="w-full px-4 py-3 rounded-xl bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-lavender/60 mb-2">Exchange Avenue</label>
          <div className="grid md:grid-cols-2 gap-2">
            {AVENUES.map(a => (
              <button
                key={a.value}
                type="button"
                onClick={() => setAvenue(a.value)}
                className={`px-4 py-3 rounded-xl border text-left transition-all ${
                  avenue === a.value
                    ? 'bg-gold-400/10 border-gold-400/30 text-cream'
                    : 'border-lavender/10 text-lavender/50 hover:border-lavender/30'
                }`}
              >
                <div className="font-medium">{a.label}</div>
                <div className="text-xs text-lavender/40 mt-0.5">{a.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <SolarGoldButton
          type="submit"
          disabled={isSubmitting}
          icon={<PiShootingStar className="w-5 h-5" />}
          iconPosition="after"
          className="w-full py-4 rounded-xl"
        >
          {isSubmitting ? 'Entering the Field...' : `Cast My ${labelText}`}
        </SolarGoldButton>
      </form>
    </div>
  )
}
