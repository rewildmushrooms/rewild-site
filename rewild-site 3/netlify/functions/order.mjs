// GET /api/order?session_id=cs_...  Used by the order-confirmed page.
// Returns only what the thank-you page needs (no addresses, no emails).
import { stripe, json } from './_shared/stripe.mjs';

export default async (req) => {
  const id = new URL(req.url).searchParams.get('session_id') || '';
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return json(400, { error: 'Invalid session' });
  try {
    const s = await stripe('GET', `/checkout/sessions/${id}`, { expand: ['line_items'] });
    if (s.status !== 'complete') return json(404, { error: 'Order not complete' });
    return json(200, {
      firstName: (s.customer_details?.name || '').split(' ')[0] || null,
      total: s.amount_total,
      currency: s.currency,
      items: (s.line_items?.data || []).map((li) => ({ name: li.description, qty: li.quantity })),
      orderRef: s.payment_intent ? String(s.payment_intent).slice(-8).toUpperCase() : id.slice(-8).toUpperCase(),
    });
  } catch (err) {
    console.error('order lookup error', err.message);
    return json(404, { error: 'Not found' });
  }
};

export const config = { path: '/api/order' };
