import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, KeyRound, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useSession } from '../lib/session'
import { useUnifiedStorage } from '../hooks/useUnifiedStorage'

export default function SignIn() {
  const navigate = useNavigate()
  const { signIn } = useSession()
  const unified = useUnifiedStorage()
  const [ces, setCes] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('[SignIn] handleSubmit triggered');
    e.preventDefault()
    setError('')
    setSuccess(false)

    const normalized = ces.trim().replace(/\D/g, '')
    console.log('[SignIn] Normalized CES:', normalized, 'Original:', ces);
    console.log('[SignIn] Passphrase length:', passphrase.length);
    
    if (normalized.length !== 9) {
      console.log('[SignIn] Validation failed: CES not 9 digits');
      setError('C.E.S. must be exactly 9 digits.')
      return
    }
    if (passphrase.length < 6) {
      console.log('[SignIn] Validation failed: Passphrase too short');
      setError('Passphrase must be at least 6 characters.')
      return
    }

    setLoading(true)
    console.log('[SignIn] Calling unified.validateSignIn with:', normalized);

    try {
      // Try Supabase first, then localStorage
      const profile = await unified.validateSignIn(normalized, passphrase)
      console.log('[SignIn] validateSignIn returned:', profile ? 'SUCCESS' : 'NULL');
      
      if (!profile) {
        setError('C.E.S. not found or passphrase does not match. Please check your credentials or create a profile.')
        setLoading(false)
        return
      }

      // Success — sign in
      console.log('[SignIn] Calling signIn with profile:', profile.cesNumber, profile.name);
      await signIn(profile)
      unified.clearError()
      setSuccess(true)
      setTimeout(() => {
        navigate('/edit-profile')
      }, 1200)
    } catch (err: any) {
      console.error('[SignIn] Exception in handleSubmit:', err);
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-16 h-16 mx-auto mb-4">
            <img
              src={`${import.meta.env.BASE_URL}logo-transparent.png`}
              alt="Heartlight Collective"
              className="w-full h-full object-contain breathing-glow"
            />
          </motion.div>
          <h1 className="font-serif text-2xl text-cream mb-2">Welcome Back</h1>
          <p className="text-sm text-lavender/50">
            Enter your C.E.S. and passphrase to access your Co-Creation space.
          </p>
        </div>

        {/* Success state */}
        {success ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-8"
          >
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-lg text-cream mb-1">Resonance Recognized</p>
            <p className="text-sm text-lavender/50">Redirecting to your Collective space...✨</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* C.E.S. Input */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-lavender/40 font-sans mb-2">
                C.E.S. Number
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-lavender/30 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={ces}
                  onChange={(e) => setCes(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  maxLength={9}
                  placeholder="111111111"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-void-900/60 border border-lavender/10 text-cream text-lg tracking-wider text-center placeholder:text-lavender/20 focus:border-gold-400/30 focus:outline-none transition-colors font-serif"
                  autoFocus
                />
              </div>
            </div>

            {/* Passphrase */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-lavender/40 font-sans mb-2">
                Passphrase
              </label>
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Your sacred passphrase"
                className="w-full px-4 py-2.5 rounded-lg bg-void-900/60 border border-lavender/10 text-cream placeholder:text-lavender/20 focus:border-gold-400/30 focus:outline-none transition-colors"
              />
              <p className="text-[10px] text-lavender/30 mt-1">
                Your passphrase is set during profile creation. No password recovery via email.
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 p-3 rounded-lg border border-magenta-400/20 bg-magenta-400/5 text-sm text-magenta-400"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {loading ? 'Opening Portal...' : 'Enter Co-Creation Space'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>

            {/* Create Profile CTA */}
            <p className="text-center text-sm text-lavender/40 pt-4">
              No profile yet?{' '}
              <a href="/create-profile" className="text-gold-400 hover:text-gold-300 transition-colors"
              >
                Create Your C.E.S.
              </a>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  )
}
