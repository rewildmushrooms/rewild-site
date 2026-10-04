// "Mark shipped" in HQ: saves the carrier + tracking number on the order and emails the customer.
// Tracking numbers are entered by hand for now; a Canada Post integration can fill them in later.
import { getJSON, setJSON } from './store.mjs';
import { putIndex, orderSummary } from './data.mjs';
import { SHIPPING } from './catalog.mjs';
import { sendMail } from './mailer.mjs';

export const CARRIERS = {
  canadapost: { name: 'Canada Post', url: (n) => `https://www.canadapost-postescanada.ca/track-reperer/en#/search?searchFor=${encodeURIComponent(n)}` },
  chitchats: { name: 'Chit Chats', url: (n) => `https://chitchats.com/tracking/${encodeURIComponent(n)}` },
  usps: { name: 'USPS', url: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(n)}` },
  ups: { name: 'UPS', url: (n) => `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}` },
  purolator: { name: 'Purolator', url: (n) => `https://www.purolator.com/en/shipping/tracker?pin=${encodeURIComponent(n)}` },
  hand: { name: 'Hand delivery', url: null },
  other: { name: 'Other', url: null },
};
export const trackingUrl = (s) => (s && CARRIERS[s.carrier]?.url && s.tracking ? CARRIERS[s.carrier].url(s.tracking) : null);

const bad = (m, status = 400) => Object.assign(new Error(m), { status });
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function shippedEmail(rec, s) {
  const first = String(rec.name || '').trim().split(/\s+/)[0];
  const carrier = CARRIERS[s.carrier]?.name || 'the carrier';
  const url = trackingUrl(s);
  const ship = SHIPPING[rec.country === 'US' ? 'US' : 'CA'];
  const eta = s.carrier === 'hand' ? 'We will drop it off soon.' : `Most ${rec.country === 'US' ? 'US' : 'Canadian'} orders arrive in ${ship.minDays} to ${ship.maxDays} business days.`;
  const items = (rec.items || []).filter((i) => i.qty > 0).map((i) => `${i.qty} × ${i.name}`);
  const ref = String(rec.id).slice(-8).toUpperCase();
  const subject = 'Your REWILD order is on the way';
  const lines = [
    first ? `Hi ${first},` : 'Hi there,',
    `Good news: your order #${ref} has shipped${s.carrier !== 'other' && s.carrier !== 'hand' ? ` with ${carrier}` : ''}. ${eta}`,
  ];
  const text = [subject + '.', '', ...lines.flatMap((l) => [l, '']), ...(s.tracking ? [`Tracking number: ${s.tracking}`] : []), ...(url ? [`Track your package: ${url}`] : []), '', 'In your order:', ...items.map((i) => '  ' + i), '',
    'Questions? Just reply to this email.', '', 'Return to your natural state.', '~ The REWILD crew', '', 'REWILD Mushrooms, Box 18, Crescent Valley, BC V0G 1H0'].join('\n');
  const html = `<!doctype html><html><body style="margin:0;background:#F3F2EE;font-family:Helvetica,Arial,sans-serif;color:#121310">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F2EE;padding:24px 0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:4px">
<tr><td style="background:#121310;padding:18px 28px;color:#fff;font-weight:800;letter-spacing:.3em;font-size:16px">REWILD</td></tr>
<tr><td style="padding:32px 28px 8px"><p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#9A8400">Order #${esc(ref)}</p>
<h1 style="margin:0 0 14px;font-size:26px;line-height:1.2;text-transform:uppercase">Your order is on the way.</h1>
${lines.map((l) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3D3F38">${esc(l)}</p>`).join('')}
${s.tracking ? `<p style="margin:0 0 18px;font-size:15px">Tracking number: <strong style="letter-spacing:.04em">${esc(s.tracking)}</strong></p>` : ''}
${url ? `<a href="${esc(url)}" style="display:inline-block;background:#E8C800;color:#121310;text-decoration:none;font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:15px 26px;border-radius:2px">Track your package</a>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E6E5E0;margin-top:24px">${items.map((i) => `<tr><td style="padding:10px 0;font-size:15px;border-bottom:1px solid #E6E5E0">${esc(i)}</td></tr>`).join('')}</table>
<p style="margin:22px 0 0;font-size:15px;line-height:1.6;color:#3D3F38">Questions? Just reply to this email.</p>
<p style="margin:24px 0 0;font-size:15px;line-height:1.5">Return to your natural state.<br>~ The REWILD crew</p></td></tr>
<tr><td style="padding:24px 28px;font-size:12px;line-height:1.5;color:#6B6D64">You're getting this because you ordered from rewildmushrooms.com.<br>REWILD Mushrooms, Box 18, Crescent Valley, BC V0G 1H0</td></tr>
</table></td></tr></table></body></html>`;
  return { subject, text, html };
}

// b: { orderId, carrier, tracking, notify }   member: who clicked
export async function markShipped(b, member, deps = {}) {
  const id = String(b.orderId || '');
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(id)) throw bad('Bad order id');
  const carrier = CARRIERS[b.carrier] ? b.carrier : 'canadapost';
  const tracking = String(b.tracking || '').replace(/\s+/g, '').toUpperCase().slice(0, 40);
  if (tracking && !/^[A-Z0-9-]{6,40}$/.test(tracking)) throw bad('That tracking number does not look right. Use letters and numbers only.');
  if (!tracking && !['hand', 'other'].includes(carrier)) throw bad('Enter the tracking number.');
  const rec = await getJSON('orders', id);
  if (!rec) throw bad('Order not found', 404);
  if (rec.source === 'offline') throw bad('Offline sales do not ship.');
  const s = { carrier, tracking: tracking || null, at: new Date().toISOString(), by: member?.id || null, emailed: false };
  const notify = b.notify !== false && !!rec.email;
  if (notify) {
    const msg = shippedEmail(rec, s);
    await (deps.sendMail || sendMail)({ to: rec.email, subject: msg.subject, text: msg.text, html: msg.html, fromName: 'REWILD Mushrooms', replyTo: 'hello@rewildmushrooms.com' });
    s.emailed = true;
  }
  rec.shipment = s;
  if (!['cancelled', 'refunded'].includes(rec.hqStatus)) rec.hqStatus = 'completed';
  await setJSON('orders', id, rec);
  await putIndex('orders', id, orderSummary(rec));
  return { ok: true, shipment: s, trackingUrl: trackingUrl(s) };
}
