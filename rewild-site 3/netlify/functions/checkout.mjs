// POST /api/checkout  { items: [{id, qty}], country: 'CA' | 'US' }
// Creates a Stripe Checkout Session with server-side prices (never trusts the browser),
// the right shipping options for the destination, and promo codes enabled.
import { PRODUCTS, PRODUCT_BY_ID, SHIPPING, CURRENCY, quote } from './_shared/catalog.mjs';
import { stripe, json } from './_shared/stripe.mjs';

const priceCache = new Map();
const lookupKey = (p) => `rewild_${p.id}_${p.price}_${CURRENCY}`;

// Finds the Stripe Price for a product, creating the Product/Price the first time.
// Lookup keys include the amount, so changing a price in catalog.mjs creates a new Price automatically.
export async function ensurePrices(ids, siteUrl, opts) {
  const need = ids.map((id) => PRODUCT_BY_ID[id]).filter((p) => !priceCache.has(lookupKey(p)));
  if (need.length) {
    const found = await stripe('GET', '/prices', { lookup_keys: need.map(lookupKey), active: true, limit: 100 }, opts);
    for (const pr of found.data) priceCache.set(pr.lookup_key, pr.id);
    for (const p of need) {
      if (priceCache.has(lookupKey(p))) continue;
      const prodSearch = await stripe('GET', '/products/search', { query: `metadata['rewild_id']:'${p.id}'` }, opts).catch(() => ({ data: [] }));
      let product = prodSearch.data?.[0];
      if (!product) {
        product = await stripe('POST', '/products', {
          name: `${p.name} (${p.size})`,
          description: `${p.mushroom}, ${p.latin}. ${p.format}.`,
          images: siteUrl ? [siteUrl + p.image.replace('.webp', '.jpg')] : undefined,
          metadata: { rewild_id: p.id, slug: p.slug },
        }, opts);
      }
      const price = await stripe('POST', '/prices', {
        product: product.id,
        currency: CURRENCY,
        unit_amount: p.price,
        lookup_key: lookupKey(p),
        transfer_lookup_key: true,
        metadata: { rewild_id: p.id },
      }, opts);
      priceCache.set(lookupKey(p), price.id);
    }
  }
  return Object.fromEntries(ids.map((id) => [id, priceCache.get(lookupKey(PRODUCT_BY_ID[id]))]));
}

export function shippingOptions(country, q) {
  const s = SHIPPING[country];
  const est = { minimum: { unit: 'business_day', value: s.minDays }, maximum: { unit: 'business_day', value: s.maxDays } };
  const rate = (name, amount, withEstimate = true) => ({
    shipping_rate_data: {
      type: 'fixed_amount',
      display_name: name,
      fixed_amount: { amount, currency: CURRENCY },
      delivery_estimate: withEstimate ? est : undefined,
    },
  });
  if (s.quotedAfterOrder) return [rate(s.standardName, 0)];
  const opts = [q.free ? rate(s.freeName, 0) : rate(s.standardName, s.flatRate)];
  if (country === 'CA' && s.localDelivery?.enabled) {
    opts.push(rate(s.localDelivery.name, q.free ? 0 : s.flatRate, false));
  }
  return opts;
}

export async function buildSession(body, siteUrl, opts) {
  const country = body?.country === 'US' ? 'US' : 'CA';
  const q = quote(body?.items, country);
  if (q.lines.length === 0) throw Object.assign(new Error('Your cart is empty.'), { status: 400 });
  const prices = await ensurePrices(q.lines.map((l) => l.id), siteUrl, opts);
  const summary = q.lines.map((l) => `${l.qty}x ${l.id}`).join(', ');
  return stripe('POST', '/checkout/sessions', {
    mode: 'payment',
    currency: CURRENCY,
    line_items: q.lines.map((l) => ({ price: prices[l.id], quantity: l.qty })),
    allow_promotion_codes: true,
    shipping_address_collection: { allowed_countries: [country] },
    shipping_options: shippingOptions(country, q),
    phone_number_collection: { enabled: true },
    customer_creation: 'always',
    billing_address_collection: 'auto',
    custom_fields: [
      {
        key: 'newsletter',
        label: { type: 'custom', custom: 'Join the Rewilders email list?' },
        type: 'dropdown',
        optional: true,
        dropdown: { options: [{ label: 'Yes, keep me posted', value: 'yes' }, { label: 'No thanks', value: 'no' }] },
      },
    ],
    custom_text: {
      shipping_address: {
        message:
          country === 'US'
            ? 'US shipping and duties are not included in this total. We declare each US parcel with customs and email you a quote to pay online before your order ships.'
            : `Free shipping in Canada on orders over $${SHIPPING.CA.freeOver / 100}. Nelson hand delivery happens Monday and Tuesday.`,
      },
      submit: { message: 'Not medical advice. Our products are not intended to diagnose, treat, cure or prevent any disease.' },
    },
    metadata: { destination: country, cart: summary.slice(0, 450), source: 'rewildmushrooms.com' },
    payment_intent_data: { description: `REWILD order: ${summary}`.slice(0, 990), metadata: { destination: country } },
    success_url: `${siteUrl}/order-confirmed/?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/shop/?checkout=cancelled`,
  }, opts);
}

export default async (req, context) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid request' });
  }
  const siteUrl = (process.env.SITE_URL || new URL(req.url).origin).replace(/\/$/, '');
  try {
    const session = await buildSession(body, siteUrl);
    return json(200, { url: session.url });
  } catch (err) {
    console.error('checkout error', err.message, err.stripe);
    return json(err.status === 400 ? 400 : 500, {
      error: err.status === 400 ? err.message : 'Checkout is having a moment. Please try again, or email us and we will sort it out.',
    });
  }
};

export const config = { path: '/api/checkout' };

export { PRODUCTS };
