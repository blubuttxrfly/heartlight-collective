import { Heart } from 'lucide-react';

export function HeartlightBadge({ feltAt }: { feltAt?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-magenta-400/30 bg-magenta-400/10 text-magenta-300 text-xs"
      title={feltAt ? `Felt and received ${new Date(feltAt).toLocaleDateString()}` : undefined}
    >
      <Heart className="w-3.5 h-3.5" />
      Felt, Received, Healing On ☤
    </span>
  );
}
