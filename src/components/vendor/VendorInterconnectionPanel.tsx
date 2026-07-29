import { useState, useMemo } from 'react';
import {
  Link2,
  Shield,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Lock,
} from 'lucide-react';
import type {
  VendorRecord,
  CreatorRecord,
  CesInterconnection,
} from '../../types/ces';

interface VendorInterconnectionPanelProps {
  vendor: VendorRecord;
  userCes?: string;
  isMember: boolean;
  findProfileByCES: (ces: string) => CreatorRecord | undefined;
  onRequestConnection: (connection: CesInterconnection) => void;
  onConfirmConnection: (ces: string) => void;
  onDeclineConnection: (ces: string) => void;
}

export function VendorInterconnectionPanel({
  vendor,
  userCes,
  isMember,
  findProfileByCES,
  onRequestConnection,
  onConfirmConnection,
  onDeclineConnection,
}: VendorInterconnectionPanelProps) {
  const [searchCes, setSearchCes] = useState('');
  const [note, setNote] = useState('');
  const [searched, setSearched] = useState<CreatorRecord | null | undefined>(undefined);
  const [error, setError] = useState('');

  const connections = vendor.interconnectedProfiles ?? [];
  const confirmed = useMemo(
    () => connections.filter((c) => c.status === 'confirmed'),
    [connections]
  );
  const pending = useMemo(
    () =>
      connections.filter(
        (c) => c.status === 'pending' && (isMember || c.ces === userCes || c.initiatedByCes === userCes)
      ),
    [connections, isMember, userCes]
  );

  function handleSearch() {
    setError('');
    const clean = searchCes.replace(/\D/g, '').slice(0, 9);
    if (clean.length !== 9) {
      setError('Please enter a 9-digit C.E.S. number.');
      setSearched(null);
      return;
    }
    const profile = findProfileByCES(clean);
    if (!profile) {
      setError('No profile found for this C.E.S. in the local collective memory.');
      setSearched(null);
      return;
    }
    setSearched(profile);
  }

  const existing = searched
    ? connections.find((c) => c.ces === searched.cesNumber)
    : undefined;

  function handleRequest() {
    if (!searched?.cesNumber || !userCes) return;
    const now = new Date().toISOString();
    onRequestConnection({
      ces: searched.cesNumber,
      name: searched.name,
      initiatedByCes: userCes,
      initiatedAt: now,
      status: 'pending',
      note: note.trim() || undefined,
    });
    setSearchCes('');
    setNote('');
    setSearched(undefined);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl text-cream inline-flex items-center gap-2">
            <Link2 className="w-5 h-5 text-blue-400" /> C.E.S. Interconnection 🔗
          </h2>
          <p className="text-sm text-lavender/50 mt-1">
            {confirmed.length} confirmed interconnection{confirmed.length === 1 ? '' : 's'} in resonance.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-green-400/20 bg-green-400/10 text-green-300 text-xs">
          <Shield className="w-3.5 h-3.5" /> Symmetric Consent
        </span>
      </div>

      {!isMember && (
        <div className="rounded-xl border border-lavender/10 bg-void-800/30 p-5 text-center">
          <Lock className="w-8 h-8 text-lavender/30 mx-auto mb-2" />
          <p className="text-sm text-lavender/50">
            Full interconnection details are visible to shop members. The public field shows only the count of confirmed connections.
          </p>
        </div>
      )}

      {isMember && (
        <div className="rounded-xl border border-lavender/10 bg-void-800/30 p-5 space-y-4">
          <label className="block text-sm text-lavender/70 mb-1.5">Search a C.E.S. to request secure interconnection 🔍</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={searchCes}
              onChange={(e) => setSearchCes(e.target.value.replace(/\D/g, '').slice(0, 9))}
              placeholder="9-digit C.E.S."
              maxLength={9}
              className="flex-1 rounded-xl border border-lavender/10 bg-void-900/40 px-4 py-2 text-sm text-cream placeholder:text-lavender/30 focus:outline-none focus:border-blue-400/40"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 rounded-lg bg-blue-400/10 border border-blue-400/30 text-blue-300 text-sm inline-flex items-center gap-1.5 hover:bg-blue-400/20 transition-all"
            >
              <Search className="w-4 h-4" /> Check C.E.S.
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-300">{error}</p>
          )}

          {searched && !existing && (
            <div className="rounded-lg border border-lavender/10 bg-void-900/40 p-4">
              <p className="text-sm text-cream font-medium">{searched.name}</p>
              <p className="text-xs font-mono text-lavender/50 mb-3">C.E.S. {searched.cesNumber}</p>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note of resonance (shared only after confirmation)"
                className="w-full rounded-lg border border-lavender/10 bg-void-900/60 px-3 py-2 text-sm text-cream placeholder:text-lavender/30 mb-3"
              />
              <button
                onClick={handleRequest}
                className="px-4 py-2 rounded-lg bg-gold-400/10 border border-gold-400/30 text-gold-300 text-sm inline-flex items-center gap-1.5 hover:bg-gold-400/20 transition-all"
              >
                <Link2 className="w-4 h-4" /> Request Interconnection
              </button>
            </div>
          )}

          {existing && (
            <div className="rounded-lg border border-lavender/10 bg-void-900/40 p-4">
              <p className="text-sm text-cream">
                Connection with {existing.name} is
                <span className="ml-1 font-medium capitalize">{existing.status}</span>.
              </p>
            </div>
          )}
        </div>
      )}

      {confirmed.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-lavender/70 mb-3 inline-flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Confirmed Interconnections
          </h3>
          <div className="flex flex-wrap gap-3">
            {confirmed.map((c) => (
              <div
                key={c.ces}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-400/20 bg-green-400/10 text-sm text-cream"
              >
                <Shield className="w-3.5 h-3.5 text-green-400" />
                <span>{c.name}</span>
                {isMember && <span className="text-[10px] font-mono text-lavender/50">C.E.S. {c.ces}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-lavender/70 mb-3 inline-flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> Pending
          </h3>
          <div className="flex flex-wrap gap-3">
            {pending.map((c) => (
              <div
                key={c.ces}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 text-sm text-cream"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{c.name}</span>
                {userCes === c.ces && c.status === 'pending' && (
                  <div className="flex items-center gap-1 ml-1">
                    <button
                      onClick={() => onConfirmConnection(c.ces)}
                      className="p-1 rounded hover:bg-green-400/20 text-green-400"
                      title="Confirm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeclineConnection(c.ces)}
                      className="p-1 rounded hover:bg-red-400/20 text-red-400"
                      title="Decline"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
