// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Upstash Redis Client (Server-Side Only)
//  Redis tokens NEVER touch the browser — all access via /api/* routes
//  Co-created with Atlas Morphoenix
// ─────────────────────────────────────────────────────────────

import { Redis } from '@upstash/redis'

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || ''
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || ''

if (!redisUrl || !redisToken) {
  console.warn('[Redis] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing.')
}

export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
})

export function isRedisConfigured(): boolean {
  return Boolean(redisUrl && redisToken)
}

// ── Key namespace helpers ──
export const Keys = {
  // Profiles
  profile: (ces: string) => `hlc:profile:${ces}`,
  profilesAll: 'hlc:profiles:all',
  profilesByStewardship: (status: string) => `hlc:profiles:stewardship:${status}`,

  // Vendors
  vendor: (id: string) => `hlc:vendor:${id}`,
  vendorsAll: 'hlc:vendors:all',
  vendorsByOwner: (ces: string) => `hlc:vendors:owner:${ces}`,

  // Offerings
  offering: (id: string) => `hlc:offering:${id}`,
  offeringsAll: 'hlc:offerings:all',
  offeringsByVendor: (vendorId: string) => `hlc:offerings:vendor:${vendorId}`,

  // Wishes
  wish: (id: string) => `hlc:wish:${id}`,
  wishesAll: 'hlc:wishes:all',
  wishesByAuthor: (ces: string) => `hlc:wishes:author:${ces}`,

  // Exchange Requests
  exchangeRequest: (id: string) => `hlc:exch_req:${id}`,
  exchangeRequestsAll: 'hlc:exch_reqs:all',
  exchangeRequestsByRequester: (ces: string) => `hlc:exch_reqs:requester:${ces}`,
  exchangeRequestsByProvider: (ces: string) => `hlc:exch_reqs:provider:${ces}`,

  // Exchange Agreements
  exchangeAgreement: (id: string) => `hlc:exch_agr:${id}`,
  exchangeAgreementsAll: 'hlc:exch_agrs:all',
  exchangeAgreementsByCes: (ces: string) => `hlc:exch_agrs:ces:${ces}`,

  // Exchange Journeys
  exchangeJourney: (id: string) => `hlc:exch_jrn:${id}`,
  exchangeJourneysAll: 'hlc:exch_jrns:all',
  exchangeJourneysByCes: (ces: string) => `hlc:exch_jrns:ces:${ces}`,

  // Exchange Calendars (one per being, keyed by CES)
  exchangeCalendar: (ces: string) => `hlc:exch_cal:${ces}`,
  exchangeCalendarsAll: 'hlc:exch_cals:all',

  // Vendor Invites
  vendorInvite: (id: string) => `hlc:vend_inv:${id}`,
  vendorInvitesAll: 'hlc:vend_invs:all',
  vendorInvitesByVendor: (vendorId: string) => `hlc:vend_invs:vendor:${vendorId}`,

  // Vendor Join Requests
  vendorJoinRequest: (id: string) => `hlc:vend_jr:${id}`,
  vendorJoinRequestsAll: 'hlc:vend_jrs:all',
  vendorJoinRequestsByVendor: (vendorId: string) => `hlc:vend_jrs:vendor:${vendorId}`,

  // Collective Petitions
  collectivePetition: (id: string) => `hlc:col_pet:${id}`,
  collectivePetitionsAll: `hlc:col_pets:all`,

  // Exchange Alerts
  exchangeAlert: (id: string) => `hlc:exch_alt:${id}`,
  exchangeAlertsAll: 'hlc:exch_alts:all',
  exchangeAlertsByTo: (ces: string) => `hlc:exch_alts:to:${ces}`,

  // Code Logs
  codeLog: (id: string) => `hlc:code_log:${id}`,
  codeLogsAll: 'hlc:code_logs:all',
  codeLogsByExchange: (exchangeId: string) => `hlc:code_logs:exchange:${exchangeId}`,

  // Legacy Agreements
  agreement: (id: string) => `hlc:agr:${id}`,
  agreementsAll: 'hlc:agrs:all',
  agreementsByCes: (ces: string) => `hlc:agrs:ces:${ces}`,
} as const