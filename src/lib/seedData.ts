// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Dev-only Mock Seed Data
//  Interconnected demo data tied to Atlas Morphoenix C.E.S. 886233612
//  Only runs in import.meta.env.DEV and only when storage is empty.
// ─────────────────────────────────────────────────────────────

import type {
  CreatorRecord,
  VendorRecord,
  OfferingItem,
  Wish,
  ExchangeRequest,
  ExchangeAgreement,
  ExchangeJourney,
  ExchangeCalendar,
  AvailabilityBlock,
  ScheduledMeeting,
  AgreementParty,
  QuestItem,
  ExchangeAlert,
} from '../types/ces';
import type { StorageState } from './storage';

const ATLAS_CES = '886233612';
const ATLAS_NAME = 'Atlas Morphoenix';
const LIORA_CES = '222222222';
const LIORA_NAME = 'Liora Starweaver';

const now = new Date().toISOString();
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

function emptyProfile(ces: string, name: string): CreatorRecord {
  return {
    id: `profile_${ces}`,
    name,
    pronouns: 'they/them',
    title: '',
    location: 'Earth, Milky Way',
    emoji: '🌟',
    photo: null,
    bio: '',
    tags: [],
    numerology: [],
    accessibility: [],
    consent: '',
    portfolioLink: '',
    portfolioItems: [],
    contactMethods: { email: '', phone: '', instagram: '', youtube: '', threads: '', spotify: '', discord: '', telegram: '', signal: '' },
    contactVisibility: { email: false, phone: false, instagram: false, youtube: false, threads: false, spotify: false, discord: false, telegram: false, signal: false },
    publicContactVisibility: false,
    contactMethod: 'other',
    cesNumber: ces,
    passphrase: 'sovereign42',
    wishAvailability: 'accepting',
    directoryWishStatus: 'accepting',
    stewardship: ces === ATLAS_CES ? 'active' : 'pending',
    stewardshipNote: '',
    guideGuardianStatus: 'not_opted_in',
    locationData: { raw: 'Earth, Milky Way', city: 'Earth', region: 'Milky Way', country: 'Gaia', continent: 'Gaia', lat: 0, lon: 0 },
  };
}

function atlasProfile(): CreatorRecord {
  return {
    ...emptyProfile(ATLAS_CES, ATLAS_NAME),
    emoji: '🦋',
    title: 'Artist of Life & Energy Healer',
    bio: 'Co-creating with color, energy, and the Heartlight Collective.',
    tags: ['Art Healing', 'Energy Work', 'Co-Creation', 'Creative Facilitation'],
    peerPaymentMethods: [
      {
        type: 'venmo',
        enabled: true,
        venmoUsername: 'atlasmorphoenix',
        note: 'Preferred for Heartlight exchanges',
        preferredCurrency: 'USD',
      },
      {
        type: 'stripe',
        enabled: true,
        stripePaymentLink: 'https://buy.stripe.com/example-atlas-art-healing',
        note: 'For card payments and recurring support',
        preferredCurrency: 'USD',
      },
    ],
  };
}

function lioraProfile(): CreatorRecord {
  return {
    ...emptyProfile(LIORA_CES, LIORA_NAME),
    emoji: '🌙',
    title: 'Soul Art Companion',
    bio: 'Walking with beings through creative reflection and intuitive art.',
    tags: ['Art Companion', 'Intuitive Creation', 'Holding Space'],
  };
}

function offering(): OfferingItem {
  return {
    id: 'offering_art_healing_001',
    vendorId: 'vendor_atlas_art',
    title: 'Art Healing Session',
    description:
      'A 1-1 art healing session where we talk about the various kinds of art we enjoy and what our inspirations are while creating. The goal is to feel inspired and aware of our creative process.',
    category: 'Healing & Wellness',
    priceType: 'gift',
    currency: 'USD',
    availability: 'available',
    consentRequired: true,
    maxParticipants: 1,
    createdAt: now,
    updatedAt: now,
  };
}

function vendor(): VendorRecord {
  return {
    id: 'vendor_atlas_art',
    name: "Atlas's Art Sanctuary",
    slug: 'atlas-art-sanctuary',
    description: 'A sovereign creative space for art healing, energy work, and co-creation.',
    ownerCes: ATLAS_CES,
    ownerName: ATLAS_NAME,
    members: [],
    offerings: [offering()],
    paymentMethods: [
      {
        type: 'venmo',
        enabled: true,
        venmoUsername: 'atlasmorphoenix',
        note: 'Preferred for Art Healing Sessions',
        preferredCurrency: 'USD',
      },
    ],
    status: 'active',
    collectiveFunded: true,
    joinRequests: [],
    createdAt: now,
    updatedAt: now,
  };
}

function wish(): Wish {
  return {
    id: 'wish_art_healing_001',
    wishingCes: LIORA_CES,
    wishingName: LIORA_NAME,
    title: 'Art Healing Session',
    description:
      'I would love a 1-1 session where we explore the art that moves us and create together in a safe, inspiring space.',
    category: 'Healing & Wellness',
    urgency: 'medium',
    status: 'in_quest',
    selectedCodes: [1, 7, 12],
    claimedByCes: ATLAS_CES,
    claimedByName: ATLAS_NAME,
    claimedAt: now,
    questJourneyId: 'journey_art_healing_001',
    createdAt: now,
    updatedAt: now,
    isContinualOffering: true,
  };
}

function exchangeRequest(): ExchangeRequest {
  return {
    id: 'request_art_healing_001',
    offeringId: 'offering_art_healing_001',
    vendorId: 'vendor_atlas_art',
    requesterCes: LIORA_CES,
    requesterName: LIORA_NAME,
    providerCes: ATLAS_CES,
    providerName: ATLAS_NAME,
    message:
      'Hello Atlas! I feel called to explore creativity and inspiration with you in an Art Healing Session.',
    priceType: 'gift',
    paymentMethod: 'collective',
    status: 'accepted',
    consentAcknowledged: true,
    createdAt: now,
    updatedAt: now,
  };
}

function makeQuest(id: string, title: string, desc: string, status: QuestItem['status'], ces: string, name: string): QuestItem {
  return {
    id,
    title,
    description: desc,
    assignedToCesList: [ces],
    assignedToNames: [name],
    assignedToRoles: [ces === ATLAS_CES ? 'Facilitator' : 'Recipient'],
    status,
    createdAt: now,
  };
}

function mainQuestDirective(): QuestItem {
  return makeQuest(
    'quest_directive_001',
    'Inspire Creative Awareness',
    'Co-create a 1-1 art healing session that awakens inspiration and mindful creative presence.',
    'in_progress',
    ATLAS_CES,
    ATLAS_NAME
  );
}

function mainQuests(): QuestItem[] {
  return [
    makeQuest(
      'quest_atlas_prepare',
      'Atlas: Prepare the creative container',
      'Set up materials, sacred space, and intention for the session.',
      'in_progress',
      ATLAS_CES,
      ATLAS_NAME
    ),
    makeQuest(
      'quest_liora_reflect',
      'Liora: Share creative intentions',
      'Bring 2-3 art forms or inspirations you would like to explore.',
      'open',
      LIORA_CES,
      LIORA_NAME
    ),
    makeQuest(
      'quest_together_create',
      'Together: Create and reflect',
      'Make art together while naming inspirations and creative process awareness.',
      'open',
      ATLAS_CES,
      ATLAS_NAME
    ),
  ];
}

function sideQuests(): QuestItem[] {
  return [
    makeQuest(
      'quest_gratitude',
      'Exchange gratitude',
      'Share a short written or voiced gratitude after the session.',
      'open',
      LIORA_CES,
      LIORA_NAME
    ),
  ];
}

function parties(): AgreementParty[] {
  return [
    {
      ces: ATLAS_CES,
      name: ATLAS_NAME,
      role: 'Facilitator',
      privacyAssurance:
        'I agree to keep our creative process sacred and to communicate before sharing anything about this exchange.',
      privacyAgreed: true,
      joinedAt: now,
    },
    {
      ces: LIORA_CES,
      name: LIORA_NAME,
      role: 'Recipient',
      privacyAssurance:
        'I honor the privacy of our exchange and will ask before sharing any details with others.',
      privacyAgreed: true,
      joinedAt: now,
    },
  ];
}

function scheduledMeeting(): ScheduledMeeting {
  return {
    id: 'meeting_art_healing_001',
    title: 'Art Healing Session',
    startAt: tomorrow,
    endAt: new Date(new Date(tomorrow).getTime() + 60 * 60 * 1000).toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    location: 'Zoom / Heartlight Space',
    status: 'confirmed',
    proposedByCes: ATLAS_CES,
    proposedByName: ATLAS_NAME,
    confirmedByCes: [ATLAS_CES, LIORA_CES],
    notes: 'Bring your favorite art supplies and an open heart.',
  };
}

function agreement(): ExchangeAgreement {
  return {
    id: 'agreement_art_healing_001',
    offeringId: 'offering_art_healing_001',
    vendorId: 'vendor_atlas_art',
    wishId: 'wish_art_healing_001',
    requesterCes: LIORA_CES,
    requesterName: LIORA_NAME,
    providerCes: ATLAS_CES,
    providerName: ATLAS_NAME,
    message: exchangeRequest().message,
    requesterRole: 'Recipient',
    providerRole: 'Facilitator',
    parties: parties(),
    mainQuest: mainQuestDirective(),
    mainQuestDirective: mainQuestDirective(),
    mainQuests: mainQuests(),
    sideQuests: sideQuests(),
    communicationPrefs: 'Session via Zoom; follow-up gratitude exchange via Heartlight messages.',
    proposedPriceCents: 2500,
    agreedPriceCents: 2500,
    paymentMethod: 'venmo',
    scheduledMeetings: [scheduledMeeting()],
    status: 'active',
    requesterConsented: true,
    providerConsented: true,
    collectiveFundingRequested: false,
    versions: [
      {
        version: 1,
        updatedAt: now,
        updatedByCes: ATLAS_CES,
        updatedByName: ATLAS_NAME,
        changeSummary: 'Initial agreement created from Art Healing Session offering.',
        approvedBy: [ATLAS_CES, LIORA_CES],
        parties: parties(),
        mainQuestDirective: mainQuestDirective(),
        mainQuests: mainQuests(),
        sideQuests: sideQuests(),
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

function journey(): ExchangeJourney {
  return {
    id: 'journey_art_healing_001',
    agreementId: 'agreement_art_healing_001',
    title: 'Art Healing Session',
    description: agreement().message,
    wishingCes: LIORA_CES,
    wishingName: LIORA_NAME,
    coCreatorCes: ATLAS_CES,
    coCreatorName: ATLAS_NAME,
    status: 'active',
    currentPhase: 'quests',
    selectedCodes: [1, 7, 12],
    logs: [],
    mainQuest: mainQuestDirective(),
    sideQuests: [...mainQuests(), ...sideQuests()],
    scheduledMeetings: [scheduledMeeting()],
    fulfillmentNotes: '',
    fulfillmentSignedAt: null,
    fulfillmentSignedBy: [],
    adaptationConsent: true,
    createdAt: now,
    updatedAt: now,
  };
}

function calendar(): ExchangeCalendar {
  return {
    ces: ATLAS_CES,
    availabilityBlocks: [
      {
        id: 'block_atlas_wed',
        dayOfWeek: 3,
        allDay: true,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        type: 'available',
        recurring: true,
        title: 'Open for exchanges',
      },
      {
        id: 'block_atlas_tomorrow',
        date: new Date(tomorrow).toISOString().split('T')[0],
        allDay: true,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        type: 'available',
        recurring: false,
        title: 'Art Healing Session day',
      },
    ],
    scheduledMeetings: [scheduledMeeting()],
    updatedAt: now,
  };
}

function lioraCalendar(): ExchangeCalendar {
  return {
    ces: LIORA_CES,
    availabilityBlocks: [],
    scheduledMeetings: [scheduledMeeting()],
    updatedAt: now,
  };
}

function exchangeAlert(): ExchangeAlert {
  return {
    id: 'alert_demo_001',
    exchangeId: 'agreement_art_healing_001',
    exchangeTitle: 'Art Healing Session',
    type: 'privacy_update',
    fromCes: LIORA_CES,
    fromName: LIORA_NAME,
    toCes: ATLAS_CES,
    message: 'Liora updated their Privacy Assurance for the Art Healing Session exchange.',
    status: 'reviewed',
    createdAt: now,
    reviewedBy: ATLAS_CES,
    reviewedAt: now,
  };
}

export function seedDevData(state: StorageState): StorageState {
  if (!import.meta.env.DEV) return state;
  if (state.exchangeAgreements.length > 0 || state.approved.some((p) => p.cesNumber === ATLAS_CES)) {
    return state;
  }

  const next: StorageState = { ...state };

  // Profiles
  next.approved = [...next.approved, atlasProfile(), lioraProfile()];

  // Vendor + offering
  next.vendors = [...next.vendors, vendor()];

  // Wish visible in Heartlight Exchange
  const w = wish();
  next.exchangeRequests = [...next.exchangeRequests, exchangeRequest()];

  // Agreement + journey
  next.exchangeAgreements = [agreement()];

  // Calendars
  next.exchangeAgreements[0].scheduledMeetings = [scheduledMeeting()];

  // Note: calendars and journeys are not in StorageState directly;
  // they are stored under separate keys. We will seed them via localStorage below.
  if (typeof window !== 'undefined') {
    const calendarsKey = 'hlc_exchangeCalendars';
    const existingCals = JSON.parse(localStorage.getItem(calendarsKey) || '[]') as ExchangeCalendar[];
    const mergedCals = [
      ...existingCals.filter((c) => c.ces !== ATLAS_CES && c.ces !== LIORA_CES),
      calendar(),
      lioraCalendar(),
    ];
    localStorage.setItem(calendarsKey, JSON.stringify(mergedCals));

    const journeysKey = 'hlc_journeys';
    const existingJourneys = JSON.parse(localStorage.getItem(journeysKey) || '[]') as ExchangeJourney[];
    const mergedJourneys = [...existingJourneys.filter((j) => j.id !== 'journey_art_healing_001'), journey()];
    localStorage.setItem(journeysKey, JSON.stringify(mergedJourneys));
  }

  next.exchangeAlerts = [exchangeAlert()];

  console.log('[seedDevData] Seeded mock Art Healing Session exchange for', ATLAS_CES);
  return next;
}
