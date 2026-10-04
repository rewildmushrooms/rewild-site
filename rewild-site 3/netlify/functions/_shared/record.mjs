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
import { putIndex, appendLedger, customerSummary, orderSummary } from './data.mjs';
import { markPurchased, useRecoveryCode, RECOVERY_RE } from './carts.mjs';

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
      try { await appendLedger(Object.entries(rec.units).map(([product, n]) => ({ at: order.created_at, product, change: -n, source: 'online_sale', reason: 'Website order', by: 'website', note: null, order: order.id }))); } catch (e) { console.error('ledger failed', e.message); }
      try { await checkLowStock(await (deps.stockLevels || stockLevels)(opts), deps); } catch (e) { console.error('low stock check failed', e.message); }
    }
  }
  if (!steps.newsletter && rec.newsletter && isEmail(email || '')) {
    try {
      const groups = [process.env.MAILERLITE_GROUP_ID, process.env.MAILERLITE_CUSTOMERS_GROUP_ID || '200334588365505920'].filter(Boolean); // Customers group starts the after-purchase emails
      const fields = { name: (name || '').split(' ')[0], signup_source: 'checkout', marketing_consent: 'yes', marketing_consent_source: 'checkout', marketing_consent_at: (order.created_at || '').slice(0, 10) };
      const add = deps.addSubscriber || addSubscriber;
      try { await add(email, fields, { groups }); } catch { await add(email, { name: fields.name, signup_source: 'checkout' }, { groups }); }
      steps.newsletter = true;
    } catch (e) { console.error('newsletter add failed', e.message); }
  }
  if (!steps.cart && order.metadata?.cart) {
    try { await markPurchased(order.metadata.cart, order.id); steps.cart = true; } catch (e) { console.error('cart mark failed', e.message); }
  }
  if (!steps.code && rec.code && RECOVERY_RE.test(rec.code)) {
    try { await useRecoveryCode(rec.code, order.id); steps.code = true; } catch (e) { console.error('code mark failed', e.message); }
  }
  let customer = null;
  if (email) {
    customer = mergeCustomer(await getJSON('customers', email), rec);
    if (order.metadata?.cart) customer.openCart = false;
    await setJSON('customers', email, customer);
    await putIndex('customers', email, customerSummary(customer));
  }
  rec.recordedAt = prev?.recordedAt || new Date().toISOString();
  await setJSON('orders', order.id, rec);
  await putIndex('orders', order.id, orderSummary(rec));
  if (customer?.marketingConsent && !steps.mlsync) {
    try { await (deps.syncCustomer || syncCustomer)(customer); steps.mlsync = true; await setJSON('orders', order.id, rec); } catch (e) { console.error('mailerlite sync failed', e.message); }
  }
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
    if (c) { const m = mergeCustomer(c, rec); await setJSON('customers', rec.email, m); await putIndex('customers', rec.email, customerSummary(m)); }
  }
  await putIndex('orders', order.id, orderSummary(rec));
  return rec;
}

// Copies purchase facts into MailerLite fields (only for people who said yes to emails).
const NAMES = { energy: 'Energy', clarity: "Lion's Mane", strength: 'Chaga', peace: 'Reishi', tincture: 'Energy Tincture' };
export function mailerliteFields(c) {
  const last = Object.entries(c.orders || {}).sort((a, b) => String(b[1].at).localeCompare(String(a[1].at)))[0]?.[1];
  return {
    customer_status: (c.orderCount || 0) >= 2 ? 'repeat customer' : (c.orderCount || 0) === 1 ? 'customer' : 'prospect',
    lifetime_value: Math.round(c.lifetimeValue || 0) / 100,
    order_count: c.orderCount || 0,
    last_purchase_date: (c.lastOrderAt || '').slice(0, 10),
    last_product_purchased: last ? Object.keys(last.items || {}).map((k) => NAMES[k] || k).join(', ') : '',
    products_purchased: Object.keys(c.products || {}).map((k) => NAMES[k] || k).join(', '),
    customer_since: (c.firstOrderAt || '').slice(0, 10),
  };
}
export async function syncCustomer(c) {
  try { await addSubscriber(c.email, mailerliteFields(c), { groups: [] }); }
  catch (e) { if (!/422/.test(e.message)) throw e; } // fields not created yet in MailerLite
}

export async function fetchOrder(id, opts) {
  const { order } = await square('GET', `/orders/${encodeURIComponent(id)}`, null, opts);
  return order;
}
