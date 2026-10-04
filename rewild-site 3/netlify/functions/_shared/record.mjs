// What happens once a website order is paid. Called by the Square webhook and by the
// order-confirmed page, whichever comes first. Safe to call many times for the same order:
//   1. lower stock in Square (tagged web:<order id>, never twice)
//   2. low-stock email if a product reached the line
//   3. add the buyer to MailerLite, only if they ticked the email box
//   4. save the order and update the customer record (Netlify Blobs)
import { square } from './square.mjs';
import { isPaid, buyerEmail, buyerName } from './orders.mjs';
import { syncWebOrders, unitsInOrder, stockLevels } from './inventory.mjs';
import { checkLowStock } from './lowstock.mjs';
import { addSubscriber, isEmail } from './mailerlite.mjs';
import { getJSON, setJSON } from './store.mjs';
import { orderCode, partnerForOrder } from './team.mjs';

const amt = (m) => Number(m?.amount || 0);
export const emailKey = (e) => String(e || '').trim().toLowerCase();

export const isWebOrder = (o) => o?.metadata?.source === 'rewildmushrooms.com';

// Plain record of an order, no addresses.
export function orderRecord(o, email, name) {
  const refunded = (o.refunds || []).filter((r) => r.status !== 'REJECTED' && r.status !== 'FAILED').reduce((a, r) => a + amt(r.amount_money), 0);
  return {
    id: o.id,
    createdAt: o.created_at,
    email: email || null,
    name: name || null,
    items: (o.line_items || []).map((li) => ({ id: li.metadata?.rewild_id || null, name: li.name, qty: Number(li.quantity) })),
    units: unitsInOrder(o),
    subtotal: (o.line_items || []).reduce((a, li) => a + (amt(li.gross_sales_money) || amt(li.base_price_money) * Number(li.quantity || 1)), 0),
    discount: amt(o.total_discount_money),
    shipping: amt(o.total_service_charge_money),
    tax: amt(o.total_tax_money),
    total: amt(o.total_money),
    refunded,
    code: orderCode(o) || null,
    partner: partnerForOrder(o)?.partner.id || null,
    country: o.metadata?.destination || null,
    newsletter: o.metadata?.newsletter === 'yes',
    state: o.state,
    source: 'online',
  };
}

// Customer totals are rebuilt from the orders map, so re-running never double counts.
export function mergeCustomer(c, rec, now = new Date().toISOString()) {
  const out = c ? { ...c, orders: { ...(c.orders || {}) } } : { email: rec.email, createdAt: now, orders: {} };
  if (rec.name && !out.name) out.name = rec.name;
  out.orders[rec.id] = { at: rec.createdAt, total: rec.total - rec.refunded, items: rec.units, code: rec.code };
  const list = Object.values(out.orders);
  out.orderCount = list.length;
  out.lifetimeValue = list.reduce((a, x) => a + x.total, 0);
  out.averageOrder = list.length ? Math.round(out.lifetimeValue / list.length) : 0;
  out.firstOrderAt = list.map((x) => x.at).sort()[0];
  out.lastOrderAt = list.map((x) => x.at).sort().at(-1);
  out.products = {};
  for (const x of list) for (const [k, n] of Object.entries(x.items || {})) out.products[k] = (out.products[k] || 0) + n;
  out.codesUsed = [...new Set(list.map((x) => x.code).filter(Boolean))];
  if (rec.newsletter && !out.marketingConsent) {
    out.marketingConsent = true;
    out.marketingConsentAt = rec.createdAt || now;
    out.marketingConsentSource = 'checkout';
  }
  out.lastActivityAt = out.lastOrderAt;
  out.updatedAt = now;
  return out;
}

export async function recordPaidOrder(order, opts, deps = {}) {
  if (!isWebOrder(order) || !isPaid(order)) return { skipped: true };
  const prev = (await getJSON('orders', order.id)) || null;
  const steps = { ...(prev?.steps || {}) };
  const email = prev?.email || emailKey(await buyerEmail(order, opts)) || null;
  const name = buyerName(order);
  const rec = { ...orderRecord(order, email, name), steps };

  if (!steps.inventory) {
    try { await (deps.syncWebOrders || syncWebOrders)([order], opts); steps.inventory = true; } catch (e) { console.error('stock update failed', order.id, e.message); }
    if (steps.inventory) {
      try { await checkLowStock(await (deps.stockLevels || stockLevels)(opts), deps); } catch (e) { console.error('low stock check failed', e.message); }
    }
  }
  if (!steps.newsletter && rec.newsletter && isEmail(email || '')) {
    try {
      const groups = [process.env.MAILERLITE_GROUP_ID, process.env.MAILERLITE_CUSTOMERS_GROUP_ID].filter(Boolean);
      const fields = { name: (name || '').split(' ')[0], signup_source: 'checkout', marketing_consent: 'yes', marketing_consent_source: 'checkout', marketing_consent_at: (order.created_at || '').slice(0, 10) };
      const add = deps.addSubscriber || addSubscriber;
      try { await add(email, fields, { groups }); } catch { await add(email, { name: fields.name, signup_source: 'checkout' }, { groups }); }
      steps.newsletter = true;
    } catch (e) { console.error('newsletter add failed', e.message); }
  }
  if (email) {
    const c = await getJSON('customers', email);
    await setJSON('customers', email, mergeCustomer(c, rec));
  }
  rec.recordedAt = prev?.recordedAt || new Date().toISOString();
  await setJSON('orders', order.id, rec);
  return rec;
}

// Refunds: note them on the order and customer. Stock is NOT put back automatically
// (a refunded bag may never come back); HQ can restock by hand.
export async function recordRefund(order) {
  if (!isWebOrder(order)) return { skipped: true };
  const prev = await getJSON('orders', order.id);
  if (!prev) return { skipped: true };
  const rec = { ...prev, ...orderRecord(order, prev.email, prev.name), steps: prev.steps, recordedAt: prev.recordedAt };
  await setJSON('orders', order.id, rec);
  if (rec.email) {
    const c = await getJSON('customers', rec.email);
    if (c) await setJSON('customers', rec.email, mergeCustomer(c, rec));
  }
  return rec;
}

export async function fetchOrder(id, opts) {
  const { order } = await square('GET', `/orders/${encodeURIComponent(id)}`, null, opts);
  return order;
}
