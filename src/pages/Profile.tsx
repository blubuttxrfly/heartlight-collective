import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Phone, Link as LinkIcon } from 'lucide-react'
import { FaInstagram, FaYoutube, FaSpotify, FaDiscord, FaTelegram } from 'react-icons/fa'
import { FaThreads } from 'react-icons/fa6'
import { SiSignal } from 'react-icons/si'
import { useUnifiedStorage } from '../hooks/useUnifiedStorage'
import { useState, useEffect } from 'react'
import type { CreatorRecord } from '../types/ces'

const CONTACT_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  phone: Phone,
  instagram: FaInstagram,
  youtube: FaYoutube,
  threads: FaThreads,
  spotify: FaSpotify,
  discord: FaDiscord,
  telegram: FaTelegram,
  signal: SiSignal,
}

export default function Profile() {
  const { ces } = useParams<{ ces: string }>()
  const unified = useUnifiedStorage()
  const [profile, setProfile] = useState<CreatorRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ces) {
      setError('No C.E.S. provided in URL')
      setLoading(false)
      return
    }
    
    let isMounted = true
    
    const loadProfile = async () => {
      try {
        console.log('[Profile] Loading profile for CES:', ces)
        setLoading(true)
        setError(null)
        
        const found = await unified.findProfileByCES(ces)
        
        if (isMounted) {
          setProfile(found || null)
          if (!found) {
            setError('Profile not found')
          }
        }
      } catch (err: any) {
        console.error('Failed to load profile:', err)
        if (isMounted) {
          setError(err.message || 'Failed to load profile')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    loadProfile()
    
    // Cleanup: prevent state updates after unmount
    return () => {
      isMounted = false
    }
  }, [ces]) // Remove 'unified' from dependencies to prevent re-fetching

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-lavender/50">Loading profile...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-16 max-w-md mx-auto text-center">
        <h1 className="font-serif text-2xl text-cream mb-4">Profile Not Found</h1>
        <p className="text-lavender/50 mb-6">{error}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all"
        >
          Return Home
        </Link>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="px-4 py-16 max-w-md mx-auto text-center">
        <h1 className="font-serif text-2xl text-cream mb-4">Profile Not Found</h1>
        <p className="text-lavender/50 mb-6">This profile doesn't exist or isn't visible.</p>
        <Link
          to="/directory"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all"
        >
          Browse Directory
        </Link>
      </div>
    )
  }

  const visibleContacts = Object.entries(profile.contactMethods || {})
    .filter(([key]) => (profile.contactVisibility as any)?.[key])

  return (
    <div className="px-4 pb-16 max-w-3xl mx-auto">
      {/* Back Button */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-lavender/40 hover:text-cream transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Collective
      </Link>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-lavender/10 bg-void-900/40 p-8"
      >
        {/* Avatar + Name */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
          <div className="w-32 h-32 rounded-full border-2 border-lavender/20 overflow-hidden bg-void-800 flex items-center justify-center">
            {profile.photo ? (
              <img
                src={profile.photo}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl font-serif text-cream/80">
                {profile.emoji || '✦'}
              </span>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="font-serif text-3xl text-cream mb-2">
              {profile.name}
            </h1>
            {profile.title && (
              <p className="text-lg text-lavender/60 mb-2">{profile.title}</p>
            )}
            {profile.pronouns && (
              <p className="text-sm text-lavender/40 mb-2">{profile.pronouns}</p>
            )}
            {profile.location && (
              <p className="text-sm text-lavender/50 mb-3">📍 {profile.location}</p>
            )}
            <p className="text-xs font-mono text-gold-400/80">
              C.E.S. {profile.cesNumber}
            </p>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mb-8">
            <h2 className="font-serif text-xl text-cream mb-3">About</h2>
            <p className="text-lavender/70 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Astrology */}
        {(profile.sunPlacement || profile.moonPlacement) && (
          <div className="mb-8">
            <h2 className="font-serif text-xl text-cream mb-3">Placements</h2>
            <div className="flex gap-4 text-lavender/60">
              {profile.sunPlacement && (
                <span>☀️ Sun in {profile.sunPlacement}</span>
              )}
              {profile.moonPlacement && (
                <span>🌙 Moon in {profile.moonPlacement}</span>
              )}
            </div>
          </div>
        )}

        {/* Wish Availability */}
        <div className="mb-8">
          <span
            className={`inline-block px-4 py-2 rounded-full text-sm ${
              profile.wishAvailability === 'accepting'
                ? 'bg-green-400/10 text-green-300'
                : 'bg-orange-400/10 text-orange-300'
            }`}
          >
            {profile.wishAvailability === 'accepting'
              ? '🌱 Accepting Wishes'
              : '🍂 Not Accepting'}
          </span>
        </div>

        {/* Contact Methods */}
        {visibleContacts.length > 0 && (
          <div className="mb-8">
            <h2 className="font-serif text-xl text-cream mb-4">Connect</h2>
            <div className="flex flex-wrap gap-3">
              {visibleContacts.map(([key, value]) => {
                const Icon = CONTACT_ICON_MAP[key]
                if (!Icon) return null
                return (
                  <a
                    key={key}
                    href={
                      key === 'email'
                        ? `mailto:${value}`
                        : key === 'phone'
                        ? `tel:${value}`
                        : value.startsWith('http')
                        ? value
                        : `https://${value}`
                    }
                    target={key !== 'email' && key !== 'phone' ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-void-800/60 border border-lavender/10 text-lavender/60 hover:text-cream hover:border-gold-400/30 transition-all"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm capitalize">{key}</span>
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* Portfolio Link */}
        {profile.portfolioLink && (
          <div className="mb-8">
            <h2 className="font-serif text-xl text-cream mb-3">Portfolio</h2>
            <a
              href={profile.portfolioLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all"
            >
              <LinkIcon className="w-4 h-4" />
              Visit Portfolio
            </a>
          </div>
        )}

        {/* Edit Button */}
        <div className="pt-6 border-t border-lavender/10">
          <Link
            to="/edit-profile"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold-400/20 border border-gold-400/30 text-gold-300 hover:bg-gold-400/30 transition-all"
          >
            Edit Profile
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
