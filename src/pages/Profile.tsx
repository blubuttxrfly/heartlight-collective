import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Phone, Link as LinkIcon, Sun, Moon, Sunrise } from 'lucide-react'
import { FaInstagram, FaYoutube, FaSpotify, FaDiscord, FaTelegram } from 'react-icons/fa'
import { FaThreads } from 'react-icons/fa6'
import { SiSignal } from 'react-icons/si'
import { getContactUrl } from '../lib/constants'
import { useState, useEffect } from 'react'
import { fetchProfileByCes } from '../lib/profileApi'
import { getPaymentUrl, formatPaymentLabel, paymentTypeIcon } from '../lib/payments'
import { getRayAstrologyForSign } from '../lib/astrology'
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
  const [profile, setProfile] = useState<CreatorRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ces) {
      setError('No C.E.S. provided in URL')
      setLoading(false)
      return
    }

    const loadProfile = async () => {
      // Try Redis-backed API first for cross-device profile visibility
      try {
        const remote = await fetchProfileByCes(ces)
        if (remote) {
          console.log('[Profile] Remote profile found:', remote.name, 'CES:', remote.cesNumber)
          setProfile(remote)
          setLoading(false)
          return
        }
      } catch (err: any) {
        console.warn('[Profile] API fetch failed, falling back to localStorage:', err.message)
      }

      // Fall back to localStorage
      const pending = JSON.parse(localStorage.getItem('hlc_pending') || '[]')
      const approved = JSON.parse(localStorage.getItem('hlc_approved') || '[]')
      const returned = JSON.parse(localStorage.getItem('hlc_returned') || '[]')
      const allProfiles = [...pending, ...approved, ...returned]

      console.log('[Profile] Reading localStorage — total profiles:', allProfiles.length, 'queues:', {
        pending: pending.length,
        approved: approved.length,
        returned: returned.length
      })

      const match = allProfiles.find((p: any) => p.cesNumber === ces || p.ces_number === ces)

      if (match) {
        console.log('[Profile] Found profile:', match.name, 'CES:', match.cesNumber || match.ces_number)
        setProfile(match)
      } else {
        console.log('[Profile] No profile found for CES:', ces)
        setError('Profile not found')
      }

      setLoading(false)
    }

    loadProfile()
  }, [ces])

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
            <p className="text-xs font-mono text-gold-400/80 mb-4">
              C.E.S. {profile.cesNumber}
            </p>

            {/* Astrology Placements */}
            {(profile.sunPlacement || profile.moonPlacement || profile.ascendantPlacement) && (
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {profile.sunPlacement && (
                    <AstrologyBadge icon={Sun} label="Sun" sign={profile.sunPlacement} />
                  )}
                  {profile.moonPlacement && (
                    <AstrologyBadge icon={Moon} label="Moon" sign={profile.moonPlacement} />
                  )}
                  {profile.ascendantPlacement && (
                    <AstrologyBadge icon={Sunrise} label="Ascendant" sign={profile.ascendantPlacement} />
                  )}
                </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {profile.tags && profile.tags.length > 0 && (
          <div className="mb-8">
            <h2 className="font-serif text-xl text-cream mb-4">Roles</h2>
            <div className="flex flex-wrap gap-2 max-w-full">
              {profile.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-gold-400/10 border border-gold-400/20 text-gold-300 text-sm whitespace-nowrap"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bio */}
        {profile.bio && (
          <div className="mb-8">
            <h2 className="font-serif text-xl text-cream mb-3">About</h2>
            <p className="text-lavender/70 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Astrology */}
        {(profile.sunPlacement || profile.moonPlacement || profile.ascendantPlacement) && (
          <div className="mb-8">
            <h2 className="font-serif text-xl text-cream mb-3">Placements</h2>
            <div className="flex flex-wrap gap-3 text-lavender/70">
              {profile.sunPlacement && (
                <AstrologyBadge icon={Sun} label="Sun" sign={profile.sunPlacement} />
              )}
              {profile.moonPlacement && (
                <AstrologyBadge icon={Moon} label="Moon" sign={profile.moonPlacement} />
              )}
              {profile.ascendantPlacement && (
                <AstrologyBadge icon={Sunrise} label="Ascendant" sign={profile.ascendantPlacement} />
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
                    href={getContactUrl(key, value)}
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
            <h2 className="font-serif text-xl text-cream mb-3">Website</h2>
            <a
              href={profile.portfolioLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all"
            >
              <LinkIcon className="w-4 h-4" />
              Visit Website
            </a>
          </div>
        )}

        {/* Public Peer Payment Methods */}
        {profile.peerPaymentMethods?.some((m) => m.enabled && m.public) && (
          <div className="mb-8">
            <h2 className="font-serif text-xl text-cream mb-3">Mutual Aid</h2>
            <div className="flex flex-wrap gap-3">
              {profile.peerPaymentMethods
                .filter((m) => m.enabled && m.public)
                .map((method, idx) => {
                  const url = getPaymentUrl(method)
                  const label = formatPaymentLabel(method)
                  return (
                    <a
                      key={`${method.type}-${idx}`}
                      href={url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                        url
                          ? 'bg-green-400/10 border-green-400/30 text-green-300 hover:bg-green-400/20'
                          : 'bg-void-800/60 border-lavender/10 text-lavender/40 cursor-default'
                      }`}
                      onClick={(e) => {
                        if (!url) e.preventDefault()
                      }}
                    >
                      <span className="text-sm">{paymentTypeIcon(method.type)}</span>
                      <span className="text-sm">{label}</span>
                    </a>
                  )
                })}
            </div>
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

function AstrologyBadge({ icon: Icon, label, sign }: { icon: React.ComponentType<{ className?: string }>; label: string; sign: string }) {
  const ray = getRayAstrologyForSign(sign)
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-void-800/60 border border-lavender/10">
      <Icon className="w-4 h-4 text-lavender/60" />
      <span className="text-sm">{label} in {sign}</span>
      {ray && (
        <span
          className="text-xs px-2 py-0.5 rounded-full border"
          style={{ color: ray.color, borderColor: `${ray.color}40`, backgroundColor: `${ray.color}15` }}
        >
          {ray.code} · {ray.ray}
        </span>
      )}
    </div>
  )
}
