// POST /api/square-webhook  Square tells us when a payment, order or refund changes.
// We never trust the message itself: we only take the order id from it and read the order
// back from Square. The signature check (SQUARE_WEBHOOK_SIGNATURE_KEY) proves it came from Square.
// Each Square event id is handled once (Netlify Blobs "square-events").
import crypto from 'node:crypto';
import { json } from './_shared/square.mjs';
import { getJSON, setJSON } from './_shared/store.mjs';
import { fetchOrder, recordPaidOrder, recordRefund } from './_shared/record.mjs';

export function webhookUrl(req) {
  if (process.env.SQUARE_WEBHOOK_URL) return process.env.SQUARE_WEBHOOK_URL;
  const base = (process.env.SITE_URL || new URL(req.url).origin).replace(/\/$/, '');
  return `${base}/api/square-webhook`;
}

export function validSignature(body, signature, key, url) {
  if (!signature || !key) return false;
  const expected = crypto.createHmac('sha256', key).update(url + body).digest('base64');
  const a = Buffer.from(expected), b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function orderIdFrom(event) {
  const o = event?.data?.object || {};
  return o.payment?.order_id || o.order_updated?.order_id || o.order_created?.order_id || o.refund?.order_id || o.order?.id || null;
}

export async function handleEvent(event, opts, deps = {}) {
  const type = String(event?.type || '');
  const orderId = orderIdFrom(event);
  if (!orderId || !/^[A-Za-z0-9_-]{10,64}$/.test(orderId)) return { ignored: 'no order' };
  const order = await (deps.fetchOrder || fetchOrder)(orderId, opts);
  if (type.startsWith('refund.')) return { refund: await recordRefund(order) };
  return { order: await recordPaidOrder(order, opts, deps) };
}

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
  const body = await req.text();
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (key && !validSignature(body, req.headers.get('x-square-hmacsha256-signature'), key, webhookUrl(req))) {
    console.error('square webhook: bad signature');
    return json(401, { error: 'Bad signature' });
  }
  let event;
  try { event = JSON.parse(body); } catch { return json(400, { error: 'Invalid JSON' }); }
  const id = String(event.event_id || '').slice(0, 100);
  try {
    if (id && (await getJSON('square-events', id))) return json(200, { ok: true, duplicate: true });
    const out = await handleEvent(event);
    if (id) await setJSON('square-events', id, { type: event.type, at: new Date().toISOString() });
    return json(200, { ok: true, skipped: !!(out.order?.skipped || out.refund?.skipped || out.ignored) });
  } catch (err) {
    console.error('square webhook error', event.type, err.message);
    return json(500, { error: 'Try again' }); // Square retries
  }
};

export const config = { path: '/api/square-webhook' };
