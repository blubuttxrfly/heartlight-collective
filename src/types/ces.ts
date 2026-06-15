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

export type MeetingStatus = 'proposed' | 'confirmed' | 'completed' | 'rescheduled' | 'cancelled';

export interface ScheduledMeeting {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  timeZone: string;
  location: string;
  status: MeetingStatus;
  proposedByCes?: string;
  proposedByName?: string;
  confirmedByCes: string[];
  notes?: string;
}

export interface AvailabilityBlock {
  id: string;
  dayOfWeek?: number;            // 0 = Sunday ... 6 = Saturday
  date?: string;                 // YYYY-MM-DD for one-off blocks
  startTime?: string;            // HH:mm (omit when allDay)
  endTime?: string;              // HH:mm (omit when allDay)
  allDay?: boolean;              // Heartlight Green/Red Ray full-day marker
  timeZone: string;
  type: 'available' | 'unavailable';
  recurring: boolean;
  title?: string;
}

export interface ExchangeCalendar {
  ces: string;
  availabilityBlocks: AvailabilityBlock[];
  scheduledMeetings: ScheduledMeeting[];
  updatedAt: string;
}

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

  // NEW — creator role tags (archetypes + specializations)
  tags?: string[];

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
  
  // NEW — Structured location data for distance-aware discovery
  locationData?: LocationData;

  // NEW — Peer-to-peer payment methods this being accepts (Wave 7)
  peerPaymentMethods?: PaymentMethodConfig[];
}

export interface MutualAidSummary {
  totalAgreements: number;
  activeAgreements: number;
  completedAgreements: number;
  giftsShared: number;
  giftsReceived: number;
  wishesPosted: number;
  wishesClaimed: number;
  vendorsOwned: number;
  offeringsActive: number;
  totalEstimatedValueCents: number;
  unpaidAgreements: number;
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

export type PaymentMethodType = 'stripe' | 'venmo' | 'cashapp' | 'zelle' | 'chime' | 'collective';

/** Accepted forms of exchange (visible everywhere an exchange can happen) */
export type ExchangeForm =
  | 'gift'
  | 'barter'
  | 'fixed'
  | 'negotiable'
  | 'collective_funded'
  | 'peer_payment';

export interface PaymentMethodConfig {
  type: PaymentMethodType;
  enabled: boolean;
  // Direct peer-to-peer / platform links
  stripePaymentLink?: string;   // Stripe Checkout / Payment Link URL
  stripeAccountId?: string;     // Stripe Connect account ID (legacy)
  venmoUsername?: string;       // @username
  cashappUsername?: string;     // $username
  zelleContact?: string;        // Phone or email (with consent)
  chimeUsername?: string;       // Chime $username or username
  collectivePriority?: boolean; // Prefer collective funding when available
  preferredCurrency?: string; // e.g. USD
  note?: string;               // Public note about when/how to pay
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

/** Beings request to join a vendor group */
export interface VendorJoinRequest {
  id: string;
  vendorId: string;
  requesterCes: string;
  requesterName: string;
  message?: string;
  status: 'pending' | 'approved' | 'declined';
  requestedAt: string;
  respondedAt?: string;
  respondedByCes?: string;
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
  exchangePolicy?: ExchangeForm[]; // Accepted forms of exchange
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface VendorRecord {
  id: string;                    // vendor_123456
  name: string;                  // "Luna's Star Readings"
  slug: string;                  // "lunas-star-readings"
  description: string;           // Short bio / mission
  coreDirective?: string;        // Full Vendor Shop bio / mission
  logoUrl?: string;              // Storefront image
  ownerCes: string;              // C.E.S. of the founding being
  ownerName: string;
  members: VendorMember[];       // Co-creators who can manage offerings
  offerings: OfferingItem[];     // Products / services
  paymentMethods: PaymentMethodConfig[];
  exchangePolicy?: ExchangeForm[]; // Accepted forms of exchange
  locationData?: import('./ces').LocationData;
  tags?: string[];
  status: VendorStatus;
  collectiveFunded: boolean;     // Accepts collective-funded requests
  joinRequests: VendorJoinRequest[]; // Incoming membership requests
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

/** Agreement-based exchange for vendor offerings with mutual consent */
// ═══════════════════════════════════════════════════════════════
//  Quest System — The beating heart of every exchange
//  Main Quest, Side Quests, roles, and the living Agreement
// ═══════════════════════════════════════════════════════════════

export type ExchangeRole =
  | 'Vision Holder'
  | 'Guide'
  | 'Learner'
  | 'Builder'
  | 'Facilitator'
  | 'Recipient'
  | 'Steward'
  | 'Contributor'
  | 'Observer'
  | 'Co-Creator';

export interface QuestItem {
  id: string;
  title: string;
  description?: string;
  /** @deprecated single assignment retained for backward compat */
  assignedToCes?: string;
  /** @deprecated single assignment retained for backward compat */
  assignedToName?: string;
  assignedToRoles?: ExchangeRole[];
  assignedToCesList?: string[];
  assignedToNames?: string[];
  status: 'open' | 'in_progress' | 'verification_pending' | 'completed' | 'paused';
  createdAt: string;
  completedAt?: string;
  completedByCes?: string;
  completedByName?: string;
  verifications?: {
    verifierCes: string;
    verifierName: string;
    verifiedAt: string;
    status: 'approved' | 'rejected';
    note?: string;
  }[];
}

export interface AgreementPartyWithdrawal {
  reason: string;
  otherReason?: string;
  notes?: string;
  requestedAt: string;
  approvedBy?: string;
  status?: 'submitted' | 'approved' | 'reviewed' | 'declined';
}

export interface AgreementParty {
  ces: string;
  name: string;
  role: ExchangeRole;
  privacyAssurance?: string;
  privacyAgreed: boolean;
  joinedAt?: string;
  withdrewAt?: string;
  withdrawal?: AgreementPartyWithdrawal;
}

export interface SafetyReport {
  feelsUnsafe: boolean;
  unsafeBeingCes?: string;
  unsafeBeingName?: string;
  unsafeBeingOutside?: string;
  contactGuide: 'yes' | 'reach_out_first' | 'no';
  details?: string;
  submittedAt: string;
}

export interface ExchangeAlert {
  id: string;
  exchangeId: string;
  exchangeTitle: string;
  type: 'withdrawal' | 'safety_report' | 'privacy_update';
  fromCes: string;
  fromName: string;
  toCes?: string;
  message: string;
  status: 'open' | 'reviewed' | 'resolved';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface AgreementVersion {
  version: number;
  updatedAt: string;
  updatedByCes: string;
  updatedByName: string;
  changeSummary: string;
  approvedBy: string[];  // CES numbers who approved this version
  // Wave 6.9 snapshots
  parties?: AgreementParty[];
  mainQuestDirective?: QuestItem;
  mainQuests?: QuestItem[];
  sideQuests?: QuestItem[];
  safetyReports?: SafetyReport[];
}

export interface ExchangeAgreement {
  id: string;
  offeringId?: string;           // for vendor offerings
  vendorId?: string;
  wishId?: string;               // for wish/gift exchanges (no vendor)
  requesterCes: string;
  requesterName: string;
  providerCes: string;
  providerName: string;
  message: string;               // initial resonance statement
  // --- ROLES (legacy binary fields kept for backward compat) ---
  requesterRole: ExchangeRole;
  providerRole: ExchangeRole;
  // --- MULTI-BEING PARTIES (Wave 6.9) ---
  parties?: AgreementParty[];
  // --- QUESTS ---
  mainQuest: QuestItem;
  /** Wave 6.9 directive quest summarizing the central shared intention */
  mainQuestDirective?: QuestItem;
  /** Wave 6.9 multi-quest list (kept in sync with mainQuest for binary exchanges) */
  mainQuests?: QuestItem[];
  sideQuests: QuestItem[];
  // --- TERMS ---
  proposedPriceCents?: number;
  agreedPriceCents?: number;
  paymentMethod?: PaymentMethodType;
  communicationPrefs?: string;   // e.g. "Weekly check-ins via Signal"
  // --- SCHEDULE ---
  scheduledMeetings: ScheduledMeeting[];
  // --- CONSENT ---
  status: 'draft' | 'proposed' | 'agreed' | 'active' | 'fulfilled' | 'completed' | 'declined' | 'withdrawn';
  requesterConsented: boolean;
  providerConsented: boolean;
  collectiveFundingRequested: boolean;
  collectiveFundingApproved?: boolean;
  // --- SAFETY & PRIVACY (Wave 6.9) ---
  safetyReports?: SafetyReport[];
  // --- LIVING DOCUMENT ---
  versions: AgreementVersion[];
  pendingUpdate?: AgreementVersion;
  // --- META ---
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

export type JourneyPhase = 'before' | 'quests' | 'during' | 'after';

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
  // --- QUESTS inherited from Agreement ---
  mainQuest: QuestItem;
  sideQuests: QuestItem[];
  // --- SCHEDULE inherited from Agreement ---
  scheduledMeetings: ScheduledMeeting[];
  // --- FULFILLMENT ---
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
  /** When true, this gift listing persists and can be claimed repeatedly */
  isContinualOffering?: boolean;
  /** Track each claim for continual offerings */
  claims?: { claimedByCes: string; claimedByName: string; claimedAt: string }[];
}

// ═══════════════════════════════════════════════════════════════
//  Location-Aware Discovery Types (Wave Y)
// ═══════════════════════════════════════════════════════════════

export type WishScope = 'local' | 'global' | 'universal';

export interface LocationData {
  raw: string;              // Display name, e.g. "Burlington, Vermont, United States"
  lat: number;
  lon: number;
  city: string | null;
  region: string | null;    // state/province
  country: string | null;
  continent: string | null;
}

/** Partial location for wishes that only specify continent (no precise coords) */
export interface WishLocation {
  raw: string;
  lat: number | null;
  lon: number | null;
  continent: string | null;
  scope: WishScope;
}
