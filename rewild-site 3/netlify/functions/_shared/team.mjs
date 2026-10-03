// REWILD HQ team: who can log in, what they can see, and how partner commission works.
// Passwords are NOT stored here. Each person's first password lives in a Netlify environment variable
// (named in `env` below); a password they reset by email is saved hashed in Netlify Blobs (see auth.mjs).
// Delete their Netlify variable to remove someone's access instantly.
//
// Commission: partners earn COMMISSION_RATE of what the customer paid for products
// (after any discount, not counting shipping, tax or refunds) on orders that used one of
// their codes (any code starting with `codePrefix`) or came through their share link (?ref=...).

export const COMMISSION_RATE = 0.5;

export const TEAM = [
  { id: 'jade', name: 'Jade Stevens', role: 'owner', env: 'HQ_PASSWORD', email: 'jade@rewildmushrooms.com' },
  { id: 'sean', name: 'Sean Turner', role: 'partner', env: 'HQ_PASSWORD_SEAN', email: 'sean@rewildmushrooms.com', codePrefix: 'SEAN', ref: 'sean' },
  { id: 'pete', name: 'Pete Moss', role: 'partner', env: 'HQ_PASSWORD_PETE', email: 'petemoss@rewildmushrooms.com', codePrefix: 'PETEMOSS', ref: 'petemoss' },
];

export const PARTNERS = TEAM.filter((m) => m.role === 'partner');
export const memberById = (id) => TEAM.find((m) => m.id === String(id || '').toLowerCase()) || null;

// Valid share-link ref -> partner, or null.
export const partnerByRef = (ref) => PARTNERS.find((p) => p.ref === String(ref || '').trim().toLowerCase()) || null;

// Longest prefix wins, so a future "PETE" partner could never steal "PETEMOSS20".
export function partnerByCode(code) {
  const c = String(code || '').trim().toUpperCase();
  if (!c) return null;
  return [...PARTNERS].sort((a, b) => b.codePrefix.length - a.codePrefix.length).find((p) => c.startsWith(p.codePrefix)) || null;
}

const amt = (m) => Number(m?.amount || 0);

export const orderCode = (o) => o?.metadata?.promo || (o?.discounts || []).map((d) => d.name).find(Boolean) || '';

// Who gets credit for an order: a partner code beats a share link.
export function partnerForOrder(o) {
  const byCode = partnerByCode(orderCode(o));
  if (byCode) return { partner: byCode, via: 'code', code: orderCode(o).toUpperCase() };
  const byRef = partnerByRef(o?.metadata?.ref);
  if (byRef) return { partner: byRef, via: 'link', code: '' };
  return null;
}

// What the customer paid for products: total minus shipping, tax and completed refunds.
export function commissionBase(o) {
  const refunded = (o.refunds || []).filter((r) => r.status !== 'REJECTED' && r.status !== 'FAILED').reduce((a, r) => a + amt(r.amount_money), 0);
  return Math.max(0, amt(o.total_money) - amt(o.total_service_charge_money) - amt(o.total_tax_money) - refunded);
}

export const commissionFor = (o, rate = COMMISSION_RATE) => Math.round(commissionBase(o) * rate);
