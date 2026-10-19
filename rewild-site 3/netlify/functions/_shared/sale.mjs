// Flash sale stock: how many of each product have sold at the sale price (store "sales", key = sale id).
// Rules and dates live in pricing.mjs (SALES). The early-access key is only on the server; it goes out in the
// early-access email link (/launch-party/?early=KEY) and the browser sends it back at checkout.
import { getJSON, setJSON } from './store.mjs';
import { activeSale, saleNow, cartUnits } from './pricing.mjs';

export const EARLY_KEYS = { launch40: 'rewilders-first', bf25: 'rewilders-bf' };
export const earlyOk = (saleId, key) => !!key && EARLY_KEYS[saleId] === String(key).trim().toLowerCase();

export async function saleSold(saleId) { return (await getJSON('sales', saleId))?.sold || {}; }

export async function saleRemaining(sale) {
  const sold = await saleSold(sale.id);
  return Object.fromEntries(sale.ids.map((id) => [id, Math.max(0, sale.stockEach - (sold[id] || 0))]));
}

// The sale that applies to this checkout, or null. early: the key from the early-access link.
export function saleFor(now = Date.now(), early = '') {
  const s = saleNow(now);
  if (!s) return null;
  return activeSale(now, s.phase === 'early' && earlyOk(s.id, early));
}

// Throws a friendly 400 if the cart breaks the per-order limit or asks for more than is left.
export async function checkSaleCart(sale, items, { byId } = {}) {
  const bad = (m) => Object.assign(new Error(m), { status: 400 });
  const units = cartUnits(items);
  const name = (id) => byId?.[id]?.word || byId?.[id]?.name || id;
  for (const [id, n] of Object.entries(units)) if (n > sale.maxEach) throw bad(`The ${(sale.label || 'sale').toLowerCase()} limit is ${sale.maxEach} of each product per order (bundles count what's inside). Please lower ${name(id)}.`);
  const left = await saleRemaining(sale);
  for (const [id, n] of Object.entries(units)) {
    if (!(id in left)) continue;
    if (left[id] <= 0) throw bad(`${name(id)} is sold out for the ${(sale.label || 'sale').toLowerCase()}. Please remove it to check out.`);
    if (n > left[id]) throw bad(`Only ${left[id]} ${name(id)} left at the ${(sale.label || 'sale').toLowerCase()} price. Please lower the amount.`);
  }
}

// Called once per paid sale order (record.mjs).
export async function recordSaleUnits(saleId, units, orderId) {
  const doc = (await getJSON('sales', saleId)) || { sold: {}, orders: 0, counted: {} };
  doc.counted = doc.counted || {};
  if (orderId && doc.counted[orderId]) return doc;
  if (orderId) doc.counted[orderId] = new Date().toISOString();
  for (const [k, n] of Object.entries(units || {})) doc.sold[k] = (doc.sold[k] || 0) + n;
  doc.orders = (doc.orders || 0) + 1;
  doc.updatedAt = new Date().toISOString();
  await setJSON('sales', saleId, doc);
  return doc;
}

// Public: GET /api/sale
export async function saleInfo(now = Date.now(), early = '') {
  const s = saleNow(now);
  if (!s) return { sale: null };
  const earlyValid = earlyOk(s.id, early);
  const left = await saleRemaining(s).catch(() => null);
  return { sale: { id: s.id, label: s.label || 'Sale', page: s.page || '/shop/', dates: s.dates || '', name: s.name, percent: s.percent, tier: s.tier || null, earlyStart: s.earlyStart, start: s.start, end: s.end, maxEach: s.maxEach, stockEach: s.stockEach, phase: s.phase, left, ...(early ? { earlyOk: earlyValid } : {}) } };
}
