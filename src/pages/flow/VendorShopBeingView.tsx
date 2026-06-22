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
  CheckCircle,
  X,
  Shield,
  Crown,
  PenTool,
  Sparkles,
  Star,
  ImageIcon,
  Link2, Play } from 'lucide-react';
import { useStorage } from '../../lib/storage';
import { useSession } from '../../lib/session';
import { ExchangePolicyBadges } from '../../components/ExchangePolicyBadges';
import { OfferingTypeBadge } from '../../components/OfferingTypeBadge';
import { ExchangeRequestModal } from '../../components/exchange/ExchangeRequestModal';
import { ExchangeAgreementEditor } from '../../components/exchange/ExchangeAgreementEditor';
import { VendorGallery } from '../../components/vendor/VendorGallery';
import { VendorReviews } from '../../components/vendor/VendorReviews';
import { VendorInterconnectionPanel } from '../../components/vendor/VendorInterconnectionPanel';
import type { OfferingItem, VendorRecord, ExchangeAgreement, VendorReview, CesInterconnection } from '../../types/ces';

const ROLE_ICONS: Record<string, any> = {
  owner: Crown,
  admin: Shield,
  contributor: PenTool,
};

type TabKey = 'directive' | 'offerings' | 'beings' | 'reviews' | 'interconnection';

export default function VendorShopBeingView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const {
    getVendors,
    findProfileByCES,
    vendors,
    getExchangeAgreements,
    updateVendor,
    updateProfile,
  } = useStorage();
  const { user } = useSession();

  const vendor = useMemo(() => {
    return vendors.find((v) => v.slug === slug);
  }, [vendors, slug]);

  const [selectedOffering, setSelectedOffering] = useState<OfferingItem | null>(null);
  const [editingAgreement, setEditingAgreement] = useState<ExchangeAgreement | null>(null);
  const [tab, setTab] = useState<TabKey>('directive');

  const agreements = useMemo(() => getExchangeAgreements(), [getExchangeAgreements]);

  if (!vendor) {
    return (
      <div className="px-4 py-16 max-w-4xl mx-auto text-center">
        <Store className="w-12 h-12 text-lavender/20 mx-auto mb-4" />
        <h1 className="font-serif text-2xl text-cream mb-2">Vendor Shop not found</h1>
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

  const handleAddReview = async (review: VendorReview) => {
    const nextReviews = [...(vendor.reviews ?? []), review];
    const total = nextReviews.length;
    const average =
      total > 0
        ? Math.round((nextReviews.reduce((acc, r) => acc + r.rating, 0) / total) * 10) / 10
        : 0;
    const nextVendor: VendorRecord = {
      ...vendor,
      reviews: nextReviews,
      totalReviews: total,
      averageRating: average,
      updatedAt: new Date().toISOString(),
    };
    await updateVendor(nextVendor);
  };

  const handleMarkFelt = async (reviewId: string) => {
    const now = new Date().toISOString();
    const nextReviews =
      vendor.reviews?.map((r) =>
        r.id === reviewId
          ? { ...r, heartlightBadge: true, badgeFeltAt: now, updatedAt: now }
          : r
      ) ?? [];
    const nextVendor: VendorRecord = {
      ...vendor,
      reviews: nextReviews,
      updatedAt: now,
    };
    await updateVendor(nextVendor);
  };

  const handleRequestConnection = async (connection: CesInterconnection) => {
    const now = new Date().toISOString();
    const nextProfiles: CesInterconnection[] = [
      ...(vendor.interconnectedProfiles ?? []),
      connection,
    ];
    const nextVendor: VendorRecord = {
      ...vendor,
      interconnectedProfiles: nextProfiles,
      updatedAt: now,
    };
    await updateVendor(nextVendor);

    const targetProfile = findProfileByCES(connection.ces);
    if (targetProfile) {
      const targetConnection: CesInterconnection = {
        ces: vendor.ownerCes,
        name: vendor.ownerName,
        initiatedByCes: connection.initiatedByCes,
        initiatedAt: connection.initiatedAt,
        status: 'pending',
        note: connection.note,
      };
      const nextTarget: typeof targetProfile = {
        ...targetProfile,
        interconnectedWith: [
          ...(targetProfile.interconnectedWith ?? []),
          targetConnection,
        ],
        updatedAt: now,
      };
      await updateProfile(nextTarget);
    }
  };

  const handleConfirmConnection = async (ces: string) => {
    const now = new Date().toISOString();
    const nextVendorProfiles =
      vendor.interconnectedProfiles?.map((c) =>
        c.ces === ces ? { ...c, status: 'confirmed' as const, confirmedAt: now } : c
      ) ?? [];
    const nextVendor: VendorRecord = {
      ...vendor,
      interconnectedProfiles: nextVendorProfiles,
      updatedAt: now,
    };
    await updateVendor(nextVendor);

    const targetProfile = findProfileByCES(ces);
    if (targetProfile) {
      const nextTargetConnections =
        targetProfile.interconnectedWith?.map((c) =>
          c.ces === vendor.ownerCes ? { ...c, status: 'confirmed' as const, confirmedAt: now } : c
        ) ?? [];
      const nextTarget: typeof targetProfile = {
        ...targetProfile,
        interconnectedWith: nextTargetConnections,
        updatedAt: now,
      };
      await updateProfile(nextTarget);
    }
  };

  const handleDeclineConnection = async (ces: string) => {
    const now = new Date().toISOString();
    const nextVendorProfiles =
      vendor.interconnectedProfiles?.map((c) =>
        c.ces === ces ? { ...c, status: 'declined' as const } : c
      ) ?? [];
    const nextVendor: VendorRecord = {
      ...vendor,
      interconnectedProfiles: nextVendorProfiles,
      updatedAt: now,
    };
    await updateVendor(nextVendor);

    const targetProfile = findProfileByCES(ces);
    if (targetProfile) {
      const nextTargetConnections =
        targetProfile.interconnectedWith?.map((c) =>
          c.ces === vendor.ownerCes ? { ...c, status: 'declined' as const } : c
        ) ?? [];
      const nextTarget: typeof targetProfile = {
        ...targetProfile,
        interconnectedWith: nextTargetConnections,
        updatedAt: now,
      };
      await updateProfile(nextTarget);
    }
  };

  const TAB_BUTTONS: { key: TabKey; label: string; icon: any }[] = [
    { key: 'directive', label: 'Main Directive', icon: Sparkles },
    { key: 'offerings', label: 'Offerings', icon: Store },
    { key: 'beings', label: 'Beings', icon: Users },
    { key: 'reviews', label: 'Reviews', icon: Star },
    { key: 'interconnection', label: 'Interconnection', icon: Link2 },
  ];

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
        className="rounded-2xl border border-blue-400/15 bg-void-800/40 p-6 md:p-8 mb-6"
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
              {vendor.totalReviews != null && vendor.totalReviews > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border border-gold-400/20 bg-gold-400/10 text-gold-300">
                  <Star className="w-3 h-3 fill-gold-400" /> {vendor.averageRating} ({vendor.totalReviews})
                </span>
              )}
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

            <div className="mt-4">
              <VendorGallery vendor={vendor} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {canManage && (
              <Link
                to="/flow/vendor-shop"
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

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TAB_BUTTONS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-sm inline-flex items-center gap-1.5 transition-all ${
              tab === key
                ? 'bg-blue-400/10 border border-blue-400/30 text-blue-300'
                : 'border border-lavender/10 text-lavender/60 hover:border-lavender/30 hover:text-lavender'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="min-h-[200px]">
        {tab === 'directive' && (
          <div className="space-y-6">
            <SectionCard icon={Sparkles} title="Main Directive">
              <p className="text-lavender/60 text-sm leading-relaxed">
                {vendor.coreDirective || vendor.description || 'This Vendor Shop is still forming its Main Directive.'}
              </p>
            </SectionCard>

            <SectionCard icon={CheckCircle} title="Accepted Exchange Forms">
              <ExchangePolicyBadges policy={vendor.exchangePolicy} size="md" />
              {!vendor.exchangePolicy?.length && (
                <p className="text-sm text-lavender/50 mt-2">
                  This shop has not yet set explicit exchange forms. Reach out to ask what feels aligned.
                </p>
              )}
            </SectionCard>
          </div>
        )}

        {tab === 'offerings' && (
          <div>
            <h2 className="font-serif text-xl text-cream mb-4 inline-flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-400" /> Offerings
            </h2>
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
                    onRequest={() => (user?.ces ? setSelectedOffering(offering) : navigate('/sign-in'))}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'beings' && (
          <div>
            <h2 className="font-serif text-xl text-cream mb-4 inline-flex items-center gap-2">
              <Users className="w-5 h-5 text-gold-400" /> Beings in this Shop
            </h2>
            <div className="flex flex-wrap gap-3">
              <MemberPill
                name={ownerProfile?.name || vendor.ownerName || 'Owner'}
                role="owner"
                ces={vendor.ownerCes}
                isOwner
              />
              {vendor.members
                .filter((m) => m.status === 'active')
                .map((m) => (
                  <MemberPill key={m.ces} name={m.name} role={m.role} ces={m.ces} />
                ))}
            </div>
          </div>
        )}

        {tab === 'reviews' && (
          <VendorReviews
            vendor={vendor}
            userCes={user?.ces}
            agreements={agreements}
            onAddReview={handleAddReview}
            onMarkFelt={handleMarkFelt}
          />
        )}

        {tab === 'interconnection' && (
          <VendorInterconnectionPanel
            vendor={vendor}
            userCes={user?.ces}
            isMember={isMember}
            findProfileByCES={findProfileByCES}
            onRequestConnection={handleRequestConnection}
            onConfirmConnection={handleConfirmConnection}
            onDeclineConnection={handleDeclineConnection}
          />
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

function SectionCard({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  icon: any;
  title: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-lavender/10 bg-void-800/30 p-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-gold-400" />
        <h2 className="font-serif text-xl text-cream">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

function MemberPill({
  name,
  role,
  ces,
  isOwner = false,
}: {
  name: string;
  role: string;
  ces: string;
  isOwner?: boolean;
}) {
  const Icon = isOwner ? Crown : ROLE_ICONS[role] || Users;
  const label = isOwner ? 'Owner' : role;
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-lavender/10 bg-void-900/40 text-sm text-cream">
      <Icon className="w-3.5 h-3.5 text-gold-400" />
      <span>{name}</span>
      <span className="text-[10px] font-mono text-lavender/50">C.E.S. {ces}</span>
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
        {offering.images && offering.images.length > 0 ? (
          <img
            src={offering.images[0]}
            alt=""
            className="w-14 h-14 rounded-xl object-cover border border-lavender/10 shrink-0"
          />
        ) : offering.imageUrl ? (
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

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <OfferingTypeBadge offering={offering} />
            {offering.videoUrl && (
              <a
                href={offering.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-400/10 border border-blue-400/20 text-blue-300 text-[10px] hover:bg-blue-400/20 transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <Play className="w-3 h-3" /> Video
              </a>
            )}
          </div>
          <div className="mt-2">
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
              <Heart className="w-3.5 h-3.5" /> Request Aligned Exchange
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
