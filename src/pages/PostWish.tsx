import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Send, Sparkles, Heart, Clock, MapPin, Wand2 } from 'lucide-react'
import { Link } from 'react-router-dom'

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

const AVENUES = [
  { value: 'direct', label: 'Direct Mutual Aid', desc: 'Being-to-being, no intermediary' },
  { value: 'collective', label: 'Heartlight Collective', desc: 'Shared mutual aid resources' },
  { value: 'funded', label: 'Collective Funding', desc: 'Community-supported' },
  { value: 'partnership', label: 'Co-Creation Partnership', desc: 'Long-term collaboration' }
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
  const [location, setLocation] = useState('')
  const [avenue, setAvenue] = useState('direct')
  const [fundsRequired, setFundsRequired] = useState('')
  const [fundsAvailable, setFundsAvailable] = useState('')
  const [timeCommitment, setTimeCommitment] = useState('')
  const [selectedCodes, setSelectedCodes] = useState([1, 3, 6, 12])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleResourceToggle = (resource) => {
    setSelectedResources(prev => 
      prev.includes(resource) 
        ? prev.filter(r => r !== resource)
        : [...prev, resource]
    )
  }

  const toggleCode = (num) => {
    setSelectedCodes(prev => 
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    )
  }

  const handleSubmit = (e) => {
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
      location,
      exchangeAvenue: avenue,
      fundsRequired: fundsRequired ? Math.round(parseFloat(fundsRequired) * 100) : undefined,
      fundsAvailable: fundsAvailable ? Math.round(parseFloat(fundsAvailable) * 100) : undefined,
      timeCommitment,
      selectedCodes,
      status: 'open',
      postedByCes: 'local_user',
      postedByName: 'Atlas Island Being',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const existing = JSON.parse(localStorage.getItem('hlw_wishes') || '[]')
    existing.push(wish)
    localStorage.setItem('hlw_wishes', JSON.stringify(existing))

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
          <Link
            to="/exchange"
            className="px-6 py-3 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all"
          >
            Browse the Exchange
          </Link>
          <Link
            to="/post-wish"
            className="px-6 py-3 rounded-full border border-lavender/20 text-lavender/60 hover:border-lavender/40 transition-all"
            onClick={() => {
              setSubmitted(false)
              setTitle('')
              setDescription('')
              setCategory('')
            }}
          >
            Post Another
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
        <div className="w-16 h-16 rounded-full bg-magenta-500/10 border border-magenta-400/20 flex items-center justify-center mx-auto mb-4">
          <Wand2 className="w-8 h-8 text-magenta-400" />
        </div>
        <h1 className="font-serif text-3xl text-cream mb-2">
          {wishType === 'wish' ? 'Share Your Wish' : 'Share Your Gift'}
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
          className={`px-6 py-3 rounded-full border transition-all ${
            wishType === 'wish'
              ? 'bg-magenta-400/10 border-magenta-400/30 text-magenta-300'
              : 'border-lavender/10 text-lavender/50 hover:border-lavender/30'
          }`}
        >
          <Heart className="w-4 h-4 inline mr-2" /> I Have a Wish
        </button>
        <button
          onClick={() => setWishType('offer')}
          className={`px-6 py-3 rounded-full border transition-all ${
            wishType === 'offer'
              ? 'bg-gold-400/10 border-gold-400/30 text-gold-300'
              : 'border-lavender/10 text-lavender/50 hover:border-lavender/30'
          }`}
        >
          <Sparkles className="w-4 h-4 inline mr-2" /> I Have a Gift
        </button>
      </div>

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
                className={`px-4 py-3 rounded-xl border text-sm transition-all ${
                  urgency === level.value
                    ? `${level.border} ${level.color} bg-void-800`
                    : 'border-lavender/10 text-lavender/50 hover:border-lavender/30'
                }`}
              >
                <Clock className="w-4 h-4 inline mr-2" />
                {level.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-lavender/60 mb-2">Location / Timezone</label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder='New York, EST — or "Remote / Anywhere"'
            className="w-full px-4 py-3 rounded-xl bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none transition-colors"
          />
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
                    ? 'bg-magenta-400/10 border-magenta-400/30 text-cream'
                    : 'border-lavender/10 text-lavender/50 hover:border-lavender/30'
                }`}
              >
                <div className="font-medium">{a.label}</div>
                <div className="text-xs text-lavender/40 mt-0.5">{a.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-lavender/60 mb-2">
            Which 12 Codes Guide This {labelText}?
          </label>
          <div className="text-xs text-lavender/30 mb-3">
            Selected: {selectedCodes.join(', ')}
          </div>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
              <button
                key={num}
                type="button"
                onClick={() => toggleCode(num)}
                className={`px-2 py-2 rounded-lg border text-sm transition-all ${
                  selectedCodes.includes(num)
                    ? 'bg-gold-400/10 border-gold-400/30 text-gold-300'
                    : 'border-lavender/10 text-lavender/40 hover:border-lavender/30'
                }`}
              >
                Code {num}
              </button>
            ))}
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all disabled:opacity-50"
        >
          <Send className="w-5 h-5 inline mr-2" />
          {isSubmitting ? 'Entering the Field...' : `Share My ${labelText}`}
        </motion.button>
      </form>
    </div>
  )
}
