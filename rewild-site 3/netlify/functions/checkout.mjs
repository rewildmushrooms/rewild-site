// POST /api/checkout  { email, items: [{id, qty}], country: 'CA' | 'US', code?: 'SEAN20', ref?: 'sean', newsletter?: true }
// The email step saves the cart first (for order confirmation and, if they said yes, cart reminders).
// Creates a Square payment link. Prices, shipping and promo codes are all checked server-side
// (the browser is never trusted for amounts).
import { PRODUCTS, PRODUCT_BY_ID, SHIPPING, quote } from './_shared/catalog.mjs';
import { square, idem, locationId, json } from './_shared/square.mjs';
import { validatePromo, orderDiscount, discountFor } from './_shared/promos.mjs';
import { SITE_EMAIL } from './_shared/config.mjs';
import { partnerByRef } from './_shared/team.mjs';
import { isEmail, addSubscriber } from './_shared/mailerlite.mjs';
import { newCart, saveCart, touchCustomer, setOpenCart } from './_shared/carts.mjs';
import { emailKey } from './_shared/record.mjs';

const CUR = 'CAD';

export async function buildPaymentLink(body, siteUrl, opts) {
  const country = body?.country === 'US' ? 'US' : 'CA';
  const q = quote(body?.items, country);
  if (q.lines.length === 0) throw Object.assign(new Error('Your cart is empty.'), { status: 400 });
  let promo = null;
  if (body?.code) promo = (await validatePromo(body.code, q.subtotal, opts)).promo;
  const ship = SHIPPING[country];
  const ref = partnerByRef(body?.ref)?.ref; // partner share link (?ref=sean), for commission
  const summary = q.lines.map((l) => `${l.qty}x ${l.id}`).join(', ');
  const email = body?.email ? emailKey(body.email) : '';
  if (email && !isEmail(email)) throw Object.assign(new Error('Please check your email address.'), { status: 400 });
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
      ...(body?.cartId ? { cart: body.cartId } : {}),
      ...(promo ? { promo: promo.code } : {}),
      ...(ref ? { ref } : {}),
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
    pre_populated_data: { buyer_address: { country }, ...(email ? { buyer_email: email } : {}) },
  }, opts);
  return { url: res.payment_link.url, orderId: res.payment_link.order_id, subtotal: q.subtotal, lines: q.lines, promo };
}

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
  let body;
  try { body = await req.json(); } catch { return json(400, { error: 'Invalid request' }); }
  const siteUrl = (process.env.SITE_URL || new URL(req.url).origin).replace(/\/$/, '');
  try {
    const email = emailKey(body?.email);
    if (!isEmail(email)) return json(400, { error: 'Please enter your email so we can send your order confirmation.' });
    const consent = !!body?.newsletter;
    const cart = newCart({ email, consent, country: body?.country === 'US' ? 'US' : 'CA', code: body?.code ? String(body.code).toUpperCase().slice(0, 30) : null, ref: body?.ref || null });
    const out = await buildPaymentLink({ ...body, email, cartId: cart.id }, siteUrl);
    cart.items = out.lines.map((l) => ({ id: l.id, qty: l.qty }));
    cart.value = out.subtotal - (out.promo ? discountFor(out.promo, out.subtotal) : 0);
    cart.orderId = out.orderId;
    // Saving the cart and customer must never block checkout.
    try {
      await saveCart(cart);
      await touchCustomer(email, { consent, source: 'checkout' });
      await setOpenCart(email, true);
    } catch (e) { console.error('cart save failed', e.message); }
    if (consent) {
      const today = new Date().toISOString().slice(0, 10);
      const groups = [process.env.MAILERLITE_GROUP_ID].filter(Boolean);
      try { await addSubscriber(email, { signup_source: 'checkout', marketing_consent: 'yes', marketing_consent_source: 'checkout', marketing_consent_at: today }, { groups }); }
      catch { try { await addSubscriber(email, { signup_source: 'checkout' }, { groups }); } catch (e) { console.error('checkout subscribe failed', e.message); } }
    }
    return json(200, { url: out.url, orderId: out.orderId });
  } catch (err) {
    console.error('checkout error', err.message, JSON.stringify(err.square || ''));
    return json(err.status === 400 ? 400 : 500, {
      error: err.status === 400 ? err.message : 'Checkout is having a moment. Please try again, or email us and we will sort it out.',
    });
  }
};

export const config = { path: '/api/checkout' };

export { PRODUCTS };
