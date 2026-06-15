import type { ExchangeForm } from '../types/ces';

const EXCHANGE_FORM_CONFIG: Record<
  ExchangeForm,
  { label: string; emoji: string; color: string }
> = {
  gift: { label: 'Gift', emoji: '🎁', color: 'bg-gold-400/10 text-gold-300 border-gold-400/20' },
  barter: { label: 'Barter', emoji: '⇄', color: 'bg-blue-400/10 text-blue-300 border-blue-400/20' },
  fixed: { label: 'Fixed', emoji: '🏷️', color: 'bg-lavender/10 text-lavender-300 border-lavender/20' },
  negotiable: { label: 'Negotiable', emoji: '🤝', color: 'bg-magenta-400/10 text-magenta-300 border-magenta-400/20' },
  collective_funded: { label: 'Collective', emoji: '♾️', color: 'bg-green-400/10 text-green-300 border-green-400/20' },
  peer_payment: { label: 'Peer Pay', emoji: '💸', color: 'bg-amber-400/10 text-amber-300 border-amber-400/20' },
};

interface Props {
  policy: ExchangeForm[] | undefined;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function ExchangePolicyBadges({ policy, size = 'sm', showLabel = true }: Props) {
  if (!policy || policy.length === 0) return null;

  const className =
    size === 'md'
      ? 'px-2.5 py-1 rounded-full border text-xs inline-flex items-center gap-1.5'
      : 'px-2 py-0.5 rounded-full border text-[10px] inline-flex items-center gap-1';

  return (
    <div className="flex flex-wrap gap-1.5">
      {policy.map((form) => {
        const config = EXCHANGE_FORM_CONFIG[form];
        return (
          <span key={form} className={`${className} ${config.color}`} title={`Accepts ${config.label}`}>
            {showLabel ? (
              <>
                {config.emoji} {config.label}
              </>
            ) : (
              <span>{config.emoji}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
