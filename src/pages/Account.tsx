// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Account Page
//  Atlas Island email binding, broadcast consent, and account security
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Megaphone, Check, AlertTriangle, Shield, ArrowLeft, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fetchAtlasMe, bindCesToAtlasUser, requestMagicLink } from '../lib/atlasAuth'
import { useSession } from '../lib/session'

export default function Account() {
  const { user } = useSession()
  const [atlasEmail, setAtlasEmail] = useState('')
  const [atlasCes, setAtlasCes] = useState('')
  const [email, setEmail] = useState('')
  const [broadcastOptIn, setBroadcastOptIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sent' | 'bound' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Load current Atlas identity in the background
  useEffect(() => {
    let mounted = true
    fetchAtlasMe()
      .then((me) => {
        if (!mounted) return
        if (me.success && me.user) {
          setAtlasEmail(me.user.email)
          setAtlasCes(me.user.cesProfileId || '')
          setEmail(me.user.email)
        }
      })
      .catch((err) => {
        console.warn('[Account] Could not load Atlas identity:', err)
      })
    return () => { mounted = false }
  }, [])

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validEmail) return
    setLoading(true)
    setStatus('idle')
    setError('')
    setMessage('')

    try {
      const result = await requestMagicLink(
        email.trim().toLowerCase(),
        `${window.location.origin}/auth/callback?returnTo=/account`
      )
      if (result.success) {
        setStatus('sent')
        setMessage('Magic link sent. The old email stays active until you click the new one.')
      } else {
        setStatus('error')
        setError(result.error || 'Could not send magic link.')
      }
    } catch (err: any) {
      setStatus('error')
      setError(err.message || 'Could not send magic link.')
    } finally {
      setLoading(false)
    }
  }

  const handleBindNow = async () => {
    if (!user?.ces) return
    setLoading(true)
    try {
      const bind = await bindCesToAtlasUser(user.ces)
      if (bind.success) {
        setStatus('bound')
        setMessage(`C.E.S. ${user.ces} is now bound to ${atlasEmail}.`)
      } else {
        setStatus('error')
        setError(bind.error || 'Could not bind C.E.S.')
      }
    } catch (err: any) {
      setStatus('error')
      setError(err.message || 'Could not bind C.E.S.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-12 max-w-2xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-lavender/60 hover:text-gold-400 transition-colors text-sm mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Collective
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="text-center">
          <Shield className="w-10 h-10 text-gold-400 mx-auto mb-3" />
          <h1 className="font-serif text-3xl text-cream mb-2">Atlas Island Account</h1>
          <p className="text-sm text-lavender/50">
            Manage the email identity that secures your C.E.S. across all Atlas Island subdomains.
          </p>
        </div>

        {/* Current connection status */}
        <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-5">
          <h2 className="font-serif text-lg text-cream mb-4">Current Connection</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-lavender/60">Atlas Email:</span>
              <span className="text-cream">{atlasEmail || 'Not connected'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lavender/60">Bound C.E.S.:</span>
              <span className="text-gold-300 font-mono">{atlasCes || user?.ces || '—'}</span>
            </div>
          </div>
        </div>

        {/* Change / add email */}
        <form onSubmit={handleSendMagicLink} className="rounded-xl border border-lavender/10 bg-void-800/40 p-5 space-y-5">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-lavender/50" />
            <h2 className="font-serif text-lg text-cream">Change or Add Email</h2>
          </div>

          <p className="text-sm text-lavender/50">
            Enter a new email to receive a magic link. Your current email stays active until you verify the new one.
          </p>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full px-4 py-2.5 rounded-xl bg-void-800/60 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none transition-colors"
          />

          <button
            type="submit"
            disabled={loading || !validEmail}
            className="w-full py-3 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                Send Magic Link
                <Mail className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Manual bind option for signed-in C.E.S. users */}
          {user?.ces && atlasEmail && atlasCes !== user.ces && (
            <button
              type="button"
              onClick={handleBindNow}
              disabled={loading}
              className="w-full py-2 rounded-xl border border-lavender/20 text-lavender/70 hover:text-cream hover:border-lavender/40 transition-all text-sm"
            >
              Bind C.E.S. {user.ces} to {atlasEmail} now
            </button>
          )}

          {status === 'sent' && (
            <div className="flex items-start gap-2 p-3 rounded-xl border border-green-400/20 bg-green-400/5 text-sm text-green-300">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              {message}
            </div>
          )}

          {status === 'bound' && (
            <div className="flex items-start gap-2 p-3 rounded-xl border border-green-400/20 bg-green-400/5 text-sm text-green-300">
              <Check className="w-4 h-4 shrink-0 mt-0.5" />
              {message}
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-start gap-2 p-3 rounded-xl border border-magenta-400/20 bg-magenta-400/5 text-sm text-magenta-400">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </form>

        {/* Broadcast consent */}
        <div className="rounded-xl border border-lavender/10 bg-void-800/40 p-5">
          <div className="flex items-start gap-3 mb-3">
            <Megaphone className="w-5 h-5 text-lavender/50 mt-0.5" />
            <h2 className="font-serif text-lg text-cream">Broadcasts & Updates</h2>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <div className={`
              w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors
              ${broadcastOptIn ? 'bg-gold-400/20 border-gold-400/50' : 'border-lavender/20 bg-void-800/60'}
            `}>
              {broadcastOptIn && <Check className="w-3.5 h-3.5 text-gold-400" />}
            </div>
            <input
              type="checkbox"
              className="hidden"
              checked={broadcastOptIn}
              onChange={(e) => setBroadcastOptIn(e.target.checked)}
            />
            <span className="text-sm text-lavender/70">
              I consent to receive Heartlight Collective & Atlas Island broadcasts and updates. I can change this anytime.
            </span>
          </label>
        </div>
      </motion.div>
    </div>
  )
}
