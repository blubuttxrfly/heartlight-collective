import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Store, Users, Package, Settings, Pause, Play, Trash2, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStorage } from '../lib/storage';
import type { VendorRecord, PaymentMethodConfig } from '../types/ces';
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
  const [error, setError] = useState('');

  const myCes = getMyCES();

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
      paymentMethods: [
        { type: 'stripe', enabled: false },
        { type: 'venmo', enabled: false },
        { type: 'cashapp', enabled: false },
        { type: 'zelle', enabled: false },
        { type: 'collective', enabled: false, collectivePriority: false },
      ],
      status: 'active',
      collectiveFunded,
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
        className="bg-void-900 border border-lavender/10 rounded-2xl w-full max-w-lg overflow-hidden"
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

          <div className="space-y-4">
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

/* ─── Storefront Card ─── */
function StorefrontCard({ vendor, onUpdate }: { vendor: VendorRecord; onUpdate: (v: VendorRecord) => void }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const offeringCount = vendor.offerings.length;
  const memberCount = vendor.members.length;
  const activePayments = vendor.paymentMethods.filter((m) => m.enabled).length;

  function toggleStatus() {
    const nextStatus = vendor.status === 'active' ? 'paused' : 'active';
    onUpdate({ ...vendor, status: nextStatus, updatedAt: new Date().toISOString() });
  }

  function handleDelete() {
    // Actual removal handled by parent; this just confirms
    setShowDeleteConfirm(false);
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
          <button className="flex-1 py-2 rounded-lg bg-lavender/5 text-lavender/60 hover:text-cream hover:bg-lavender/10 transition-all text-xs font-medium flex items-center justify-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Invite
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
      </div>

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
