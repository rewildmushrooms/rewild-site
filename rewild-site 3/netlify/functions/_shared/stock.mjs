// What shoppers see about stock: "out" (sold out, can't be added or bought), "low" (LOW_STOCK_THRESHOLD,
// default 10, or fewer left) or "in". Counts come from Square Inventory (the same numbers as HQ).
// Bundles (Duo, All Four Set) follow their parts: if Peace is out, the All Four Set is out too.
// Only the status is public, never the exact count.
import { stockLevels } from './inventory.mjs';
import { PRODUCTS } from './catalog.mjs';
import { OFFERS, cartUnits } from './pricing.mjs';
import { lowStockThreshold } from './lowstock.mjs';

// levels: { productId: count | null } (null = no Square item yet, treated as in stock).
export function stockStatus(levels, line = lowStockThreshold()) {
  const status = {};
  for (const p of PRODUCTS) {
    const parts = OFFERS.bundles[p.id] || { [p.id]: 1 };
    let can = Infinity;
    for (const [k, n] of Object.entries(parts)) {
      const c = levels?.[k];
      if (typeof c === 'number') can = Math.min(can, Math.floor(c / n));
    }
    status[p.id] = can <= 0 ? 'out' : can <= line ? 'low' : 'in';
  }
  return status;
}

let cache = null; // { at, levels }
async function levelsCached(opts, maxAgeMs = 30000) {
  if (cache && Date.now() - cache.at < maxAgeMs) return cache.levels;
  const levels = await stockLevels(opts);
  cache = { at: Date.now(), levels };
  return levels;
}

export async function publicStock(opts) {
  const line = lowStockThreshold();
  return { low: line, status: stockStatus(await levelsCached(opts), line) };
}

const nameOf = (id) => { const p = PRODUCTS.find((x) => x.id === id); return p ? `${p.name} (${p.commonName || p.mushroom || p.format})` : id; };

// Checkout guard: refuse sold-out products, and more than is on hand. Fresh counts (no cache).
// If Square can't be reached, checkout still goes ahead (logged) rather than losing the sale.
export async function checkStockCart(items, { addon = false } = {}, opts) {
  let levels;
  try { levels = await stockLevels(opts); } catch (e) { console.error('stock check skipped', e.message); return; }
  const units = cartUnits(items);
  if (addon) units[OFFERS.addon.id] = (units[OFFERS.addon.id] || 0) + 1;
  for (const [id, n] of Object.entries(units)) {
    const c = levels?.[id];
    if (typeof c !== 'number') continue;
    const bad = (m) => Object.assign(new Error(m), { status: 400 });
    if (c <= 0) throw bad(`${nameOf(id)} is sold out right now. Please remove it to check out.`);
    if (n > c) throw bad(`Only ${c} ${nameOf(id)} left. Please lower the amount.`);
  }
}
