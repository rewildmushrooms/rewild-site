// GET /api/order?order_id=...  Used by the order-confirmed page.
// Returns only what the thank-you page needs (no addresses, no emails).
// Also records the paid order (stock, newsletter if ticked, customer record) in case the
// Square webhook has not arrived yet. Recording is safe to repeat.
import { json } from './_shared/square.mjs';
import { isPaid, orderRef, buyerName } from './_shared/orders.mjs';
import { fetchOrder, recordPaidOrder } from './_shared/record.mjs';
import { orderCode } from './_shared/team.mjs';
import { referralFor, REFERRAL } from './_shared/referrals.mjs';
import { buyerEmail } from './_shared/orders.mjs';
import { getJSON } from './_shared/store.mjs';

export async function handleOrder(id, deps = {}, opts) {
  const order = await (deps.fetchOrder || fetchOrder)(id, opts);
  if (!isPaid(order)) return null;
  try { await recordPaidOrder(order, opts, deps); } catch (err) { console.error('record order failed', err.message); }
  const name = buyerName(order);
  // Their own friend code for the thank-you page (give $20, get $20).
  let referral = null;
  try {
    const email = (await getJSON('orders', order.id))?.email || String((await buyerEmail(order, opts)) || '').toLowerCase();
    const ref = email ? await (deps.referralFor || referralFor)(email, name) : null;
    if (ref) referral = { code: ref.code, friendOff: REFERRAL.friendOff, min: REFERRAL.min };
  } catch (err) { console.error('referral code failed', err.message); }
  return {
    referral,
    orderId: order.id,
    firstName: name.split(' ')[0] || null,
    total: Number(order.total_money?.amount || 0),
    shipping: Number(order.total_service_charge_money?.amount || 0),
    currency: order.total_money?.currency || 'CAD',
    code: orderCode(order) || null,
    items: (order.line_items || []).map((li) => ({ id: li.metadata?.rewild_id || null, name: li.name, qty: Number(li.quantity), price: Number(li.base_price_money?.amount || 0) })),
    orderRef: orderRef(order.id),
  };
}

export default async (req) => {
  const id = new URL(req.url).searchParams.get('order_id') || '';
  if (!/^[A-Za-z0-9_-]{10,64}$/.test(id)) return json(400, { error: 'Invalid order' });
  try {
    const out = await handleOrder(id);
    return out ? json(200, out) : json(404, { error: 'Order not paid yet' });
  } catch (err) {
    console.error('order lookup error', err.message);
    return json(404, { error: 'Not found' });
  }
};

export const config = { path: '/api/order' };
