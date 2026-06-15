// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Peer Payment Helpers
//  Generates deep links / web URLs for Venmo, Cash App, Zelle, Chime, Stripe
// ─────────────────────────────────────────────────────────────

import type { PaymentMethodConfig, PaymentMethodType } from '../types/ces';

export function getPaymentUrl(method: PaymentMethodConfig, amountCents?: number): string | null {
  if (!method.enabled) return null;

  switch (method.type) {
    case 'venmo': {
      if (!method.venmoUsername) return null;
      const clean = method.venmoUsername.replace(/^@/, '');
      const url = new URL(`https://venmo.com/u/${clean}`);
      if (amountCents !== undefined && amountCents > 0) {
        url.searchParams.set('amount', (amountCents / 100).toFixed(2));
        url.searchParams.set('note', 'Heartlight Collective exchange');
      }
      return url.toString();
    }
    case 'cashapp': {
      if (!method.cashappUsername) return null;
      const clean = method.cashappUsername.replace(/^\$/, '');
      return `https://cash.app/$${clean}`;
    }
    case 'chime': {
      if (!method.chimeUsername) return null;
      const clean = method.chimeUsername.replace(/^\$/, '');
      return `https://chime.com/r/${clean}`;
    }
    case 'stripe': {
      if (!method.stripePaymentLink) return null;
      const url = new URL(method.stripePaymentLink);
      if (amountCents !== undefined && amountCents > 0) {
        url.searchParams.set('amount', String(amountCents));
      }
      return url.toString();
    }
    case 'zelle': {
      if (!method.zelleContact) return null;
      return `mailto:${method.zelleContact}?subject=Heartlight%20Collective%20Exchange%20Payment`;
    }
    case 'collective':
      return null;
    default:
      return null;
  }
}

export function formatPaymentLabel(method: PaymentMethodConfig): string {
  switch (method.type) {
    case 'venmo':
      return `Venmo @${method.venmoUsername || ''}`;
    case 'cashapp':
      return `Cash App $${method.cashappUsername || ''}`;
    case 'chime':
      return `Chime $${method.chimeUsername || ''}`;
    case 'zelle':
      return `Zelle ${method.zelleContact || ''}`;
    case 'stripe':
      return 'Stripe' + (method.stripePaymentLink ? ' payment link' : '');
    case 'collective':
      return 'Collective funding';
    default:
      return method.type;
  }
}

export function paymentTypeIcon(method: PaymentMethodType): string {
  switch (method) {
    case 'venmo':
      return '💙';
    case 'cashapp':
      return '💚';
    case 'chime':
      return '💜';
    case 'zelle':
      return '💛';
    case 'stripe':
      return '💳';
    case 'collective':
      return '🤲';
    default:
      return '💫';
  }
}
