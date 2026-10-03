// Square order helpers shared by /api/order and /api/hq.
import { square } from './square.mjs';

export const isPaid = (o) => !!o && ((o.tenders || []).length > 0 || o.state === 'COMPLETED');
export const orderRef = (id) => String(id || '').slice(-8).toUpperCase();

export async function buyerEmail(order, opts) {
  const ful = (order.fulfillments || []).find((f) => f.shipment_details?.recipient?.email_address);
  if (ful) return ful.shipment_details.recipient.email_address;
  const pid = (order.tenders || []).find((t) => t.payment_id || t.id);
  if (!pid) return null;
  try {
    const { payment } = await square('GET', `/payments/${pid.payment_id || pid.id}`, null, opts);
    return payment?.buyer_email_address || null;
  } catch { return null; }
}

export const buyerName = (order) =>
  (order.fulfillments || []).map((f) => f.shipment_details?.recipient?.display_name).find(Boolean) || '';
