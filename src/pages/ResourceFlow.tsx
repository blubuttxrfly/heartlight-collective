// ─────────────────────────────────────────────────────────────
//  Resource Flow Page — individual being resource overview
//  Shows active agreements, gifts, offerings, wishes, vendors, and payments.
// ─────────────────────────────────────────────────────────────

import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  HandHeart,
  ScrollText,
  Store,
  Sparkles,
  Gift,
  CreditCard,
  ExternalLink,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { useStorage } from '../lib/storage';
import { useSession } from '../lib/session';
import type { ExchangeAgreement, Wish, VendorRecord, PaymentMethodConfig } from '../types/ces';
import { getPaymentUrl, formatPaymentLabel, paymentTypeIcon } from '../lib/payments';

export default function ResourceFlow() {
  const { ces } = useParams<{ ces: string }>();
  const { user } = useSession();
  const storage = useStorage();
  const [profile, setProfile] = useState<ReturnType<typeof storage.findProfileByCES> | null>(null);

  const targetCes = ces || user?.ces;
  const isSelf = !ces || ces === user?.ces;

  useEffect(() => {
    if (!targetCes) return;
    setProfile(storage.findProfileByCES(targetCes));
  }, [targetCes, storage]);

  const allAgreements = useMemo(() => storage.getExchangeAgreements(), [storage]);
  const allWishes = useMemo(() => {
    try {
      const raw = localStorage.getItem('hlw_wishes');
      return raw ? (JSON.parse(raw) as Wish[]) : [];
    } catch {
      return [];
    }
  }, []);
  const allVendors = useMemo(() => storage.getVendors(), [storage]);

  const myAgreements = useMemo(
    () => allAgreements.filter((a) => a.requesterCes === targetCes || a.providerCes === targetCes || a.parties?.some((p) => p.ces === targetCes)),
    [allAgreements, targetCes]
  );
  const activeAgreements = useMemo(() => myAgreements.filter((a) => a.status === 'active'), [myAgreements]);
  const completedAgreements = useMemo(() => myAgreements.filter((a) => a.status === 'completed' || a.status === 'fulfilled'), [myAgreements]);

  const myWishes = useMemo(() => allWishes.filter((w) => w.wishingCes === targetCes), [allWishes, targetCes]);
  const claimedWishes = useMemo(() => allWishes.filter((w) => w.claimedByCes === targetCes), [allWishes, targetCes]);

  const myVendors = useMemo(() => allVendors.filter((v) => v.ownerCes === targetCes || v.members.some((m) => m.ces === targetCes)), [allVendors, targetCes]);

  const giftsGiven = useMemo(
    () => allWishes.filter((w) => w.wishingCes === targetCes && w.isContinualOffering),
    [allWishes, targetCes]
  );
  const giftsReceived = useMemo(
    () => allWishes.filter((w) => w.claimedByCes === targetCes && w.isContinualOffering),
    [allWishes, targetCes]
  );

  const paymentMethods = useMemo<PaymentMethodConfig[]>(
    () => (profile?.peerPaymentMethods || []).filter((m) => m.enabled),
    [profile]
  );

  const totalValueCents = useMemo(
    () =>
      myAgreements.reduce((acc, a) => {
        const val = a.agreedPriceCents ?? a.proposedPriceCents ?? 0;
        return acc + val;
      }, 0),
    [myAgreements]
  );

  const unpaidAgreements = useMemo(
    () =>
      myAgreements.filter((a) => {
        const price = a.agreedPriceCents ?? a.proposedPriceCents ?? 0;
        return price > 0 && a.status !== 'completed' && a.status !== 'fulfilled' && a.paymentMethod && a.paymentMethod !== 'collective';
      }),
    [myAgreements]
  );

  if (!targetCes) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <HandHeart className="w-16 h-16 text-lavender/20 mx-auto mb-4" />
          <h2 className="text-xl font-serif text-cream">No Being Selected</h2>
          <p className="text-sm text-lavender/50">Please sign in to view your resource flow.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 py-8 space-y-8"
    >
      <header className="flex items-center gap-4">
        <Link to="/flow" className="text-lavender/60 hover:text-cream transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-serif text-cream">
            {isSelf ? 'My Resource Flow' : `${profile?.name || 'Being'} Resource Flow`}
          </h1>
          <p className="text-sm text-lavender/60">
            {isSelf ? 'Mutual aid, offerings, and exchanges flowing through you.' : 'Mutual aid overview for this being.'}
          </p>
        </div>
      </header>

      {/* Summary cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard icon={ScrollText} label="Active Agreements" value={activeAgreements.length} color="#eab308" />
        <SummaryCard icon={CheckCircle} label="Completed" value={completedAgreements.length} color="#22c55e" />
        <SummaryCard icon={Gift} label="Gifts Shared" value={giftsGiven.length} color="#d946ef" />
        <SummaryCard icon={Store} label="Vendors" value={myVendors.length} color="#3b82f6" />
        <SummaryCard icon={Sparkles} label="Wishes Posted" value={myWishes.length} color="#f59e0b" />
        <SummaryCard icon={HandHeart} label="Wishes Claimed" value={claimedWishes.length} color="#ec4899" />
        <SummaryCard icon={CreditCard} label="Unpaid" value={unpaidAgreements.length} color="#ef4444" />
        <SummaryCard icon={Clock} label="Total Value" value={`$${(totalValueCents / 100).toFixed(2)}`} color="#a78bfa" />
      </section>

      {/* Payment methods */}
      <section className="rounded-xl border border-lavender/10 bg-void-800/30 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-gold-400" />
          <h2 className="text-lg font-serif text-cream">Payment Methods</h2>
        </div>
        {paymentMethods.length === 0 ? (
          <p className="text-sm text-lavender/50">
            {isSelf ? 'Add peer-to-peer payment methods in your profile to make exchanges flow.' : 'No public payment methods configured yet.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {paymentMethods.map((method, idx) => {
              const url = getPaymentUrl(method);
              return (
                <div key={idx} className="p-3 rounded-lg border border-lavender/10 bg-void-900/40 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{paymentTypeIcon(method.type)}</span>
                    <span className="font-medium text-cream">{formatPaymentLabel(method)}</span>
                  </div>
                  {method.note && <p className="text-xs text-lavender/60">{method.note}</p>}
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-gold-300 hover:text-gold-200 mt-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Pay via {formatPaymentLabel(method)}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {isSelf && (
          <Link
            to="/edit-profile"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 hover:bg-gold-400/20 transition-all text-sm w-fit"
          >
            Edit Payment Methods
          </Link>
        )}
      </section>

      {/* Active agreements with payment links */}
      <section className="rounded-xl border border-lavender/10 bg-void-800/30 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-gold-400" />
          <h2 className="text-lg font-serif text-cream">Active Agreements</h2>
        </div>
        {activeAgreements.length === 0 ? (
          <p className="text-sm text-lavender/50">No active agreements right now.</p>
        ) : (
          <div className="space-y-3">
            {activeAgreements.map((a) => (
              <AgreementRow key={a.id} agreement={a} targetCes={targetCes} storage={storage} />
            ))}
          </div>
        )}
      </section>

      {/* Vendors / Offerings */}
      <section className="rounded-xl border border-lavender/10 bg-void-800/30 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-gold-400" />
          <h2 className="text-lg font-serif text-cream">Vendors & Offerings</h2>
        </div>
        {myVendors.length === 0 ? (
          <p className="text-sm text-lavender/50">No vendor storefronts yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myVendors.map((v) => (
              <Link
                key={v.id}
                to={`/vendor/${v.slug}`}
                className="p-3 rounded-lg border border-lavender/10 bg-void-900/40 hover:border-gold-400/30 transition-colors"
              >
                <p className="font-medium text-cream">{v.name}</p>
                <p className="text-xs text-lavender/60">{v.offerings.length} offering{v.offerings.length !== 1 ? 's' : ''}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Wishes posted */}
      <section className="rounded-xl border border-lavender/10 bg-void-800/30 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-gold-400" />
          <h2 className="text-lg font-serif text-cream">Wishes Posted</h2>
        </div>
        {myWishes.length === 0 ? (
          <p className="text-sm text-lavender/50">No wishes posted yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myWishes.map((w) => (
              <Link
                key={w.id}
                to="/exchange"
                className="p-3 rounded-lg border border-lavender/10 bg-void-900/40 hover:border-gold-400/30 transition-colors"
              >
                <p className="font-medium text-cream">{w.title}</p>
                <p className="text-xs text-lavender/60">{w.status.replace(/_/g, ' ')}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-lavender/10 bg-void-800/30 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-xs uppercase tracking-wider text-lavender/50">{label}</span>
      </div>
      <span className="text-2xl font-serif text-cream">{value}</span>
    </div>
  );
}

function AgreementRow({
  agreement,
  targetCes,
  storage,
}: {
  agreement: ExchangeAgreement;
  targetCes: string;
  storage: ReturnType<typeof useStorage>;
}) {
  const providerProfile = storage.findProfileByCES(agreement.providerCes);
  const vendor = agreement.vendorId ? storage.findVendorById(agreement.vendorId) : undefined;
  const amountCents = agreement.agreedPriceCents ?? agreement.proposedPriceCents;

  const paymentMethods = useMemo(() => {
    const all: PaymentMethodConfig[] = [];
    const seen = new Set<string>();
    const add = (m?: PaymentMethodConfig) => {
      if (!m || !m.enabled || seen.has(m.type)) return;
      seen.add(m.type);
      all.push(m);
    };
    (providerProfile?.peerPaymentMethods || []).forEach(add);
    (vendor?.paymentMethods || []).forEach(add);
    return all;
  }, [providerProfile, vendor]);

  const selectedMethod = paymentMethods.find((m) => m.type === agreement.paymentMethod);

  return (
    <div className="p-4 rounded-xl border border-lavender/10 bg-void-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-1">
        <p className="font-medium text-cream">{agreement.message.slice(0, 80)}{agreement.message.length > 80 ? '...' : ''}</p>
        <p className="text-xs text-lavender/60">
          with {agreement.providerName} · {agreement.status} · {agreement.scheduledMeetings.length} session{agreement.scheduledMeetings.length !== 1 ? 's' : ''}
        </p>
        {amountCents != null && amountCents > 0 && (
          <p className="text-sm text-gold-300">Amount: ${(amountCents / 100).toFixed(2)}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {selectedMethod && getPaymentUrl(selectedMethod, amountCents) && (
          <a
            href={getPaymentUrl(selectedMethod, amountCents)!}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-full bg-gold-400/20 text-gold-300 hover:bg-gold-400/30 transition-all text-sm inline-flex items-center gap-1"
          >
            <ExternalLink className="w-4 h-4" />
            Pay {formatPaymentLabel(selectedMethod)}
          </a>
        )}
        {agreement.paymentMethod === 'collective' && (
          <span className="px-3 py-2 rounded-full border border-green-400/30 text-green-300 text-sm">Collective funding</span>
        )}
        <Link
          to={`/flow?agreement=${agreement.id}`}
          className="px-4 py-2 rounded-full border border-lavender/20 text-lavender/70 hover:text-cream hover:border-lavender/40 transition-all text-sm"
        >
          View
        </Link>
      </div>
    </div>
  );
}
