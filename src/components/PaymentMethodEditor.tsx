// ─────────────────────────────────────────────────────────────
//  PaymentMethodEditor — edit peer-to-peer payment methods on a profile
// ─────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import type { PaymentMethodConfig, PaymentMethodType } from '../types/ces';
import { getPaymentUrl, formatPaymentLabel } from '../lib/payments';

const PAYMENT_TYPES: { type: PaymentMethodType; label: string; placeholder: string; field: keyof PaymentMethodConfig }[] = [
  { type: 'venmo', label: 'Venmo', placeholder: 'username (no @)', field: 'venmoUsername' },
  { type: 'cashapp', label: 'Cash App', placeholder: '$tag', field: 'cashappUsername' },
  { type: 'chime', label: 'Chime', placeholder: '$username', field: 'chimeUsername' },
  { type: 'zelle', label: 'Zelle', placeholder: 'email or phone', field: 'zelleContact' },
  { type: 'stripe', label: 'Stripe Payment Link', placeholder: 'https://buy.stripe.com/...', field: 'stripePaymentLink' },
];

interface PaymentMethodEditorProps {
  methods: PaymentMethodConfig[];
  onChange: (methods: PaymentMethodConfig[]) => void;
}

export default function PaymentMethodEditor({ methods, onChange }: PaymentMethodEditorProps) {
  const [nextType, setNextType] = useState<PaymentMethodType>('venmo');
  const [nextValue, setNextValue] = useState('');
  const [nextNote, setNextNote] = useState('');

  const add = useCallback(() => {
    if (!nextValue.trim()) return;
    const config: PaymentMethodConfig = {
      type: nextType,
      enabled: true,
      [PAYMENT_TYPES.find(p => p.type === nextType)!.field]: nextValue.trim(),
      note: nextNote.trim() || undefined,
      preferredCurrency: 'USD',
    };
    onChange([...methods, config]);
    setNextValue('');
    setNextNote('');
  }, [methods, nextType, nextValue, nextNote, onChange]);

  const remove = useCallback((idx: number) => {
    onChange(methods.filter((_, i) => i !== idx));
  }, [methods, onChange]);

  const toggle = useCallback((idx: number) => {
    const next = [...methods];
    next[idx] = { ...next[idx], enabled: !next[idx].enabled };
    onChange(next);
  }, [methods, onChange]);

  const updateField = useCallback((idx: number, field: keyof PaymentMethodConfig, value: unknown) => {
    const next = [...methods];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  }, [methods, onChange]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-lavender">Peer-to-Peer Payment Methods</h3>
      <p className="text-sm text-lavender/60">
        Add direct links so exchange partners can send or receive mutual aid with one click.
      </p>

      {methods.map((method, idx) => {
        const typeMeta = PAYMENT_TYPES.find(p => p.type === method.type)!;
        const url = getPaymentUrl(method);
        return (
          <div key={idx} className="p-3 rounded-xl border border-lavender/10 bg-lavender/5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-lavender">{typeMeta.label}</span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-sm text-lavender/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={method.enabled}
                    onChange={() => toggle(idx)}
                    className="accent-gold-400"
                  />
                  Enabled
                </label>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="text-red-400 hover:text-red-300 p-1"
                  aria-label="Remove payment method"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <input
              type="text"
              value={(method[typeMeta.field] as string | undefined) || ''}
              onChange={(e) => updateField(idx, typeMeta.field, e.target.value)}
              placeholder={typeMeta.placeholder}
              className="w-full px-3 py-2 rounded-lg bg-black/20 border border-lavender/20 text-lavender placeholder:text-lavender/30 focus:outline-none focus:border-gold-400/50"
            />
            <input
              type="text"
              value={method.note || ''}
              onChange={(e) => updateField(idx, 'note', e.target.value)}
              placeholder="Note: when / how to use this method"
              className="w-full px-3 py-2 rounded-lg bg-black/20 border border-lavender/20 text-lavender placeholder:text-lavender/30 focus:outline-none focus:border-gold-400/50"
            />
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-gold-300 hover:text-gold-200"
              >
                <ExternalLink className="w-3 h-3" /> Preview {formatPaymentLabel(method)}
              </a>
            )}
          </div>
        );
      })}

      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-lavender/60">Method</label>
          <select
            value={nextType}
            onChange={(e) => setNextType(e.target.value as PaymentMethodType)}
            className="px-3 py-2 rounded-lg bg-black/20 border border-lavender/20 text-lavender focus:outline-none focus:border-gold-400/50"
          >
            {PAYMENT_TYPES.map(p => (
              <option key={p.type} value={p.type}>{p.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[10rem]">
          <label className="text-xs text-lavender/60">Identifier / Link</label>
          <input
            type="text"
            value={nextValue}
            onChange={(e) => setNextValue(e.target.value)}
            placeholder={PAYMENT_TYPES.find(p => p.type === nextType)?.placeholder}
            className="px-3 py-2 rounded-lg bg-black/20 border border-lavender/20 text-lavender placeholder:text-lavender/30 focus:outline-none focus:border-gold-400/50"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[10rem]">
          <label className="text-xs text-lavender/60">Note</label>
          <input
            type="text"
            value={nextNote}
            onChange={(e) => setNextNote(e.target.value)}
            placeholder="Optional note"
            className="px-3 py-2 rounded-lg bg-black/20 border border-lavender/20 text-lavender placeholder:text-lavender/30 focus:outline-none focus:border-gold-400/50"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          />
        </div>
        <button
          type="button"
          onClick={add}
          className="px-4 py-2 rounded-lg bg-gold-400/20 text-gold-300 hover:bg-gold-400/30 transition-colors inline-flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
    </div>
  );
}
