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

export type WishAvailability = 'accepting' | 'full';

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
  instagram: string;
  email: string;
  phone: string;
  discord: string;
  signal: string;
  whatsapp: string;
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
  sunPlacement: string;
  moonPlacement: string;
  emoji: string;
  photo: string | null;
  ray: string;
  primaryRay: string;
  primaryRayKey: string;
  rays: string[];
  heartlight: string;
  offerings: string[];
  exchanges: string[];
  seasons: SeasonState;
  timeline: string;
  numerology: string[];
  accessibility: string[];
  consent: string;
  portfolioLink: string;
  portfolioItems: PortfolioItem[];
  contactMethods: ContactMethods;
  contactVisibility: ContactVisibility;
  publicContactVisibility: boolean;
  contactMethod: string;
  season_current: string;
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
