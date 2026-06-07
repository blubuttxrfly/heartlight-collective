// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Sacred Constants
//  Shared across CreateProfile, Directory, and Profile views
// ─────────────────────────────────────────────────────────────

export const RAY_DATA = [
  { key: 'Red',       label: 'Red — Presence',          color: '#ef4444', code: '1A' },
  { key: 'Orange',    label: 'Orange — Essence',        color: '#f97316', code: '2A' },
  { key: 'Yellow',    label: 'Yellow — Sovereignty',    color: '#facc15', code: '3A' },
  { key: 'Green',     label: 'Green — Union',           color: '#22c55e', code: '4A' },
  { key: 'Turquoise', label: 'Turquoise — Harmony',     color: '#2dd4bf', code: '5A' },
  { key: 'Blue',      label: 'Blue — Expression',       color: '#3b82f6', code: '6A' },
  { key: 'Indigo',    label: 'Indigo — Perception',     color: '#6366f1', code: '7A' },
  { key: 'Violet',    label: 'Violet — Integration',    color: '#8b5cf6', code: '8A' },
  { key: 'Magenta',   label: 'Magenta — Reunion',       color: '#d946ef', code: '9A' },
  { key: 'Omni',      label: 'Omni — Integration',      color: '#fafafa', code: '10A' },
  { key: 'Elemental', label: 'Crystalline-Carbon',      color: '#a5f3fc', code: '11A' },
  { key: 'ALL',       label: 'Infinite of ALL',         color: '#7dd3fc', code: '12A' },
] as const;

export const OFFERING_PRESETS = [
  'Astrology Readings',
  'Natal Charts',
  'Dream Work',
  'Somatic Practice',
  'Breathwork',
  'Movement Ritual',
  'Sound Healing',
  'Guided Visualizations',
  'Community Facilitation',
  'Web Development',
  'Visual Design',
  'Sacred Art',
  'Tea Blends',
  'Apothecary',
  'Handcrafted Talismans',
  'Mentorship',
  'Teaching',
  'Writing',
  'Translation',
  'Event Hosting',
  'Space Holding',
  'Conflict Resolution',
  'Grant Writing',
  'Fundraising',
  'Accounting',
  'Legal Support',
  'Translation',
  'Other',
];

export const EXCHANGE_PATHWAYS: { label: string; description: string }[] = [
  { label: 'Fixed Price',     description: 'A clear, agreed-upon offering in exchange for currency.' },
  { label: 'Sliding Scale',   description: 'The receiver chooses what they can offer within a suggested range.' },
  { label: 'Trade',           description: 'One offering in return for another — skill swap or barter.' },
  { label: 'Gift',            description: 'The offering is given freely, with no expectation of return.' },
  { label: 'Scholarship',     description: 'Community-supported offering for beings who may not otherwise have access.' },
];

export const SEASONS = [
  { key: 'Winter', label: 'Winter Rest',    emoji: '❄️' },
  { key: 'Spring', label: 'Spring Seed',    emoji: '🌱' },
  { key: 'Summer', label: 'Summer Bloom',   emoji: '🌞' },
  { key: 'Fall',   label: 'Fall Harvest',   emoji: '🍂' },
] as const;

export const NUMEROLOGY_PRESETS = [
  'Life Path Number',
  'Destiny Number',
  'Soul Urge Number',
  'Personality Number',
  'Maturity Number',
  'Birthday Number',
  'Expression Number',
];

export const ACCESSIBILITY_PRESETS = [
  'Captions available',
  'Audio description',
  'Screen-reader friendly',
  'Sensory-friendly pacing',
  'Simplified steps',
  'Multiple time-zone windows',
  'Translation available',
  'ASL interpretation',
  'Large print',
  'Color-blind friendly',
];

export const ASTROLOGY_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

export const CONTACT_FIELDS = [
  { key: 'email',     label: 'Email',     placeholder: 'you@example.com',           icon: 'email' },
  { key: 'phone',     label: 'Phone',     placeholder: '+1 (000) 000-0000',       icon: 'phone' },
  { key: 'instagram', label: 'Instagram', placeholder: '@handle',                 icon: 'instagram' },
  { key: 'youtube',   label: 'YouTube',   placeholder: 'channel or @handle',      icon: 'youtube' },
  { key: 'threads',   label: 'Threads',   placeholder: '@handle',                 icon: 'threads' },
  { key: 'spotify',   label: 'Spotify',   placeholder: 'Artist or profile URL',   icon: 'spotify' },
  { key: 'discord',   label: 'Discord',   placeholder: 'username',                icon: 'discord' },
  { key: 'telegram',  label: 'Telegram',  placeholder: '@handle or +number',    icon: 'telegram' },
  { key: 'signal',    label: 'Signal',    placeholder: '+1 (000) 000-0000',       icon: 'signal' },
] as const;

// ═══════════════════════════════════════════════════════════════
//  Marketplace Constants (Wave B+)
// ═══════════════════════════════════════════════════════════════

export const OFFERING_CATEGORIES = [
  'Astrology & Cosmic Guidance',
  'Creative Arts & Design',
  'Education & Mentorship',
  'Healing & Wellness',
  'Music & Sound',
  'Technology & Web',
  'Writing & Content',
  'Events & Facilitation',
  'Handcrafts & Goods',
  'Other',
] as const;

export const CURRENCIES: { code: string; label: string; symbol: string }[] = [
  { code: 'USD', label: 'US Dollar', symbol: '$' },
];

export const PRICE_TYPE_OPTIONS: { value: string; label: string; description: string }[] = [
  { value: 'fixed',            label: 'Fixed Price',       description: 'A set price for your offering, paid via Stripe or direct transfer.' },
  { value: 'gift',             label: 'Gift Economy',      description: 'No set price. The receiver offers what feels aligned.' },
  { value: 'collective_funded', label: 'Collective Funded', description: 'Funds flow from the Collective treasury for aligned exchanges.' },
  { value: 'negotiable',       label: 'Negotiable',        description: 'Price is discussed and agreed upon between both beings.' },
];

export const OFFERING_AVAILABILITY_OPTIONS = [
  { value: 'available',     label: 'Available' },
  { value: 'limited',       label: 'Limited Spots' },
  { value: 'waitlist',      label: 'Waitlist Open' },
  { value: 'unavailable',   label: 'Currently Unavailable' },
] as const;

export const PAYMENT_METHOD_LABELS: Record<string, { label: string; prefix: string; example: string }> = {
  venmo:     { label: 'Venmo',     prefix: 'venmo.com/u/',  example: '@username' },
  cashapp:   { label: 'Cash App',  prefix: 'cash.app/$',    example: '$username' },
  zelle:     { label: 'Zelle',     prefix: '',              example: 'phone or email' },
  stripe:    { label: 'Stripe',    prefix: '',              example: 'Stripe Connect account' },
  collective: { label: 'Collective', prefix: '',             example: 'Collective treasury' },
};

export const VENDOR_MEMBER_ROLES = [
  { value: 'owner',       label: 'Owner',       description: 'Full sovereign control of the storefront' },
  { value: 'admin',       label: 'Admin',       description: 'Can manage offerings and members' },
  { value: 'contributor', label: 'Contributor', description: 'Can add/edit offerings, no payment settings' },
] as const;
