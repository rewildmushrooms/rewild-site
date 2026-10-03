import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { quote, PRODUCTS } from '../netlify/functions/_shared/catalog.mjs';
import { encode, verifySignature } from '../netlify/functions/_shared/stripe.mjs';

process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
process.env.MAILERLITE_API_KEY = 'ml_dummy';
process.env.MAILERLITE_GROUP_ID = '123';
process.env.HQ_PASSWORD = 'correct-horse-battery';

// --- mock Stripe + MailerLite over global fetch ---
const calls = [];
const db = { products: [], prices: [], sessions: [], promos: [], coupons: [] };
function parseForm(body) { return Object.fromEntries(new URLSearchParams(body || '')); }
globalThis.fetch = async (url, init = {}) => {
  const u = new URL(url);
  const method = init.method || 'GET';
  const params = method === 'GET' ? Object.fromEntries(u.searchParams) : parseForm(init.body);
  calls.push({ host: u.host, path: u.pathname, method, params, raw: init.body });
  const ok = (j) => new Response(JSON.stringify(j), { status: 200, headers: { 'content-type': 'application/json' } });
  if (u.host === 'connect.mailerlite.com') {
    if (u.pathname.startsWith('/api/groups/')) return ok({ data: { name: 'Rewilders', active_count: 42 } });
    return ok({ data: { id: 'sub_1', email: JSON.parse(init.body).email } });
  }
  const p = u.pathname.replace('/v1', '');
  if (p === '/prices' && method === 'GET') {
    const keys = Object.entries(params).filter(([k]) => k.startsWith('lookup_keys')).map(([, v]) => v);
    return ok({ data: db.prices.filter((x) => keys.includes(x.lookup_key)), has_more: false });
  }
  if (p === '/products/search') return ok({ data: [] });
  if (p === '/products') { const prod = { id: 'prod_' + db.products.length, ...params }; db.products.push(prod); return ok(prod); }
  if (p === '/prices') { const pr = { id: 'price_' + db.prices.length, lookup_key: params.lookup_key, unit_amount: Number(params.unit_amount) }; db.prices.push(pr); return ok(pr); }
  if (p === '/checkout/sessions' && method === 'POST') { const s = { id: 'cs_test_abc', url: 'https://checkout.stripe.com/c/pay/cs_test_abc', params }; db.sessions.push(s); return ok(s); }
  if (p === '/checkout/sessions' && method === 'GET') {
    return ok({ has_more: false, data: [
      { id: 'cs_test_1', created: Math.floor(Date.now() / 1000) - 3600, amount_total: 10000, customer_details: { email: 'a@b.co', name: 'Ann Lee' }, shipping_details: { address: { country: 'CA', city: 'Nelson' } },
        total_details: { amount_shipping: 2000, amount_discount: 1000, breakdown: { discounts: [{ amount: 1000, discount: { promotion_code: 'promo_1' } }] } },
        line_items: { data: [{ description: 'Rewild Energy (100g)', quantity: 1, amount_total: 8000, price: { metadata: { rewild_id: 'energy' } } }] }, payment_intent: 'pi_1' },
      { id: 'cs_test_2', created: Math.floor(Date.now() / 1000) - 7200, amount_total: 5000, customer_details: { email: 'c@d.co', name: 'Cy' }, shipping_details: { address: { country: 'US', city: 'Portland' } },
        total_details: { amount_shipping: 0, amount_discount: 0, breakdown: { discounts: [] } },
        line_items: { data: [{ description: 'Rewild Peace (100g)', quantity: 1, amount_total: 5000, price: { metadata: { rewild_id: 'peace' } } }] } },
    ] });
  }
  if (p === '/invoices' && method === 'GET') return ok({ data: [], has_more: false });
  if (p === '/customers') return ok({ id: 'cus_new' });
  if (p === '/invoices' && method === 'POST') { db.invoices = db.invoices || []; db.invoices.push(params); return ok({ id: 'in_1' }); }
  if (p === '/invoiceitems') { db.invoiceItems = db.invoiceItems || []; db.invoiceItems.push(params); return ok({ id: 'ii_1' }); }
  if (p === '/invoices/in_1/finalize') return ok({ id: 'in_1', status: 'open' });
  if (p === '/invoices/in_1/send') return ok({ id: 'in_1', status: 'open', hosted_invoice_url: 'https://invoice.stripe.com/i/x' });
  if (p.startsWith('/checkout/sessions/')) return ok({ id: p.split('/').pop(), status: 'complete', customer_details: { name: 'Ann Lee', email: 'ann@x.co' }, customer_details: { name: 'Ann Lee' }, amount_total: 10000, currency: 'cad', payment_intent: 'pi_123456789', line_items: { data: [{ description: 'Rewild Energy (100g)', quantity: 1 }] } });
  if (p === '/refunds') return ok({ data: [], has_more: false });
  if (p === '/promotion_codes' && method === 'GET') return ok({ data: [{ id: 'promo_1', code: 'REWILD33', active: true, times_redeemed: 1, coupon: { percent_off: 33 }, restrictions: {} }], has_more: false });
  if (p === '/coupons') { const c = { id: 'co_' + db.coupons.length, ...params }; db.coupons.push(c); return ok(c); }
  if (p === '/promotion_codes') { const pc = { id: 'promo_new', code: params.code, ...params }; db.promos.push(pc); return ok(pc); }
  if (p.startsWith('/promotion_codes/')) return ok({ id: p.split('/').pop(), active: params.active === 'true' });
  return new Response(JSON.stringify({ error: { message: 'unmocked ' + p } }), { status: 404 });
};

const checkout = (await import('../netlify/functions/checkout.mjs')).default;
const webhook = (await import('../netlify/functions/stripe-webhook.mjs')).default;
const subscribe = (await import('../netlify/functions/subscribe.mjs')).default;
const hq = (await import('../netlify/functions/hq.mjs')).default;
const order = (await import('../netlify/functions/order.mjs')).default;

test('quote: Canada flat rate under $175, free at $175+', () => {
  assert.deepEqual(quote([{ id: 'clarity', qty: 1 }], 'CA').shipping, 2000);
  const q = quote([{ id: 'energy', qty: 1 }, { id: 'clarity', qty: 1 }, { id: 'peace', qty: 1 }], 'CA'); // 180
  assert.equal(q.subtotal, 18000); assert.equal(q.shipping, 0); assert.equal(q.free, true);
  assert.equal(quote([{ id: 'energy', qty: 1 }, { id: 'tincture', qty: 1 }, { id: 'peace', qty: 1 }], 'CA').shipping, 2000); // 160
});
test('quote: US never free, ignores bad items and quantities', () => {
  const q = quote([{ id: 'energy', qty: 5 }, { id: 'nope', qty: 1 }, { id: 'peace', qty: 0 }, { id: 'clarity', qty: 999 }], 'US');
  assert.equal(q.lines.length, 1); assert.equal(q.subtotal, 40000); assert.equal(q.shipping, 0); assert.equal(q.quoted, true);
});
test('prices match what Jade set', () => {
  const m = Object.fromEntries(PRODUCTS.map((p) => [p.id, p.price]));
  assert.deepEqual(m, { energy: 8000, clarity: 5000, strength: 5000, peace: 5000, tincture: 3000, duo: 9000 });
});
test('encode builds Stripe nested params', () => {
  const s = decodeURIComponent(encode({ a: { b: [{ c: 1 }] }, d: ['x'] }).join('&'));
  assert.equal(s, 'a[b][0][c]=1&d[0]=x');
});
test('webhook signature verification', () => {
  const payload = '{"x":1}'; const t = Math.floor(Date.now() / 1000);
  const sig = crypto.createHmac('sha256', 'whsec_test').update(`${t}.${payload}`).digest('hex');
  assert.equal(verifySignature(payload, `t=${t},v1=${sig}`, 'whsec_test'), true);
  assert.equal(verifySignature(payload, `t=${t},v1=${sig.replace(/^./, '0')}`, 'whsec_test'), false);
  assert.equal(verifySignature(payload, `t=${t - 1000},v1=${sig}`, 'whsec_test'), false);
});

test('checkout: creates prices once, server-side amounts, CA free shipping + Nelson', async () => {
  const req = new Request('https://rewild.test/api/checkout', { method: 'POST', body: JSON.stringify({ country: 'CA', items: [{ id: 'energy', qty: 2 }, { id: 'clarity', qty: 1 }], price: 1 }) });
  const res = await checkout(req); const data = await res.json();
  assert.equal(res.status, 200); assert.match(data.url, /checkout\.stripe\.com/);
  const s = db.sessions.at(-1).params;
  assert.equal(s['line_items[0][quantity]'], '2');
  assert.equal(s['allow_promotion_codes'], 'true');
  assert.equal(s['shipping_address_collection[allowed_countries][0]'], 'CA');
  assert.equal(s['shipping_options[0][shipping_rate_data][fixed_amount][amount]'], '0'); // 210 > 175
  assert.match(s['shipping_options[1][shipping_rate_data][display_name]'], /Nelson/);
  assert.equal(s['currency'], 'cad');
  assert.equal(db.prices.find((p) => p.lookup_key.startsWith('rewild_energy')).unit_amount, 8000);
  const before = db.prices.length;
  await checkout(new Request('https://rewild.test/api/checkout', { method: 'POST', body: JSON.stringify({ country: 'US', items: [{ id: 'energy', qty: 1 }] }) }));
  assert.equal(db.prices.length, before, 'reuses existing prices');
  const us = db.sessions.at(-1).params;
  assert.equal(us['shipping_address_collection[allowed_countries][0]'], 'US');
  assert.equal(us['shipping_options[0][shipping_rate_data][fixed_amount][amount]'], '0');
  assert.match(us['shipping_options[0][shipping_rate_data][display_name]'], /quoted/);
  assert.equal(us['customer_creation'], 'always');
  assert.equal(us['shipping_options[1][shipping_rate_data][display_name]'], undefined);
});
test('checkout: empty cart rejected', async () => {
  const res = await checkout(new Request('https://rewild.test/api/checkout', { method: 'POST', body: JSON.stringify({ items: [] }) }));
  assert.equal(res.status, 400);
});

test('webhook: opted-in customer is added to MailerLite; bad signature rejected', async () => {
  const event = { type: 'checkout.session.completed', data: { object: { customer_details: { email: 'Buyer@Example.com', name: 'Bea Buyer' }, custom_fields: [{ key: 'newsletter', dropdown: { value: 'yes' } }] } } };
  const payload = JSON.stringify(event); const t = Math.floor(Date.now() / 1000);
  const sig = crypto.createHmac('sha256', 'whsec_test').update(`${t}.${payload}`).digest('hex');
  const n = calls.length;
  const res = await webhook(new Request('https://rewild.test/api/stripe-webhook', { method: 'POST', body: payload, headers: { 'stripe-signature': `t=${t},v1=${sig}` } }));
  const data = await res.json();
  assert.equal(res.status, 200); assert.equal(data.subscribed, 'Buyer@Example.com');
  assert.ok(calls.slice(n).some((c) => c.host === 'connect.mailerlite.com'));
  const bad = await webhook(new Request('https://rewild.test/api/stripe-webhook', { method: 'POST', body: payload, headers: { 'stripe-signature': `t=${t},v1=deadbeef` } }));
  assert.equal(bad.status, 400);
});

test('subscribe: validates email and honeypot', async () => {
  const bad = await subscribe(new Request('https://x/api/subscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'nope' }) }));
  assert.equal(bad.status, 400);
  const ok = await subscribe(new Request('https://x/api/subscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'hi@rewild.ca' }) }));
  assert.equal(ok.status, 200);
  const n = calls.length;
  const bot = await subscribe(new Request('https://x/api/subscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'bot@x.co', website: 'spam' }) }));
  assert.equal(bot.status, 200); assert.equal(calls.length, n, 'honeypot makes no API call');
});

test('hq: rejects wrong password, returns summary and creates coupons', async () => {
  const no = await hq(new Request('https://x/api/hq?action=summary', { headers: { 'x-hq-key': 'wrong' } }));
  assert.equal(no.status, 401);
  const res = await hq(new Request('https://x/api/hq?action=summary&days=30', { headers: { 'x-hq-key': 'correct-horse-battery' } }));
  const s = await res.json();
  assert.equal(res.status, 200);
  assert.equal(s.revenue, 15000); assert.equal(s.orders, 2); assert.equal(s.aov, 7500);
  assert.equal(s.coupons[0].code, 'REWILD33'); assert.equal(s.coupons[0].discount, 1000);
  assert.equal(s.products[0].name, 'Rewild Energy');
  assert.equal(s.subscribers.active, 42); assert.equal(s.mode, 'test');
  assert.equal(s.series.length, 30);
  const c = await hq(new Request('https://x/api/hq', { method: 'POST', headers: { 'x-hq-key': 'correct-horse-battery' }, body: JSON.stringify({ action: 'createCoupon', code: 'fall15', percentOff: 15, maxRedemptions: 50, expiresAt: '2099-12-31', minimumAmount: 60 }) }));
  assert.equal(c.status, 200);
  const pc = db.promos.at(-1);
  assert.equal(pc.code, 'FALL15'); assert.equal(pc.max_redemptions, '50'); assert.equal(pc['restrictions[minimum_amount]'], '6000');
  assert.equal(db.coupons.at(-1).percent_off, '15');
  const badc = await hq(new Request('https://x/api/hq', { method: 'POST', headers: { 'x-hq-key': 'correct-horse-battery' }, body: JSON.stringify({ action: 'createCoupon', code: 'X', percentOff: 15 }) }));
  assert.equal(badc.status, 400);
  const tog = await hq(new Request('https://x/api/hq', { method: 'POST', headers: { 'x-hq-key': 'correct-horse-battery' }, body: JSON.stringify({ action: 'toggleCoupon', id: 'promo_1', active: false }) }));
  assert.equal(tog.status, 200);
});

test('order lookup returns safe fields only', async () => {
  const res = await order(new Request('https://x/api/order?session_id=cs_test_abc123'));
  const o = await res.json();
  assert.equal(o.firstName, 'Ann'); assert.equal(o.total, 10000); assert.equal(o.orderRef, '23456789');
  assert.equal(o.email, undefined);
  assert.equal((await order(new Request('https://x/api/order?session_id=evil'))).status, 400);
});

test('hq: US order flagged and shipping invoice sent', async () => {
  const res = await hq(new Request('https://x/api/hq?action=summary&days=30', { headers: { 'x-hq-key': 'correct-horse-battery' } }));
  const s = await res.json();
  assert.equal(s.recent.find((o) => o.id === 'cs_test_2').needsShippingQuote, true);
  assert.equal(s.recent.find((o) => o.id === 'cs_test_1').needsShippingQuote, false);
  const r = await hq(new Request('https://x/api/hq', { method: 'POST', headers: { 'x-hq-key': 'correct-horse-battery' }, body: JSON.stringify({ action: 'shippingInvoice', sessionId: 'cs_test_2', amount: '28.40' }) }));
  const d = await r.json();
  assert.equal(r.status, 200); assert.match(d.url, /invoice\.stripe\.com/);
  assert.equal(db.invoiceItems.at(-1).amount, '2840');
  assert.equal(db.invoices.at(-1)['metadata[session_id]'], 'cs_test_2');
  assert.equal(db.invoices.at(-1).collection_method, 'send_invoice');
  const bad = await hq(new Request('https://x/api/hq', { method: 'POST', headers: { 'x-hq-key': 'correct-horse-battery' }, body: JSON.stringify({ action: 'shippingInvoice', sessionId: 'cs_test_2', amount: '0' }) }));
  assert.equal(bad.status, 400);
});

test('hq: WW30 expiry lands on Oct 15 Pacific', async () => {
  const r = await hq(new Request('https://x/api/hq', { method: 'POST', headers: { 'x-hq-key': 'correct-horse-battery' }, body: JSON.stringify({ action: 'createCoupon', code: 'WW30', percentOff: 30, expiresAt: '2026-10-15' }) }));
  const pc = db.promos.at(-1);
  if (Date.now() < Date.parse('2026-10-16T06:59:00Z')) {
    assert.equal(r.status, 200);
    assert.equal(new Date(Number(pc.expires_at) * 1000).toISOString(), '2026-10-16T06:59:00.000Z');
    assert.equal(pc.max_redemptions, undefined);
  }
});

test('subscribe: quiz answers sent as MailerLite fields', async () => {
  const n = calls.length;
  const res = await subscribe(new Request('https://x/api/subscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'q@rewild.ca', source: 'quiz', quiz: { stack: 'duo,clarity', want: 'energy,clarity', how: 'drink' } }) }));
  assert.equal(res.status, 200);
  const body = JSON.parse(calls.slice(n).find((c) => c.host === 'connect.mailerlite.com').raw);
  assert.equal(body.fields.source, 'quiz'); assert.equal(body.fields.quiz_stack, 'duo,clarity'); assert.equal(body.fields.quiz_how, 'drink');
});
