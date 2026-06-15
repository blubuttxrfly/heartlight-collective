import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Store,
  Users,
  MapPin,
  Mail,
  Heart,
  ChevronRight,
  CheckCircle,
  X,
  Shield,
  Crown,
  PenTool,
} from 'lucide-react';
import { useStorage } from '../lib/storage';
import { useSession } from '../lib/session';
import { ExchangePolicyBadges } from '../components/ExchangePolicyBadges';
import { ExchangeRequestModal } from '../components/exchange/ExchangeRequestModal';
import { ExchangeAgreementEditor } from '../components/exchange/ExchangeAgreementEditor';
import type { OfferingItem, VendorRecord, ExchangeAgreement } from '../types/ces';

const ROLE_ICONS: Record<string, any> = {
  owner: Crown,
  admin: Shield,
  contributor: PenTool,
};

export default function Storefront() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { getVendors, findProfileByCES } = useStorage();
  const { user } = useSession();

  const vendor = useMemo(() => {
    return getVendors().find((v) => v.slug === slug);
  }, [getVendors, slug]);

  const [selectedOffering, setSelectedOffering] = useState<OfferingItem | null>(null);
  const [editingAgreement, setEditingAgreement] = useState<ExchangeAgreement | null>(null);

  if (!vendor) {
    return (
      <div className="px-4 py-16 max-w-4xl mx-auto text-center">
        <Store className="w-12 h-12 text-lavender/20 mx-auto mb-4" />
        <h1 className="font-serif text-2xl text-cream mb-2">Storefront not found</h1>
        <p className="text-lavender/50 mb-6">This Vendor Shop has not appeared in the collective memory yet.</p>
        <Link
          to="/directory"
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-lavender/20 text-lavender-300 hover:border-gold-400/40 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </Link>
      </div>
    );
  }

  const isMember =
    user?.ces === vendor.ownerCes ||
    vendor.members.some((m) => m.ces === user?.ces && m.status === 'active');
  const canManage =
    user?.ces === vendor.ownerCes ||
    vendor.members.some(
      (m) => m.ces === user?.ces && m.status === 'active' && (m.role === 'owner' || m.role === 'admin')
    );

  const ownerProfile = findProfileByCES(vendor.ownerCes);

  return (
    <div className="px-4 pb-16 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link
          to="/directory"
          className="inline-flex items-center gap-2 text-lavender/60 hover:text-gold-400 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </Link>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-blue-400/15 bg-void-800/40 p-6 md:p-8 mb-8"
      >
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-blue-400/10 border border-blue-400/20 flex items-center justify-center shrink-0">
            {vendor.logoUrl ? (
              <img src={vendor.logoUrl} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              <Store className="w-10 h-10 text-blue-300" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="font-serif text-2xl md:text-3xl text-cream">{vendor.name}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] border border-green-400/30 bg-green-400/10 text-green-300">
                {vendor.status}
              </span>
            </div>
            <p className="text-lavender/60 text-sm leading-relaxed max-w-2xl">
              {vendor.coreDirective || vendor.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-lavender/40">
              {vendor.locationData && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {vendor.locationData.raw}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {vendor.members.length + 1} beings
              </span>
              {vendor.collectiveFunded && (
                <span className="text-green-400 inline-flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" /> Collective funded
                </span>
              )}
            </div>

            <div className="mt-4">
              <ExchangePolicyBadges policy={vendor.exchangePolicy} size="md" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {canManage && (
              <Link
                to="/my-storefronts"
                className="px-4 py-2 rounded-lg bg-gold-400/10 border border-gold-400/30 text-gold-300 text-sm inline-flex items-center gap-1.5 hover:bg-gold-400/20 transition-all"
              >
                <PenTool className="w-4 h-4" /> Manage Shop
              </Link>
            )}
            {!isMember && user?.ces && (
              <button className="px-4 py-2 rounded-lg border border-lavender/20 text-lavender-300 text-sm inline-flex items-center gap-1.5 hover:border-blue-400/30 transition-all">
                <Mail className="w-4 h-4" /> Ask to Join
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Members */}
      <div className="mb-8">
        <h2 className="font-serif text-xl text-cream mb-4 inline-flex items-center gap-2">
          <Users className="w-5 h-5 text-gold-400" /> Beings in this Shop
        </h2>
        <div className="flex flex-wrap gap-3">
          <MemberPill
            name={ownerProfile?.name || vendor.ownerName || 'Owner'}
            role="owner"
            isOwner
          />
          {vendor.members
            .filter((m) => m.status === 'active')
            .map((m) => (
              <MemberPill key={m.ces} name={m.name} role={m.role} />
            ))}
        </div>
      </div>

      {/* Offerings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl text-cream inline-flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-400" /> Offerings
          </h2>
          {canManage && (
            <Link
              to="/my-storefronts"
              className="text-xs text-lavender/50 hover:text-gold-400 transition-colors inline-flex items-center gap-1"
            >
              Add offering <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {vendor.offerings.length === 0 ? (
          <div className="rounded-xl border border-lavender/10 bg-void-800/30 p-6 text-center">
            <p className="text-lavender/50">This Vendor Shop has not listed any offerings yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {vendor.offerings.map((offering) => (
              <OfferingRow
                key={offering.id}
                offering={offering}
                vendor={vendor}
                onRequest={() => user?.ces ? setSelectedOffering(offering) : navigate('/sign-in')}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedOffering && user?.ces && (
          <ExchangeRequestModal
            offering={selectedOffering}
            vendor={vendor}
            requesterCes={user.ces}
            requesterName={findProfileByCES(user.ces)?.name || user.name || 'You'}
            onClose={() => setSelectedOffering(null)}
            onAgreementCreated={(ag) => {
              setSelectedOffering(null);
              setEditingAgreement(ag);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingAgreement && (
          <ExchangeAgreementEditor
            agreement={editingAgreement}
            onClose={() => {
              setEditingAgreement(null);
            }}
            onSigned={() => {
              setEditingAgreement(null);
              navigate('/flow');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MemberPill({
  name,
  role,
  isOwner = false,
}: {
  name: string;
  role: string;
  isOwner?: boolean;
}) {
  const Icon = isOwner ? Crown : ROLE_ICONS[role] || Users;
  const label = isOwner ? 'Owner' : role;
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-lavender/10 bg-void-900/40 text-sm text-cream">
      <Icon className="w-3.5 h-3.5 text-gold-400" />
      <span>{name}</span>
      <span className="text-[10px] text-lavender/40 capitalize">{label}</span>
    </div>
  );
}

function OfferingRow({
  offering,
  vendor,
  onRequest,
}: {
  offering: OfferingItem;
  vendor: VendorRecord;
  onRequest: () => void;
}) {
  const priceText =
    offering.priceType === 'gift'
      ? 'Gift'
      : offering.priceType === 'collective_funded'
      ? 'Collective funded'
      : offering.priceType === 'negotiable'
      ? 'Negotiable'
      : offering.priceCents != null
      ? `$${(offering.priceCents / 100).toFixed(2)}`
      : 'Fixed';

  return (
    <div className="rounded-xl border border-lavender/10 bg-void-800/30 p-5 hover:border-blue-400/20 transition-all">
      <div className="flex items-start gap-4">
        {offering.imageUrl ? (
          <img
            src={offering.imageUrl}
            alt=""
            className="w-14 h-14 rounded-xl object-cover border border-lavender/10 shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center shrink-0">
            <Store className="w-6 h-6 text-blue-300" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-serif text-lg text-cream line-clamp-1">{offering.title}</h3>
              <p className="text-xs text-lavender/50 line-clamp-2 mt-0.5">{offering.description}</p>
            </div>
            <span className="px-2 py-0.5 rounded-full border border-gold-400/20 bg-gold-400/10 text-gold-300 text-[10px] shrink-0">
              {priceText}
            </span>
          </div>

          <div className="mt-3">
            <ExchangePolicyBadges policy={offering.exchangePolicy?.length ? offering.exchangePolicy : vendor.exchangePolicy} />
          </div>

          <div className="flex items-center justify-between mt-4">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
              offering.availability === 'available'
                ? 'bg-green-400/10 text-green-300 border-green-400/20'
                : offering.availability === 'limited'
                ? 'bg-amber-400/10 text-amber-300 border-amber-400/20'
                : 'bg-red-400/10 text-red-300 border-red-400/20'
            }`}>
              {offering.availability}
            </span>
            <button
              onClick={onRequest}
              className="px-4 py-2 rounded-lg bg-gold-400/10 border border-gold-400/30 text-gold-300 text-xs inline-flex items-center gap-1.5 hover:bg-gold-400/20 transition-all"
            >
              <Heart className="w-3.5 h-3.5" /> Request Exchange
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
