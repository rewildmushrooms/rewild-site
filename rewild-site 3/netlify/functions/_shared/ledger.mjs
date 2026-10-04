// Stock movements that HQ records by hand: offline sales, restocks and adjustments.
// Each one changes the count in Square (so it matches the Square app) and adds a line to the
// REWILD stock ledger (Netlify Blobs) with who, why and an optional note.
import crypto from 'node:crypto';
import { square, locationId } from './square.mjs';
import { PRODUCTS } from './catalog.mjs';
import { BUNDLES, STOCKED, ensureVariations, stockLevels } from './inventory.mjs';
import { appendLedger, putIndex, orderSummary } from './data.mjs';
import { setJSON } from './store.mjs';
import { checkLowStock } from './lowstock.mjs';

const bad = (m) => Object.assign(new Error(m), { status: 400 });
const note = (n) => String(n || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 200);

// [{id, qty}] -> { stockedId: units } (the Duo becomes its parts). Only sellable/stocked ids.
export function cleanItems(items, { allowBundles = true } = {}) {
  const out = {};
  for (const it of Array.isArray(items) ? items : []) {
    const id = String(it?.id || '');
    const qty = Math.floor(Number(it?.qty));
    if (!qty) continue;
    if (!(qty > 0 && qty <= 1000)) throw bad('Quantities must be whole numbers from 1 to 1000.');
    const parts = BUNDLES[id] && allowBundles ? BUNDLES[id] : STOCKED.some((p) => p.id === id) ? { [id]: 1 } : null;
    if (!parts) throw bad(`Unknown product: ${id}`);
    for (const [k, n] of Object.entries(parts)) out[k] = (out[k] || 0) + n * qty;
  }
  if (!Object.keys(out).length) throw bad('Add at least one product with a quantity.');
  return out;
}

async function move(units, from, to, ref, opts) {
  const vars = await ensureVariations(opts);
  const loc = await locationId(opts);
  const now = new Date().toISOString();
  await square('POST', '/inventory/changes/batch-create', {
    idempotency_key: ref.slice(0, 128),
    ignore_unchanged_counts: true,
    changes: Object.entries(units).map(([pid, n]) => ({
      type: 'ADJUSTMENT',
      adjustment: { from_state: from, to_state: to, location_id: loc, catalog_object_id: vars[pid], quantity: String(n), occurred_at: now, reference_id: ref.slice(0, 255) },
    })),
  }, opts);
  return now;
}

async function afterMove(opts) {
  try { await checkLowStock(await stockLevels(opts)); } catch (e) { console.error('low stock check failed', e.message); }
}

const lines = (units, sign, source, reason, by, n, order, at) =>
  Object.entries(units).map(([product, q]) => ({ at, product, change: sign * q, source, reason, by, note: n || null, order: order || null }));

// Offline / event sale. Several products at once. amount = dollars received (optional).
export async function recordOfflineSale(b, member, opts) {
  const sold = (Array.isArray(b.items) ? b.items : []).filter((i) => Math.floor(Number(i?.qty)) > 0);
  const units = cleanItems(sold);
  const amount = b.amount === '' || b.amount == null ? null : Math.round(Number(b.amount) * 100);
  if (amount != null && !(amount >= 0 && amount < 10000000)) throw bad('Enter the amount received in dollars, or leave it blank.');
  const id = 'OFF-' + crypto.randomBytes(5).toString('hex').toUpperCase();
  const at = await move(units, 'IN_STOCK', 'SOLD', `offline:${id}`, opts);
  const n = note(b.note);
  await appendLedger(lines(units, -1, 'offline_sale', 'Offline sale', member.id, n, id, at));
  const rec = {
    id, createdAt: at, email: null, name: n || 'Offline sale', source: 'offline', by: member.id, note: n || null,
    items: sold.map((i) => ({ id: i.id, name: PRODUCTS.find((p) => p.id === i.id)?.name || i.id, qty: Math.floor(Number(i.qty)) })),
    units, total: amount || 0, discount: 0, refunded: 0, code: null,
  };
  await setJSON('orders', id, rec);
  await putIndex('orders', id, orderSummary(rec));
  await afterMove(opts);
  return { id, units };
}

export async function recordRestock(b, member, opts) {
  const units = cleanItems(b.items, { allowBundles: false });
  const ref = `restock:${crypto.randomBytes(5).toString('hex')}`;
  const at = await move(units, 'NONE', 'IN_STOCK', ref, opts);
  await appendLedger(lines(units, 1, 'restock', 'Restock', member.id, note(b.note), null, at));
  await afterMove(opts);
  return { units };
}

// One product, + or - a number of units (e.g. damaged, samples, found stock).
export async function recordAdjustment(b, member, opts) {
  const id = String(b.id || '');
  const change = Math.trunc(Number(b.change));
  if (!STOCKED.some((p) => p.id === id)) throw bad('Pick a product.');
  if (!change || Math.abs(change) > 1000) throw bad('Enter a change like 3 or -2.');
  const n = note(b.note);
  if (!n) throw bad('Add a short note so the history makes sense later (e.g. "2 damaged in shipping").');
  const ref = `adjust:${crypto.randomBytes(5).toString('hex')}`;
  const at = change > 0 ? await move({ [id]: change }, 'NONE', 'IN_STOCK', ref, opts) : await move({ [id]: -change }, 'IN_STOCK', 'WASTE', ref, opts);
  await appendLedger(lines({ [id]: Math.abs(change) }, change > 0 ? 1 : -1, 'manual_adjustment', 'Adjustment', member.id, n, null, at));
  await afterMove(opts);
  return { id, change };
}

// Logged when someone types a full count in HQ (a stocktake).
export async function logCount(id, before, after, member) {
  if (before == null || before === after) return;
  await appendLedger([{ at: new Date().toISOString(), product: id, change: after - before, source: 'manual_adjustment', reason: 'Stock count', by: member.id, note: `Counted ${after} (was ${before})`, order: null }]);
}
