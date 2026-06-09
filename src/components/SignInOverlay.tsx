import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Sparkles, ShieldCheck } from 'lucide-react';
import { useStorage } from '../lib/storage';
import { useSession } from '../lib/session';
import { cesEncrypt } from '../lib/ces';

interface SignInOverlayProps {
  open: boolean;
  onClose: () => void;
}

export default function SignInOverlay({ open, onClose }: SignInOverlayProps) {
  const { findProfileByCES, addSecurityLog } = useStorage();
  const { signIn } = useSession();
  const [step, setStep] = useState<'ces' | 'passphrase' | 'success' | 'error'>('ces');
  const [ces, setCes] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [profile, setProfile] = useState<ReturnType<typeof findProfileByCES>>(undefined);

  const reset = () => {
    setStep('ces');
    setCes('');
    setPassphrase('');
    setErrorMsg('');
    setAttempts(0);
    setProfile(undefined);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCesSubmit = () => {
    const clean = ces.trim();
    if (clean.length !== 9 || !/^\d{9}$/.test(clean)) {
      setErrorMsg('A C.E.S. is 9 digits. Please enter your full signature.');
      return;
    }

    const found = findProfileByCES(clean);
    if (!found) {
      setErrorMsg('That C.E.S. was not found. You can create a new profile below.');
      setAttempts((a) => a + 1);
      return;
    }

    setProfile(found);
    setErrorMsg('');
    setStep('passphrase');
  };

  const handlePassphraseSubmit = () => {
    if (!profile) return;
    const pp = passphrase.trim();
    if (pp.length < 6) {
      setErrorMsg('Passphrase must be at least 6 characters.');
      return;
    }

    if (pp !== profile.passphrase) {
      setErrorMsg('Passphrase does not match. Please try again.');
      setAttempts((a) => a + 1);
      // Log failed attempt
      addSecurityLog({
        timestamp: new Date().toISOString(),
        cesEncrypted: cesEncrypt(ces),
        type: 'signin_failed',
        status: 'failure',
        message: `Failed sign-in attempt ${attempts + 1} for C.E.S. ${ces}`,
      });
      return;
    }

    // Success
    signIn(profile);
    addSecurityLog({
      timestamp: new Date().toISOString(),
      cesEncrypted: cesEncrypt(ces),
      type: 'signin_success',
      status: 'success',
      message: `Successful sign-in for ${profile.name} (C.E.S. ${ces})`,
    });
    setStep('success');
    setTimeout(() => {
      handleClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl border border-gold-400/20 bg-void-900/95 p-6 shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-lavender/40 hover:text-cream transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <Sparkles className="w-8 h-8 text-gold-400 mx-auto mb-2" />
              <h2 className="font-serif text-xl text-cream">Sovereign Sign-In</h2>
              <p className="text-sm text-lavender/50 mt-1">Enter your C.E.S. and passphrase to access your profile.</p>
            </div>

            {errorMsg && (
              <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {errorMsg}
              </div>
            )}

            {step === 'ces' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-lavender/70 mb-1">Core Energetic Signature</label>
                  <input
                    type="text"
                    value={ces}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                      setCes(val);
                      setErrorMsg('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleCesSubmit()}
                    placeholder="9-digit number"
                    className="w-full px-4 py-3 rounded-xl bg-void-800/60 border border-lavender/10 text-cream text-center text-lg tracking-[0.3em] placeholder:text-lavender/30 placeholder:tracking-normal placeholder:text-sm focus:border-gold-400/40 focus:outline-none"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleCesSubmit}
                  disabled={ces.length !== 9}
                  className={`w-full py-3 rounded-xl text-sm font-medium transition-all ${
                    ces.length === 9
                      ? 'bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20'
                      : 'border border-white/5 text-lavender/20 cursor-not-allowed'
                  }`}
                >
                  Continue
                </button>
                <div className="pt-2 border-t border-lavender/10">
                  <p className="text-xs text-lavender/40 text-center mb-2">New to the Collective?</p>
                  <a
                    href="/create-profile"
                    onClick={(e) => { e.preventDefault(); handleClose(); }}
                    className="flex items-center justify-center w-full py-2.5 rounded-xl text-sm font-medium border border-gold-400/20 bg-gold-400/5 text-gold-300 hover:bg-gold-400/10 transition-all"
                  >
                    Create C.E.S. Profile
                  </a>
                </div>
              </div>
            )}

            {step === 'passphrase' && (
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <p className="text-sm text-lavender/60">C.E.S. <span className="text-gold-300 font-mono">{ces}</span></p>
                </div>
                <div>
                  <label className="block text-sm text-lavender/70 mb-1">Passphrase</label>
                  <div className="flex gap-2">
                    <input
                      type={showPassphrase ? 'text' : 'password'}
                      value={passphrase}
                      onChange={(e) => {
                        setPassphrase(e.target.value);
                        setErrorMsg('');
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handlePassphraseSubmit()}
                      placeholder="Your sovereign key"
                      className="flex-1 px-4 py-3 rounded-xl bg-void-800/60 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => setShowPassphrase(!showPassphrase)}
                      className="px-3 py-3 rounded-xl border border-lavender/10 text-lavender/50 hover:text-cream"
                    >
                      {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handlePassphraseSubmit}
                  disabled={passphrase.length < 6}
                  className={`w-full py-3 rounded-xl text-sm font-medium transition-all ${
                    passphrase.length >= 6
                      ? 'bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20'
                      : 'border border-white/5 text-lavender/20 cursor-not-allowed'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 inline mr-1" />
                  Sign In
                </button>
                <button
                  onClick={() => setStep('ces')}
                  className="w-full py-2 text-sm text-lavender/40 hover:text-lavender/70 transition-colors"
                >
                  Back to C.E.S.
                </button>
              </div>
            )}

            {step === 'success' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-4"
              >
                <ShieldCheck className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <p className="text-lg text-cream mb-1">Welcome back, {profile?.name}</p>
                <p className="text-sm text-lavender/50">Your resonance is recognized. Redirecting…</p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
