// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Core Energetic Signature Types
//  Migrated from the original Heartlight Exchange engine
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

export type RayKey =
  | 'Red'
  | 'Orange'
  | 'Yellow'
  | 'Green'
  | 'Turquoise'
  | 'Blue'
  | 'Indigo'
  | 'Violet'
  | 'Magenta'
  | 'Omni'
  | 'Elemental'
  | 'ALL';

export type WishAvailability = 'accepting' | 'closed';

export type SeasonKey = 'Winter' | 'Spring' | 'Summer' | 'Fall';

export interface SeasonState {
  Winter: boolean;
  Spring: boolean;
  Summer: boolean;
  Fall: boolean;
}

export type ExchangePathway =
  | 'Fixed Price'
  | 'Sliding Scale'
  | 'Trade'
  | 'Gift'
  | 'Scholarship';

export interface ContactMethods {
  email: string;
  phone: string;
  instagram: string;
  youtube: string;
  threads: string;
  spotify: string;
  discord: string;
  telegram: string;
  signal: string;
}

export type ContactVisibility = Record<keyof ContactMethods, boolean>;

export interface PortfolioItem {
  type: 'image' | 'video';
  url: string;
  caption: string;
  storagePath?: string;
  fileName?: string;
  contentType?: string;
  fileSize?: number;
  uploadedAt?: string;
}

export interface CreatorRecord {
  id: string;
  name: string;
  pronouns: string;
  title: string;
  location: string;
  sunPlacement?: string;
  moonPlacement?: string;
  emoji: string;
  photo: string | null;

  // NEW — personal bio, separate from marketplace
  bio: string;

  // DEPRECATED — kept for backward compat with old profiles.
  // These now live on VendorRecord.
  ray?: string;
  primaryRay?: string;
  primaryRayKey?: string;
  rays?: string[];
  heartlight?: string;
  offerings?: string[];
  exchanges?: string[];
  seasons?: SeasonState;
  timeline?: string;

  // Life Path Number (single free-text value, stored as first item)
  numerology: string[];
  accessibility: string[];
  consent: string;
  portfolioLink: string;
  portfolioItems: PortfolioItem[];
  contactMethods: ContactMethods;
  contactVisibility: ContactVisibility;
  publicContactVisibility: boolean;
  contactMethod: string;
  // DEPRECATED — season symbol removed from profile creation
  season_current?: string;
  cesNumber: string | null;
  passphrase: string;
  wishAvailability: WishAvailability;
  directoryWishStatus: WishAvailability;
  stewardship: 'active' | 'suspended' | 'banned';
  stewardshipNote: string;
}

export interface AuthorizedStewardEntry {
  id?: string;
  ces: string;
  cesEncrypted?: string;
  name: string;
  passphrase: string;
  role?: string;
  registeredAt?: string;
  createdAt?: string;
  status?: string;
}

export interface SecurityLogEntry {
  timestamp: string;
  cesEncrypted: string;
  type: string;
  status: string;
  message: string;
  requestedCesNumber?: string;
  createdBy?: string;
}

export interface AgreementRole {
  label: string;
  beings: string;
}

export type AgreementStatus = 'draft' | 'signed';

export interface AgreementRecord {
  id: string;
  sourceType: string;
  sourceWishId: string | null;
  sourceWishName: string;
  status: AgreementStatus;
  wishingProfileId: string;
  wishingCES: string;
  wishingName: string;
  coCreatorProfileId: string;
  coCreatorCES: string;
  coCreatorName: string;
  roles: AgreementRole[];
  portalStartPhase: string;
  portalEndPhase: string;
  portalTimeline: string;
  scope: string;
  format: string;
  exchangePathway: string;
  springMilestone: string;
  summerMilestone: string;
  fallMilestone: string;
  openingNote: string;
  replyPreference: string;
  boundaries: string;
  coCreatorBlessing: string;
  receiverBlessing: string;
  sharedContactMethods: ContactMethods;
  createdAt: string;
  updatedAt: string;
  signedAt: string | null;
}

// ═══════════════════════════════════════════════════════════════
//  Marketplace / Vendor Types (Wave B+)
//  Co-created with Atlas Morphoenix
// ═══════════════════════════════════════════════════════════════

export type OfferingCategory =
  | 'Astrology & Cosmic Guidance'
  | 'Creative Arts & Design'
  | 'Education & Mentorship'
  | 'Healing & Wellness'
  | 'Music & Sound'
  | 'Technology & Web'
  | 'Writing & Content'
  | 'Events & Facilitation'
  | 'Handcrafts & Goods'
  | 'Other';

export type CurrencyCode = 'USD';

export type OfferingPriceType = 'fixed' | 'gift' | 'collective_funded' | 'negotiable';

export type VendorStatus = 'active' | 'paused' | 'under_review';

export type VendorMemberRole = 'owner' | 'admin' | 'contributor';

export type VendorMemberStatus = 'invited' | 'active' | 'removed';

export type PaymentMethodType = 'stripe' | 'venmo' | 'cashapp' | 'zelle' | 'collective';

export interface PaymentMethodConfig {
  type: PaymentMethodType;
  enabled: boolean;
  stripeAccountId?: string;     // Stripe Connect account ID
  venmoUsername?: string;       // @username
  cashappUsername?: string;     // $username
  zelleContact?: string;        // Phone or email (with consent)
  collectivePriority?: boolean; // Prefer collective funding when available
}

export interface VendorMember {
  ces: string;
  name: string;
  role: VendorMemberRole;
  invitedAt: string;
  joinedAt?: string;
  status: VendorMemberStatus;
}

export interface VendorInvite {
  id: string;
  vendorId: string;
  vendorName: string;
  invitedByCes: string;
  invitedByName: string;
  inviteeCes: string;
  inviteeName: string;
  role: VendorMemberRole;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  respondedAt?: string;
}

export interface OfferingItem {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  category: OfferingCategory;
  priceType: OfferingPriceType;
  priceCents?: number;          // For Stripe fixed-price (in cents)
  currency: CurrencyCode;
  imageUrl?: string;
  availability: 'available' | 'limited' | 'waitlist' | 'unavailable';
  consentRequired: boolean;      // Must read provider's boundaries before booking
  maxParticipants?: number;      // For group sessions / events
  stripePriceId?: string;        // Stripe Price object ID
  createdAt: string;
  updatedAt: string;
}

export interface VendorRecord {
  id: string;                    // vendor_123456
  name: string;                  // "Luna's Star Readings"
  slug: string;                  // "lunas-star-readings"
  description: string;           // Short bio / mission
  logoUrl?: string;              // Storefront image
  ownerCes: string;              // C.E.S. of the founding being
  ownerName: string;
  members: VendorMember[];       // Co-creators who can manage offerings
  offerings: OfferingItem[];     // Products / services
  paymentMethods: PaymentMethodConfig[];
  status: VendorStatus;
  collectiveFunded: boolean;     // Accepts collective-funded requests
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeRequest {
  id: string;
  offeringId: string;
  vendorId: string;
  requesterCes: string;
  requesterName: string;
  providerCes: string;
  providerName: string;
  message: string;               // Personal message / need statement
  priceType: OfferingPriceType;
  paymentMethod?: PaymentMethodType;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  collectivePetitionId?: string; // If collective-funded
  consentAcknowledged: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CollectivePetition {
  id: string;
  exchangeRequestId: string;
  requesterCes: string;
  requesterName: string;
  providerCes: string;
  providerName: string;
  offeringTitle: string;
  amountCents: number;
  message: string;
  status: 'submitted' | 'under_review' | 'approved' | 'denied' | 'funded';
  stewardNotes?: string;
  reviewedByCes?: string;
  reviewedByName?: string;
  createdAt: string;
  reviewedAt?: string;
  fundedAt?: string;
}
