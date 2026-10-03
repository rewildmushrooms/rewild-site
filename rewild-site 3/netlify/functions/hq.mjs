// REWILD HQ API. Every request needs header  x-hq-key: <HQ_PASSWORD>
//   GET  /api/hq?action=summary&days=30
//   GET  /api/hq?action=coupons
//   POST /api/hq  { action:'createCoupon', code, percentOff|amountOff, expiresAt, minimumAmount }
//   POST /api/hq  { action:'toggleCoupon', id, active }
//   POST /api/hq  { action:'shippingInvoice', orderId, amount, note? }
// Reads website orders from Square (orders tagged source = rewildmushrooms.com).
import crypto from 'node:crypto';
import { square, idem, locationId, pages, isLive, json } from './_shared/square.mjs';
import { groupStats } from './_shared/mailerlite.mjs';
import { PRODUCTS } from './_shared/catalog.mjs';
import { listPromos, createPromo, setPromoActive } from './_shared/promos.mjs';
import { isPaid, orderRef, buyerName } from './_shared/orders.mjs';

function authorized(req) {
  const expected = process.env.HQ_PASSWORD || '';
  const given = req.headers.get('x-hq-key') || '';
  if (expected.length < 10) return false; // refuse weak or missing passwords
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

const amt = (m) => Number(m?.amount || 0);
const ts = (iso) => Math.floor(Date.parse(iso) / 1000);
const isWebOrder = (o) => o.metadata?.source === 'rewildmushrooms.com';
const INVOICE_TITLE = 'REWILD US shipping + duties';

const productIdFromLine = (li) =>
  li.metadata?.rewild_id || PRODUCTS.find((p) => (li.name || '').startsWith(p.name))?.id || li.name;

export function summarize(orders, days, now = Date.now(), invoices = [], emails = {}) {
  const invByRef = {};
  for (const inv of invoices) {
    const m = /order ([A-Z0-9]{8})/.exec(inv.description || '');
    if (m && !invByRef[m[1]]) invByRef[m[1]] = inv;
  }
  const dayMs = 86400000;
  const start = now - days * dayMs;
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date(start + (i + 1) * dayMs);
    return { date: d.toISOString().slice(0, 10), revenue: 0, orders: 0 };
  });
  const seriesIdx = Object.fromEntries(series.map((s, i) => [s.date, i]));
  const byProduct = {}, byCoupon = {}, byCountry = {};
  let revenue = 0, shipping = 0, discounts = 0, refunded = 0;
  const customers = new Set();
  const paid = orders.filter((o) => isWebOrder(o) && isPaid(o));
  for (const o of paid) {
    const total = amt(o.total_money);
    revenue += total;
    shipping += amt(o.total_service_charge_money);
    discounts += amt(o.total_discount_money);
    refunded += (o.refunds || []).filter((r) => r.status !== 'REJECTED' && r.status !== 'FAILED').reduce((a, r) => a + amt(r.amount_money), 0);
    const email = emails[o.id] || (o.fulfillments || []).map((f) => f.shipment_details?.recipient?.email_address).find(Boolean);
    if (email) customers.add(email.toLowerCase());
    const day = new Date(o.created_at).toISOString().slice(0, 10);
    if (day in seriesIdx) { series[seriesIdx[day]].revenue += total; series[seriesIdx[day]].orders += 1; }
    const addr = (o.fulfillments || []).map((f) => f.shipment_details?.recipient?.address).find(Boolean) || {};
    const country = addr.country || o.metadata?.destination || '??';
    byCountry[country] = byCountry[country] || { orders: 0, revenue: 0 };
    byCountry[country].orders += 1; byCountry[country].revenue += total;
    for (const li of o.line_items || []) {
      const id = productIdFromLine(li);
      byProduct[id] = byProduct[id] || { id, units: 0, revenue: 0 };
      byProduct[id].units += Number(li.quantity) || 0;
      byProduct[id].revenue += amt(li.total_money);
    }
    for (const d of o.discounts || []) {
      const code = d.name || 'discount';
      byCoupon[code] = byCoupon[code] || { code, orders: 0, discount: 0, revenue: 0 };
      byCoupon[code].orders += 1; byCoupon[code].discount += amt(d.applied_money); byCoupon[code].revenue += total;
    }
  }
  const names = Object.fromEntries(PRODUCTS.map((p) => [p.id, p.name]));
  return {
    days,
    revenue, netRevenue: revenue - refunded, refunded, shipping, discounts,
    orders: paid.length,
    aov: paid.length ? Math.round(revenue / paid.length) : 0,
    customers: customers.size,
    series,
    products: Object.values(byProduct).map((p) => ({ ...p, name: names[p.id] || p.id })).sort((a, b) => b.revenue - a.revenue),
    coupons: Object.values(byCoupon).sort((a, b) => b.orders - a.orders),
    countries: byCountry,
    recent: paid.slice(0, 25).map((o) => {
      const addr = (o.fulfillments || []).map((f) => f.shipment_details?.recipient?.address).find(Boolean) || {};
      const country = addr.country || o.metadata?.destination || '';
      const inv = invByRef[orderRef(o.id)];
      return {
        id: o.id,
        ref: orderRef(o.id),
        created: ts(o.created_at),
        name: buyerName(o),
        email: emails[o.id] || (o.fulfillments || []).map((f) => f.shipment_details?.recipient?.email_address).find(Boolean) || '',
        total: amt(o.total_money),
        country,
        city: addr.locality || '',
        items: (o.line_items || []).map((li) => `${li.quantity}x ${li.name}`).join(', '),
        note: (o.fulfillments || []).map((f) => f.shipment_details?.shipping_note).find(Boolean) || '',
        needsShippingQuote: (o.metadata?.destination || country) === 'US',
        shippingInvoice: inv
          ? { id: inv.id, status: inv.status === 'PAID' ? 'paid' : 'sent', amount: amt(inv.payment_requests?.[0]?.computed_amount_money), url: inv.public_url }
          : null,
      };
    }),
  };
}

async function searchOrders(sinceIso, opts) {
  const loc = await locationId(opts);
  return pages((cursor) => square('POST', '/orders/search', {
    location_ids: [loc],
    cursor,
    limit: 500,
    query: {
      filter: { date_time_filter: { created_at: { start_at: sinceIso } }, state_filter: { states: ['OPEN', 'COMPLETED'] } },
      sort: { sort_field: 'CREATED_AT', sort_order: 'DESC' },
    },
  }, opts), 'orders', 3000);
}

async function paymentEmails(sinceIso, opts) {
  const pays = await pages((cursor) => square('GET', `/payments?begin_time=${encodeURIComponent(sinceIso)}&limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, null, opts), 'payments', 3000);
  return Object.fromEntries(pays.filter((p) => p.order_id && p.buyer_email_address).map((p) => [p.order_id, p.buyer_email_address]));
}

async function listInvoices(opts) {
  const loc = await locationId(opts);
  const all = await pages((cursor) => square('GET', `/invoices?location_id=${loc}&limit=200${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, null, opts), 'invoices', 1000);
  return all.filter((i) => i.title === INVOICE_TITLE);
}

async function summary(days, opts) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const [orders, emails, invoices, subs] = await Promise.all([
    searchOrders(since, opts),
    paymentEmails(since, opts).catch(() => ({})),
    listInvoices(opts).catch(() => []),
    groupStats().catch(() => null),
  ]);
  return { ...summarize(orders, days, Date.now(), invoices, emails), subscribers: subs, mode: isLive() ? 'live' : 'test' };
}

async function coupons(opts) {
  const [promos, orders] = await Promise.all([
    listPromos(opts, { fresh: true }),
    searchOrders(new Date(Date.now() - 365 * 86400000).toISOString(), opts).catch(() => []),
  ]);
  const used = {};
  for (const o of orders) if (isWebOrder(o) && isPaid(o)) for (const d of o.discounts || []) used[d.name] = (used[d.name] || 0) + 1;
  return promos.map((p) => ({ ...p, timesRedeemed: used[p.code] || 0 })).sort((a, b) => a.code.localeCompare(b.code));
}

async function findOrCreateCustomer(order, opts) {
  if (order.customer_id) return order.customer_id;
  let email = (order.fulfillments || []).map((f) => f.shipment_details?.recipient?.email_address).find(Boolean);
  const pid = (order.tenders || []).map((t) => t.payment_id || t.id).find(Boolean);
  let payment = null;
  if (pid) payment = (await square('GET', `/payments/${pid}`, null, opts).catch(() => ({}))).payment;
  if (payment?.customer_id) return payment.customer_id;
  email = email || payment?.buyer_email_address;
  if (!email) throw Object.assign(new Error('No email on this order, so an invoice cannot be sent.'), { status: 400 });
  const found = await square('POST', '/customers/search', { query: { filter: { email_address: { exact: email } } }, limit: 1 }, opts).catch(() => ({}));
  if (found.customers?.[0]) return found.customers[0].id;
  const name = buyerName(order).split(' ');
  const { customer } = await square('POST', '/customers', { idempotency_key: idem(), email_address: email, given_name: name[0] || undefined, family_name: name.slice(1).join(' ') || undefined }, opts);
  return customer.id;
}

// US orders: Jade declares the parcel in Zonos, then sends the customer a Square invoice
// for shipping + duties. Square emails it with a secure pay link.
export async function sendShippingInvoice(b, opts) {
  if (!/^[A-Za-z0-9_-]{10,64}$/.test(b.orderId || '')) throw Object.assign(new Error('Bad order id'), { status: 400 });
  const amount = Math.round(Number(b.amount) * 100);
  if (!(amount > 0 && amount < 100000)) throw Object.assign(new Error('Enter the shipping + duties amount in dollars.'), { status: 400 });
  const { order } = await square('GET', `/orders/${b.orderId}`, null, opts);
  const loc = await locationId(opts);
  const customerId = await findOrCreateCustomer(order, opts);
  const ref = orderRef(order.id);
  const { order: invOrder } = await square('POST', '/orders', {
    idempotency_key: idem(),
    order: {
      location_id: loc,
      customer_id: customerId,
      line_items: [{ name: b.note ? `US shipping + duties (${String(b.note).slice(0, 80)})` : 'US shipping + duties', quantity: '1', base_price_money: { amount, currency: 'CAD' } }],
      metadata: { type: 'us_shipping', original_order: order.id },
    },
  }, opts);
  const due = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const { invoice } = await square('POST', '/invoices', {
    idempotency_key: idem(),
    invoice: {
      location_id: loc,
      order_id: invOrder.id,
      primary_recipient: { customer_id: customerId },
      payment_requests: [{ request_type: 'BALANCE', due_date: due }],
      delivery_method: 'EMAIL',
      accepted_payment_methods: { card: true },
      title: INVOICE_TITLE,
      description: `Shipping and duties for your REWILD order ${ref}. Your order ships as soon as this is paid.`,
    },
  }, opts);
  const { invoice: sent } = await square('POST', `/invoices/${invoice.id}/publish`, { version: invoice.version, idempotency_key: idem() }, opts);
  return { id: sent.id, url: sent.public_url, status: sent.status };
}

export default async (req) => {
  if (!authorized(req)) return json(401, { error: 'Wrong password' });
  try {
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const action = url.searchParams.get('action');
      if (action === 'summary') {
        const days = Math.min(365, Math.max(1, Number(url.searchParams.get('days')) || 30));
        return json(200, await summary(days));
      }
      if (action === 'coupons') return json(200, { coupons: await coupons() });
      return json(400, { error: 'Unknown action' });
    }
    if (req.method === 'POST') {
      const b = await req.json();
      if (b.action === 'createCoupon') {
        const p = await createPromo(b);
        return json(200, { ok: true, id: p.id, code: p.code, warning: p.warning });
      }
      if (b.action === 'toggleCoupon') return json(200, await setPromoActive(b.id, b.active));
      if (b.action === 'shippingInvoice') return json(200, { ok: true, ...(await sendShippingInvoice(b)) });
      return json(400, { error: 'Unknown action' });
    }
    return json(405, { error: 'Method not allowed' });
  } catch (err) {
    console.error('hq error', err.message, JSON.stringify(err.square || ''));
    return json(err.status && err.status < 500 ? err.status : 500, { error: err.message });
  }
};

export const config = { path: '/api/hq' };
