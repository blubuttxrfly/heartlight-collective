import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff, Check, X, ArrowLeft, LogOut, AlertTriangle, UserCheck, UserX, RotateCcw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useStorage } from '../lib/storage';
import { cesEncrypt } from '../lib/ces';
import type { CreatorRecord, SecurityLogEntry } from '../types/ces';

/* ─── Steward Gate ─── */
export default function StewardGate() {
  const { getStewards, getPending, getApproved, getReturned, getSecurityLog, moveProfile, addSecurityLog } = useStorage();
  const navigate = useNavigate();

  const [authorized, setAuthorized] = useState(false);
  const [ces, setCes] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'pending' | 'approved' | 'returned' | 'security'>('pending');

  // Check if already a steward (stored in localStorage)
  useEffect(() => {
    const stewardCES = localStorage.getItem('hlc_stewardSession');
    if (stewardCES) {
      const stewards = getStewards();
      const match = stewards.find((s) => s.ces === stewardCES);
      if (match) setAuthorized(true);
    }
  }, [getStewards]);

  const handleGateSubmit = () => {
    const cleanCes = ces.trim();
    const cleanPass = passphrase.trim();

    if (cleanCes.length !== 9 || !/^\d{9}$/.test(cleanCes)) {
      setError('C.E.S. must be exactly 9 digits.');
      return;
    }
    if (cleanPass.length < 6) {
      setError('Passphrase must be at least 6 characters.');
      return;
    }

    const stewards = getStewards();
    const match = stewards.find((s) => s.ces === cleanCes && s.passphrase === cleanPass);

    if (!match) {
      setError('Steward credentials not recognized. This gate is for aligned stewards only.');
      addSecurityLog({
        timestamp: new Date().toISOString(),
        cesEncrypted: cesEncrypt(cleanCes),
        type: 'steward_gate_failed',
        status: 'failure',
        message: `Failed steward gate attempt for C.E.S. ${cleanCes}`,
      });
      return;
    }

    // Success
    localStorage.setItem('hlc_stewardSession', cleanCes);
    setAuthorized(true);
    setError('');
    addSecurityLog({
      timestamp: new Date().toISOString(),
      cesEncrypted: cesEncrypt(cleanCes),
      type: 'steward_gate_success',
      status: 'success',
      message: `Steward ${match.name || cleanCes} entered the gate`,
    });
  };

  const handleSignOut = () => {
    localStorage.removeItem('hlc_stewardSession');
    setAuthorized(false);
    setCes('');
    setPassphrase('');
    setError('');
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-lavender/60 hover:text-gold-400 transition-colors text-sm mb-6">
              <ArrowLeft className="w-4 h-4" /> Back to Collective
            </Link>
            <Shield className="w-12 h-12 text-gold-400 mx-auto mb-4" />
            <h1 className="font-serif text-3xl text-cream mb-2">Steward Gate</h1>
            <p className="text-lavender/60 text-sm">
              This portal is for aligned stewards of the Heartlight Collective.
              Enter your credentials to access the review panel.
            </p>
          </div>

          <div className="rounded-2xl border border-gold-400/15 bg-void-900/80 p-6 space-y-4">
            {error && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-lavender/70 mb-1">Steward C.E.S.</label>
              <input
                type="text"
                value={ces}
                onChange={(e) => { setCes(e.target.value.replace(/\D/g, '').slice(0, 9)); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleGateSubmit()}
                placeholder="9-digit C.E.S."
                className="w-full px-4 py-3 rounded-xl bg-void-800/60 border border-lavender/10 text-cream text-center tracking-[0.3em] placeholder:text-lavender/30 placeholder:tracking-normal placeholder:text-sm focus:border-gold-400/40 focus:outline-none"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm text-lavender/70 mb-1">Passphrase</label>
              <div className="flex gap-2">
                <input
                  type={showPassphrase ? 'text' : 'password'}
                  value={passphrase}
                  onChange={(e) => { setPassphrase(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleGateSubmit()}
                  placeholder="Sovereign key"
                  className="flex-1 px-4 py-3 rounded-xl bg-void-800/60 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
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
              onClick={handleGateSubmit}
              disabled={ces.length !== 9 || passphrase.length < 6}
              className={`w-full py-3 rounded-xl text-sm font-medium transition-all ${
                ces.length === 9 && passphrase.length >= 6
                  ? 'bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20'
                  : 'border border-white/5 text-lavender/20 cursor-not-allowed'
              }`}
            >
              <Lock className="w-4 h-4 inline mr-1" /> Enter Steward Portal
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Steward Panel ──
  const pending = getPending();
  const approved = getApproved();
  const returned = getReturned();
  const securityLog = getSecurityLog();

  return (
    <div className="px-4 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-gold-400" />
          <div>
            <h1 className="font-serif text-xl text-cream">Steward Portal</h1>
            <p className="text-xs text-lavender/50">Review, approve, and shepherd the collective</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-lavender/10 text-lavender/60 hover:text-lavender/80 hover:border-lavender/20 transition-all text-sm"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-lavender/10 pb-2">
        {[
          { key: 'pending' as const, label: `Pending (${pending.length})`, icon: AlertTriangle },
          { key: 'approved' as const, label: `Approved (${approved.length})`, icon: UserCheck },
          { key: 'returned' as const, label: `Returned (${returned.length})`, icon: UserX },
          { key: 'security' as const, label: 'Security Log', icon: Shield },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm flex items-center gap-1.5 transition-all ${
              tab === t.key
                ? 'bg-gold-400/10 border border-gold-400/30 text-gold-300'
                : 'text-lavender/50 hover:text-lavender/70'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {tab === 'pending' && (
          <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {pending.length === 0 ? (
              <div className="text-center py-12 text-lavender/40">No profiles awaiting review. The field is clear. ✦</div>
            ) : (
              <div className="space-y-4">
                {pending.map((p) => (
                  <ProfileReviewCard
                    key={p.id}
                    profile={p}
                    onApprove={() => moveProfile(p.id, 'pending', 'approved')}
                    onReturn={() => moveProfile(p.id, 'pending', 'returned')}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'approved' && (
          <motion.div key="approved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {approved.length === 0 ? (
              <div className="text-center py-12 text-lavender/40">No approved profiles yet.</div>
            ) : (
              <div className="space-y-3">
                {approved.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-lavender/10 bg-void-800/40 p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{p.emoji || '✦'}</span>
                      <div>
                        <div className="text-cream text-sm">{p.name}</div>
                        <div className="text-xs text-lavender/50">C.E.S. {p.cesNumber}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => moveProfile(p.id, 'approved', 'returned')}
                      className="px-3 py-1.5 rounded-full border border-orange-400/20 text-orange-300 text-xs hover:bg-orange-400/10 transition-all"
                    >
                      <RotateCcw className="w-3 h-3 inline mr-1" /> Return
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'returned' && (
          <motion.div key="returned" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {returned.length === 0 ? (
              <div className="text-center py-12 text-lavender/40">No returned profiles.</div>
            ) : (
              <div className="space-y-3">
                {returned.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl border border-lavender/10 bg-void-800/40 p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{p.emoji || '✦'}</span>
                      <div>
                        <div className="text-cream text-sm">{p.name}</div>
                        <div className="text-xs text-lavender/50">C.E.S. {p.cesNumber}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => moveProfile(p.id, 'returned', 'pending')}
                      className="px-3 py-1.5 rounded-full border border-gold-400/20 text-gold-300 text-xs hover:bg-gold-400/10 transition-all"
                    >
                      <RotateCcw className="w-3 h-3 inline mr-1" /> Re-review
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'security' && (
          <motion.div key="security" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {securityLog.length === 0 ? (
              <div className="text-center py-12 text-lavender/40">No security events recorded.</div>
            ) : (
              <div className="rounded-xl border border-lavender/10 bg-void-800/40 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-lavender/10 text-lavender/50 text-xs uppercase">
                        <th className="px-4 py-3 text-left">Time</th>
                        <th className="px-4 py-3 text-left">Type</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">C.E.S. (Encrypted)</th>
                        <th className="px-4 py-3 text-left">Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-lavender/5">
                      {securityLog.map((entry: SecurityLogEntry, i: number) => (
                        <tr key={i} className="hover:bg-white/3">
                          <td className="px-4 py-3 text-lavender/60 whitespace-nowrap">
                            {new Date(entry.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                              entry.type.includes('success')
                                ? 'bg-green-500/10 text-green-400'
                                : entry.type.includes('failed')
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-lavender/10 text-lavender/60'
                            }`}>
                              {entry.type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs ${entry.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                              {entry.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-lavender/40 font-mono text-xs">
                            {entry.cesEncrypted || '—'}
                          </td>
                          <td className="px-4 py-3 text-lavender/60">{entry.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Review Card ─── */
function ProfileReviewCard({
  profile,
  onApprove,
  onReturn,
}: {
  profile: CreatorRecord;
  onApprove: () => void;
  onReturn: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-gold-400/15 bg-void-800/60 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-void-900 border border-lavender/10 flex items-center justify-center text-xl">
            {profile.emoji || '✦'}
          </div>
          <div>
            <h3 className="font-serif text-lg text-cream">{profile.name}</h3>
            <div className="text-xs text-lavender/50">C.E.S. {profile.cesNumber}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onReturn}
            className="px-4 py-2 rounded-full border border-red-400/20 text-red-300 text-sm hover:bg-red-400/10 transition-all"
          >
            <X className="w-4 h-4 inline mr-1" /> Return
          </button>
          <button
            onClick={onApprove}
            className="px-4 py-2 rounded-full border border-green-400/20 text-green-300 text-sm hover:bg-green-400/10 transition-all"
          >
            <Check className="w-4 h-4 inline mr-1" /> Approve
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-lavender/70">
          <span className="text-lavender/40">Heartlight: </span>{profile.heartlight}
        </p>
        <p className="text-sm text-lavender/60">
          <span className="text-lavender/40">Offerings: </span>{profile.offerings.join(', ')}
        </p>
        <p className="text-sm text-lavender/60">
          <span className="text-lavender/40">Exchanges: </span>{profile.exchanges?.join(', ') || 'Not specified'}
        </p>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-gold-400/60 hover:text-gold-400 transition-colors"
        >
          {expanded ? 'Show less' : 'Show full profile'}
        </button>

        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 pt-2">
            <p className="text-sm text-lavender/60">
              <span className="text-lavender/40">Rays: </span>{(profile.rays || [profile.ray]).filter(Boolean).join(', ')}
            </p>
            {profile.location && <p className="text-sm text-lavender/60"><span className="text-lavender/40">Location: </span>{profile.location}</p>}
            {profile.pronouns && <p className="text-sm text-lavender/60"><span className="text-lavender/40">Pronouns: </span>{profile.pronouns}</p>}
            {profile.sunPlacement && <p className="text-sm text-lavender/60"><span className="text-lavender/40">Sun: </span>{profile.sunPlacement}</p>}
            {profile.moonPlacement && <p className="text-sm text-lavender/60"><span className="text-lavender/40">Moon: </span>{profile.moonPlacement}</p>}
            {profile.timeline && <p className="text-sm text-lavender/60"><span className="text-lavender/40">Timeline: </span>{profile.timeline}</p>}
            {profile.accessibility?.length > 0 && <p className="text-sm text-lavender/60"><span className="text-lavender/40">Accessibility: </span>{profile.accessibility.join(', ')}</p>}
          </motion.div>
        )}
      </div>
    </div>
  );
}
