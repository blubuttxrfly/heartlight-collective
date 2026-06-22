import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Store, Users, Package, Settings, Pause, Play, Trash2, X, CheckCircle, AlertCircle, Mail, UserPlus, Crown, Shield, PenTool, Globe, Sprout, Video, Clock, Calendar, MapPin, Home, Utensils, BookOpen, GraduationCap, Link2, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useStorage } from '../../lib/storage';
import { useSession } from '../../lib/session';
import { deleteOffering } from '../../lib/exchangeSync';
import { syncVendorToRedis } from '../../lib/redisSync';
import type { VendorRecord, PaymentMethodConfig, VendorJoinRequest, OfferingItem, OfferingCategory, OfferingType, MeetingPlatform, ExchangeLocation, WorkStudyExchangeConfig, VirtualSessionConfig, OfferingFulfiller, LocationData, PortfolioItem, VendorLink } from '../../types/ces';
import { PAYMENT_METHOD_LABELS, OFFERING_CATEGORIES } from '../../lib/constants';
import LocationSelect from '../../components/LocationSelect';

/* ─── Helper: slugify for URLs ─── */
function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
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
  const [logoUrl, setLogoUrl] = useState('');
  const [links, setLinks] = useState<VendorLink[]>([]);
  const [error, setError] = useState('');

  const { user } = useSession();
  const { findProfileByCES } = useStorage();
  const myCes = user?.ces || null;
  const myName = (myCes ? findProfileByCES(myCes)?.name : undefined) || user?.name || 'Atlas Island Being';

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
      ownerName: myName,
      members: [],
      offerings: [],
      logoUrl: logoUrl.trim() || undefined,
      paymentMethods: paymentConfig,
      status: 'active',
      collectiveFunded,
      links: links.length ? links : undefined,
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

            {/* Profile Icon URL */}
            <div>
              <label className="block text-sm text-lavender/70 mb-1.5">Vendor Shop Icon URL</label>
              <div className="flex items-center gap-3">
                <input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://... (upload support coming in a future wave)"
                  className="flex-1 bg-void-800 border border-lavender/10 rounded-xl px-4 py-3 text-cream placeholder:text-lavender/30 focus:outline-none focus:border-gold-400/50 transition-colors"
                />
                {logoUrl && (
                  <img src={logoUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-lavender/10" />
                )}
              </div>
              <p className="text-xs text-lavender/40 mt-1">Paste an image URL. Direct upload will arrive in a future wave.</p>
            </div>

            {/* Links */}
            <div>
              <label className="block text-sm text-lavender/70 mb-1.5">Vendor Links</label>
              <div className="space-y-2">
                {links.map((l, i) => (
                  <div key={l.id} className="flex items-center gap-2">
                    <input
                      value={l.label}
                      onChange={(e) => setLinks(prev => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                      placeholder="Label"
                      className="flex-1 bg-void-800 border border-lavender/10 rounded-xl px-3 py-2 text-sm text-cream placeholder:text-lavender/30 focus:outline-none focus:border-gold-400/50 transition-colors"
                    />
                    <input
                      value={l.url}
                      onChange={(e) => setLinks(prev => prev.map((x, j) => j === i ? { ...x, url: e.target.value } : x))}
                      placeholder="https://..."
                      className="flex-[2] bg-void-800 border border-lavender/10 rounded-xl px-3 py-2 text-sm text-cream placeholder:text-lavender/30 focus:outline-none focus:border-gold-400/50 transition-colors"
                    />
                    <button
                      onClick={() => setLinks(prev => prev.filter((_, j) => j !== i))}
                      className="p-2 rounded-lg text-lavender/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setLinks(prev => [...prev, { id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, label: '', url: '' }])}
                  className="inline-flex items-center gap-2 text-sm text-gold-400 hover:text-gold-300 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add link
                </button>
              </div>
            </div>

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

/* ─── Offerings List on Storefront Card ─── */
function StorefrontOfferings({ vendor, onUpdate }: { vendor: VendorRecord; onUpdate: (v: VendorRecord) => void }) {
  const [showList, setShowList] = useState(false);
  const [editingOffering, setEditingOffering] = useState<OfferingItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleToggleAvailability = (o: OfferingItem) => {
    const next: OfferingItem['availability'] = o.availability === 'unavailable' ? 'available' : 'unavailable';
    const updated: VendorRecord = {
      ...vendor,
      offerings: vendor.offerings.map((x) => (x.id === o.id ? { ...x, availability: next, updatedAt: new Date().toISOString() } : x)),
      updatedAt: new Date().toISOString(),
    };
    onUpdate(updated);
  };

  const handleDelete = async (id: string) => {
    // Wave 8.3 — remove from Supabase first, then from local vendor state
    try {
      const result = await deleteOffering(id);
      if (!result.success) {
        console.warn('[VendorShopManagement] deleteOffering failed for', id, result.error);
      }
    } catch (err) {
      console.warn('[VendorShopManagement] deleteOffering threw for', id, err);
    }

    const updated = {
      ...vendor,
      offerings: vendor.offerings.filter((o) => o.id !== id),
      updatedAt: new Date().toISOString(),
    };
    onUpdate(updated);
    setConfirmDelete(null);
  };

  const formatPrice = (o: OfferingItem) => {
    if (o.priceType === 'gift') return 'Gift';
    if (o.priceType === 'collective_funded') return 'Collective Funded';
    if (o.priceType === 'negotiable') return 'Negotiable';
    if (o.priceCents != null) return `$${(o.priceCents / 100).toFixed(2)}`;
    return 'Fixed';
  };

  const statusClass = (o: OfferingItem) => {
    switch (o.availability) {
      case 'available': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'limited': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'waitlist': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-lavender/5 text-lavender/40 border-lavender/10';
    }
  };

  return (
    <div className="border-t border-lavender/5 pt-3 mb-4">
      <button
        onClick={() => setShowList((p) => !p)}
        className="flex items-center gap-2 text-xs text-lavender/50 hover:text-cream transition-colors mb-2"
      >
        <Package className="w-3.5 h-3.5" />
        {vendor.offerings.length} {vendor.offerings.length === 1 ? 'offering' : 'offerings'}
        <span className="text-lavender/30">{showList ? '▲' : '▼'}</span>
      </button>

      {showList && vendor.offerings.length === 0 && (
        <p className="text-xs text-lavender/40 italic mb-2">No offerings yet. Add your first gift or service above.</p>
      )}

      {showList && vendor.offerings.length > 0 && (
        <div className="space-y-2 mb-3">
          {vendor.offerings.map((o) => (
            <div key={o.id} className="rounded-lg border border-lavender/10 bg-void-800/50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-cream font-medium truncate">{o.title}</p>
                  <p className="text-[10px] text-lavender/40 truncate">{o.category}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] border ${statusClass(o)}`}>
                    {o.availability}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gold-400 font-medium">{formatPrice(o)}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingOffering(o)}
                    className="p-1.5 rounded-md text-lavender/40 hover:text-cream hover:bg-lavender/10 transition-colors"
                    title="Edit offering"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleAvailability(o)}
                    className="p-1.5 rounded-md text-lavender/40 hover:text-cream hover:bg-lavender/10 transition-colors"
                    title={o.availability === 'unavailable' ? 'Activate offering' : 'Pause offering'}
                  >
                    {o.availability === 'unavailable' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(o.id)}
                    className="p-1.5 rounded-md text-lavender/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Remove offering"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {confirmDelete === o.id && (
                <div className="mt-2 p-2 rounded-md bg-red-500/5 border border-red-500/20">
                  <p className="text-[10px] text-red-400 mb-2">Remove this offering permanently?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="flex-1 py-1 rounded-md border border-lavender/10 text-lavender/50 text-[10px]"
                    >
                      Keep
                    </button>
                    <button
                      onClick={() => handleDelete(o.id)}
                      className="flex-1 py-1 rounded-md bg-red-500/20 border border-red-500/30 text-red-400 text-[10px]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editingOffering && (
          <AddOfferingModal
            vendor={vendor}
            offering={editingOffering}
            onClose={() => setEditingOffering(null)}
            onSave={onUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Add / Edit Offering Modal ─── */
function AddOfferingModal({
  vendor,
  offering,
  onClose,
  onSave,
}: {
  vendor: VendorRecord;
  offering?: OfferingItem;
  onClose: () => void;
  onSave: (vendor: VendorRecord) => void;
}) {
  // Core fields
  const [title, setTitle] = useState(offering?.title || '');
  const [description, setDescription] = useState(offering?.description || '');
  const [category, setCategory] = useState<OfferingCategory>(offering?.category || 'Astrology & Cosmic Guidance');
  const [priceType, setPriceType] = useState<'fixed' | 'gift' | 'collective_funded' | 'negotiable'>(offering?.priceType || 'fixed');
  const [priceCents, setPriceCents] = useState(offering?.priceCents != null ? (offering.priceCents / 100).toFixed(2) : '');
  const [availability, setAvailability] = useState<'available' | 'limited' | 'waitlist' | 'unavailable'>(offering?.availability || 'available');
  const [maxParticipants, setMaxParticipants] = useState(offering?.maxParticipants?.toString() || '');
  const [consentRequired, setConsentRequired] = useState(offering?.consentRequired ?? true);
  const [tags, setTags] = useState(offering?.tags?.join(', ') || '');
  const [error, setError] = useState('');

  // Wave 8.2 — offering type
  const [offeringType, setOfferingType] = useState<OfferingType>(offering?.offeringType || 'service');
  const [requiresScheduling, setRequiresScheduling] = useState(offering?.requiresScheduling ?? (offering?.offeringType === 'virtual_session' || offering?.offeringType === 'work_study_exchange'));

  // Wave 8.2 — accepted exchange forms
  const [exchangeForms, setExchangeForms] = useState<Record<string, boolean>>(() => {
    const all = ['gift', 'barter', 'fixed', 'negotiable', 'collective_funded', 'peer_payment'];
    const enabled = offering?.exchangePolicy || [];
    return Object.fromEntries(all.map((f) => [f, enabled.includes(f as any)]));
  });

  // Wave 8.2 — virtual session config
  const defaultVirtual: VirtualSessionConfig = {
    durationMinutes: 60,
    platform: 'google_meet',
    bufferMinutes: 15,
    maxDailySessions: 4,
  };
  const [virtualSession, setVirtualSession] = useState<VirtualSessionConfig>(() => {
    if (offering?.virtualSession) return offering.virtualSession;
    return defaultVirtual;
  });

  // Wave 8.2 — work/study config
  const [workStudy, setWorkStudy] = useState<WorkStudyExchangeConfig>(() => {
    if (offering?.workStudyExchange) return offering.workStudyExchange;
    return {
      programName: '',
      durationWeeks: 4,
      hoursPerWeek: 20,
      accommodationType: 'self_arranged',
      mealsIncluded: false,
      stipendCents: 0,
      learningOutcomes: [],
      prerequisites: '',
      location: { type: 'work_study_site' },
    };
  });

  // Wave 8.2 — shared location
  const [location, setLocation] = useState<ExchangeLocation>(() => {
    if (offering?.location) return offering.location;
    if (offering?.workStudyExchange?.location) {
      return { ...offering.workStudyExchange.location };
    }
    return { type: 'physical_address' };
  });
  const [selectedLocationData, setSelectedLocationData] = useState<LocationData | null>(location.locationData || null);

  // Fulfillment team for this offering
  const [fulfillers, setFulfillers] = useState<OfferingFulfiller[]>(() => {
    if (offering?.fulfillers) return offering.fulfillers;
    return [];
  });

  // Multi-image gallery for this offering
  const [gallery, setGallery] = useState<PortfolioItem[]>(() => {
    if (offering?.gallery) return offering.gallery;
    return [];
  });

  const categories = OFFERING_CATEGORIES;
  const priceTypes = [
    { value: 'fixed', label: 'Fixed Price', desc: 'A clear exchange amount' },
    { value: 'gift', label: 'Gift Economy', desc: 'Receiver offers what feels aligned' },
    { value: 'collective_funded', label: 'Collective Funded', desc: 'From the Collective treasury' },
    { value: 'negotiable', label: 'Negotiable', desc: 'Discussed between beings' },
  ] as const;
  const availOptions = [
    { value: 'available', label: 'Available' },
    { value: 'limited', label: 'Limited Spots' },
    { value: 'waitlist', label: 'Waitlist Open' },
    { value: 'unavailable', label: 'Currently Unavailable' },
  ] as const;
  const offeringTypes = [
    { value: 'product', label: 'Product', icon: Package, desc: 'A physical or digital good' },
    { value: 'service', label: 'Service', icon: PenTool, desc: 'In-person or remote skill share' },
    { value: 'virtual_session', label: 'Virtual Session', icon: Video, desc: 'Meet via Google Meet, Zoom, etc.' },
    { value: 'work_study_exchange', label: 'Work / Study Exchange', icon: Sprout, desc: 'Onsite program with learning' },
  ] as const;
  const platforms: { value: MeetingPlatform; label: string }[] = [
    { value: 'google_meet', label: 'Google Meet' },
    { value: 'zoom', label: 'Zoom' },
    { value: 'jitsi', label: 'Jitsi' },
    { value: 'teams', label: 'Microsoft Teams' },
    { value: 'other', label: 'Other platform' },
  ];
  const accommodationTypes = [
    { value: 'onsite', label: 'Onsite accommodation included' },
    { value: 'nearby', label: 'Nearby / supported finding' },
    { value: 'self_arranged', label: 'Self-arranged' },
  ] as const;

  function toggleExchangeForm(form: string) {
    setExchangeForms((prev) => ({ ...prev, [form]: !prev[form] }));
  }

  function handleSave() {
    if (!title.trim()) { setError('A title is required'); return; }
    if (!description.trim()) { setError('A description is required'); return; }
    if (priceType === 'fixed' && !priceCents.trim()) { setError('Please set a price or choose a different exchange type'); return; }

    // Convert dollars input to cents for storage
    const parsedDollars = priceType === 'fixed' ? parseFloat(priceCents) : undefined;
    const finalCents = parsedDollars != null && !isNaN(parsedDollars) ? Math.round(parsedDollars * 100) : undefined;

    const selectedForms = (Object.keys(exchangeForms).filter((k) => exchangeForms[k]) as OfferingItem['exchangePolicy']);

    const finalVirtual = offeringType === 'virtual_session' ? virtualSession : undefined;
    const finalWorkStudy = offeringType === 'work_study_exchange' ? {
      ...workStudy,
      location,
    } : undefined;
    const finalLocation = (offeringType === 'work_study_exchange' || location.address || location.label || selectedLocationData) ? {
      ...location,
      locationData: selectedLocationData || undefined,
      label: selectedLocationData?.raw || location.label,
      address: location.address || selectedLocationData?.raw,
      city: selectedLocationData?.city || location.city,
      region: selectedLocationData?.region || location.region,
      country: selectedLocationData?.country || location.country,
      latitude: selectedLocationData?.lat ?? location.latitude,
      longitude: selectedLocationData?.lon ?? location.longitude,
    } : undefined;
    const finalRequiresScheduling = requiresScheduling || offeringType === 'virtual_session' || offeringType === 'work_study_exchange';

    const newOffering: OfferingItem = {
      ...(offering || {
        id: `offering_${Date.now()}`,
        vendorId: vendor.id,
        createdAt: new Date().toISOString(),
      }),
      title: title.trim(),
      description: description.trim(),
      category: category as any,
      priceType,
      priceCents: finalCents,
      currency: 'USD',
      availability,
      consentRequired,
      maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : undefined,
      exchangePolicy: selectedForms.length > 0 ? selectedForms : undefined,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      // Wave 8.2
      offeringType,
      virtualSession: finalVirtual,
      workStudyExchange: finalWorkStudy,
      location: finalLocation,
      requiresScheduling: finalRequiresScheduling,
      fulfillers,
      gallery,
      updatedAt: new Date().toISOString(),
    };

    const updatedOfferings = offering
      ? vendor.offerings.map((o) => (o.id === offering.id ? newOffering : o))
      : [...vendor.offerings, newOffering];

    const updated: VendorRecord = {
      ...vendor,
      offerings: updatedOfferings,
      updatedAt: new Date().toISOString(),
    };

    onSave(updated);
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
        className="bg-void-900 border border-lavender/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-gold-400" />
              <h2 className="text-xl font-semibold text-cream">{offering ? 'Edit Offering' : 'Add Offering'}</h2>
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

          <div className="space-y-6">
            {/* Offering Type */}
            <div>
              <label className="block text-sm text-lavender/70 mb-2">Offering Type</label>
              <div className="grid grid-cols-2 gap-2">
                {offeringTypes.map((ot) => {
                  const Icon = ot.icon;
                  return (
                    <button
                      key={ot.value}
                      onClick={() => {
                        setOfferingType(ot.value);
                        if (ot.value === 'virtual_session' || ot.value === 'work_study_exchange') {
                          setRequiresScheduling(true);
                        }
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        offeringType === ot.value
                          ? 'border-gold-400/30 bg-gold-400/10 text-cream'
                          : 'border-lavender/10 text-lavender/50 hover:border-lavender/20 hover:text-lavender/70'
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <Icon className="w-4 h-4" /> {ot.label}
                      </span>
                      <span className="block text-[10px] mt-0.5 opacity-70">{ot.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm text-lavender/70 mb-1.5">What do you offer?</label>
              <input
                value={title}
                onChange={(e) => { setTitle(e.target.value); setError(''); }}
                placeholder={offeringType === 'virtual_session' ? 'e.g., Evolutionary Astrology Reading — 90 min' : offeringType === 'work_study_exchange' ? 'e.g., Permaculture Work/Study Program' : 'e.g., Handwoven scarf'}
                className="w-full px-4 py-2.5 rounded-xl bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm text-lavender/70 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as OfferingCategory)}
                className="w-full px-4 py-2.5 rounded-xl bg-void-800/50 border border-lavender/10 text-cream focus:border-gold-400/40 focus:outline-none appearance-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-lavender/70 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => { setDescription(e.target.value); setError(''); }}
                placeholder="Describe your offering, how it serves, and what beings can expect..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none resize-none"
              />
            </div>

            {/* Price Type */}
            <div>
              <label className="block text-sm text-lavender/70 mb-2">Exchange Type</label>
              <div className="grid grid-cols-2 gap-2">
                {priceTypes.map((pt) => (
                  <button
                    key={pt.value}
                    onClick={() => setPriceType(pt.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      priceType === pt.value
                        ? 'border-gold-400/30 bg-gold-400/10 text-cream'
                        : 'border-lavender/10 text-lavender/50 hover:border-lavender/20 hover:text-lavender/70'
                    }`}
                  >
                    <span className="text-sm font-medium">{pt.label}</span>
                    <span className="block text-[10px] mt-0.5 opacity-70">{pt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price (only for fixed) */}
            {priceType === 'fixed' && (
              <div>
                <label className="block text-sm text-lavender/70 mb-1.5">Exchange Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lavender/30">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={priceCents}
                    onChange={(e) => { setPriceCents(e.target.value); setError(''); }}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-lavender/30 mt-1">
                  If Collective-funded is enabled on your storefront, beings may also request Collective support.
                </p>
              </div>
            )}

            {/* Accepted exchange forms */}
            <div className="p-4 rounded-xl border border-lavender/10 bg-white/[0.02]">
              <label className="block text-sm text-lavender/70 mb-3">Accepted Exchange Forms</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'gift', label: 'Gift' },
                  { key: 'barter', label: 'Barter' },
                  { key: 'fixed', label: 'Fixed' },
                  { key: 'negotiable', label: 'Negotiable' },
                  { key: 'collective_funded', label: 'Collective Funded' },
                  { key: 'peer_payment', label: 'Peer Payment' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => toggleExchangeForm(f.key)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                      exchangeForms[f.key]
                        ? 'bg-gold-400/20 border-gold-400/40 text-gold-400'
                        : 'bg-void-800/50 border-lavender/10 text-lavender/50 hover:border-lavender/20'
                    }`}
                  >
                    {exchangeForms[f.key] ? '✓ ' : ''}{f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm text-lavender/70 mb-1.5">Availability</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl bg-void-800/50 border border-lavender/10 text-cream focus:border-gold-400/40 focus:outline-none appearance-none"
              >
                {availOptions.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>

            {/* Max Participants */}
            <div>
              <label className="block text-sm text-lavender/70 mb-1.5">Max Participants (optional)</label>
              <input
                type="number"
                min="1"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder="Leave blank for one-on-one"
                className="w-full px-4 py-2.5 rounded-xl bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm text-lavender/70 mb-1.5">Tags (comma separated)</label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., astrology, guidance, virtual"
                className="w-full px-4 py-2.5 rounded-xl bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
              />
            </div>

            {/* Virtual Session Config */}
            {offeringType === 'virtual_session' && (
              <div className="p-4 rounded-xl border border-lavender/10 bg-white/[0.02] space-y-4">
                <div className="flex items-center gap-2 text-gold-400">
                  <Video className="w-4 h-4" />
                  <span className="text-sm font-medium">Virtual Session Details</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-lavender/50 mb-1">Duration (minutes)</label>
                    <input
                      type="number"
                      min="15"
                      step="15"
                      value={virtualSession.durationMinutes}
                      onChange={(e) => setVirtualSession({ ...virtualSession, durationMinutes: parseInt(e.target.value) || 60 })}
                      className="w-full px-3 py-2 rounded-lg bg-void-800/50 border border-lavender/10 text-cream focus:border-gold-400/40 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-lavender/50 mb-1">Buffer between sessions (minutes)</label>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={virtualSession.bufferMinutes}
                      onChange={(e) => setVirtualSession({ ...virtualSession, bufferMinutes: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg bg-void-800/50 border border-lavender/10 text-cream focus:border-gold-400/40 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-lavender/50 mb-1">Meeting Platform</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {platforms.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setVirtualSession({ ...virtualSession, platform: p.value })}
                        className={`px-3 py-2 rounded-lg border text-xs transition-all ${
                          virtualSession.platform === p.value
                            ? 'bg-gold-400/20 border-gold-400/40 text-gold-400'
                            : 'bg-void-800/50 border-lavender/10 text-lavender/60 hover:border-lavender/20'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-lavender/50 mb-1">Default meeting link (optional)</label>
                  <input
                    type="url"
                    value={virtualSession.meetingLink || ''}
                    onChange={(e) => setVirtualSession({ ...virtualSession, meetingLink: e.target.value })}
                    placeholder="https://meet.google.com/... or https://zoom.us/j/..."
                    className="w-full px-3 py-2 rounded-lg bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
                  />
                  <p className="text-[10px] text-lavender/30 mt-1">A link can also be generated later when the agreement is confirmed.</p>
                </div>
                <div>
                  <label className="block text-xs text-lavender/50 mb-1">Platform note (optional)</label>
                  <input
                    value={virtualSession.platformNote || ''}
                    onChange={(e) => setVirtualSession({ ...virtualSession, platformNote: e.target.value })}
                    placeholder="e.g., I will send the Zoom link 24 hours before our session"
                    className="w-full px-3 py-2 rounded-lg bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-lavender/50 mb-1">Max daily sessions (optional)</label>
                  <input
                    type="number"
                    min="1"
                    value={virtualSession.maxDailySessions || ''}
                    onChange={(e) => setVirtualSession({ ...virtualSession, maxDailySessions: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="Leave blank for no daily cap"
                    className="w-full px-3 py-2 rounded-lg bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Work/Study Exchange Config */}
            {offeringType === 'work_study_exchange' && (
              <div className="p-4 rounded-xl border border-lavender/10 bg-white/[0.02] space-y-4">
                <div className="flex items-center gap-2 text-gold-400">
                  <Sprout className="w-4 h-4" />
                  <span className="text-sm font-medium">Work / Study Program Details</span>
                </div>
                <div>
                  <label className="block text-xs text-lavender/50 mb-1">Program name</label>
                  <input
                    value={workStudy.programName || ''}
                    onChange={(e) => setWorkStudy({ ...workStudy, programName: e.target.value })}
                    placeholder="e.g., Spring Permaculture Intensive"
                    className="w-full px-3 py-2 rounded-lg bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-lavender/50 mb-1">Duration (weeks)</label>
                    <input
                      type="number"
                      min="1"
                      value={workStudy.durationWeeks || ''}
                      onChange={(e) => setWorkStudy({ ...workStudy, durationWeeks: parseInt(e.target.value) || undefined })}
                      className="w-full px-3 py-2 rounded-lg bg-void-800/50 border border-lavender/10 text-cream focus:border-gold-400/40 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-lavender/50 mb-1">Hours per week</label>
                    <input
                      type="number"
                      min="1"
                      value={workStudy.hoursPerWeek || ''}
                      onChange={(e) => setWorkStudy({ ...workStudy, hoursPerWeek: parseInt(e.target.value) || undefined })}
                      className="w-full px-3 py-2 rounded-lg bg-void-800/50 border border-lavender/10 text-cream focus:border-gold-400/40 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-lavender/50 mb-2">Accommodation</label>
                  <div className="flex flex-wrap gap-2">
                    {accommodationTypes.map((a) => (
                      <button
                        key={a.value}
                        onClick={() => setWorkStudy({ ...workStudy, accommodationType: a.value })}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                          workStudy.accommodationType === a.value
                            ? 'bg-gold-400/20 border-gold-400/40 text-gold-400'
                            : 'bg-void-800/50 border-lavender/10 text-lavender/50 hover:border-lavender/20'
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={workStudy.mealsIncluded || false}
                    onChange={(e) => setWorkStudy({ ...workStudy, mealsIncluded: e.target.checked })}
                    className="w-4 h-4 accent-gold-400"
                  />
                  <span className="text-sm text-lavender/70">Meals included</span>
                </label>
                <div>
                  <label className="block text-xs text-lavender/50 mb-1">Weekly stipend (USD, optional)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lavender/30">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={workStudy.stipendCents ? (workStudy.stipendCents / 100).toFixed(2) : ''}
                      onChange={(e) => {
                        const dollars = parseFloat(e.target.value);
                        setWorkStudy({ ...workStudy, stipendCents: !isNaN(dollars) ? Math.round(dollars * 100) : 0 });
                      }}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 rounded-lg bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-lavender/50 mb-1">Learning outcomes (one per line)</label>
                  <textarea
                    value={(workStudy.learningOutcomes || []).join('\n')}
                    onChange={(e) => setWorkStudy({ ...workStudy, learningOutcomes: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
                    placeholder="e.g., Design regenerative food systems&#10;e.g., Build community governance skills"
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-lavender/50 mb-1">Prerequisites</label>
                  <input
                    value={workStudy.prerequisites || ''}
                    onChange={(e) => setWorkStudy({ ...workStudy, prerequisites: e.target.value })}
                    placeholder="e.g., Able to lift 25 lbs, comfortable camping"
                    className="w-full px-3 py-2 rounded-lg bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Location editor (shared) */}
            {(offeringType === 'product' || offeringType === 'service' || offeringType === 'work_study_exchange') && (
              <div className="p-4 rounded-xl border border-lavender/10 bg-white/[0.02] space-y-4">
                <div className="flex items-center gap-2 text-gold-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {offeringType === 'work_study_exchange' ? 'Program Location' : 'Location'}
                  </span>
                </div>
                <LocationSelect
                  label="Search location"
                  value={selectedLocationData}
                  onChange={(loc) => {
                    setSelectedLocationData(loc);
                    if (loc) {
                      setLocation((prev) => ({
                        ...prev,
                        locationData: loc,
                        label: loc.raw,
                        address: loc.raw,
                        city: loc.city || prev.city,
                        region: loc.region || prev.region,
                        country: loc.country || prev.country,
                        latitude: loc.lat,
                        longitude: loc.lon,
                      }));
                    }
                  }}
                  placeholder="Search city, town, or place…"
                  allowRemote
                />
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-lavender/5">
                  <div>
                    <label className="block text-xs text-lavender/50 mb-1">Venue / label</label>
                    <input
                      value={location.label || ''}
                      onChange={(e) => setLocation({ ...location, label: e.target.value })}
                      placeholder="e.g., Heartlight Commons"
                      className="w-full px-3 py-2 rounded-lg bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-lavender/50 mb-1">Address</label>
                    <textarea
                      value={location.address || ''}
                      onChange={(e) => setLocation({ ...location, address: e.target.value })}
                      placeholder="Street address, city, country"
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none resize-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-lavender/50 mb-1">City</label>
                    <input
                      value={location.city || ''}
                      onChange={(e) => setLocation({ ...location, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-void-800/50 border border-lavender/10 text-cream focus:border-gold-400/40 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-lavender/50 mb-1">Region / State</label>
                    <input
                      value={location.region || ''}
                      onChange={(e) => setLocation({ ...location, region: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-void-800/50 border border-lavender/10 text-cream focus:border-gold-400/40 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-lavender/50 mb-1">Country</label>
                    <input
                      value={location.country || ''}
                      onChange={(e) => setLocation({ ...location, country: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-void-800/50 border border-lavender/10 text-cream focus:border-gold-400/40 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-lavender/50 mb-1">Postal code</label>
                    <input
                      value={location.postalCode || ''}
                      onChange={(e) => setLocation({ ...location, postalCode: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-void-800/50 border border-lavender/10 text-cream focus:border-gold-400/40 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-lavender/50 mb-1">Directions / how to arrive</label>
                  <textarea
                    value={location.directions || ''}
                    onChange={(e) => setLocation({ ...location, directions: e.target.value })}
                    placeholder="Nearest bus stop, parking, ferry, or shuttle details"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-lavender/50 mb-1">Accessibility notes</label>
                  <textarea
                    value={location.accessibilityNotes || ''}
                    onChange={(e) => setLocation({ ...location, accessibilityNotes: e.target.value })}
                    placeholder="e.g., Wheelchair ramp available, scent-free space, etc."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-lavender/50 mb-1">Associated organization / community</label>
                  <input
                    value={location.associatedOrganization || ''}
                    onChange={(e) => setLocation({ ...location, associatedOrganization: e.target.value })}
                    placeholder="e.g., Traditional Dream Factory"
                    className="w-full px-3 py-2 rounded-lg bg-void-800/50 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-lavender/50 mb-1">Contact email</label>
                    <input
                      type="email"
                      value={location.contactEmail || ''}
                      onChange={(e) => setLocation({ ...location, contactEmail: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-void-800/50 border border-lavender/10 text-cream focus:border-gold-400/40 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-lavender/50 mb-1">Contact phone</label>
                    <input
                      type="tel"
                      value={location.contactPhone || ''}
                      onChange={(e) => setLocation({ ...location, contactPhone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-void-800/50 border border-lavender/10 text-cream focus:border-gold-400/40 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Fulfillment team */}
            <div className="p-4 rounded-xl border border-lavender/10 bg-white/[0.02] space-y-4">
              <div className="flex items-center gap-2 text-gold-400">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">Fulfillment Team</span>
              </div>
              <p className="text-xs text-lavender/50">
                Select beings from this Vendor Shop who are responsible for fulfilling this offering, and the role they play.
              </p>
              <div className="space-y-2">
                {fulfillers.map((f, i) => (
                  <div key={f.ces} className="flex items-center gap-2">
                    <span className="text-sm text-cream flex-1">{f.name}</span>
                    <input
                      type="text"
                      value={f.role}
                      onChange={(e) => {
                        const next = [...fulfillers];
                        next[i] = { ...f, role: e.target.value };
                        setFulfillers(next);
                      }}
                      placeholder="Role, e.g. Guide"
                      className="w-36 px-3 py-1.5 rounded-lg bg-void-800/50 border border-lavender/10 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/40 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setFulfillers(fulfillers.filter((_, idx) => idx !== i))}
                      className="p-1.5 rounded-md text-lavender/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <select
                value=""
                onChange={(e) => {
                  const ces = e.target.value;
                  if (!ces) return;
                  if (fulfillers.some((f) => f.ces === ces)) return;
                  const member = [vendor.ownerCes, ...vendor.members.filter((m) => m.status === 'active').map((m) => m.ces)].find((c) => c === ces);
                  if (!member) return;
                  const name = ces === vendor.ownerCes ? vendor.ownerName : vendor.members.find((m) => m.ces === ces)?.name || 'Being';
                  setFulfillers([...fulfillers, { ces, name, role: '' }]);
                  e.target.value = '';
                }}
                className="w-full px-3 py-2 rounded-lg bg-void-800/50 border border-lavender/10 text-sm text-cream focus:border-gold-400/40 focus:outline-none appearance-none"
              >
                <option value="">+ Add being…</option>
                <option value={vendor.ownerCes}>{vendor.ownerName} (owner)</option>
                {vendor.members.filter((m) => m.status === 'active').map((m) => (
                  <option key={m.ces} value={m.ces}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Scheduling toggle */}
            <div className="flex items-center gap-3 p-3 rounded-xl border border-lavender/10 bg-white/[0.02]">
              <input
                type="checkbox"
                id="scheduling"
                checked={requiresScheduling}
                onChange={(e) => setRequiresScheduling(e.target.checked)}
                className="w-4 h-4 accent-gold-400"
              />
              <label htmlFor="scheduling" className="text-sm text-lavender/70 cursor-pointer">
                <span className="text-cream">Requires scheduling</span> — Beings will pick from calendar availability before the exchange is confirmed
              </label>
            </div>

            {/* Consent Required */}
            <div className="flex items-center gap-3 p-3 rounded-xl border border-lavender/10 bg-white/[0.02]">
              <input
                type="checkbox"
                id="consent"
                checked={consentRequired}
                onChange={(e) => setConsentRequired(e.target.checked)}
                className="w-4 h-4 accent-gold-400"
              />
              <label htmlFor="consent" className="text-sm text-lavender/70 cursor-pointer">
                <span className="text-cream">Consent required before exchange</span> — Beings must read and agree to your boundaries before requesting
              </label>
            </div>

            {/* Multi-Image Gallery */}
            <div>
              <label className="block text-sm text-lavender/70 mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Gallery Images
              </label>
              <div className="space-y-2">
                {gallery.map((item, i) => (
                  <div key={item.id} className="flex items-start gap-2 rounded-xl border border-lavender/10 bg-void-800/50 p-2">
                    <img src={item.url} alt={item.caption || ''} className="w-16 h-16 rounded-lg object-cover border border-lavender/10" />
                    <div className="flex-1 space-y-2">
                      <input
                        value={item.url}
                        onChange={(e) => setGallery(prev => prev.map((x, j) => j === i ? { ...x, url: e.target.value } : x))}
                        placeholder="https://..."
                        className="w-full bg-void-900 border border-lavender/10 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/50 focus:outline-none"
                      />
                      <input
                        value={item.caption || ''}
                        onChange={(e) => setGallery(prev => prev.map((x, j) => j === i ? { ...x, caption: e.target.value } : x))}
                        placeholder="Caption (optional)"
                        className="w-full bg-void-900 border border-lavender/10 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-lavender/30 focus:border-gold-400/50 focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => setGallery(prev => prev.filter((_, j) => j !== i))}
                      className="p-2 rounded-lg text-lavender/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setGallery(prev => [...prev, { id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, type: 'image', url: '', caption: '' }])}
                  className="inline-flex items-center gap-2 text-sm text-gold-400 hover:text-gold-300 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add image
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-lavender/5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-lavender/10 text-lavender/60 hover:text-cream hover:border-lavender/20 transition-all text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-gold-400/20 border border-gold-400/30 text-gold-400 hover:bg-gold-400/30 transition-all text-sm font-medium"
          >
            Save Offering
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
  const [showOffering, setShowOffering] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  const { addVendorJoinRequest, updateVendorJoinRequest, removeVendor } = useStorage();

  const offeringCount = vendor.offerings.length;
  const memberCount = vendor.members.length;
  const activePayments = vendor.paymentMethods.filter((m) => m.enabled).length;
  const pendingRequests = vendor.joinRequests?.filter((r) => r.status === 'pending') || [];

  async function handleSync() {
    setSyncState('syncing');
    setSyncMessage('');
    try {
      const result = await syncVendorToRedis(vendor);
      if (result.success) {
        setSyncState('success');
        setSyncMessage(
          `Synced to Collective Directory ✨ ${result.synced.vendor ? 'Vendor Shop + ' : ''}${result.synced.offerings} offering${result.synced.offerings !== 1 ? 's' : ''}`
        );
      } else {
        setSyncState('error');
        setSyncMessage(result.error || 'Sync incomplete');
      }
      // Reset after 5 seconds
      setTimeout(() => { setSyncState('idle'); setSyncMessage(''); }, 5000);
    } catch (err: unknown) {
      setSyncState('error');
      setSyncMessage(err instanceof Error ? err.message : 'Sync failed');
      setTimeout(() => { setSyncState('idle'); setSyncMessage(''); }, 5000);
    }
  }

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
            <div className="w-10 h-10 rounded-xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center overflow-hidden">
              {vendor.logoUrl ? (
                <img src={vendor.logoUrl} alt={vendor.name} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-5 h-5 text-gold-400" />
              )}
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
        <div className="flex flex-wrap gap-1.5 mb-2">
          {vendor.paymentMethods.map((m) => (
            <PaymentBadge key={m.type} method={m} />
          ))}
        </div>

        {/* Vendor links */}
        {vendor.links && vendor.links.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {vendor.links.filter((l) => l.url.trim()).map((l) => (
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-lavender/5 border border-lavender/10 text-lavender/70 hover:text-cream hover:border-lavender/30 transition-colors"
              >
                <Link2 className="w-3 h-3" /> {l.label || 'Link'}
              </a>
            ))}
          </div>
        )}

        {/* Offerings List */}
        <StorefrontOfferings vendor={vendor} onUpdate={onUpdate} />
        <div className="flex items-center gap-2 pt-3 border-t border-lavender/5">
          <button
            onClick={() => setShowOffering(true)}
            className="flex-1 py-2 rounded-lg bg-lavender/5 text-lavender/60 hover:text-cream hover:bg-lavender/10 transition-all text-xs font-medium flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Offering
          </button>
          <button
            onClick={handleSync}
            disabled={syncState === 'syncing'}
            className={`py-2 px-3 rounded-lg transition-all text-xs font-medium flex items-center justify-center gap-1.5 ${
              syncState === 'syncing'
                ? 'bg-blue-400/10 text-blue-300 cursor-wait'
                : syncState === 'success'
                  ? 'bg-green-500/10 text-green-400'
                  : syncState === 'error'
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-gold-400/10 text-gold-400 hover:bg-gold-400/20'
            }`}
            title="Sync Vendor Shop and offerings to Collective Directory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncState === 'syncing' ? 'animate-spin' : ''}`} />
            Sync
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

        {/* Sync Status */}
        {syncMessage && (
          <div className={`mt-2 px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
            syncState === 'success'
              ? 'bg-green-500/10 text-green-400'
              : syncState === 'error'
                ? 'bg-red-500/10 text-red-400'
                : 'bg-blue-400/10 text-blue-300'
          }`}>
            {syncState === 'success' && <CheckCircle className="w-3.5 h-3.5 shrink-0" />}
            {syncState === 'error' && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
            {syncState === 'syncing' && <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />}
            {syncMessage}
          </div>
        )}

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

      {/* Add Offering Modal */}
      <AnimatePresence>
        {showOffering && (
          <AddOfferingModal
            vendor={vendor}
            onClose={() => setShowOffering(false)}
            onSave={onUpdate}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Vendor Shop Management Dashboard ─── */
export default function VendorShopManagement() {
  const { getVendors, addVendor, updateVendor, vendors } = useStorage();
  const { user } = useSession();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  const myCes = user?.ces || null;
  const myVendors = useMemo(() => {
    if (!myCes) return [];
    return vendors.filter(
      (v) =>
        v.ownerCes === myCes ||
        v.members.some((m) => m.ces === myCes && m.status === 'active')
    );
  }, [myCes, vendors]);

  async function handleCreate(vendor: VendorRecord) {
    const result = await addVendor(vendor);
    if (!result.success) {
      console.error('[VendorShopManagement] Create vendor failed:', result.error);
      alert(`Vendor Shop created locally, but cloud sync needs attention: ${result.error}`);
    }
  }

  async function handleUpdate(vendor: VendorRecord) {
    const result = await updateVendor(vendor);
    if (!result.success) {
      console.error('[VendorShopManagement] Update vendor failed:', result.error);
      alert(`Vendor Shop updated locally, but cloud sync needs attention: ${result.error}`);
    }
  }

  const isSignedIn = !!myCes;

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-2">
          <Link to="/flow" className="text-lavender/40 hover:text-cream transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-cream tracking-tight">Vendor Shops</h1>
        </div>
        <p className="text-lavender/50 text-sm ml-8">
          Co-create and manage the Vendor Shops you are part of
        </p>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        {!isSignedIn ? (
          <div className="text-center py-16">
            <Store className="w-12 h-12 text-lavender/20 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-lavender/60 mb-2">Sign in to see your Vendor Shops</h2>
            <p className="text-sm text-lavender/40 mb-6 max-w-md mx-auto">
              Your session C.E.S. was not found. Sign in from the top-right menu to join or co-create Vendor Shops.
            </p>
            <button
              onClick={() => navigate('/sign-in')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-400/20 border border-gold-400/30 text-gold-400 hover:bg-gold-400/30 transition-all text-sm font-medium"
            >
              Sign In
            </button>
          </div>
        ) : myVendors.length === 0 ? (
          <div className="text-center py-16">
            <Store className="w-12 h-12 text-lavender/20 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-lavender/60 mb-2">No Vendor Shops yet</h2>
            <p className="text-sm text-lavender/40 mb-6 max-w-md mx-auto">
              You are not yet part of any Vendor Shop. Co-create a new shop or browse the Directory to join one.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-400/20 border border-gold-400/30 text-gold-400 hover:bg-gold-400/30 transition-all text-sm font-medium"
              >
                Co-Create Vendor Shop <Plus className="w-4 h-4" />
              </button>
              <Link
                to="/directory"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-lavender/10 text-lavender/70 hover:text-cream hover:border-lavender/30 transition-all text-sm font-medium"
              >
                Join a Shop <Users className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-lavender/40">
                {myVendors.length} shop{myVendors.length !== 1 ? 's' : ''} you belong to
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-400/20 border border-gold-400/30 text-gold-400 hover:bg-gold-400/30 transition-all text-sm font-medium"
              >
                New Vendor Shop <Plus className="w-4 h-4" />
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
