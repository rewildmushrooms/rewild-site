// Small indexes in Netlify Blobs (store "data") so HQ can list customers, orders and carts
// without scanning every record. Full records live in their own stores (customers, orders, carts).
import { getJSON, setJSON } from './store.mjs';

const S = 'data';
export async function readIndex(name) { return (await getJSON(S, `${name}-index`)) || {}; }
export async function putIndex(name, id, value) {
  const all = await readIndex(name);
  if (value == null) delete all[id]; else all[id] = value;
  await setJSON(S, `${name}-index`, all);
  return all;
}

// Stock ledger: newest first, capped.
const LEDGER_MAX = 3000;
export async function readLedger() { return (await getJSON(S, 'ledger')) || []; }
export async function appendLedger(entries) {
  if (!entries?.length) return;
  const list = await readLedger();
  list.unshift(...entries);
  await setJSON(S, 'ledger', list.slice(0, LEDGER_MAX));
}

export const HIGH_VALUE = 25000; // $250 lifetime
const INACTIVE_DAYS = 120;

export function customerSummary(c, now = Date.now()) {
  return {
    email: c.email,
    name: c.name || null,
    orders: c.orderCount || 0,
    ltv: c.lifetimeValue || 0,
    first: c.firstOrderAt || null,
    last: c.lastOrderAt || null,
    lastActivity: c.lastActivityAt || c.updatedAt || null,
    products: c.products || {},
    consent: !!c.marketingConsent,
    quiz: c.quiz?.stack_names || null,
    source: c.firstSource || null,
    codes: c.codesUsed || [],
    openCart: !!c.openCart,
    noReminders: !!c.noReminders,
    segments: segmentsFor(c, now),
  };
}

const BUYER = { energy: 'Energy buyer', clarity: "Lion's Mane buyer", strength: 'Chaga buyer', peace: 'Reishi buyer', tincture: 'Tincture buyer' };
export function segmentsFor(c, now = Date.now()) {
  const s = [];
  const n = c.orderCount || 0;
  if (!n) s.push('Prospect');
  else if (n === 1) s.push('Customer');
  else s.push('Repeat customer');
  if ((c.lifetimeValue || 0) >= HIGH_VALUE) s.push('High value');
  for (const [k, label] of Object.entries(BUYER)) if (c.products?.[k]) s.push(label);
  if (c.quiz) s.push('Quiz lead');
  if (c.openCart) s.push('Abandoned cart');
  if (c.marketingConsent) s.push('Subscriber');
  if (n && c.lastOrderAt && now - Date.parse(c.lastOrderAt) > INACTIVE_DAYS * 86400000) s.push('Inactive');
  if ((c.codesUsed || []).some((x) => /^(SEAN|PETEMOSS)/.test(x))) s.push('Partner referral');
  return s;
}

// Order status, like WooCommerce: processing (paid, not shipped yet), on-hold, completed (shipped or handed over),
// cancelled, refunded (set automatically when the full amount is refunded).
export const ORDER_STATUSES = { processing: 'Processing', 'on-hold': 'On hold', completed: 'Completed', cancelled: 'Cancelled', refunded: 'Refunded' };
export function orderStatus(r) {
  if (r.refunded && r.total > 0 && r.refunded >= r.total) return 'refunded';
  if (r.hqStatus && ORDER_STATUSES[r.hqStatus]) return r.hqStatus;
  if (r.source === 'offline' || r.shipment) return 'completed';
  return 'processing';
}

export function orderSummary(r) {
  return {
    id: r.id,
    at: r.createdAt,
    email: r.email || null,
    name: r.name || null,
    items: (r.items || []).map((i) => `${i.qty}x ${i.name}`).join(', '),
    total: r.total || 0,
    discount: r.discount || 0,
    refunded: r.refunded || 0,
    code: r.code || null,
    status: orderStatus(r),
    partRefunded: !!r.refunded && r.refunded < r.total,
    restocked: !!r.restocked,
    notes: (r.notes || []).slice(-20),
    paidOnline: r.source !== 'offline',
    partner: r.partner || null,
    by: r.by || null,
    source: r.source || 'online',
    country: r.country || null,
    shipment: r.shipment ? { at: r.shipment.at, carrier: r.shipment.carrier, tracking: r.shipment.tracking, emailed: !!r.shipment.emailed } : null,
  };
}
