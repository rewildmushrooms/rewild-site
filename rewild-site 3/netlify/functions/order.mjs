// GET /api/order?order_id=...  Used by the order-confirmed page.
// Returns only what the thank-you page needs (no addresses, no emails).
// Also adds the buyer to MailerLite if they ticked the newsletter box in the cart.
import { square, json } from './_shared/square.mjs';
import { isPaid, orderRef, buyerEmail, buyerName } from './_shared/orders.mjs';
import { addSubscriber, isEmail } from './_shared/mailerlite.mjs';

export async function handleOrder(id, deps = {}, opts) {
  const { order } = await square('GET', `/orders/${id}`, null, opts);
  if (!isPaid(order)) return null;
  const name = buyerName(order);
  if (order.metadata?.newsletter === 'yes') {
    try {
      const email = await buyerEmail(order, opts);
      if (isEmail(email)) {
        const groups = [process.env.MAILERLITE_GROUP_ID, process.env.MAILERLITE_CUSTOMERS_GROUP_ID].filter(Boolean);
        await (deps.addSubscriber || addSubscriber)(email, { name: name.split(' ')[0], source: 'checkout' }, { groups });
      }
    } catch (err) { console.error('newsletter add failed', err.message); }
  }
  return {
    firstName: name.split(' ')[0] || null,
    total: Number(order.total_money?.amount || 0),
    currency: order.total_money?.currency || 'CAD',
    items: (order.line_items || []).map((li) => ({ name: li.name, qty: Number(li.quantity) })),
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
