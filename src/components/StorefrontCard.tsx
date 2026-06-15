import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, MapPin, Users } from 'lucide-react';
import { ExchangePolicyBadges } from './ExchangePolicyBadges';
import type { VendorRecord } from '../types/ces';

interface StorefrontCardProps {
  vendor: VendorRecord;
  showOfferings?: boolean;
}

export function StorefrontCard({ vendor, showOfferings = true }: StorefrontCardProps) {
  const firstOffering = vendor.offerings?.[0];
  const memberCount = vendor.members?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-blue-400/15 bg-void-800/30 p-5 hover:border-blue-400/30 transition-all"
    >
      <Link to={`/storefront/${vendor.slug}`} className="block">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-400/10 border border-blue-400/20 flex items-center justify-center shrink-0">
            {vendor.logoUrl ? (
              <img src={vendor.logoUrl} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              <Store className="w-6 h-6 text-blue-300" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-lg text-cream line-clamp-1">{vendor.name}</h3>
            <p className="text-xs text-lavender/50 line-clamp-2 mt-1">
              {vendor.coreDirective || vendor.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] text-lavender/40">
          {vendor.locationData && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {vendor.locationData.raw}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Users className="w-3 h-3" /> {memberCount + 1} {memberCount + 1 === 1 ? 'being' : 'beings'}
          </span>
          {vendor.collectiveFunded && (
            <span className="text-green-400">Collective funded ♾️</span>
          )}
        </div>

        <div className="mt-3">
          <ExchangePolicyBadges policy={vendor.exchangePolicy} />
        </div>

        {showOfferings && firstOffering && (
          <div className="mt-4 pt-4 border-t border-lavender/5">
            <p className="text-xs text-lavender/40 mb-1">Featured offering</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-cream line-clamp-1">{firstOffering.title}</span>
              <span className="text-xs text-gold-400">
                {firstOffering.priceType === 'gift'
                  ? 'Gift'
                  : firstOffering.priceType === 'collective_funded'
                  ? 'Collective'
                  : firstOffering.priceCents != null
                  ? `$${(firstOffering.priceCents / 100).toFixed(2)}`
                  : 'Negotiable'}
              </span>
            </div>
          </div>
        )}
      </Link>
    </motion.div>
  );
}
