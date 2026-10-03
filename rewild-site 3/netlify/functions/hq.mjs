// REWILD HQ API. Every request needs header  x-hq-key: <HQ_PASSWORD>
//   GET  /api/hq?action=summary&days=30
//   GET  /api/hq?action=coupons
//   POST /api/hq  { action:'createCoupon', code, percentOff|amountOff, maxRedemptions, expiresAt, minimumAmount, firstTimeOnly }
//   POST /api/hq  { action:'toggleCoupon', id, active }
import crypto from 'node:crypto';
import { stripe, listAll, json } from './_shared/stripe.mjs';
import { groupStats } from './_shared/mailerlite.mjs';
import { PRODUCTS } from './_shared/catalog.mjs';

function authorized(req) {
  const expected = process.env.HQ_PASSWORD || '';
  const given = req.headers.get('x-hq-key') || '';
  if (expected.length < 10) return false; // refuse weak or missing passwords
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

const productIdFromLine = (li) =>
  li.price?.metadata?.rewild_id ||
  PRODUCTS.find((p) => (li.description || '').startsWith(p.name))?.id ||
  li.description;

export function summarize(sessions, refunds, promoCodes, days, now = Date.now(), invoices = []) {
  const invBySession = {};
  for (const inv of invoices) if (inv.metadata?.session_id && !invBySession[inv.metadata.session_id]) invBySession[inv.metadata.session_id] = inv;
  const dayMs = 86400000;
  const start = now - days * dayMs;
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date(start + (i + 1) * dayMs);
    return { date: d.toISOString().slice(0, 10), revenue: 0, orders: 0 };
  });
  const seriesIdx = Object.fromEntries(series.map((s, i) => [s.date, i]));
  const promoById = Object.fromEntries(promoCodes.map((p) => [p.id, p.code]));
  const byProduct = {};
  const byCoupon = {};
  const byCountry = {};
  let revenue = 0, shipping = 0, discounts = 0;
  const customers = new Set();
  for (const s of sessions) {
    const total = s.amount_total || 0;
    revenue += total;
    shipping += s.total_details?.amount_shipping || 0;
    discounts += s.total_details?.amount_discount || 0;
    if (s.customer_details?.email) customers.add(s.customer_details.email.toLowerCase());
    const day = new Date(s.created * 1000).toISOString().slice(0, 10);
    if (day in seriesIdx) { series[seriesIdx[day]].revenue += total; series[seriesIdx[day]].orders += 1; }
    const country = s.shipping_details?.address?.country || s.customer_details?.address?.country || s.metadata?.destination || '??';
    byCountry[country] = byCountry[country] || { orders: 0, revenue: 0 };
    byCountry[country].orders += 1; byCountry[country].revenue += total;
    for (const li of s.line_items?.data || []) {
      const id = productIdFromLine(li);
      byProduct[id] = byProduct[id] || { id, units: 0, revenue: 0 };
      byProduct[id].units += li.quantity || 0;
      byProduct[id].revenue += li.amount_total || 0;
    }
    for (const d of s.total_details?.breakdown?.discounts || []) {
      const code = promoById[d.discount?.promotion_code] || d.discount?.coupon?.name || d.discount?.coupon?.id || 'coupon';
      byCoupon[code] = byCoupon[code] || { code, orders: 0, discount: 0, revenue: 0 };
      byCoupon[code].orders += 1; byCoupon[code].discount += d.amount || 0; byCoupon[code].revenue += total;
    }
  }
  const refunded = refunds.reduce((a, r) => a + (r.status === 'succeeded' || r.status === 'pending' ? r.amount : 0), 0);
  const names = Object.fromEntries(PRODUCTS.map((p) => [p.id, p.name]));
  return {
    days,
    revenue, netRevenue: revenue - refunded, refunded, shipping, discounts,
    orders: sessions.length,
    aov: sessions.length ? Math.round(revenue / sessions.length) : 0,
    customers: customers.size,
    series,
    products: Object.values(byProduct).map((p) => ({ ...p, name: names[p.id] || p.id })).sort((a, b) => b.revenue - a.revenue),
    coupons: Object.values(byCoupon).sort((a, b) => b.orders - a.orders),
    countries: byCountry,
    recent: sessions.slice(0, 25).map((s) => ({
      id: s.id,
      created: s.created,
      name: s.customer_details?.name || '',
      email: s.customer_details?.email || '',
      total: s.amount_total,
      country: s.shipping_details?.address?.country || '',
      city: s.shipping_details?.address?.city || '',
      items: (s.line_items?.data || []).map((li) => `${li.quantity}x ${li.description}`).join(', '),
      paymentIntent: s.payment_intent,
      needsShippingQuote: (s.metadata?.destination || s.shipping_details?.address?.country) === 'US',
      shippingInvoice: invBySession[s.id]
        ? { id: invBySession[s.id].id, status: invBySession[s.id].status, amount: invBySession[s.id].amount_due, url: invBySession[s.id].hosted_invoice_url }
        : null,
    })),
  };
}

async function summary(days) {
  const since = Math.floor(Date.now() / 1000) - days * 86400;
  const [sessions, refunds, promos, subs, invoices] = await Promise.all([
    listAll('/checkout/sessions', { status: 'complete', 'created[gte]': since, expand: ['data.line_items', 'data.total_details.breakdown'] }, 1000),
    listAll('/refunds', { 'created[gte]': since }, 1000).catch(() => []),
    listAll('/promotion_codes', {}, 500).catch(() => []),
    groupStats().catch(() => null),
    listAll('/invoices', { 'created[gte]': since }, 500).catch(() => []),
  ]);
  return { ...summarize(sessions, refunds, promos, days, Date.now(), invoices), subscribers: subs, mode: (process.env.STRIPE_SECRET_KEY || '').startsWith('sk_live') ? 'live' : 'test' };
}

async function coupons() {
  const promos = await listAll('/promotion_codes', { expand: ['data.coupon'] }, 500);
  return promos.map((p) => ({
    id: p.id,
    code: p.code,
    active: p.active,
    timesRedeemed: p.times_redeemed,
    maxRedemptions: p.max_redemptions,
    expiresAt: p.expires_at,
    created: p.created,
    percentOff: p.coupon?.percent_off ?? null,
    amountOff: p.coupon?.amount_off ?? null,
    minimumAmount: p.restrictions?.minimum_amount ?? null,
    firstTimeOnly: !!p.restrictions?.first_time_transaction,
  }));
}

export async function createCoupon(b, opts) {
  const code = String(b.code || '').trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) throw Object.assign(new Error('Code must be 3 to 30 letters, numbers, - or _.'), { status: 400 });
  const pct = b.percentOff ? Number(b.percentOff) : null;
  const amt = b.amountOff ? Math.round(Number(b.amountOff) * 100) : null;
  if (!(pct > 0 && pct <= 100) && !(amt > 0)) throw Object.assign(new Error('Enter a percent off (1 to 100) or a dollar amount off.'), { status: 400 });
  const coupon = await stripe('POST', '/coupons', {
    name: code,
    duration: 'once',
    ...(pct ? { percent_off: pct } : { amount_off: amt, currency: 'cad' }),
    metadata: { created_by: 'rewild_hq' },
  }, opts);
  const params = { coupon: coupon.id, code, metadata: { created_by: 'rewild_hq' } };
  if (b.maxRedemptions) params.max_redemptions = Math.floor(Number(b.maxRedemptions));
  if (b.expiresAt) {
    // Expires at 11:59 pm Pacific time on the chosen date.
    const ts = Math.floor(new Date(`${b.expiresAt}T23:59:00-07:00`).getTime() / 1000);
    if (ts > Date.now() / 1000) params.expires_at = ts;
  }
  const restrictions = {};
  if (b.minimumAmount) { restrictions.minimum_amount = Math.round(Number(b.minimumAmount) * 100); restrictions.minimum_amount_currency = 'cad'; }
  if (b.firstTimeOnly) restrictions.first_time_transaction = true;
  if (Object.keys(restrictions).length) params.restrictions = restrictions;
  return stripe('POST', '/promotion_codes', params, opts);
}

// US orders: Jade declares the parcel in Zonos, then sends the customer a Stripe invoice
// for shipping + duties. Stripe emails it with a secure pay link.
export async function sendShippingInvoice(b, opts) {
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(b.sessionId || '')) throw Object.assign(new Error('Bad order id'), { status: 400 });
  const amount = Math.round(Number(b.amount) * 100);
  if (!(amount > 0 && amount < 100000)) throw Object.assign(new Error('Enter the shipping + duties amount in dollars.'), { status: 400 });
  const s = await stripe('GET', `/checkout/sessions/${b.sessionId}`, null, opts);
  let customer = s.customer;
  if (!customer) {
    const c = await stripe('POST', '/customers', { email: s.customer_details?.email, name: s.customer_details?.name }, opts);
    customer = c.id;
  }
  const ref = String(s.payment_intent || s.id).slice(-8).toUpperCase();
  const inv = await stripe('POST', '/invoices', {
    customer,
    collection_method: 'send_invoice',
    days_until_due: 7,
    currency: 'cad',
    auto_advance: false,
    pending_invoice_items_behavior: 'exclude',
    description: `Shipping and duties for your REWILD order ${ref}. Your order ships as soon as this is paid.`,
    metadata: { session_id: s.id, order_ref: ref, type: 'us_shipping' },
  }, opts);
  await stripe('POST', '/invoiceitems', {
    customer,
    invoice: inv.id,
    amount,
    currency: 'cad',
    description: b.note ? `US shipping + duties (${String(b.note).slice(0, 80)})` : 'US shipping + duties',
  }, opts);
  await stripe('POST', `/invoices/${inv.id}/finalize`, {}, opts);
  const sent = await stripe('POST', `/invoices/${inv.id}/send`, {}, opts);
  return { id: sent.id, url: sent.hosted_invoice_url, status: sent.status };
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
        const p = await createCoupon(b);
        return json(200, { ok: true, id: p.id, code: p.code });
      }
      if (b.action === 'shippingInvoice') return json(200, { ok: true, ...(await sendShippingInvoice(b)) });
      if (b.action === 'toggleCoupon') {
        if (!/^promo_[A-Za-z0-9]+$/.test(b.id || '')) return json(400, { error: 'Bad id' });
        await stripe('POST', `/promotion_codes/${b.id}`, { active: !!b.active });
        return json(200, { ok: true });
      }
      return json(400, { error: 'Unknown action' });
    }
    return json(405, { error: 'Method not allowed' });
  } catch (err) {
    console.error('hq error', err.message, err.stripe);
    return json(err.status && err.status < 500 ? err.status : 500, { error: err.message });
  }
};

export const config = { path: '/api/hq' };
