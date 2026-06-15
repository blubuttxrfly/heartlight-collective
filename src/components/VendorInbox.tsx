import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox,
  X,
  Users,
  Store,
  Mail,
  ScrollText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
  HandCoins,
  ChevronRight,
  Repeat,
} from 'lucide-react';
import { useStorage } from '../lib/storage';
import { useSession } from '../lib/session';
import type { VendorRecord, ExchangeRequest, VendorJoinRequest, VendorInvite, CollectivePetition, ExchangeAlert } from '../types/ces';
import { ExchangePolicyBadges } from './ExchangePolicyBadges';

/* ═══════════════════════════════════════════════════════════════
   VendorInbox
   Unified notifications + action center for a being across all
   Vendor Shops they belong to. Rendered inside /exchange and /flow.
   ═══════════════════════════════════════════════════════════════ */

type InboxTab = 'all' | 'requests' | 'members' | 'petitions' | 'alerts';

interface InboxItem {
  id: string;
  type: 'exchange_request' | 'join_request' | 'invite' | 'petition' | 'alert';
  title: string;
  subtitle: string;
  meta: string;
  vendorId?: string;
  entityId: string;
  raw: ExchangeRequest | VendorJoinRequest | VendorInvite | CollectivePetition | ExchangeAlert;
  actionLabel?: string;
  onAction?: () => void;
  onDecline?: () => void;
}

export function VendorInbox({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void }) {
  const [activeTab, setActiveTab] = useState<InboxTab>('all');
  const { user } = useSession();
  const {
    state,
    getVendors,
    updateExchangeRequest,
    updateVendorJoinRequest,
    updateVendorInvite,
    updateExchangeAlert,
  } = useStorage();

  const myCes = user?.ces;

  // Vendors this being owns or is an active member of
  const myVendors = useMemo(() => {
    if (!myCes) return [];
    return getVendors().filter((v) =>
      v.ownerCes === myCes ||
      v.members.some((m) => m.ces === myCes && m.status === 'active')
    );
  }, [getVendors, myCes]);

  const myVendorIds = useMemo(() => new Set(myVendors.map((v) => v.id)), [myVendors]);
  const myRequestIds = useMemo(() => new Set(state.exchangeRequests.filter((r) => myVendorIds.has(r.vendorId)).map((r) => r.id)), [state.exchangeRequests, myVendorIds]);

  const items = useMemo(() => {
    const list: InboxItem[] = [];

    // 1. Exchange requests targeting any of my vendors
    for (const req of state.exchangeRequests) {
      if (!myVendorIds.has(req.vendorId)) continue;
      const vendor = myVendors.find((v) => v.id === req.vendorId);
      const offering = vendor?.offerings.find((o) => o.id === req.offeringId);
      list.push({
        id: `req-${req.id}`,
        type: 'exchange_request',
        title: `Exchange request for ${offering?.title || 'an offering'}`,
        subtitle: `From ${req.requesterName}`,
        meta: `${vendor?.name || 'Vendor'} · ${req.status}`,
        vendorId: req.vendorId,
        entityId: req.id,
        raw: req,
        actionLabel: req.status === 'pending' ? 'Review' : undefined,
      });
    }

    // 2. Join requests for my vendors
    for (const r of state.vendorJoinRequests) {
      if (!myVendorIds.has(r.vendorId)) continue;
      const vendor = myVendors.find((v) => v.id === r.vendorId);
      const canModerate = vendor?.ownerCes === myCes || vendor?.members.some((m) => m.ces === myCes && (m.role === 'owner' || m.role === 'admin'));
      if (!canModerate) continue;
      list.push({
        id: `join-${r.id}`,
        type: 'join_request',
        title: `Wants to join ${vendor?.name || 'vendor'}`,
        subtitle: r.requesterName,
        meta: r.status,
        vendorId: r.vendorId,
        entityId: r.id,
        raw: r,
        actionLabel: r.status === 'pending' ? 'Approve' : undefined,
        onDecline: r.status === 'pending' ? () => {
          updateVendorJoinRequest({ ...r, status: 'declined', respondedAt: new Date().toISOString() });
        } : undefined,
        onAction: r.status === 'pending' ? () => {
          updateVendorJoinRequest({ ...r, status: 'approved', respondedAt: new Date().toISOString() });
        } : undefined,
      });
    }

    // 3. Vendor invites sent to me
    for (const inv of state.vendorInvites) {
      if (inv.inviteeCes !== myCes) continue;
      list.push({
        id: `invite-${inv.id}`,
        type: 'invite',
        title: `Invite to ${inv.vendorName}`,
        subtitle: `From ${inv.invitedByName} · ${inv.role}`,
        meta: inv.status,
        vendorId: inv.vendorId,
        entityId: inv.id,
        raw: inv,
        actionLabel: inv.status === 'pending' ? 'Accept' : undefined,
        onDecline: inv.status === 'pending' ? () => {
          updateVendorInvite({ ...inv, status: 'declined', respondedAt: new Date().toISOString() });
        } : undefined,
        onAction: inv.status === 'pending' ? () => {
          updateVendorInvite({ ...inv, status: 'accepted', respondedAt: new Date().toISOString() });
        } : undefined,
      });
    }

    // 4. Collective petitions involving my vendors
    for (const p of state.collectivePetitions) {
      const linked = p.exchangeRequestId && myRequestIds.has(p.exchangeRequestId);
      if (!linked) continue;
      const request = state.exchangeRequests.find((r) => r.id === p.exchangeRequestId);
      list.push({
        id: `petition-${p.id}`,
        type: 'petition',
        title: `Collective petition`,
        subtitle: `${p.offeringTitle} — initiated by ${p.requesterName}`,
        meta: `${p.status}`,
        entityId: p.id,
        raw: p,
        actionLabel: p.status === 'submitted' ? 'Fund / Review' : undefined,
      });
    }

    // 5. Exchange alerts where I am the recipient
    for (const a of state.exchangeAlerts) {
      if (a.toCes !== myCes) continue;
      list.push({
        id: `alert-${a.id}`,
        type: 'alert',
        title: a.exchangeTitle,
        subtitle: a.message,
        meta: `${a.type} · ${a.status}`,
        entityId: a.id,
        raw: a,
        actionLabel: a.status === 'open' ? 'Review' : undefined,
      });
    }

    // Sort: newest first
    return list.sort((a, b) => {
      const aTime = (a.raw as any).createdAt || (a.raw as any).requestedAt || (a.raw as any).created_at || '';
      const bTime = (b.raw as any).createdAt || (b.raw as any).requestedAt || (b.raw as any).created_at || '';
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }, [state, myVendorIds, myVendors, myCes, updateExchangeRequest, updateVendorJoinRequest, updateVendorInvite]);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return items;
    const map: Record<InboxTab, InboxItem['type'][]> = {
      all: [],
      requests: ['exchange_request'],
      members: ['join_request', 'invite'],
      petitions: ['petition'],
      alerts: ['alert'],
    };
    return items.filter((i) => map[activeTab].includes(i.type));
  }, [items, activeTab]);

  const totalCount = items.length;
  const unreadCount = items.filter((i) => {
    const raw = i.raw as any;
    return raw.status === 'pending' || raw.status === 'open';
  }).length;

  const header = (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Inbox className="w-5 h-5 text-gold-400" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-magenta-400 text-[8px] flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <div>
          <h3 className="font-serif text-lg text-cream">Vendor Inbox</h3>
          <p className="text-xs text-lavender/40">
            {totalCount} {totalCount === 1 ? 'item' : 'items'} across {myVendors.length} {myVendors.length === 1 ? 'shop' : 'shops'}
          </p>
        </div>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-lavender/40 hover:text-cream">
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );

  const tabs: { key: InboxTab; label: string; icon: any }[] = [
    { key: 'all', label: 'ALL', icon: Inbox },
    { key: 'requests', label: 'Requests', icon: HandCoins },
    { key: 'members', label: 'Members', icon: Users },
    { key: 'petitions', label: 'Petitions', icon: ScrollText },
    { key: 'alerts', label: 'Alerts', icon: AlertTriangle },
  ];

  const content = (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-3 py-1.5 rounded-full border text-xs inline-flex items-center gap-1.5 transition-all ${
                active
                  ? 'bg-gold-400/10 border-gold-400/30 text-gold-300'
                  : 'border-lavender/10 text-lavender/50 hover:border-lavender/30'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 rounded-xl border border-lavender/10 bg-void-900/30">
          <Inbox className="w-8 h-8 text-lavender/20 mx-auto mb-2" />
          <p className="text-sm text-lavender/50">No vendor activity right now.</p>
          <p className="text-xs text-lavender/30 mt-1">Requests, invites, and petitions appear here.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {filtered.map((item) => (
            <InboxRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );

  if (embedded) {
    return (
      <div className="rounded-2xl border border-gold-400/20 bg-void-900/60 p-5">
        {header}
        {content}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gold-400/20 bg-void-900/60 p-5"
    >
      {header}
      {content}
    </motion.div>
  );
}

function InboxRow({ item }: { item: InboxItem }) {
  const Icon = {
    exchange_request: Repeat,
    join_request: Users,
    invite: Mail,
    petition: ScrollText,
    alert: AlertTriangle,
  }[item.type];

  const statusColor = (() => {
    const s = (item.raw as any).status;
    if (s === 'accepted' || s === 'approved') return 'text-green-400 bg-green-400/10 border-green-400/20';
    if (s === 'declined') return 'text-red-400 bg-red-400/10 border-red-400/20';
    if (s === 'pending' || s === 'open') return 'text-gold-400 bg-gold-400/10 border-gold-400/20';
    return 'text-lavender/50 bg-lavender/5 border-lavender/10';
  })();

  return (
    <div className="rounded-xl border border-lavender/10 bg-void-900/40 p-4 hover:border-lavender/20 transition-all">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full border border-lavender/10 bg-void-800 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-lavender/50" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm text-cream font-medium line-clamp-1">{item.title}</p>
              <p className="text-xs text-lavender/50 line-clamp-1">{item.subtitle}</p>
            </div>
            <span className={`px-2 py-0.5 rounded-full border text-[10px] shrink-0 ${statusColor}`}>
              {(item.raw as any).status}
            </span>
          </div>
          <p className="text-[10px] text-lavender/30 mt-1">{item.meta}</p>

          {/* Exchange policy badges for requests */}
          {item.type === 'exchange_request' && (
            <div className="mt-2">
              {(() => {
                const vendor = (item.raw as ExchangeRequest).vendorId;
                return null; // TODO: show offering policy inline
              })()}
            </div>
          )}

          {/* Actions */}
          {(item.actionLabel || item.onDecline) && (
            <div className="flex items-center gap-2 mt-3">
              {item.onAction && (
                <button
                  onClick={item.onAction}
                  className="px-3 py-1.5 rounded-lg bg-gold-400/10 border border-gold-400/30 text-gold-300 text-xs inline-flex items-center gap-1 hover:bg-gold-400/20 transition-all"
                >
                  <CheckCircle className="w-3 h-3" /> {item.actionLabel}
                </button>
              )}
              {item.onDecline && (
                <button
                  onClick={item.onDecline}
                  className="px-3 py-1.5 rounded-lg bg-red-400/10 border border-red-400/30 text-red-300 text-xs inline-flex items-center gap-1 hover:bg-red-400/20 transition-all"
                >
                  <XCircle className="w-3 h-3" /> Decline
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
