import type { OfferingItem, MeetingPlatform } from '../types/ces';
import { Video, Sprout, Package, PenTool, MapPin, Globe } from 'lucide-react';

const OFFERING_TYPE_CONFIG: Record<
  OfferingItem['offeringType'],
  { label: string; icon: React.ElementType; color: string; symbol?: string }
> = {
  product: { label: 'Product', icon: Package, color: 'bg-blue-400/10 text-blue-300 border-blue-400/20' },
  service: { label: 'Service', icon: PenTool, color: 'bg-lavender/10 text-lavender-300 border-lavender/20' },
  virtual_session: { label: 'Virtual Session', icon: Video, color: 'bg-magenta-400/10 text-magenta-300 border-magenta-400/20', symbol: '🎥' },
  work_study_exchange: { label: 'Work / Study Exchange', icon: Sprout, color: 'bg-green-400/10 text-green-300 border-green-400/20', symbol: '🌱' },
};

const PLATFORM_LABEL: Record<MeetingPlatform, string> = {
  google_meet: 'Google Meet',
  zoom: 'Zoom',
  jitsi: 'Jitsi Meet',
  teams: 'Microsoft Teams',
  other: 'Other platform',
};

interface Props {
  offering: OfferingItem;
  size?: 'sm' | 'md';
  showLocation?: boolean;
}

export function OfferingTypeBadge({ offering, size = 'sm', showLocation = true }: Props) {
  const typeConfig = OFFERING_TYPE_CONFIG[offering.offeringType || 'service'];
  const Icon = typeConfig.icon;
  const isPhysical = offering.location && (offering.location.address || offering.location.label);

  const className =
    size === 'md'
      ? 'px-2.5 py-1 rounded-full border text-xs inline-flex items-center gap-1.5'
      : 'px-2 py-0.5 rounded-full border text-[10px] inline-flex items-center gap-1';

  return (
    <div className="flex flex-wrap gap-1.5">
      <span className={`${className} ${typeConfig.color}`}>
        <Icon className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
        {typeConfig.label} {typeConfig.symbol}
      </span>

      {offering.offeringType === 'virtual_session' && offering.virtualSession && (
        <span className={`${className} bg-magenta-400/5 text-magenta-300/80 border-magenta-400/15`}>
          {offering.virtualSession.durationMinutes} min · {PLATFORM_LABEL[offering.virtualSession.platform]} {offering.virtualSession.platform === 'other' ? '' : '🎥'}
        </span>
      )}

      {offering.offeringType === 'work_study_exchange' && offering.workStudyExchange && (
        <span className={`${className} bg-green-400/5 text-green-300/80 border-green-400/15`}>
          {offering.workStudyExchange.durationWeeks} weeks · {offering.workStudyExchange.hoursPerWeek} hrs/wk 🌱
        </span>
      )}

      {showLocation && isPhysical && (
        <span className={`${className} bg-amber-400/10 text-amber-300 border-amber-400/20`}>
          <MapPin className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          {offering.location?.label || offering.location?.address || 'Physical'} 📍
        </span>
      )}

      {showLocation && offering.offeringType === 'virtual_session' && (
        <span className={`${className} bg-blue-400/10 text-blue-300 border-blue-400/20`}>
          <Globe className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
          Remote / Virtual 🌐
        </span>
      )}
    </div>
  );
}
