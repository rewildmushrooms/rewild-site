// POST /api/promo  { code, items, country }  ->  { code, percentOff, amountOff, minimumAmount, discount }
// Lets the cart show the discount before checkout. Checkout re-checks the code server-side.
import { PRODUCT_BY_ID, SHIPPING } from './_shared/catalog.mjs';
import { priceCart } from './_shared/pricing.mjs';
import { validatePromo } from './_shared/promos.mjs';
import { json } from './_shared/square.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
  let b;
  try { b = await req.json(); } catch { return json(400, { error: 'Invalid request' }); }
  try {
    const catalog = { byId: PRODUCT_BY_ID, shipping: Object.fromEntries(Object.entries(SHIPPING).map(([k, v]) => [k, { flatRate: v.flatRate, freeOver: v.freeOver, quoted: !!v.quotedAfterOrder }])) };
    const q = priceCart(b?.items, b?.country === 'US' ? 'US' : 'CA', catalog);
    const { promo, discount } = await validatePromo(b?.code, q.listTotal, undefined, Date.now(), b?.email || '');
    return json(200, { code: promo.code, percentOff: promo.percentOff, amountOff: promo.amountOff, minimumAmount: promo.minimumAmount, discount });
  } catch (err) {
    if (err.status !== 400) console.error('promo error', err.message);
    return json(err.status === 400 ? 400 : 500, { error: err.status === 400 ? err.message : 'Could not check that code. Please try again.', detail: String(err.square?.[0]?.code || err.message || '').slice(0, 80) });
  }
};

export const config = { path: '/api/promo' };
