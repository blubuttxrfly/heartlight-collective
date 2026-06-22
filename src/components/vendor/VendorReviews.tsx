import { useState, useMemo } from 'react';
import { Star, Heart, Send, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartlightBadge } from './HeartlightBadge';
import type { VendorRecord, VendorReview, ExchangeAgreement, RayKey } from '../../types/ces';

const RAY_OPTIONS: { key: RayKey; label: string; color: string }[] = [
  { key: 'Red', label: 'Consent', color: '#ef4444' },
  { key: 'Orange', label: 'Care', color: '#f97316' },
  { key: 'Yellow', label: 'Sovereignty', color: '#eab308' },
  { key: 'Green', label: 'Thrival', color: '#22c55e' },
  { key: 'Turquoise', label: 'Discernment & Repair', color: '#2dd4bf' },
  { key: 'Blue', label: 'Sustainability & Communication', color: '#3b82f6' },
  { key: 'Indigo', label: 'Vision', color: '#6366f1' },
  { key: 'Violet', label: 'Sanctity of Experience', color: '#8b5cf6' },
  { key: 'Magenta', label: 'Authentic Joy', color: '#d946ef' },
  { key: 'Omni', label: 'Conscious Awareness', color: '#c0c0d8' },
  { key: 'Elemental', label: 'Sacred Service', color: '#7a9e5a' },
  { key: 'ALL', label: 'Co-Creation', color: '#e8d4ff' },
];

interface VendorReviewFormProps {
  vendor: VendorRecord;
  reviewerCes: string;
  reviewerName: string;
  agreementId?: string;
  onSubmit: (review: VendorReview) => void;
  onCancel: () => void;
}

export function VendorReviewForm({
  vendor,
  reviewerCes,
  reviewerName,
  agreementId,
  onSubmit,
  onCancel,
}: VendorReviewFormProps) {
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [body, setBody] = useState('');
  const [selectedRays, setSelectedRays] = useState<RayKey[]>([]);
  const [healingIntent, setHealingIntent] = useState(false);

  const canSubmit = body.trim().length >= 3 && rating > 0;

  function toggleRay(ray: RayKey) {
    setSelectedRays((prev) =>
      prev.includes(ray) ? prev.filter((r) => r !== ray) : [...prev, ray]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const now = new Date().toISOString();
    const review: VendorReview = {
      id: `review_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      vendorId: vendor.id,
      reviewerCes,
      reviewerName,
      agreementId,
      rating: rating as 1 | 2 | 3 | 4 | 5,
      body: body.trim(),
      rays: selectedRays,
      healingIntent,
      heartlightBadge: false,
      createdAt: now,
      updatedAt: now,
    };
    onSubmit(review);
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      onSubmit={handleSubmit}
      className="rounded-2xl border border-lavender/10 bg-void-800/40 p-5 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg text-cream inline-flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-gold-400" /> Share Your Experience ☤
        </h3>
        <button type="button" onClick={onCancel} className="text-lavender/40 hover:text-lavender">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n as 1 | 2 | 3 | 4 | 5)}
            className="p-1 rounded hover:bg-lavender/5 transition-colors"
          >
            <Star
              className={`w-6 h-6 ${n <= rating ? 'text-gold-400 fill-gold-400' : 'text-lavender/20'}`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-lavender/60">{rating} of 5 stars</span>
      </div>

      <label className="block text-sm text-lavender/70 mb-1.5">What rays did this exchange illuminate? ✨</label>
      <div className="flex flex-wrap gap-2 mb-4">
        {RAY_OPTIONS.map((ray) => {
          const selected = selectedRays.includes(ray.key);
          return (
            <button
              key={ray.key}
              type="button"
              onClick={() => toggleRay(ray.key)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                selected
                  ? 'text-void-900 border-transparent'
                  : 'text-lavender/70 border-lavender/20 hover:border-lavender/40'
              }`}
              style={selected ? { backgroundColor: ray.color } : undefined}
            >
              {ray.label}
            </button>
          );
        })}
      </div>

      <label className="block text-sm text-lavender/70 mb-1.5">Your reflection 🪞</label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share how the exchange felt, what was healed, and what continues..."
        className="w-full min-h-[120px] rounded-xl border border-lavender/10 bg-void-900/40 p-3 text-sm text-cream placeholder:text-lavender/30 focus:outline-none focus:border-gold-400/40 mb-4"
      />

      <label className="flex items-start gap-3 cursor-pointer mb-5">
        <input
          type="checkbox"
          checked={healingIntent}
          onChange={(e) => setHealingIntent(e.target.checked)}
          className="mt-0.5 accent-magenta-400"
        />
        <span className="text-sm text-lavender/70 leading-relaxed">
          I share this review with honest intent of healing, honoring sovereign interdependence and the wholeness of all beings. ☤
        </span>
      </label>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-lavender/20 text-lavender-300 text-sm hover:border-lavender/40 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-4 py-2 rounded-lg bg-gold-400/10 border border-gold-400/30 text-gold-300 text-sm inline-flex items-center gap-1.5 hover:bg-gold-400/20 transition-all disabled:opacity-40"
        >
          <Send className="w-4 h-4" /> Share Review ☤
        </button>
      </div>
    </motion.form>
  );
}

interface VendorReviewsProps {
  vendor: VendorRecord;
  userCes?: string;
  agreements: ExchangeAgreement[];
  onAddReview: (review: VendorReview) => void;
  onMarkFelt?: (reviewId: string) => void;
}

export function VendorReviews({
  vendor,
  userCes,
  agreements,
  onAddReview,
  onMarkFelt,
}: VendorReviewsProps) {
  const [showForm, setShowForm] = useState(false);
  const reviews = vendor.reviews ?? [];

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  const canReview = useMemo(() => {
    if (!userCes) return false;
    if (reviews.some((r) => r.reviewerCes === userCes)) return false;
    return agreements.some(
      (a) =>
        a.status === 'completed' &&
        a.vendorId === vendor.id &&
        (a.requesterCes === userCes || a.providerCes === userCes || a.parties?.some((p) => p.ces === userCes))
    );
  }, [agreements, userCes, vendor.id, reviews]);

  const isVendorSide = userCes && (userCes === vendor.ownerCes || vendor.members.some((m) => m.ces === userCes && m.status === 'active'));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl text-cream inline-flex items-center gap-2">
            <Heart className="w-5 h-5 text-magenta-400" /> Reviews ☤
          </h2>
          <p className="text-sm text-lavender/50 mt-1">
            {reviews.length
              ? `${reviews.length} review${reviews.length === 1 ? '' : 's'} • average ${averageRating} stars`
              : 'No reviews yet. Be the first to share your experience.'}
          </p>
        </div>
        {canReview && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-lg bg-gold-400/10 border border-gold-400/30 text-gold-300 text-sm inline-flex items-center gap-1.5 hover:bg-gold-400/20 transition-all"
          >
            <Sparkles className="w-4 h-4" /> Share Review ☤
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <VendorReviewForm
            vendor={vendor}
            reviewerCes={userCes!}
            reviewerName={userCes === vendor.ownerCes ? vendor.ownerName : vendor.members.find((m) => m.ces === userCes)?.name || 'You'}
            onSubmit={(review) => {
              onAddReview(review);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>

      {reviews.length === 0 && !showForm && (
        <div className="rounded-xl border border-lavender/10 bg-void-800/30 p-8 text-center">
          <p className="text-lavender/50">Reviews are shared after a completed exchange, with honest healing intent. ☤</p>
        </div>
      )}

      <div className="grid gap-4">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            showMarkFelt={Boolean(isVendorSide && onMarkFelt && !review.heartlightBadge)}
            onMarkFelt={() => onMarkFelt?.(review.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ReviewCard({
  review,
  showMarkFelt,
  onMarkFelt,
}: {
  review: VendorReview;
  showMarkFelt: boolean;
  onMarkFelt: () => void;
}) {
  return (
    <div className="rounded-xl border border-lavender/10 bg-void-800/30 p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-sm font-medium text-cream">{review.reviewerName}</p>
          <p className="text-[10px] font-mono text-lavender/50">C.E.S. {review.reviewerCes}</p>
        </div>
        <div className="flex items-center gap-0.5 text-gold-400">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-gold-400' : 'text-lavender/20'}`}
            />
          ))}
        </div>
      </div>

      <p className="text-sm text-lavender/70 leading-relaxed mb-3">{review.body}</p>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {review.rays.map((ray) => {
          const option = RAY_OPTIONS.find((r) => r.key === ray);
          return (
            <span
              key={ray}
              className="px-2 py-0.5 rounded-full text-[10px] border"
              style={{
                color: option?.color,
                borderColor: `${option?.color}40`,
                backgroundColor: `${option?.color}10`,
              }}
            >
              {option?.label || ray}
            </span>
          );
        })}
        {review.healingIntent && (
          <span className="px-2 py-0.5 rounded-full text-[10px] border border-green-400/30 bg-green-400/10 text-green-300">
            Honest Healing Intent ☤
          </span>
        )}
        {review.heartlightBadge && <HeartlightBadge feltAt={review.badgeFeltAt} />}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-lavender/40">
          {new Date(review.createdAt).toLocaleDateString()}
        </span>
        {showMarkFelt && (
          <button
            onClick={onMarkFelt}
            className="px-3 py-1.5 rounded-lg bg-magenta-400/10 border border-magenta-400/30 text-magenta-300 text-xs inline-flex items-center gap-1.5 hover:bg-magenta-400/20 transition-all"
          >
            <Heart className="w-3.5 h-3.5" /> Mark Felt & Received ☤
          </button>
        )}
      </div>
    </div>
  );
}
