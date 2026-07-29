import { ImageOff } from 'lucide-react';
import type { VendorRecord, PortfolioItem } from '../../types/ces';

export function VendorGallery({ vendor }: { vendor: VendorRecord }) {
  const shopImages: PortfolioItem[] = vendor.portfolioItems?.filter((p) => p.type === 'image') ?? [];
  const offeringImages: PortfolioItem[] =
    vendor.offerings?.flatMap((o) => o.gallery?.filter((p) => p.type === 'image') ?? []).slice(0, 8) ?? [];
  const images = shopImages.length ? shopImages : offeringImages;

  if (!images.length) {
    return (
      <div className="flex items-center gap-2 text-xs text-lavender/40">
        <ImageOff className="w-4 h-4" />
        <span>No photos yet</span>
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
      {images.map((img) => (
        <div key={img.id} className="shrink-0 group relative">
          <img
            src={img.url}
            alt={img.caption || `${vendor.name} photo`}
            className="w-28 h-28 rounded-xl object-cover border border-lavender/10"
          />
          {img.caption && (
            <span className="absolute bottom-0 left-0 right-0 px-2 py-1 text-[10px] text-cream/90 bg-void-900/70 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity">
              {img.caption}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
