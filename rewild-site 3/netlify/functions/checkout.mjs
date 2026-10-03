// POST /api/checkout  { items: [{id, qty}], country: 'CA' | 'US', code?: 'SEAN20', newsletter?: true }
// Creates a Square payment link. Prices, shipping and promo codes are all checked server-side
// (the browser is never trusted for amounts).
import { PRODUCTS, PRODUCT_BY_ID, SHIPPING, quote } from './_shared/catalog.mjs';
import { square, idem, locationId, json } from './_shared/square.mjs';
import { validatePromo, orderDiscount } from './_shared/promos.mjs';
import { SITE_EMAIL } from './_shared/config.mjs';

const CUR = 'CAD';

export async function buildPaymentLink(body, siteUrl, opts) {
  const country = body?.country === 'US' ? 'US' : 'CA';
  const q = quote(body?.items, country);
  if (q.lines.length === 0) throw Object.assign(new Error('Your cart is empty.'), { status: 400 });
  let promo = null;
  if (body?.code) promo = (await validatePromo(body.code, q.subtotal, opts)).promo;
  const ship = SHIPPING[country];
  const summary = q.lines.map((l) => `${l.qty}x ${l.id}`).join(', ');
  const order = {
    location_id: await locationId(opts),
    line_items: q.lines.map((l) => {
      const p = PRODUCT_BY_ID[l.id];
      return {
        name: `${p.name} (${p.size})`,
        quantity: String(l.qty),
        base_price_money: { amount: p.price, currency: CUR },
        metadata: { rewild_id: p.id },
      };
    }),
    metadata: {
      source: 'rewildmushrooms.com',
      destination: country,
      cart: summary.slice(0, 255),
      newsletter: body?.newsletter ? 'yes' : 'no',
      ...(promo ? { promo: promo.code } : {}),
    },
  };
  if (promo) order.discounts = [orderDiscount(promo)];
  const checkout_options = {
    ask_for_shipping_address: true,
    redirect_url: `${siteUrl}/order-confirmed/`,
    merchant_support_email: SITE_EMAIL,
    allow_tipping: false,
    enable_coupon: false,
    enable_loyalty: false,
    accepted_payment_methods: { apple_pay: true, google_pay: true },
  };
  if (!ship.quotedAfterOrder && !q.free) {
    checkout_options.shipping_fee = { name: ship.standardName, charge: { amount: ship.flatRate, currency: CUR } };
  }
  if (country === 'CA' && ship.localDelivery?.enabled) {
    checkout_options.custom_fields = [{ title: 'In Nelson? Ask for Mon/Tue hand delivery' }];
  }
  const res = await square('POST', '/online-checkout/payment-links', {
    idempotency_key: idem(),
    description: `REWILD website order: ${summary}`.slice(0, 255),
    order,
    checkout_options,
    pre_populated_data: { buyer_address: { country } },
  }, opts);
  return { url: res.payment_link.url, orderId: res.payment_link.order_id };
}

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
  let body;
  try { body = await req.json(); } catch { return json(400, { error: 'Invalid request' }); }
  const siteUrl = (process.env.SITE_URL || new URL(req.url).origin).replace(/\/$/, '');
  try {
    return json(200, await buildPaymentLink(body, siteUrl));
  } catch (err) {
    console.error('checkout error', err.message, JSON.stringify(err.square || ''));
    return json(err.status === 400 ? 400 : 500, {
      error: err.status === 400 ? err.message : 'Checkout is having a moment. Please try again, or email us and we will sort it out.',
    });
  }
};

export const config = { path: '/api/checkout' };

export { PRODUCTS };
