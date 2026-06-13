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
  id: string;                    // Unique identifier for gallery management
  type: 'image' | 'video';
  url: string;
  caption: string;
  storagePath?: string;
  fileName?: string;
  contentType?: string;
  fileSize?: number;
  uploadedAt?: string;
}

export type GuideGuardianStatus = 
  | 'not_opted_in'           // Has not opted in
  | 'opted_in'               // Checked the box, hasn't done Oathis
  | 'companion'              // Exploring via Oathis ceremony
  | 'active'                 // Completed Oathis, actively serving
  | 'inactive'               // Temporarily paused (can reactivate)
  | 'declined';              // Opted out after opting in

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
  stewardship: 'active' | 'suspended' | 'banned' | 'pending' | 'returned';
  stewardshipNote: string;
  
  // NEW — Guide & Guardian journey tracking
  guideGuardianStatus: GuideGuardianStatus;
  guideGuardianOptedInAt?: string;
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

// ═══════════════════════════════════════════════════════════════
//  Codes Co-Creation Journey Types (Wave H)
//  The Flow page — live exchange documentation and Code awareness
// ═══════════════════════════════════════════════════════════════

export type ExchangeJourneyStatus =
  | 'agreement_pending'
  | 'active'
  | 'fulfillment_review'
  | 'complete'
  | 'adapted';

export type JourneyPhase = 'before' | 'during' | 'after';

export interface CodeLogEntry {
  id: string;
  exchangeId: string;
  authorCes: string;
  authorName: string;
  ray: RayKey;
  codeNumber: number;
  timestamp: string;
  content: string;
  visibility: 'private' | 'public';
  phase: JourneyPhase;
  moodEnergy?: string;
}

export interface ExchangeJourney {
  id: string;
  agreementId: string;
  title: string;
  description: string;
  wishingCes: string;
  wishingName: string;
  coCreatorCes: string;
  coCreatorName: string;
  status: ExchangeJourneyStatus;
  currentPhase: JourneyPhase;
  selectedCodes: number[];
  logs: CodeLogEntry[];
  fulfillmentNotes: string;
  fulfillmentSignedAt: string | null;
  fulfillmentSignedBy: string[];
  adaptationConsent: boolean;
  adaptedFromJourneyId?: string;
  adaptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════
//  Wish Exchange Types (Green Hackathon 2026)
//  Wish → Exchange → Quest → Fulfillment
// ═══════════════════════════════════════════════════════════════

export type WishCategory =
  | 'Tech & Development'
  | 'Creative & Design'
  | 'Writing & Content'
  | 'Healing & Wellness'
  | 'Astrology & Guidance'
  | 'Music & Sound'
  | 'Events & Facilitation'
  | 'Mutual Aid'
  | 'Climate Action'
  | 'Co-Creation Partnership'
  | 'Other';

export type WishUrgency = 'low' | 'medium' | 'high' | 'time-sensitive';

export type WishStatus =
  | 'open'              // Available to claim
  | 'claimed'           // Someone resonated, quest forming
  | 'in_quest'          // Active ExchangeJourney
  | 'fulfillment'       // In review, signing off
  | 'complete'          // Fulfilled, gratitude exchanged
  | 'closed';           // Closed without fulfillment

export interface Wish {
  id: string;
  wishingCes: string;           // C.E.S. of the one who posted
  wishingName: string;
  title: string;                // "Need help with React + Supabase integration"
  description: string;          // Full context, what success looks like
  category: WishCategory;
  urgency: WishUrgency;
  status: WishStatus;
  selectedCodes: number[];      // Which of the 12 Codes guide this wish
  claimedByCes?: string;        // C.E.S. of fulfiller (once claimed)
  claimedByName?: string;
  claimedAt?: string;
  questJourneyId?: string;      // Links to ExchangeJourney once active
  fulfillmentNotes?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
