import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Store, Users, Package, Settings, Pause, Play, Trash2, X, CheckCircle, AlertCircle, Mail, UserPlus, Crown, Shield, PenTool } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStorage } from '../lib/storage';
import type { VendorRecord, PaymentMethodConfig, VendorJoinRequest } from '../types/ces';
import { PAYMENT_METHOD_LABELS } from '../lib/constants';

/* ─── Helper: slugify for URLs ─── */
function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/* ─── Helper: find user's C.E.S. from profile ─── */
function getMyCES(): string | null {
  try {
    const queues = ['pending', 'approved', 'returned'] as const;
    for (const q of queues) {
      const list = JSON.parse(localStorage.getItem(`hlc_${q}`) || '[]') as { cesNumber?: string }[];
      if (list.length > 0 && list[0].cesNumber) return list[0].cesNumber;
    }
  } catch { /* silent */ }
  return null;
}

/* ─── Payment method badge helper ─── */
function PaymentBadge({ method }: { method: PaymentMethodConfig }) {
  const labels = PAYMENT_METHOD_LABELS;
  const cfg = labels[method.type];
  if (!cfg) return null;
  const enabledClass = method.enabled ? 'bg-gold-400/20 text-gold-400 border-gold-400/30' : 'bg-lavender/5 text-lavender/40 border-lavender/10';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${enabledClass}`}>
      {method.enabled ? <CheckCircle className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
      {cfg.label}
    </span>
  );
}

/* ─── Create Storefront Modal ─── */
function CreateStorefrontModal({ onClose, onCreate }: { onClose: () => void; onCreate: (v: VendorRecord) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [collectiveFunded, setCollectiveFunded] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<PaymentMethodConfig[]>([
    { type: 'stripe', enabled: false },
    { type: 'venmo', enabled: false },
    { type: 'cashapp', enabled: false },
    { type: 'zelle', enabled: false },
    { type: 'collective', enabled: false, collectivePriority: false },
  ]);
  const [error, setError] = useState('');

  const myCes = getMyCES();

  const updatePayment = (type: string, key: string, value: unknown) => {
    setPaymentConfig(prev =>
      prev.map(p => p.type === type ? { ...p, [key]: value } : p)
    );
  };

  function handleSubmit() {
    if (!name.trim()) { setError('A storefront name is required'); return; }
    if (!myCes) { setError('You must have a C.E.S. profile to create a storefront'); return; }

    const now = new Date().toISOString();
    const vendor: VendorRecord = {
      id: `vendor_${Date.now()}`,
      name: name.trim(),
      slug: slugify(name.trim()),
      description: description.trim(),
      ownerCes: myCes,
      ownerName: '', // filled from profile
      members: [],
      offerings: [],
      paymentMethods: paymentConfig,
      status: 'active',
      collectiveFunded,
      joinRequests: [],
      createdAt: now,
      updatedAt: now,
    };
    onCreate(vendor);
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-void-900 border border-lavender/10 rounded-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-cream">Create Storefront</h2>
            <button onClick={onClose} className="text-lavender/40 hover:text-cream transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <div className="space-y-5">
            {/* Name + Description */}
            <div>
              <label className="block text-sm text-lavender/70 mb-1.5">Storefront Name</label>
              <input
                value={name} onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="e.g., Luna's Star Readings"
                className="w-full bg-void-800 border border-lavender/10 rounded-xl px-4 py-3 text-cream placeholder:text-lavender/30 focus:outline-none focus:border-gold-400/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-lavender/70 mb-1.5">Description</label>
              <textarea
                value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="What do you offer? What is your mission?"
                rows={3}
                className="w-full bg-void-800 border border-lavender/10 rounded-xl px-4 py-3 text-cream placeholder:text-lavender/30 focus:outline-none focus:border-gold-400/50 transition-colors resize-none"
              />
            </div>

            {/* Collective Funding */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox" checked={collectiveFunded}
                onChange={(e) => setCollectiveFunded(e.target.checked)}
                className="w-4 h-4 rounded border-lavender/20 bg-void-800 accent-gold-400"
              />
              <span className="text-sm text-lavender/70">
                Accept Collective-funded exchanges
                <span className="block text-xs text-lavender/40">Allow aligned exchanges to flow through the Collective treasury</span>
              </span>
            </label>

            {/* Payment Methods */}
            <div>
              <label className="block text-sm text-lavender/70 mb-3">Payment Methods</label>
              <div className="space-y-3">
                {paymentConfig.map((method) => {
                  const cfg = PAYMENT_METHOD_LABELS[method.type];
                  return (
                    <div key={method.type} className="rounded-xl border border-lavender/10 bg-void-800/50 p-3">
                      <label className="flex items-center gap-3 cursor-pointer mb-2">
                        <input
                          type="checkbox"
                          checked={method.enabled}
                          onChange={(e) => updatePayment(method.type, 'enabled', e.target.checked)}
                          className="w-4 h-4 rounded border-lavender/20 bg-void-800 accent-gold-400"
                        />
                        <span className="text-sm text-cream">{cfg.label}</span>
                      </label>
                      {method.enabled && method.type === 'venmo' && (
                        <input
                          value={(method as any).venmoUsername || ''}
                          onChange={(e) => updatePayment('venmo', 'venmoUsername', e.target.value)}
                          placeholder="@username"
                          className="w-full bg-void-900 border border-lavender/10 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/50 focus:outline-none"
                        />
                      )}
                      {method.enabled && method.type === 'cashapp' && (
                        <input
                          value={(method as any).cashappUsername || ''}
                          onChange={(e) => updatePayment('cashapp', 'cashappUsername', e.target.value)}
                          placeholder="$username"
                          className="w-full bg-void-900 border border-lavender/10 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/50 focus:outline-none"
                        />
                      )}
                      {method.enabled && method.type === 'zelle' && (
                        <input
                          value={(method as any).zelleContact || ''}
                          onChange={(e) => updatePayment('zelle', 'zelleContact', e.target.value)}
                          placeholder="phone or email"
                          className="w-full bg-void-900 border border-lavender/10 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/50 focus:outline-none"
                        />
                      )}
                      {method.enabled && method.type === 'stripe' && (
                        <p className="text-xs text-lavender/40">Stripe Connect account linking will be available in a future wave.</p>
                      )}
                      {method.enabled && method.type === 'collective' && (
                        <label className="flex items-center gap-2 cursor-pointer mt-1">
                          <input
                            type="checkbox"
                            checked={(method as any).collectivePriority || false}
                            onChange={(e) => updatePayment('collective', 'collectivePriority', e.target.checked)}
                            className="w-3 h-3 rounded border-lavender/20 bg-void-800 accent-gold-400"
                          />
                          <span className="text-xs text-lavender/50">Prefer Collective funding when available</span>
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-lavender/5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-lavender/10 text-lavender/60 hover:text-cream hover:border-lavender/20 transition-all text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl bg-gold-400/20 border border-gold-400/30 text-gold-400 hover:bg-gold-400/30 transition-all text-sm font-medium"
          >
            Create Storefront
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Member List ─── */
function MemberList({ members }: { members: VendorRecord['members'] }) {
  const roleIcon = (role: string) => {
    if (role === 'owner') return <Crown className="w-3 h-3 text-gold-400" />;
    if (role === 'admin') return <Shield className="w-3 h-3 text-blue-400" />;
    return <PenTool className="w-3 h-3 text-lavender/50" />;
  };
  const roleClass = (role: string) => {
    if (role === 'owner') return 'bg-gold-400/10 text-gold-300 border-gold-400/20';
    if (role === 'admin') return 'bg-blue-400/10 text-blue-300 border-blue-400/20';
    return 'bg-lavender/5 text-lavender/50 border-lavender/10';
  };

  return (
    <div className="space-y-1.5">
      {members.map((m) => (
        <div key={m.ces} className="flex items-center justify-between px-3 py-2 rounded-lg bg-void-800/50 border border-lavender/5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-void-900 border border-lavender/10 flex items-center justify-center text-[10px] text-lavender/40">
              {m.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-cream">{m.name}</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] border flex items-center gap-1 ${roleClass(m.role)}`}>
            {roleIcon(m.role)} {m.role}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Invite Member Modal ─── */
function InviteMemberModal({ vendor, onClose, onInvite }: {
  vendor: VendorRecord;
  onClose: () => void;
  onInvite: (req: VendorJoinRequest) => void;
}) {
  const [ces, setCes] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!ces.trim()) { setError('A C.E.S. number is required'); return; }

    const req: VendorJoinRequest = {
      id: `vjr_${Date.now()}`,
      vendorId: vendor.id,
      requesterCes: ces.trim(),
      requesterName: ces.trim(), // Will be resolved from profile in future
      message: message.trim() || undefined,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    onInvite(req);
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-void-900 border border-lavender/10 rounded-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-gold-400" />
              <h2 className="text-xl font-semibold text-cream">Invite Co-Creator</h2>
            </div>
            <button onClick={onClose} className="text-lavender/40 hover:text-cream transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <p className="text-sm text-lavender/50 mb-4">
            Invite a being to join <span className="text-cream">{vendor.name}</span>. They will receive a request to become a contributor.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-lavender/70 mb-1.5">C.E.S. Number</label>
              <input
                value={ces} onChange={(e) => { setCes(e.target.value); setError(''); }}
                placeholder="e.g., 111111111"
                className="w-full bg-void-800 border border-lavender/10 rounded-xl px-4 py-3 text-cream placeholder:text-lavender/30 focus:outline-none focus:border-gold-400/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-lavender/70 mb-1.5">Message (optional)</label>
              <textarea
                value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder="Why would you like them to join your collective?"
                rows={3}
                className="w-full bg-void-800 border border-lavender/10 rounded-xl px-4 py-3 text-cream placeholder:text-lavender/30 focus:outline-none focus:border-gold-400/50 transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-lavender/5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-lavender/10 text-lavender/60 hover:text-cream hover:border-lavender/20 transition-all text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl bg-gold-400/20 border border-gold-400/30 text-gold-400 hover:bg-gold-400/30 transition-all text-sm font-medium"
          >
            Send Invite
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Storefront Card ─── */
function StorefrontCard({ vendor, onUpdate }: { vendor: VendorRecord; onUpdate: (v: VendorRecord) => void }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showJoinRequests, setShowJoinRequests] = useState(false);

  const { addVendorJoinRequest, updateVendorJoinRequest, removeVendor } = useStorage();

  const offeringCount = vendor.offerings.length;
  const memberCount = vendor.members.length;
  const activePayments = vendor.paymentMethods.filter((m) => m.enabled).length;
  const pendingRequests = vendor.joinRequests?.filter((r) => r.status === 'pending') || [];

  function toggleStatus() {
    const nextStatus = vendor.status === 'active' ? 'paused' : 'active';
    onUpdate({ ...vendor, status: nextStatus, updatedAt: new Date().toISOString() });
  }

  function handleDelete() {
    removeVendor(vendor.id);
    setShowDeleteConfirm(false);
  }

  function handleInvite(req: VendorJoinRequest) {
    addVendorJoinRequest(req);
    onUpdate({ ...vendor, updatedAt: new Date().toISOString() });
  }

  function handleApproveJoin(req: VendorJoinRequest) {
    const updatedReq = { ...req, status: 'approved' as const, respondedAt: new Date().toISOString() };
    updateVendorJoinRequest(updatedReq);
    // Add to members as contributor
    const newMember = {
      ces: req.requesterCes,
      name: req.requesterName,
      role: 'contributor' as const,
      invitedAt: req.requestedAt,
      joinedAt: new Date().toISOString(),
      status: 'active' as const,
    };
    onUpdate({
      ...vendor,
      members: [...vendor.members, newMember],
      joinRequests: vendor.joinRequests?.map((r) =>
        r.id === req.id ? updatedReq : r
      ) || [updatedReq],
      updatedAt: new Date().toISOString(),
    });
  }

  function handleDeclineJoin(req: VendorJoinRequest) {
    const updatedReq = { ...req, status: 'declined' as const, respondedAt: new Date().toISOString() };
    updateVendorJoinRequest(updatedReq);
    onUpdate({
      ...vendor,
      joinRequests: vendor.joinRequests?.map((r) =>
        r.id === req.id ? updatedReq : r
      ) || [updatedReq],
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <motion.div
      layout
      className="bg-void-800/50 border border-lavender/10 rounded-2xl overflow-hidden hover:border-lavender/20 transition-colors"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center">
              <Store className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h3 className="font-semibold text-cream">{vendor.name}</h3>
              <p className="text-xs text-lavender/40">{vendor.slug}</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
            vendor.status === 'active'
              ? 'bg-green-500/10 text-green-400 border-green-500/20'
              : vendor.status === 'paused'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {vendor.status === 'active' ? 'Active' : vendor.status === 'paused' ? 'Paused' : 'Under Review'}
          </span>
        </div>

        {/* Description */}
        {vendor.description && (
          <p className="text-sm text-lavender/60 mb-4 line-clamp-2">{vendor.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-xs text-lavender/50">
          <span className="flex items-center gap-1">
            <Package className="w-3.5 h-3.5" /> {offeringCount} {offeringCount === 1 ? 'offering' : 'offerings'}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {memberCount + 1} member{memberCount !== 0 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1">
            <Settings className="w-3.5 h-3.5" /> {activePayments} payment{activePayments !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Payment badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {vendor.paymentMethods.map((m) => (
            <PaymentBadge key={m.type} method={m} />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-lavender/5">
          <button className="flex-1 py-2 rounded-lg bg-lavender/5 text-lavender/60 hover:text-cream hover:bg-lavender/10 transition-all text-xs font-medium flex items-center justify-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Offering
          </button>
          <button
            onClick={() => setShowInvite(true)}
            className="flex-1 py-2 rounded-lg bg-lavender/5 text-lavender/60 hover:text-cream hover:bg-lavender/10 transition-all text-xs font-medium flex items-center justify-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" /> Invite
          </button>
          <button
            onClick={toggleStatus}
            className={`py-2 px-3 rounded-lg transition-all text-xs font-medium flex items-center justify-center gap-1.5 ${
              vendor.status === 'active'
                ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
            }`}
            title={vendor.status === 'active' ? 'Pause storefront' : 'Activate storefront'}
          >
            {vendor.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="py-2 px-3 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
            title="Delete storefront"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Members Section */}
        {vendor.members.length > 0 && (
          <div className="mt-3 pt-3 border-t border-lavender/5">
            <button
              onClick={() => setShowMembers(prev => !prev)}
              className="flex items-center gap-2 text-xs text-lavender/50 hover:text-cream transition-colors mb-2"
            >
              <Users className="w-3.5 h-3.5" />
              {vendor.members.length + 1} member{vendor.members.length !== 0 ? 's' : ''}
              <span className="text-lavender/30">{showMembers ? '▲' : '▼'}</span>
            </button>
            {showMembers && (
              <div className="mb-2">
                {/* Owner */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gold-400/5 border border-gold-400/10 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-void-900 border border-gold-400/20 flex items-center justify-center text-[10px] text-gold-400">
                      {vendor.ownerName?.charAt(0).toUpperCase() || 'O'}
                    </div>
                    <span className="text-sm text-cream">{vendor.ownerName || 'Owner'}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] border bg-gold-400/10 text-gold-300 border-gold-400/20 flex items-center gap-1">
                    <Crown className="w-3 h-3" /> owner
                  </span>
                </div>
                <MemberList members={vendor.members} />
              </div>
            )}
          </div>
        )}

        {/* Pending Join Requests */}
        {pendingRequests.length > 0 && (
          <div className="mt-3 pt-3 border-t border-lavender/5">
            <button
              onClick={() => setShowJoinRequests(prev => !prev)}
              className="flex items-center gap-2 text-xs text-magenta-400 hover:text-magenta-300 transition-colors mb-2"
            >
              <Mail className="w-3.5 h-3.5" />
              {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''}
              <span className="text-magenta-400/50">{showJoinRequests ? '▲' : '▼'}</span>
            </button>
            {showJoinRequests && (
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="rounded-lg border border-lavender/10 bg-void-800/50 p-3">
                    <p className="text-sm text-cream mb-1">C.E.S. {req.requesterCes}</p>
                    {req.message && <p className="text-xs text-lavender/50 mb-2 italic">"{req.message}"</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveJoin(req)}
                        className="flex-1 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs hover:bg-green-500/20 transition-all"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDeclineJoin(req)}
                        className="flex-1 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-all"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInvite && (
          <InviteMemberModal
            vendor={vendor}
            onClose={() => setShowInvite(false)}
            onInvite={handleInvite}
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-red-500/10 bg-red-500/5"
          >
            <div className="p-4">
              <p className="text-sm text-red-400 mb-3">
                Are you sure? This will permanently remove <strong>{vendor.name}</strong> and all its offerings.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 rounded-lg border border-lavender/10 text-lavender/60 text-xs font-medium hover:text-cream transition-colors"
                >
                  Keep Storefront
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── My Storefronts Dashboard ─── */
export default function MyStorefronts() {
  const { getVendors, addVendor, updateVendor, findVendorByOwner } = useStorage();
  const [showCreate, setShowCreate] = useState(false);

  const myCes = getMyCES();
  const myVendors = useMemo(() => {
    if (!myCes) return [];
    return findVendorByOwner(myCes);
  }, [myCes, findVendorByOwner, getVendors()]);

  function handleCreate(vendor: VendorRecord) {
    addVendor(vendor);
  }

  function handleUpdate(vendor: VendorRecord) {
    updateVendor(vendor);
  }

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-2">
          <Link to="/exchange" className="text-lavender/40 hover:text-cream transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-cream tracking-tight">My Storefronts</h1>
        </div>
        <p className="text-lavender/50 text-sm ml-8">
          Manage your offerings, payment methods, and co-creator invites
        </p>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        {!myCes ? (
          <div className="text-center py-16">
            <Store className="w-12 h-12 text-lavender/20 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-lavender/60 mb-2">No C.E.S. Profile Found</h2>
            <p className="text-sm text-lavender/40 mb-6 max-w-md mx-auto">
              You need a Core Energetic Signature profile before you can create a storefront and offer your gifts to the Collective.
            </p>
            <Link
              to="/create-profile"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-400/20 border border-gold-400/30 text-gold-400 hover:bg-gold-400/30 transition-all text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Create C.E.S. Profile
            </Link>
          </div>
        ) : myVendors.length === 0 ? (
          <div className="text-center py-16">
            <Store className="w-12 h-12 text-lavender/20 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-lavender/60 mb-2">No Storefronts Yet</h2>
            <p className="text-sm text-lavender/40 mb-6 max-w-md mx-auto">
              Your offerings deserve a vessel. Create your first storefront to share your gifts, services, and creations with the Heartlight Collective.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-400/20 border border-gold-400/30 text-gold-400 hover:bg-gold-400/30 transition-all text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Create Storefront
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-lavender/40">
                {myVendors.length} storefront{myVendors.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-400/20 border border-gold-400/30 text-gold-400 hover:bg-gold-400/30 transition-all text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> New Storefront
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {myVendors.map((vendor) => (
                  <StorefrontCard key={vendor.id} vendor={vendor} onUpdate={handleUpdate} />
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateStorefrontModal
            onClose={() => setShowCreate(false)}
            onCreate={handleCreate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
