// Stock counts live in Square Inventory, on one Square item per product (SKU REWILD-<ID>).
// That way in-person sales rung up in the Square app also lower the count.
// Website orders are built from plain line items, so HQ deducts them here: every paid website
// order gets one Square adjustment (IN_STOCK -> SOLD) tagged reference_id "web:<order id>",
// dated when the order was placed. The tag means an order is never deducted twice.
// The Duo has no stock of its own: it uses one Energy powder and one tincture.
import { square, idem, locationId, pages } from './square.mjs';
import { PRODUCTS } from './catalog.mjs';
import { isPaid } from './orders.mjs';

import { OFFERS } from './pricing.mjs';
export const BUNDLES = OFFERS.bundles; // duo, all4 (what each bundle takes out of stock)
export const STOCKED = PRODUCTS.filter((p) => !BUNDLES[p.id]);
export const skuFor = (id) => `REWILD-${String(id).toUpperCase()}`;
const REF = 'web:';
const SYNC_DAYS = 120;

let varCache = null; // { productId: variationId }
let bundleVars = {}; // { bundleId: variationId } for Duo / All Four Set items in Square
export const _resetInventoryCache = () => { varCache = null; bundleVars = {}; };

// Find (or create) the Square item variation for every stocked product.
export async function ensureVariations(opts, { create = true } = {}) {
  if (varCache && Object.keys(varCache).length === STOCKED.length) return varCache;
  const items = await pages((cursor) => square('GET', `/catalog/list?types=ITEM${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, null, opts), 'objects', 2000);
  const found = {};
  const skus = new Set();
  for (const it of items) {
    if (it.is_deleted || it.item_data?.is_archived) continue;
    for (const v of it.item_data?.variations || []) {
      const sku = v.item_variation_data?.sku;
      if (sku) skus.add(sku);
      const bp = PRODUCTS.find((x) => BUNDLES[x.id] && skuFor(x.id) === sku);
      if (bp && !bundleVars[bp.id]) bundleVars[bp.id] = v.id;
      const p = STOCKED.find((x) => skuFor(x.id) === sku);
      if (p && !found[p.id]) found[p.id] = v.id;
    }
  }
  const missing = STOCKED.filter((p) => !found[p.id]);
  // Bundles (Duo, All Four Set) also get a Square item so they can be rung up in the Square app.
  // They don't track stock in Square; HQ takes their parts out of stock.
  const bundles = PRODUCTS.filter((p) => BUNDLES[p.id] && !skus.has(skuFor(p.id)));
  if ((missing.length || bundles.length) && create) {
    const res = await square('POST', '/catalog/batch-upsert', {
      idempotency_key: idem(),
      batches: [{
        objects: [...missing, ...bundles].map((p) => ({
          type: 'ITEM',
          id: `#item-${p.id}`,
          present_at_all_locations: true,
          item_data: {
            name: p.name,
            description: p.format || '',
            variations: [{
              type: 'ITEM_VARIATION',
              id: `#var-${p.id}`,
              present_at_all_locations: true,
              item_variation_data: {
                item_id: `#item-${p.id}`,
                name: p.size || 'Regular',
                sku: skuFor(p.id),
                pricing_type: 'FIXED_PRICING',
                price_money: { amount: p.price, currency: 'CAD' },
                track_inventory: !BUNDLES[p.id],
              },
            }],
          },
        })),
      }],
    }, opts);
    for (const m of res.id_mappings || []) {
      const hit = /^#var-(.+)$/.exec(m.client_object_id || '');
      if (hit && STOCKED.some((x) => x.id === hit[1])) found[hit[1]] = m.object_id;
      else if (hit && BUNDLES[hit[1]]) bundleVars[hit[1]] = m.object_id;
    }
  }
  varCache = found;
  return found;
}

async function counts(vars, opts) {
  const loc = await locationId(opts);
  const ids = Object.values(vars);
  if (!ids.length) return {};
  const rows = await pages((cursor) => square('POST', '/inventory/counts/batch-retrieve', { catalog_object_ids: ids, location_ids: [loc], states: ['IN_STOCK'], cursor }, opts), 'counts', 1000);
  const byVar = {};
  for (const c of rows) byVar[c.catalog_object_id] = (byVar[c.catalog_object_id] || 0) + Number(c.quantity || 0);
  return Object.fromEntries(Object.entries(vars).map(([pid, vid]) => [pid, byVar[vid] ?? null]));
}

// Units of each stocked product used by one order.
export function unitsInOrder(o) {
  const out = {};
  for (const li of o.line_items || []) {
    const pid = li.metadata?.rewild_id || PRODUCTS.find((p) => (li.name || '').startsWith(p.name))?.id;
    const qty = Math.round(Number(li.quantity) || 0);
    if (!pid || !qty) continue;
    const parts = BUNDLES[pid] || { [pid]: 1 };
    for (const [k, n] of Object.entries(parts)) out[k] = (out[k] || 0) + n * qty;
  }
  return out;
}

// Bundles rung up in the Square app: Square doesn't know what is inside them, so their parts are
// taken out of stock here (single products sold in the Square app already lower their own count).
export function bundleUnitsInPosOrder(o) {
  const byVar = Object.fromEntries(Object.entries(bundleVars).map(([pid, vid]) => [vid, pid]));
  const out = {};
  for (const li of o.line_items || []) {
    const pid = byVar[li.catalog_object_id];
    const qty = Math.round(Number(li.quantity) || 0);
    if (!pid || !qty) continue;
    for (const [k, n] of Object.entries(BUNDLES[pid])) out[k] = (out[k] || 0) + n * qty;
  }
  return out;
}
const isWeb = (o) => o.metadata?.source === 'rewildmushrooms.com';
const unitsToDeduct = (o) => (isWeb(o) ? unitsInOrder(o) : bundleUnitsInPosOrder(o));

// Deduct paid website orders (and Square app orders with bundles) that have not been deducted yet.
// Returns how many orders were applied.
export async function syncWebOrders(orders, opts, now = Date.now()) {
  const vars = await ensureVariations(opts, { create: false });
  const ids = Object.values(vars);
  if (!ids.length) return 0;
  const loc = await locationId(opts);
  const since = new Date(now - SYNC_DAYS * 86400000).toISOString();
  const done = new Set();
  const changes = await pages((cursor) => square('POST', '/inventory/changes/batch-retrieve', { catalog_object_ids: ids, location_ids: [loc], types: ['ADJUSTMENT'], updated_after: since, cursor }, opts), 'changes', 5000);
  for (const c of changes) {
    const ref = c.adjustment?.reference_id || '';
    if (ref.startsWith(REF)) done.add(ref.slice(REF.length));
  }
  const todo = orders.filter((o) => isPaid(o) && o.created_at >= since && !done.has(o.id) && (isWeb(o) || Object.keys(bundleUnitsInPosOrder(o)).length));
  let applied = 0;
  for (const o of todo) {
    const lines = Object.entries(unitsToDeduct(o)).filter(([pid]) => vars[pid]);
    if (!lines.length) continue;
    await square('POST', '/inventory/changes/batch-create', {
      idempotency_key: `rw-${o.id}`.slice(0, 128),
      ignore_unchanged_counts: true,
      changes: lines.map(([pid, n]) => ({
        type: 'ADJUSTMENT',
        adjustment: {
          from_state: 'IN_STOCK',
          to_state: 'SOLD',
          location_id: loc,
          catalog_object_id: vars[pid],
          quantity: String(n),
          occurred_at: o.created_at,
          reference_id: REF + o.id,
        },
      })),
    }, opts);
    applied += 1;
  }
  return applied;
}

// Current IN_STOCK count per stocked product id (null if the product has no Square item yet).
export async function stockLevels(opts) {
  return counts(await ensureVariations(opts, { create: false }), opts);
}

export async function inventory(opts, { orders = [] } = {}) {
  const vars = await ensureVariations(opts);
  let synced = 0, syncError = null;
  try { synced = await syncWebOrders(orders, opts); } catch (e) { syncError = e.message; console.error('inventory sync failed', e.message); }
  const stock = await counts(vars, opts);
  const items = STOCKED.map((p) => ({ id: p.id, name: p.name, size: p.size, onHand: stock[p.id] ?? 0, tracked: !!vars[p.id] }));
  const by = Object.fromEntries(items.map((i) => [i.id, i.onHand]));
  const bundles = Object.entries(BUNDLES).map(([id, parts]) => {
    const p = PRODUCTS.find((x) => x.id === id);
    return { id, name: p?.name || id, canMake: Math.max(0, Math.min(...Object.entries(parts).map(([k, n]) => Math.floor((by[k] || 0) / n)))), uses: parts };
  });
  return { items, bundles, synced, syncError };
}

// Set the counted stock for one product (a physical count, like a stocktake).
export async function setStock(productId, quantity, opts) {
  const p = STOCKED.find((x) => x.id === productId);
  const q = Math.floor(Number(quantity));
  if (!p) throw Object.assign(new Error('Unknown product'), { status: 400 });
  if (!(q >= 0 && q <= 100000)) throw Object.assign(new Error('Enter a whole number, 0 or more.'), { status: 400 });
  const vars = await ensureVariations(opts);
  const loc = await locationId(opts);
  await square('POST', '/inventory/changes/batch-create', {
    idempotency_key: idem(),
    changes: [{
      type: 'PHYSICAL_COUNT',
      physical_count: { catalog_object_id: vars[p.id], state: 'IN_STOCK', location_id: loc, quantity: String(q), occurred_at: new Date().toISOString() },
    }],
  }, opts);
  return { id: p.id, onHand: q };
}
