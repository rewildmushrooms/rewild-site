// REWILD HQ API. Every request needs headers  x-hq-user: jade|sean|pete  and  x-hq-key: <that person's password>
// (no x-hq-user = Jade, for older bookmarks). Owners see everything; partners see stock and their own sales.
//   GET  /api/hq?action=me
//   GET  /api/hq?action=summary&days=30                     (owner)
//   GET  /api/hq?action=coupons                             (everyone; partners see active codes, read only)
//   GET  /api/hq?action=traffic&days=30                     (owner, Google Analytics)
//   GET  /api/hq?action=alerts                              (owner, things to look at)
//   GET  /api/hq?action=inventory                           (everyone)
//   GET  /api/hq?action=commissions&month=2026-10           (owner: all partners; partner: themselves)
//   POST /api/hq  { action:'setStock', id, quantity }       (everyone)
//   POST /api/hq  { action:'createCoupon', code, percentOff|amountOff, expiresAt, minimumAmount }   (owner)
//   POST /api/hq  { action:'toggleCoupon'|'archiveCoupon'|'onceCoupon'|'noteCoupon', id: CODE, ... }   (owner)
//   POST /api/hq  { action:'shippingInvoice', orderId, amount, note? }   (owner)
//   POST /api/hq  { action:'markShipped', orderId, carrier, tracking, notify }   (owner; emails the customer their tracking)
//   GET  /api/hq?action=people&days=30   customers, carts, email numbers for Overview   (owner)
//   GET  /api/hq?action=customers&q=     GET /api/hq?action=customer&email=              (owner)
//   GET  /api/hq?action=orders&days=30&source=online|offline                             (owner)
//   GET  /api/hq?action=ledger           stock history                                   (everyone)
//   POST /api/hq  { action:'offlineSale', items:[{id,qty}], amount?, note? }              (everyone)
//   POST /api/hq  { action:'restock', items:[{id,qty}], note? }                           (everyone)
//   POST /api/hq  { action:'adjust', id, change, note }                                   (everyone)
// Reads website orders from Square (orders tagged source = rewildmushrooms.com).
import { square, idem, locationId, pages, isLive, json } from './_shared/square.mjs';
import { groupStats, groupCount } from './_shared/mailerlite.mjs';
import { readIndex, readLedger, HIGH_VALUE } from './_shared/data.mjs';
import { recordOfflineSale, recordRestock, recordAdjustment, logCount } from './_shared/ledger.mjs';
import { cartStats } from './_shared/carts.mjs';
import { getJSON, dataStartsAt } from './_shared/store.mjs';
import { stockLevels } from './_shared/inventory.mjs';
import { PRODUCTS } from './_shared/catalog.mjs';
import { listPromos, createPromo, setPromoActive, setPromoArchived, setPromoOnce, setPromoNote } from './_shared/promos.mjs';
import { isPaid, orderRef, buyerName } from './_shared/orders.mjs';
import { TEAM, PARTNERS, COMMISSION_RATE, memberById, partnerForOrder, commissionBase, commissionFor } from './_shared/team.mjs';
import { inventory, setStock } from './_shared/inventory.mjs';
import { checkLowStock, lowStockThreshold } from './_shared/lowstock.mjs';
import { checkPassword } from './_shared/auth.mjs';
import { traffic } from './_shared/ga.mjs';
import { markShipped } from './_shared/shipping.mjs';
import { setOrderStatus, addOrderNote, refundOrder, deleteOrder } from './_shared/orderadmin.mjs';

// Returns the signed-in team member, or null.
export async function authorized(req) {
  const member = memberById(req.headers.get('x-hq-user') || 'jade');
  return member && (await checkPassword(member, req.headers.get('x-hq-key') || '')) ? member : null;
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

// Square orders for HQ's numbers. Starts at the last test-data reset (or go-live), so test orders never show.
async function searchOrders(sinceIso, opts, { all = false } = {}) {
  const loc = await locationId(opts);
  const from = all ? null : await dataStartsAt().catch(() => null);
  if (from && from > sinceIso) sinceIso = from;
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

const buyerKey = (o, emails = {}) => (emails[o.id] || (o.fulfillments || []).map((f) => f.shipment_details?.recipient?.email_address).find(Boolean) || buyerName(o) || o.id).toLowerCase();

// Extra numbers for the Overview: abandoned checkouts, where sales come from, repeat buyers.
export function extras(orders, emails = {}, now = Date.now()) {
  const web = orders.filter(isWebOrder);
  const paid = web.filter(isPaid);
  const unpaid = web.filter((o) => !isPaid(o) && now - Date.parse(o.created_at) > 3600000);
  const src = {};
  for (const o of paid) {
    const hit = partnerForOrder(o);
    const code = (o.metadata?.promo || (o.discounts || [])[0]?.name || '').toUpperCase();
    const name = hit ? `${hit.partner.name.split(' ')[0]} (${hit.via === 'code' ? 'code' : 'share link'})` : code ? 'Other codes' : 'Direct, no code';
    src[name] = src[name] || { name, orders: 0, revenue: 0 };
    src[name].orders += 1; src[name].revenue += amt(o.total_money);
  }
  const perBuyer = {};
  for (const o of paid) { const k = buyerKey(o, emails); perBuyer[k] = (perBuyer[k] || 0) + 1; }
  const buyers = Object.keys(perBuyer).length;
  const repeat = Object.values(perBuyer).filter((n) => n > 1).length;
  return {
    abandoned: { count: unpaid.length, value: unpaid.reduce((a, o) => a + amt(o.total_money), 0) },
    sources: Object.values(src).sort((a, b) => b.revenue - a.revenue),
    repeatBuyers: repeat, repeatRate: buyers ? repeat / buyers : 0,
  };
}

async function summary(days, opts) {
  const now = Date.now();
  const since = new Date(now - days * 86400000).toISOString();
  const [all, emails, invoices, subs] = await Promise.all([
    searchOrders(new Date(now - 2 * days * 86400000).toISOString(), opts),
    paymentEmails(since, opts).catch(() => ({})),
    listInvoices(opts).catch(() => []),
    groupStats().catch(() => null),
  ]);
  const cur = all.filter((o) => o.created_at >= since);
  const prev = summarize(all.filter((o) => o.created_at < since), days, now - days * 86400000);
  return {
    ...summarize(cur, days, now, invoices, emails),
    previous: { revenue: prev.revenue, orders: prev.orders, aov: prev.aov, customers: prev.customers },
    ...extras(cur, emails, now),
    subscribers: subs, mode: isLive() ? 'live' : 'test',
  };
}

// "Heads up" list for Jade: things worth a look, most urgent first.
export function buildAlerts({ inv, promos = [], orders = [], invoices = [], traffic: tr = null, commission = null }, now = Date.now()) {
  const out = [];
  const add = (level, title, detail, tab) => out.push({ level, title, detail, tab });
  const day = 86400000;
  if (inv?.items) {
    for (const i of inv.items) {
      if (i.onHand <= 0) add('urgent', `${i.name} is sold out`, 'Restock, or enter the real count in Inventory if this is wrong.', 'inventory');
      else if (i.onHand <= lowStockThreshold()) add('watch', `${i.name} is running low`, `${i.onHand} left.`, 'inventory');
    }
    for (const b of inv.bundles || []) if (b.canMake <= 0) add('urgent', `${b.name} can't be made`, 'One of its parts is out of stock, so the Duo will oversell.', 'inventory');
  }
  const web = orders.filter(isWebOrder);
  const paid = web.filter(isPaid);
  const invRefs = new Set(invoices.map((i) => (/order ([A-Z0-9]{8})/.exec(i.description || '') || [])[1]).filter(Boolean));
  const waiting = paid.filter((o) => o.metadata?.destination === 'US' && !invRefs.has(orderRef(o.id)));
  if (waiting.length) add('urgent', `${waiting.length} US order${waiting.length === 1 ? '' : 's'} waiting for a shipping quote`, 'Price it in Zonos, then click Send quote in Recent orders.', 'overview');
  const stale = invoices.filter((i) => i.status !== 'PAID' && i.status !== 'CANCELED' && now - Date.parse(i.created_at || 0) > 3 * day);
  if (stale.length) add('watch', `${stale.length} US shipping quote${stale.length === 1 ? '' : 's'} unpaid for 3+ days`, 'Send a friendly nudge, or refund the order if they changed their mind.', 'overview');
  const in7 = (o) => now - Date.parse(o.created_at) <= 7 * day;
  const prev7 = (o) => now - Date.parse(o.created_at) > 7 * day && now - Date.parse(o.created_at) <= 14 * day;
  const rev = (list) => list.reduce((a, o) => a + amt(o.total_money), 0);
  const w = paid.filter(in7), pw = paid.filter(prev7);
  if (!w.length) add('watch', 'No website orders in the last 7 days', 'A good week for an email to the Rewilders list or a social post with a code.', 'codes');
  else if (pw.length && rev(w) < rev(pw) * 0.7) add('watch', `Sales are down ${Math.round((1 - rev(w) / rev(pw)) * 100)}% on last week`, `$${(rev(w) / 100).toFixed(0)} this week vs $${(rev(pw) / 100).toFixed(0)} the week before.`, 'overview');
  else if (pw.length && rev(w) > rev(pw) * 1.3) add('good', `Sales are up ${Math.round((rev(w) / rev(pw) - 1) * 100)}% on last week`, `$${(rev(w) / 100).toFixed(0)} this week. Nice.`, 'overview');
  const abandoned = web.filter((o) => !isPaid(o) && in7(o) && now - Date.parse(o.created_at) > 3600000);
  if (abandoned.length) add('watch', `${abandoned.length} checkout${abandoned.length === 1 ? '' : 's'} started but not paid this week`, `$${(rev(abandoned) / 100).toFixed(0)} left in carts. If it keeps happening, check shipping costs and the checkout page.`, 'overview');
  const used30 = {};
  for (const o of paid) if (now - Date.parse(o.created_at) <= 30 * day) for (const d of o.discounts || []) used30[(d.name || '').toUpperCase()] = 1;
  const nowS = now / 1000;
  for (const p of promos) {
    if (!p.active) continue;
    if (p.expiresAt && p.expiresAt < nowS) add('watch', `${p.code} has expired but is still switched on`, 'Turn it off in Promo codes to keep the list tidy.', 'codes');
    else if (p.expiresAt && p.expiresAt - nowS < 7 * 86400) add('info', `${p.code} ends ${p.expiresOn}`, `Last day to use it is ${p.expiresOn} (11:59 pm Pacific).`, 'codes');
  }
  const unused = promos.filter((p) => p.active && !(p.expiresAt && p.expiresAt < nowS) && !used30[p.code]).map((p) => p.code);
  if (unused.length) add('info', `${unused.length} code${unused.length === 1 ? '' : 's'} not used in 30 days`, `${unused.join(', ')}. Share them, or switch them off.`, 'codes');
  if (tr?.configured && !tr.error) {
    const conv = tr.sessions ? (w.length / tr.sessions) : 0;
    if (tr.sessions >= 100 && conv < 0.01) add('watch', 'Few visits are turning into orders', `${(conv * 100).toFixed(1)}% of ${tr.sessions} visits this week bought. Most shops sit around 1 to 3%.`, 'overview');
    if (tr.previous?.visitors >= 20 && tr.visitors < tr.previous.visitors * 0.7) add('watch', `Visitors are down ${Math.round((1 - tr.visitors / tr.previous.visitors) * 100)}% on last week`, `${tr.visitors} this week vs ${tr.previous.visitors}.`, 'overview');
    else if (tr.previous?.visitors >= 20 && tr.visitors > tr.previous.visitors * 1.3) add('good', `Visitors are up ${Math.round((tr.visitors / tr.previous.visitors - 1) * 100)}% on last week`, `${tr.visitors} this week.`, 'overview');
    if (tr.events?.addToCart >= 10 && tr.events.beginCheckout < tr.events.addToCart * 0.25) add('watch', 'People add to cart but few start checkout', `${tr.events.addToCart} add-to-carts, ${tr.events.beginCheckout} checkouts started this week. Check the cart and shipping price.`, 'overview');
  }
  const owed = (commission?.partners || []).filter((p) => p.commission > 0);
  if (owed.length) add('info', 'Partner commission this month', owed.map((p) => `${p.name.split(' ')[0]} $${(p.commission / 100).toFixed(2)}`).join(', '), 'commissions');
  const order = { urgent: 0, watch: 1, info: 2, good: 3 };
  return out.sort((a, b) => order[a.level] - order[b.level]);
}

async function alerts(opts) {
  const now = Date.now();
  const orders = await searchOrders(new Date(now - 60 * 86400000).toISOString(), opts).catch(() => []);
  const [inv, promos, invoices, tr, com] = await Promise.all([
    inventory(opts, { orders }).catch(() => null),
    listPromos(opts, { fresh: true }).catch(() => []),
    listInvoices(opts).catch(() => []),
    traffic(7).catch(() => null),
    readIndex('orders').then((ix) => commissionReport(orders, monthOf(new Date(now).toISOString()), null, Object.values(ix))).catch(() => commissionReport(orders, monthOf(new Date(now).toISOString()))),
  ]);
  return { alerts: buildAlerts({ inv, promos, orders, invoices, traffic: tr, commission: com }, now), checkedAt: Math.floor(now / 1000) };
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

const monthOf = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Vancouver', year: 'numeric', month: '2-digit' }).format(new Date(iso)).slice(0, 7);

// offline: HQ order summaries (source "offline") with a partner. Commission on the amount received, less refunds.
export function commissionReport(orders, month, onlyPartnerId = null, offline = []) {
  const rows = {};
  for (const p of PARTNERS) if (!onlyPartnerId || p.id === onlyPartnerId) rows[p.id] = { id: p.id, name: p.name, codePrefix: p.codePrefix, ref: p.ref, orders: 0, sales: 0, commission: 0, lines: [] };
  for (const o of orders) {
    if (!isWebOrder(o) || !isPaid(o) || monthOf(o.created_at) !== month) continue;
    const hit = partnerForOrder(o);
    if (!hit || !rows[hit.partner.id]) continue;
    const r = rows[hit.partner.id];
    const base = commissionBase(o), c = commissionFor(o);
    r.orders += 1; r.sales += base; r.commission += c;
    r.lines.push({ ref: orderRef(o.id), created: ts(o.created_at), via: hit.via, code: hit.code, paid: base, commission: c,
      items: (o.line_items || []).map((li) => `${li.quantity}x ${li.name}`).join(', ') });
  }
  for (const o of offline) {
    if (o.source !== 'offline' || !o.partner || !rows[o.partner] || monthOf(o.at) !== month || ['cancelled', 'refunded'].includes(o.status)) continue;
    const r = rows[o.partner];
    const base = Math.max(0, (o.total || 0) - (o.refunded || 0)), c = Math.round(base * COMMISSION_RATE);
    r.orders += 1; r.sales += base; r.commission += c;
    r.lines.push({ ref: String(o.id).slice(-8).toUpperCase(), created: ts(o.at), via: 'offline', code: '', paid: base, commission: c, items: o.items });
  }
  for (const r of Object.values(rows)) r.lines.sort((a, b) => b.created - a.created);
  return { month, rate: COMMISSION_RATE, partners: Object.values(rows) };
}

async function commissions(month, member, opts) {
  const [y, m] = month.split('-').map(Number);
  const since = new Date(Date.UTC(y, m - 1, 1) - 86400000).toISOString();
  const orders = (await searchOrders(since, opts)).filter((o) => Date.parse(o.created_at) < Date.UTC(y, m, 2));
  const offline = Object.values(await readIndex('orders')).filter((o) => o.source === 'offline');
  return commissionReport(orders, month, member.role === 'owner' ? null : member.id, offline);
}

async function stock(opts) {
  const orders = await searchOrders(new Date(Date.now() - 120 * 86400000).toISOString(), opts, { all: true }).catch(() => []);
  const inv = await inventory(opts, { orders });
  // Sends any due low-stock email, and clears the flag for products restocked above the line.
  try { await checkLowStock(Object.fromEntries(inv.items.filter((i) => i.tracked).map((i) => [i.id, i.onHand]))); } catch (e) { console.error('low stock check failed', e.message); }
  inv.lowStockAt = lowStockThreshold();
  return inv;
}

const denied = () => json(403, { error: 'Only Jade can do that.' });
const ALL_DAYS = 1095;
const parseDays = (v) => (v === 'all' ? ALL_DAYS : Math.min(ALL_DAYS, Math.max(1, Number(v) || 30)));
const sinceMs = (days, now = Date.now()) => (days >= ALL_DAYS ? 0 : now - days * 86400000);

// Customers, carts and email numbers for the Overview (from the REWILD data layer + MailerLite).
export async function people(days, now = Date.now()) {
  const [cust, carts, orders] = await Promise.all([readIndex('customers'), readIndex('carts'), readIndex('orders')]);
  const since = sinceMs(days, now);
  const list = Object.values(cust);
  const buyers = list.filter((c) => c.orders > 0);
  const repeat = buyers.filter((c) => c.orders >= 2);
  const ltv = buyers.reduce((a, c) => a + c.ltv, 0);
  const newCustomers = buyers.filter((c) => c.first && Date.parse(c.first) >= since).length;
  const groups = { main: process.env.MAILERLITE_GROUP_ID, quiz: process.env.MAILERLITE_QUIZ_GROUP_ID, customers: process.env.MAILERLITE_CUSTOMERS_GROUP_ID };
  const counts = {};
  await Promise.all(Object.entries(groups).map(async ([k, id]) => { counts[k] = await groupCount(id).catch(() => null); }));
  const offline = Object.values(orders).filter((o) => o.source === 'offline').sort((a, b) => String(b.at).localeCompare(String(a.at)));
  return {
    customers: buyers.length,
    newCustomers,
    repeatCustomers: repeat.length,
    repeatRate: buyers.length ? repeat.length / buyers.length : 0,
    avgLifetimeValue: buyers.length ? Math.round(ltv / buyers.length) : 0,
    highValue: buyers.filter((c) => c.ltv >= HIGH_VALUE).length,
    prospects: list.length - buyers.length,
    consented: list.filter((c) => c.consent).length,
    quizLeads: list.filter((c) => c.quiz).length,
    email: { subscribers: counts.main, quiz: counts.quiz, customers: counts.customers },
    carts: cartStats(carts, since),
    recentCustomers: list.filter((c) => c.lastActivity).sort((a, b) => String(b.lastActivity).localeCompare(String(a.lastActivity))).slice(0, 6),
    recentOffline: offline.slice(0, 5),
  };
}

export async function customersList(q = '') {
  const s = String(q).trim().toLowerCase();
  const list = Object.values(await readIndex('customers'))
    .filter((c) => !s || c.email.includes(s) || String(c.name || '').toLowerCase().includes(s))
    .sort((a, b) => String(b.lastActivity || '').localeCompare(String(a.lastActivity || '')));
  return { total: list.length, customers: list.slice(0, 200) };
}

export async function customerDetail(email) {
  const e = String(email || '').trim().toLowerCase();
  const c = await getJSON('customers', e);
  if (!c) throw Object.assign(new Error('Customer not found'), { status: 404 });
  const [orders, carts] = await Promise.all([readIndex('orders'), readIndex('carts')]);
  const summary = (await readIndex('customers'))[e] || null;
  return {
    customer: { email: c.email, name: c.name || null, since: c.firstOrderAt || c.createdAt, lastOrder: c.lastOrderAt || null, orders: c.orderCount || 0, ltv: c.lifetimeValue || 0, avg: c.averageOrder || 0,
      products: c.products || {}, quiz: c.quiz || null, consent: !!c.marketingConsent, consentAt: c.marketingConsentAt || null, consentSource: c.marketingConsentSource || null,
      codes: c.codesUsed || [], noReminders: !!c.noReminders, source: c.firstSource || null, segments: summary?.segments || [] },
    orders: Object.values(orders).filter((o) => o.email === e).sort((a, b) => String(b.at).localeCompare(String(a.at))),
    carts: Object.values(carts).filter((x) => x.email === e).sort((a, b) => String(b.at).localeCompare(String(a.at))),
  };
}

export async function ordersList(days, source, now = Date.now()) {
  const since = sinceMs(days, now);
  const list = Object.values(await readIndex('orders'))
    .filter((o) => Date.parse(o.at) >= since && (!source || o.source === source))
    .sort((a, b) => String(b.at).localeCompare(String(a.at)));
  return { orders: list.slice(0, 300), total: list.length, revenue: list.reduce((a, o) => a + o.total - (o.refunded || 0), 0) };
}

export default async (req) => {
  const member = await authorized(req);
  if (!member) return json(401, { error: 'Wrong name or password' });
  const owner = member.role === 'owner';
  try {
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const action = url.searchParams.get('action');
      if (action === 'me') return json(200, { id: member.id, name: member.name, role: member.role, mode: isLive() ? 'live' : 'test',
        partners: PARTNERS.filter((p) => owner || p.id === member.id).map((p) => ({ id: p.id, name: p.name, codePrefix: p.codePrefix, ref: p.ref })) });
      if (action === 'inventory') return json(200, await stock());
      if (action === 'ledger') return json(200, { ledger: (await readLedger()).slice(0, 200) });
      if (action === 'commissions') {
        const month = /^\d{4}-\d{2}$/.test(url.searchParams.get('month') || '') ? url.searchParams.get('month') : monthOf(new Date().toISOString());
        return json(200, await commissions(month, member));
      }
      if (action === 'coupons') {
        const list = await coupons();
        return json(200, { coupons: owner ? list : list.filter((c) => !c.archived) });
      }
      if (!owner) return denied();
      if (action === 'summary') {
        const days = parseDays(url.searchParams.get('days'));
        return json(200, await summary(days));
      }
      if (action === 'people') return json(200, await people(parseDays(url.searchParams.get('days'))));
      if (action === 'customers') return json(200, await customersList(url.searchParams.get('q') || ''));
      if (action === 'customer') return json(200, await customerDetail(url.searchParams.get('email')));
      if (action === 'orders') {
        const src = ['online', 'offline'].includes(url.searchParams.get('source')) ? url.searchParams.get('source') : null;
        return json(200, await ordersList(parseDays(url.searchParams.get('days')), src));
      }
      if (action === 'alerts') return json(200, await alerts());
      if (action === 'traffic') {
        const days = Math.min(365, parseDays(url.searchParams.get('days')));
        try { return json(200, await traffic(days)); } catch (e) { return json(200, { configured: true, error: e.message }); }
      }
      return json(400, { error: 'Unknown action' });
    }
    if (req.method === 'POST') {
      const b = await req.json();
      if (b.action === 'offlineSale') return json(200, { ok: true, ...(await recordOfflineSale(b, member)) });
      if (b.action === 'restock') return json(200, { ok: true, ...(await recordRestock(b, member)) });
      if (b.action === 'adjust') return json(200, { ok: true, ...(await recordAdjustment(b, member)) });
      if (b.action === 'setStock') {
        const before = (await stockLevels().catch(() => ({})))[b.id];
        const r = await setStock(b.id, b.quantity);
        try { await logCount(r.id, before, r.onHand, member); } catch (e) { console.error('ledger failed', e.message); }
        console.log('stock set', member.id, r.id, r.onHand);
        try { await checkLowStock({ [r.id]: r.onHand }); } catch (e) { console.error('low stock check failed', e.message); }
        return json(200, { ok: true, ...r });
      }
      if (!owner) return denied();
      if (b.action === 'createCoupon') {
        const p = await createPromo(b);
        return json(200, { ok: true, id: p.id, code: p.code, warning: p.warning });
      }
      if (b.action === 'toggleCoupon') return json(200, await setPromoActive(b.id, b.active));
      if (b.action === 'archiveCoupon') return json(200, await setPromoArchived(b.id, !!b.archived));
      if (b.action === 'onceCoupon') return json(200, await setPromoOnce(b.id, !!b.once));
      if (b.action === 'noteCoupon') return json(200, await setPromoNote(b.id, b.note));
      if (b.action === 'markShipped') return json(200, await markShipped(b, member));
      if (b.action === 'orderStatus') return json(200, await setOrderStatus(b, member));
      if (b.action === 'orderNote') return json(200, await addOrderNote(b, member));
      if (b.action === 'refundOrder') { console.log('refund', member.id, b.orderId, b.amount || 'all'); return json(200, await refundOrder(b, member)); }
      if (b.action === 'deleteOrder') { console.log('order deleted', member.id, b.orderId); return json(200, await deleteOrder(b, member)); }
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
