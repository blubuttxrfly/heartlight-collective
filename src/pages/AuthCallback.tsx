// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Auth Callback Page
//  Receives user back from auth.atlasisland.co magic link,
//  fetches shared session, binds C.E.S. profile, then redirects.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchAtlasMe, bindCesToAtlasUser } from '../lib/atlasAuth'
import { useSession } from '../lib/session'
import { useUnifiedStorage } from '../hooks/useUnifiedStorage'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { signIn } = useSession()
  const unified = useUnifiedStorage()
  const [status, setStatus] = useState('Opening the sacred doorway...')
  const [error, setError] = useState('')

  useEffect(() => {
    const returnTo = params.get('returnTo') || '/edit-profile'

    const completeSignIn = async () => {
      try {
        setStatus('Recognizing your resonance...')
        const me = await fetchAtlasMe()

        if (!me.success || !me.user?.email) {
          setError(me.error || 'Unable to recognize your session. Please try the magic link again.')
          return
        }

        const { email, cesProfileId } = me.user

        // If the Atlas user already has a CES bound, find and sign in to that profile
        if (cesProfileId) {
          setStatus(`Welcoming back ${cesProfileId}...`)
          const profile = await unified.findProfileByCES(cesProfileId)
          if (profile) {
            await signIn(profile)
            navigate(returnTo)
            return
          }
        }

        // No CES bound yet — look for a Heartlight profile with this email in contactMethods
        const allProfiles = await unified.getProfiles()
        const matchedByEmail = allProfiles.find(
          (p) => p.contactMethods?.email?.toLowerCase().trim() === email.toLowerCase().trim()
        )

        if (matchedByEmail?.cesNumber) {
          setStatus(`Binding ${matchedByEmail.cesNumber} to your Atlas identity...`)
          const bind = await bindCesToAtlasUser(matchedByEmail.cesNumber)
          if (!bind.success) {
            console.warn('[AuthCallback] bind-ces failed:', bind.error)
          }
          await signIn(matchedByEmail)
          navigate(returnTo)
          return
        }

        // No matching profile yet — send them to create-profile with email prefilled
        setStatus('No C.E.S. profile found for this email. Let\'s create one...')
        navigate(`/create-profile?email=${encodeURIComponent(email)}&returnTo=${encodeURIComponent(returnTo)}`)
      } catch (err: any) {
        console.error('[AuthCallback] error:', err)
        setError(err.message || 'Something went wrong during sign-in.')
      }
    }

    completeSignIn()
  }, [navigate, params, signIn, unified])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-16 h-16 mx-auto mb-6">
          <img
            src={`${import.meta.env.BASE_URL}logo-transparent.png`}
            alt="Heartlight Collective"
            className="w-full h-full object-contain breathing-glow"
          />
        </div>

        {error ? (
          <>
            <h1 className="font-serif text-xl text-cream mb-2">Doorway Could Not Open</h1>
            <p className="text-sm text-magenta-400 mb-6">{error}</p>
            <button
              onClick={() => navigate('/sign-in')}
              className="px-6 py-2 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all"
            >
              Try Again
            </button>
          </>
        ) : (
          <>
            <h1 className="font-serif text-xl text-cream mb-2">Entering Heartlight</h1>
            <p className="text-sm text-lavender/60">{status}</p>
          </>
        )}
      </motion.div>
    </div>
  )
}
