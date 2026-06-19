import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUnifiedStorage } from '../hooks/useUnifiedStorage';
import { useStorage } from '../lib/storage';
import { CREATOR_TAGS } from '../lib/constants';
import { StorefrontCard } from '../components/StorefrontCard';
import { ExchangePolicyBadges } from '../components/ExchangePolicyBadges';
import { Store, MapPin } from 'lucide-react';
import type { CreatorRecord, VendorRecord, ExchangeForm, OfferingItem } from '../types/ces';

export default function Directory() {
  const unified = useUnifiedStorage();
  const { vendors } = useStorage();
  const [profiles, setProfiles] = useState<CreatorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [resultType, setResultType] = useState<'all' | 'beings' | 'vendors' | 'offerings'>('all');
  const [selectedExchangeForm, setSelectedExchangeForm] = useState<ExchangeForm | ''>('');

  const allVendors = useMemo(() => vendors.filter((v) => v.status === 'active'), [vendors]);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const all = await unified.getApproved();
      setProfiles(all);
    } catch (err: any) {
      console.error('[Directory] Failed to load profiles:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      if (p.cesNumber === '111111111') return false;
      if (selectedTags.size > 0 && !(p.tags || []).some((t) => selectedTags.has(t))) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.bio || '').toLowerCase().includes(q) ||
          (p.title || '').toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [profiles, selectedTags, search]);

  const filteredVendors = useMemo(() => {
    return allVendors.filter((v) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesVendor =
          v.name.toLowerCase().includes(q) ||
          (v.coreDirective || '').toLowerCase().includes(q) ||
          (v.description || '').toLowerCase().includes(q) ||
          (v.tags || []).some((t) => t.toLowerCase().includes(q));
        const matchesOffering = v.offerings.some((o) =>
          o.title.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q) ||
          (o.tags || []).some((t) => t.toLowerCase().includes(q))
        );
        if (!matchesVendor && !matchesOffering) return false;
      }
      if (selectedExchangeForm) {
        const policy = v.exchangePolicy || [];
        if (!policy.includes(selectedExchangeForm)) return false;
      }
      return true;
    });
  }, [allVendors, search, selectedExchangeForm]);

  const filteredOfferings = useMemo(() => {
    const list: { vendor: VendorRecord; offering: OfferingItem }[] = [];
    for (const v of filteredVendors) {
      for (const o of v.offerings) {
        if (selectedExchangeForm && !(o.exchangePolicy || v.exchangePolicy || []).includes(selectedExchangeForm)) continue;
        list.push({ vendor: v, offering: o });
      }
    }
    return list;
  }, [filteredVendors, selectedExchangeForm]);

  const visibleBeings = resultType === 'all' || resultType === 'beings' ? filteredProfiles : [];
  const visibleVendors = resultType === 'all' || resultType === 'vendors' ? filteredVendors : [];
  const visibleOfferings = resultType === 'all' || resultType === 'offerings' ? filteredOfferings : [];

  const totalCount = visibleBeings.length + visibleVendors.length + visibleOfferings.length;

  const exchangeForms: ExchangeForm[] = ['gift', 'barter', 'fixed', 'negotiable', 'collective_funded', 'peer_payment'];
  const typeTabs = [
    { key: 'all', label: 'ALL' },
    { key: 'beings', label: `Beings (${filteredProfiles.length})` },
    { key: 'vendors', label: `Vendors (${filteredVendors.length})` },
    { key: 'offerings', label: `Offerings (${filteredOfferings.length})` },
  ] as const;

  return (
    <div className="px-4 pb-16 max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="font-serif text-4xl text-heartlight-green mb-3">Co-Creator Directory</h1>
        <p className="text-lavender/70 text-lg">
          Discover sovereign beings, Vendor Shops, and offerings in the Heartlight Exchange
        </p>
      </div>

      <div className="max-w-2xl mx-auto mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search beings, vendors, or offerings..."
          className="w-full px-5 py-3 rounded-full bg-void-800/40 border border-lavender/10 text-cream placeholder:text-lavender/30 focus:outline-none focus:border-gold-400/40"
        />
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {typeTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setResultType(tab.key as typeof resultType)}
            className={`px-4 py-2 rounded-full text-sm border transition-all whitespace-nowrap ${
              resultType === tab.key
                ? 'border-gold-400/40 bg-gold-400/10 text-gold-300'
                : 'border-lavender/20 text-lavender/60 hover:border-lavender/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-full">
        <button
          onClick={() => setSelectedExchangeForm('')}
          className={`px-3 py-1.5 rounded-full text-xs border transition-all whitespace-nowrap ${
            selectedExchangeForm === ''
              ? 'border-blue-400/40 bg-blue-400/10 text-blue-300'
              : 'border-lavender/20 text-lavender/60 hover:border-lavender/40'
          }`}
        >
          Any exchange form
        </button>
        {exchangeForms.map((form) => (
          <button
            key={form}
            onClick={() => setSelectedExchangeForm((prev) => (prev === form ? '' : form))}
            className={`px-3 py-1.5 rounded-full text-xs border transition-all whitespace-nowrap ${
              selectedExchangeForm === form
                ? 'border-blue-400/40 bg-blue-400/10 text-blue-300'
                : 'border-lavender/20 text-lavender/60 hover:border-lavender/40'
            }`}
          >
            {form.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-full">
        <button
          onClick={() => setSelectedTags(new Set())}
          className={`px-4 py-2 rounded-full text-sm border transition-all whitespace-nowrap ${
            selectedTags.size === 0
              ? 'border-gold-400/40 bg-gold-400/10 text-gold-300'
              : 'border-lavender/20 text-lavender/60 hover:border-lavender/40'
          }`}
        >
          All tags
        </button>
        {CREATOR_TAGS.map((tag) => (
          <button
            key={tag.archetype}
            onClick={() => toggleTag(tag.archetype)}
            className={`px-4 py-2 rounded-full text-sm border transition-all whitespace-nowrap ${
              selectedTags.has(tag.archetype)
                ? 'border-gold-400/40 bg-gold-400/10 text-gold-300'
                : 'border-lavender/20 text-lavender/60 hover:border-lavender/40'
            }`}
          >
            {tag.archetype} <span className="ml-1">{tag.emoji}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-12">
          <p className="text-lavender/50">Loading creators...</p>
        </div>
      )}

      {!loading && totalCount === 0 && (
        <div className="text-center py-12">
          <p className="text-lavender/50">No beings, vendors, or offerings match your search.</p>
        </div>
      )}

      {visibleBeings.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm uppercase tracking-widest text-lavender/40 mb-4 font-sans">Beings ({visibleBeings.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleBeings.map((profile) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-lavender/10 bg-void-900/40 p-6 hover:border-gold-400/30 hover:bg-void-900/60 transition-all"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full border-2 border-lavender/20 overflow-hidden bg-void-800 flex items-center justify-center">
                    {profile.photo ? (
                      <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-serif text-cream/80">{profile.emoji || '✦'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-lg text-cream truncate">{profile.name}</h3>
                    {profile.title && <p className="text-sm text-lavender/60 truncate">{profile.title}</p>}
                    <p className="text-xs font-mono text-gold-400/80 mt-1">C.E.S. {profile.cesNumber}</p>
                  </div>
                </div>

                {profile.bio && <p className="text-sm text-lavender/70 mb-4 line-clamp-3">{profile.bio}</p>}

                {(profile.sunPlacement || profile.moonPlacement) && (
                  <div className="flex gap-3 text-xs text-lavender/50 mb-4">
                    {profile.sunPlacement && <span>☀️ {profile.sunPlacement}</span>}
                    {profile.moonPlacement && <span>🌙 {profile.moonPlacement}</span>}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-4 max-w-full">
                  {profile.wishAvailability === 'accepting' && (
                    <span className="text-xs px-3 py-1 rounded-full bg-green-400/10 text-green-300 border border-green-400/20">
                      🌱 Accepting
                    </span>
                  )}
                  {(profile.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1 rounded-full bg-void-800/60 border border-lavender/10 text-lavender/60 whitespace-nowrap"
                    >
                      {tag}
                    </span>
                  ))}
                  {profile.guideGuardianStatus === 'active' && (
                    <span className="text-xs px-3 py-1 rounded-full bg-gold-400/10 text-gold-300 border border-gold-400/20">
                      🛡️ Guide & Guardian
                    </span>
                  )}
                </div>

                {profile.publicContactVisibility && profile.contactMethods && (
                  <div className="border-t border-lavender/10 pt-4 mt-4">
                    <p className="text-xs text-lavender/50 mb-2">Connect:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(profile.contactMethods)
                        .filter(([key]) => (profile.contactVisibility as any)[key])
                        .map(([key]) => (
                          <span
                            key={key}
                            className="text-xs px-2 py-1 rounded-lg bg-void-800/60 border border-lavender/10 text-lavender/60"
                          >
                            {key}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <Link
                    to={`/profile/${profile.cesNumber}`}
                    className="block w-full text-center px-4 py-2 rounded-full border border-heartlight-green/30 bg-heartlight-green/10 text-heartlight-green hover:bg-heartlight-green/20 transition-all text-sm"
                  >
                    View Profile
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {visibleVendors.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm uppercase tracking-widest text-lavender/40 mb-4 font-sans">Vendor Shops ({visibleVendors.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleVendors.map((vendor) => (
              <StorefrontCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        </section>
      )}

      {visibleOfferings.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm uppercase tracking-widest text-lavender/40 mb-4 font-sans">Offerings ({visibleOfferings.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleOfferings.map(({ vendor, offering }) => (
              <OfferingDirectoryCard key={`${vendor.id}-${offering.id}`} vendor={vendor} offering={offering} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function OfferingDirectoryCard({ vendor, offering }: { vendor: VendorRecord; offering: OfferingItem }) {
  const priceText =
    offering.priceType === 'gift'
      ? 'Gift'
      : offering.priceType === 'collective_funded'
      ? 'Collective'
      : offering.priceType === 'negotiable'
      ? 'Negotiable'
      : offering.priceCents != null
      ? `$${(offering.priceCents / 100).toFixed(2)}`
      : 'Fixed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-lavender/10 bg-void-900/40 p-5 hover:border-gold-400/30 transition-all"
    >
      <Link to={`/storefront/${vendor.slug}`} className="block">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-400/10 border border-blue-400/20 flex items-center justify-center">
            <Store className="w-5 h-5 text-blue-300" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-lavender/50 truncate">{vendor.name}</p>
            <h3 className="font-serif text-base text-cream line-clamp-1">{offering.title}</h3>
          </div>
        </div>

        <p className="text-xs text-lavender/50 line-clamp-2 mb-3">{offering.description}</p>

        <div className="mb-3">
          <ExchangePolicyBadges policy={offering.exchangePolicy?.length ? offering.exchangePolicy : vendor.exchangePolicy} />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-lavender/10">
          <span className="text-xs text-gold-400">{priceText}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-lavender/10 text-lavender/50 capitalize">
            {offering.availability}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
