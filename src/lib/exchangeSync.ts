// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Supabase Sync Layer for Exchange Entities
//  Open collective transparency by default; privacy assured by sovereign beings.
//  Dual-mode: localStorage is the cache; Supabase is the shared collective memory.
// ─────────────────────────────────────────────────────────────

import { supabase, isSupabaseConfigured } from './supabase';
import type {
  ExchangeAgreement,
  ExchangeRequest,
  ExchangeCalendar,
  VendorRecord,
  VendorInvite,
  VendorJoinRequest,
  CollectivePetition,
  ExchangeAlert,
  AgreementRecord,
  Wish,
  OfferingItem,
  ExchangeJourney,
} from '../types/ces';

export type ExchangeEntityKey =
  | 'exchangeAgreements'
  | 'exchangeRequests'
  | 'vendors'
  | 'vendorInvites'
  | 'vendorJoinRequests'
  | 'collectivePetitions'
  | 'exchangeAlerts'
  | 'agreements'
  | 'exchangeCalendars'
  | 'wishes'
  | 'exchangeJourneys';

/* ═══════════════════════════════════════════════════════════════
   Row mappers: app entity ↔ Supabase row
   ═══════════════════════════════════════════════════════════════ */

export function exchangeAgreementToRow(ag: ExchangeAgreement): Record<string, unknown> {
  return {
    id: ag.id,
    offering_id: ag.offeringId || null,
    vendor_id: ag.vendorId || null,
    wish_id: ag.wishId || null,
    requester_ces: ag.requesterCes,
    requester_name: ag.requesterName,
    provider_ces: ag.providerCes,
    provider_name: ag.providerName,
    message: ag.message,
    requester_role: ag.requesterRole,
    provider_role: ag.providerRole,
    parties: ag.parties || [],
    main_quest: ag.mainQuest,
    main_quest_directive: ag.mainQuestDirective || null,
    main_quests: ag.mainQuests || null,
    side_quests: ag.sideQuests,
    proposed_price_cents: ag.proposedPriceCents ?? null,
    agreed_price_cents: ag.agreedPriceCents ?? null,
    payment_method: ag.paymentMethod || null,
    communication_prefs: ag.communicationPrefs || '',
    dedication_of_profits: ag.dedicationOfProfits || null,
    // Wave 8.2
    hybrid_payment: ag.hybridPayment || null,
    confirmed_meeting_slot: ag.confirmedMeetingSlot || null,
    scheduled_meetings: ag.scheduledMeetings || [],
    status: ag.status,
    requester_consented: ag.requesterConsented,
    provider_consented: ag.providerConsented,
    collective_funding_requested: ag.collectiveFundingRequested,
    collective_funding_approved: ag.collectiveFundingApproved ?? null,
    safety_reports: ag.safetyReports || null,
    versions: ag.versions || [],
    pending_update: ag.pendingUpdate || null,
    created_at: ag.createdAt,
    updated_at: ag.updatedAt,
  };
}

export function rowToExchangeAgreement(row: any): ExchangeAgreement {
  return {
    id: String(row.id),
    offeringId: row.offering_id || undefined,
    vendorId: row.vendor_id || undefined,
    wishId: row.wish_id || undefined,
    requesterCes: String(row.requester_ces),
    requesterName: String(row.requester_name),
    providerCes: String(row.provider_ces),
    providerName: String(row.provider_name),
    message: String(row.message || ''),
    requesterRole: String(row.requester_role) as ExchangeAgreement['requesterRole'],
    providerRole: String(row.provider_role) as ExchangeAgreement['providerRole'],
    parties: Array.isArray(row.parties) ? row.parties : undefined,
    mainQuest: row.main_quest,
    mainQuestDirective: row.main_quest_directive || undefined,
    mainQuests: row.main_quests || undefined,
    sideQuests: Array.isArray(row.side_quests) ? row.side_quests : [],
    proposedPriceCents: row.proposed_price_cents ?? undefined,
    agreedPriceCents: row.agreed_price_cents ?? undefined,
    paymentMethod: row.payment_method || undefined,
    communicationPrefs: row.communication_prefs || undefined,
    dedicationOfProfits: row.dedication_of_profits || undefined,
    // Wave 8.2
    hybridPayment: row.hybrid_payment || undefined,
    confirmedMeetingSlot: row.confirmed_meeting_slot || undefined,
    scheduledMeetings: Array.isArray(row.scheduled_meetings) ? row.scheduled_meetings : [],
    status: String(row.status) as ExchangeAgreement['status'],
    requesterConsented: Boolean(row.requester_consented),
    providerConsented: Boolean(row.provider_consented),
    collectiveFundingRequested: Boolean(row.collective_funding_requested),
    collectiveFundingApproved: row.collective_funding_approved ?? undefined,
    safetyReports: row.safety_reports || undefined,
    versions: Array.isArray(row.versions) ? row.versions : [],
    pendingUpdate: row.pending_update || undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function exchangeCalendarToRow(cal: ExchangeCalendar): Record<string, unknown> {
  return {
    ces: cal.ces,
    availability_blocks: cal.availabilityBlocks || [],
    scheduled_meetings: cal.scheduledMeetings || [],
    updated_at: cal.updatedAt,
    created_at: new Date().toISOString(),
  };
}

export function rowToExchangeCalendar(row: any): ExchangeCalendar {
  return {
    ces: String(row.ces),
    availabilityBlocks: Array.isArray(row.availability_blocks) ? row.availability_blocks : [],
    scheduledMeetings: Array.isArray(row.scheduled_meetings) ? row.scheduled_meetings : [],
    updatedAt: String(row.updated_at),
  };
}

export function vendorToRow(v: VendorRecord): Record<string, unknown> {
  return {
    id: v.id,
    name: v.name,
    slug: v.slug,
    description: v.description,
    core_directive: v.coreDirective || null,
    logo_url: v.logoUrl || null,
    owner_ces: v.ownerCes,
    owner_name: v.ownerName,
    members: v.members || [],
    payment_methods: v.paymentMethods || [],
    exchange_policy: v.exchangePolicy || [],
    location_data: v.locationData || null,
    tags: v.tags || [],
    links: v.links || null,
    status: v.status,
    collective_funded: v.collectiveFunded,
    created_at: v.createdAt,
    updated_at: v.updatedAt,
  };
}

export function rowToVendor(row: any): VendorRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: String(row.description || ''),
    coreDirective: row.core_directive || undefined,
    logoUrl: row.logo_url || undefined,
    ownerCes: String(row.owner_ces),
    ownerName: String(row.owner_name),
    members: Array.isArray(row.members) ? row.members : [],
    offerings: [], // merged from offerings table during hydration
    paymentMethods: Array.isArray(row.payment_methods) ? row.payment_methods : [],
    exchangePolicy: Array.isArray(row.exchange_policy) ? row.exchange_policy : undefined,
    locationData: row.location_data || undefined,
    tags: Array.isArray(row.tags) ? row.tags : undefined,
    links: Array.isArray(row.links) ? row.links : undefined,
    status: String(row.status) as VendorRecord['status'],
    collectiveFunded: Boolean(row.collective_funded),
    joinRequests: [], // merged from vendor_join_requests during hydration
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function offeringToRow(o: OfferingItem): Record<string, unknown> {
  return {
    id: o.id,
    vendor_id: o.vendorId,
    title: o.title,
    description: o.description,
    category: o.category,
    price_type: o.priceType,
    price_cents: o.priceCents ?? null,
    currency: o.currency,
    image_url: o.imageUrl || null,
    availability: o.availability,
    consent_required: o.consentRequired,
    max_participants: o.maxParticipants ?? null,
    stripe_price_id: o.stripePriceId || null,
    exchange_policy: o.exchangePolicy || [],
    tags: o.tags || [],
    // Wave 8.2
    offering_type: o.offeringType || null,
    virtual_session: o.virtualSession || null,
    work_study_exchange: o.workStudyExchange || null,
    location: o.location || null,
    requires_scheduling: o.requiresScheduling ?? false,
    fulfillers: o.fulfillers || null,
    gallery: o.gallery || null,
    created_at: o.createdAt,
    updated_at: o.updatedAt,
  };
}

export function rowToOffering(row: any): OfferingItem {
  return {
    id: String(row.id),
    vendorId: String(row.vendor_id),
    title: String(row.title),
    description: String(row.description || ''),
    category: String(row.category || 'Other') as OfferingItem['category'],
    priceType: String(row.price_type || 'gift') as OfferingItem['priceType'],
    priceCents: row.price_cents ?? undefined,
    currency: String(row.currency || 'USD') as OfferingItem['currency'],
    imageUrl: row.image_url || undefined,
    availability: String(row.availability || 'available') as OfferingItem['availability'],
    consentRequired: Boolean(row.consent_required),
    maxParticipants: row.max_participants ?? undefined,
    stripePriceId: row.stripe_price_id || undefined,
    exchangePolicy: Array.isArray(row.exchange_policy) ? row.exchange_policy : undefined,
    tags: Array.isArray(row.tags) ? row.tags : undefined,
    // Wave 8.2
    offeringType: row.offering_type || undefined,
    virtualSession: row.virtual_session || undefined,
    workStudyExchange: row.work_study_exchange || undefined,
    location: row.location || undefined,
    requiresScheduling: Boolean(row.requires_scheduling),
    fulfillers: row.fulfillers || undefined,
    gallery: Array.isArray(row.gallery) ? row.gallery : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function exchangeAlertToRow(a: ExchangeAlert): Record<string, unknown> {
  return {
    id: a.id,
    exchange_id: a.exchangeId,
    exchange_title: a.exchangeTitle,
    type: a.type,
    from_ces: a.fromCes,
    from_name: a.fromName,
    to_ces: a.toCes || null,
    message: a.message,
    status: a.status,
    created_at: a.createdAt,
    reviewed_by: a.reviewedBy || null,
    reviewed_at: a.reviewedAt || null,
    metadata: a.metadata || null,
  };
}

export function rowToExchangeAlert(row: any): ExchangeAlert {
  return {
    id: String(row.id),
    exchangeId: String(row.exchange_id),
    exchangeTitle: String(row.exchange_title),
    type: String(row.type) as ExchangeAlert['type'],
    fromCes: String(row.from_ces),
    fromName: String(row.from_name),
    toCes: row.to_ces || undefined,
    message: String(row.message),
    status: String(row.status) as ExchangeAlert['status'],
    createdAt: String(row.created_at),
    reviewedBy: row.reviewed_by || undefined,
    reviewedAt: row.reviewed_at || undefined,
    metadata: row.metadata || undefined,
  };
}

export function vendorInviteToRow(i: VendorInvite): Record<string, unknown> {
  return {
    id: i.id,
    vendor_id: i.vendorId,
    vendor_name: i.vendorName,
    invited_by_ces: i.invitedByCes,
    invited_by_name: i.invitedByName,
    invitee_ces: i.inviteeCes,
    invitee_name: i.inviteeName,
    role: i.role,
    message: i.message || null,
    status: i.status,
    created_at: i.createdAt,
    responded_at: i.respondedAt || null,
  };
}

export function rowToVendorInvite(row: any): VendorInvite {
  return {
    id: String(row.id),
    vendorId: String(row.vendor_id),
    vendorName: String(row.vendor_name),
    invitedByCes: String(row.invited_by_ces),
    invitedByName: String(row.invited_by_name),
    inviteeCes: String(row.invitee_ces),
    inviteeName: String(row.invitee_name),
    role: String(row.role) as VendorInvite['role'],
    message: row.message || undefined,
    status: String(row.status) as VendorInvite['status'],
    createdAt: String(row.created_at),
    respondedAt: row.responded_at || undefined,
  };
}

export function vendorJoinRequestToRow(r: VendorJoinRequest): Record<string, unknown> {
  return {
    id: r.id,
    vendor_id: r.vendorId,
    requester_ces: r.requesterCes,
    requester_name: r.requesterName,
    message: r.message || null,
    status: r.status,
    requested_at: r.requestedAt,
    responded_at: r.respondedAt || null,
    responded_by_ces: r.respondedByCes || null,
  };
}

export function rowToVendorJoinRequest(row: any): VendorJoinRequest {
  return {
    id: String(row.id),
    vendorId: String(row.vendor_id),
    requesterCes: String(row.requester_ces),
    requesterName: String(row.requester_name),
    message: row.message || undefined,
    status: String(row.status) as VendorJoinRequest['status'],
    requestedAt: String(row.requested_at),
    respondedAt: row.responded_at || undefined,
    respondedByCes: row.responded_by_ces || undefined,
  };
}

export function collectivePetitionToRow(p: CollectivePetition): Record<string, unknown> {
  return {
    id: p.id,
    exchange_request_id: p.exchangeRequestId,
    requester_ces: p.requesterCes,
    requester_name: p.requesterName,
    provider_ces: p.providerCes,
    provider_name: p.providerName,
    offering_title: p.offeringTitle,
    amount_cents: p.amountCents,
    message: p.message,
    status: p.status,
    steward_notes: p.stewardNotes || null,
    reviewed_by_ces: p.reviewedByCes || null,
    reviewed_by_name: p.reviewedByName || null,
    created_at: p.createdAt,
    reviewed_at: p.reviewedAt || null,
    funded_at: p.fundedAt || null,
  };
}

export function rowToCollectivePetition(row: any): CollectivePetition {
  return {
    id: String(row.id),
    exchangeRequestId: String(row.exchange_request_id),
    requesterCes: String(row.requester_ces),
    requesterName: String(row.requester_name),
    providerCes: String(row.provider_ces),
    providerName: String(row.provider_name),
    offeringTitle: String(row.offering_title),
    amountCents: Number(row.amount_cents),
    message: String(row.message),
    status: String(row.status) as CollectivePetition['status'],
    stewardNotes: row.steward_notes || undefined,
    reviewedByCes: row.reviewed_by_ces || undefined,
    reviewedByName: row.reviewed_by_name || undefined,
    createdAt: String(row.created_at),
    reviewedAt: row.reviewed_at || undefined,
    fundedAt: row.funded_at || undefined,
  };
}

export function exchangeRequestToRow(r: ExchangeRequest): Record<string, unknown> {
  return {
    id: r.id,
    offering_id: r.offeringId,
    vendor_id: r.vendorId,
    requester_ces: r.requesterCes,
    requester_name: r.requesterName,
    provider_ces: r.providerCes,
    provider_name: r.providerName,
    message: r.message,
    price_type: r.priceType,
    payment_method: r.paymentMethod || null,
    // Wave 8.2
    hybrid_payment: r.hybridPayment || null,
    proposed_meeting_slot: r.proposedMeetingSlot || null,
    status: r.status,
    collective_petition_id: r.collectivePetitionId || null,
    consent_acknowledged: r.consentAcknowledged,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  };
}

export function rowToExchangeRequest(row: any): ExchangeRequest {
  return {
    id: String(row.id),
    offeringId: String(row.offering_id),
    vendorId: String(row.vendor_id),
    requesterCes: String(row.requester_ces),
    requesterName: String(row.requester_name),
    providerCes: String(row.provider_ces),
    providerName: String(row.provider_name),
    message: String(row.message),
    priceType: String(row.price_type) as ExchangeRequest['priceType'],
    paymentMethod: row.payment_method || undefined,
    // Wave 8.2
    hybridPayment: row.hybrid_payment || undefined,
    proposedMeetingSlot: row.proposed_meeting_slot || undefined,
    status: String(row.status) as ExchangeRequest['status'],
    collectivePetitionId: row.collective_petition_id || undefined,
    consentAcknowledged: Boolean(row.consent_acknowledged),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function exchangeJourneyToRow(j: ExchangeJourney): Record<string, unknown> {
  return {
    id: j.id,
    agreement_id: j.agreementId,
    requester_ces: j.wishingCes,
    provider_ces: j.coCreatorCes,
    party_ces: [j.wishingCes, j.coCreatorCes].filter(Boolean),
    status: j.status,
    main_quest: j.mainQuest,
    side_quests: j.sideQuests,
    logs: j.logs,
    created_at: j.createdAt,
    updated_at: j.updatedAt,
  };
}

export function rowToExchangeJourney(row: any): ExchangeJourney {
  const agreementId = String(row.agreement_id);
  const requesterCes = String(row.requester_ces);
  const providerCes = String(row.provider_ces);
  return {
    id: String(row.id),
    agreementId,
    title: '', // derived from linked agreement in UI layer
    description: '', // derived from linked agreement in UI layer
    wishingCes: requesterCes,
    wishingName: '', // derived from linked agreement in UI layer
    coCreatorCes: providerCes,
    coCreatorName: '', // derived from linked agreement in UI layer
    status: String(row.status) as ExchangeJourney['status'],
    currentPhase: 'quests',
    selectedCodes: [],
    logs: Array.isArray(row.logs) ? row.logs : [],
    mainQuest: row.main_quest || { id: 'main', title: '', status: 'open' },
    sideQuests: Array.isArray(row.side_quests) ? row.side_quests : [],
    scheduledMeetings: [], // derived from linked agreement in UI layer
    fulfillmentNotes: '',
    fulfillmentSignedAt: null,
    fulfillmentSignedBy: [],
    adaptationConsent: false,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function wishToRow(w: Wish): Record<string, unknown> {
  const anyWish = w as any;
  return {
    id: w.id,
    type: anyWish.type || 'wish',
    title: w.title,
    description: w.description,
    author_ces: anyWish.postedByCes || anyWish.authorCes || anyWish.wishingCes || 'unknown',
    author_name: anyWish.postedByName || anyWish.authorName || anyWish.wishingName || 'Atlas Island Being',
    scope: anyWish.scope || 'universal',
    category: w.category || null,
    tags: anyWish.skills?.length ? anyWish.skills : [],
    resources: anyWish.resources || [],
    roles: anyWish.roles || [],
    location: anyWish.location || null,
    location_data: anyWish.locationData || null,
    lat: anyWish.locationData?.lat ?? null,
    lng: anyWish.locationData?.lon ?? null,
    price_cents: anyWish.fundsRequired || null,
    price_type: anyWish.priceType || null,
    payment_method: anyWish.paymentMethod || null,
    images: anyWish.images || [],
    status: w.status || 'open',
    urgency: anyWish.urgency || 'low',
    time_commitment: anyWish.timeCommitment || null,
    is_continual_offering: anyWish.isContinualOffering || false,
    claimed_by_ces: w.claimedByCes || null,
    claimed_by_name: w.claimedByName || null,
    collective_funding_requested: Array.isArray(anyWish.exchangePolicy)
      ? anyWish.exchangePolicy.includes('collective_funded')
      : anyWish.exchangeAvenue === 'collective' || anyWish.collectiveFundingRequested || false,
    exchange_policy: Array.isArray(anyWish.exchangePolicy)
      ? anyWish.exchangePolicy
      : anyWish.exchangeAvenue
        ? [anyWish.exchangeAvenue]
        : [],
    created_at: w.createdAt,
    updated_at: w.updatedAt,
  };
}

export function rowToWish(row: any): Wish {
  return {
    id: String(row.id),
    wishingCes: String(row.author_ces || 'unknown'),
    wishingName: String(row.author_name || 'Atlas Island Being'),
    title: String(row.title),
    description: String(row.description || ''),
    category: row.category ? String(row.category) : ('' as Wish['category']),
    urgency: String(row.urgency || 'low') as Wish['urgency'],
    status: String(row.status || 'open') as Wish['status'],
    selectedCodes: row.selected_codes || [],
    claimedByCes: row.claimed_by_ces || undefined,
    claimedByName: row.claimed_by_name || undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    // Extended fields used by PostWish / Exchange pages
    type: String(row.type || 'wish'),
    postedByCes: String(row.author_ces || 'unknown'),
    postedByName: String(row.author_name || 'Atlas Island Being'),
    scope: String(row.scope || 'universal'),
    skills: row.tags || [],
    resources: row.resources || [],
    roles: row.roles || [],
    images: row.images || [],
    location: row.location || '',
    locationData: row.location_data
      ? row.location_data
      : row.lat && row.lng
        ? { raw: row.location || '', lat: row.lat, lon: row.lng, city: null, region: null, country: null, continent: null }
        : null,
    exchangeAvenue: Array.isArray(row.exchange_policy) ? row.exchange_policy[0] : 'gift',
    exchangePolicy: Array.isArray(row.exchange_policy)
      ? row.exchange_policy
      : row.collective_funding_requested
        ? ['collective_funded']
        : [],
    fundsRequired: row.price_cents || undefined,
    fundsAvailable: row.funds_available || undefined,
    timeCommitment: row.time_commitment || '',
    isContinualOffering: row.type === 'offer' && row.is_continual_offering,
  } as unknown as Wish;
}

/* ═══════════════════════════════════════════════════════════════
   Sync operations
   ═══════════════════════════════════════════════════════════════ */

export interface SyncResult<T> {
  success: boolean;
  error?: string;
  data?: T;
}

function log(op: string, msg: string) {
  console.log(`[ExchangeSync] ${op}: ${msg}`);
}

async function upsert(table: string, row: Record<string, unknown>, onConflict = 'id'): Promise<SyncResult<null>> {
  if (!isSupabaseConfigured()) return { success: true };
  try {
    const { error } = await supabase.from(table).upsert(row, { onConflict });
    if (error) {
      log('upsert', `${table} failed: ${error.message}`);
      return { success: false, error: error.message };
    }
    log('upsert', `${table} succeeded for ${row.id || row.ces || JSON.stringify(Object.keys(row))}`);
    return { success: true };
  } catch (err: any) {
    log('upsert', `${table} exception: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function removeById(table: string, id: string): Promise<SyncResult<null>> {
  if (!isSupabaseConfigured()) return { success: true };
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      log('delete', `${table} failed: ${error.message}`);
      return { success: false, error: error.message };
    }
    log('delete', `${table} removed ${id}`);
    return { success: true };
  } catch (err: any) {
    log('delete', `${table} exception: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function fetchAll<T>(table: string, mapper: (row: any) => T): Promise<T[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      log('fetch', `${table} failed: ${error.message}`);
      return [];
    }
    return (data || []).map(mapper);
  } catch (err: any) {
    log('fetch', `${table} exception: ${err.message}`);
    return [];
  }
}

export async function syncExchangeAgreement(ag: ExchangeAgreement) {
  return upsert('exchange_agreements', exchangeAgreementToRow(ag));
}

export async function deleteExchangeAgreement(id: string) {
  return removeById('exchange_agreements', id);
}

export async function syncExchangeCalendar(cal: ExchangeCalendar) {
  return upsert('exchange_calendars', exchangeCalendarToRow(cal), 'ces');
}

export async function syncVendor(v: VendorRecord) {
  return upsert('vendors', vendorToRow(v));
}

export async function syncOfferingsForVendor(v: VendorRecord) {
  const results = await Promise.all((v.offerings || []).map((o) => upsert('offerings', offeringToRow(o))));
  const failed = results.filter((r) => !r.success);
  if (failed.length > 0) {
    log('syncOfferings', `${failed.length} offering sync(s) failed for vendor ${v.id}`);
  }
  return results;
}

export async function syncOffering(o: OfferingItem) {
  return upsert('offerings', offeringToRow(o));
}

export async function deleteOffering(id: string) {
  return removeById('offerings', id);
}

export async function deleteVendor(id: string) {
  return removeById('vendors', id);
}

export async function syncExchangeAlert(a: ExchangeAlert) {
  return upsert('exchange_alerts', exchangeAlertToRow(a));
}

export async function syncVendorInvite(i: VendorInvite) {
  return upsert('vendor_invites', vendorInviteToRow(i));
}

export async function syncVendorJoinRequest(r: VendorJoinRequest) {
  return upsert('vendor_join_requests', vendorJoinRequestToRow(r));
}

export async function syncCollectivePetition(p: CollectivePetition) {
  return upsert('collective_petitions', collectivePetitionToRow(p));
}

export async function syncExchangeRequest(r: ExchangeRequest) {
  return upsert('exchange_requests', exchangeRequestToRow(r));
}

export async function syncWish(w: Wish | Record<string, unknown>) {
  return upsert('wishes', wishToRow(w as Wish));
}

export async function deleteWish(id: string) {
  return removeById('wishes', id);
}

export async function syncExchangeJourney(j: ExchangeJourney) {
  return upsert('exchange_journeys', exchangeJourneyToRow(j));
}

export async function deleteExchangeJourney(id: string) {
  return removeById('exchange_journeys', id);
}

/* ═══════════════════════════════════════════════════════════════
   Hydration: pull collective memory from Supabase into localStorage shape
   ═══════════════════════════════════════════════════════════════ */

export interface HydratedExchangeState {
  exchangeAgreements: ExchangeAgreement[];
  exchangeRequests: ExchangeRequest[];
  vendors: VendorRecord[];
  vendorInvites: VendorInvite[];
  vendorJoinRequests: VendorJoinRequest[];
  collectivePetitions: CollectivePetition[];
  exchangeAlerts: ExchangeAlert[];
  exchangeCalendars: ExchangeCalendar[];
  wishes: Wish[];
  exchangeJourneys: ExchangeJourney[];
}

export async function hydrateExchangeState(requireSession = false): Promise<Partial<HydratedExchangeState>> {
  if (!isSupabaseConfigured()) {
    log('hydrate', 'Supabase not configured; using localStorage only');
    return {};
  }
  if (requireSession) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      log('hydrate', 'No active session; skipping Supabase hydration');
      return {};
    }
  }
  log('hydrate', `Pulling collective exchange memory from Supabase...`);
  const [
    exchangeAgreements,
    exchangeRequests,
    vendors,
    offerings,
    vendorInvites,
    vendorJoinRequests,
    collectivePetitions,
    exchangeAlerts,
    exchangeCalendars,
    wishes,
    exchangeJourneys,
  ] = await Promise.all([
    fetchAll('exchange_agreements', rowToExchangeAgreement),
    fetchAll('exchange_requests', rowToExchangeRequest),
    fetchAll('vendors', rowToVendor),
    fetchAll('offerings', rowToOffering),
    fetchAll('vendor_invites', rowToVendorInvite),
    fetchAll('vendor_join_requests', rowToVendorJoinRequest),
    fetchAll('collective_petitions', rowToCollectivePetition),
    fetchAll('exchange_alerts', rowToExchangeAlert),
    fetchAll('exchange_calendars', rowToExchangeCalendar),
    fetchAll('wishes', rowToWish),
    fetchAll('exchange_journeys', rowToExchangeJourney),
  ]);

  // Merge offerings into their parent vendors
  const vendorMap = new Map(vendors.map((v) => [v.id, v]));
  for (const o of offerings) {
    const v = vendorMap.get(o.vendorId);
    if (v) v.offerings.push(o);
  }

  // Merge join requests into vendors
  for (const r of vendorJoinRequests) {
    const v = vendorMap.get(r.vendorId);
    if (v) v.joinRequests.push(r);
  }

  log('hydrate', `Loaded: ${exchangeAgreements.length} agreements, ${vendors.length} vendors (${offerings.length} offerings), ${exchangeCalendars.length} calendars, ${wishes.length} wishes, ${exchangeJourneys.length} journeys`);
  return {
    exchangeAgreements,
    exchangeRequests,
    vendors,
    vendorInvites,
    vendorJoinRequests,
    collectivePetitions,
    exchangeAlerts,
    exchangeCalendars,
    wishes,
    exchangeJourneys,
  };
}
