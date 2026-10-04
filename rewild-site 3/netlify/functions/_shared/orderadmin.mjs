// HQ order actions, modelled on WooCommerce: change status, refund (full or partial, through Square),
// private notes, and delete (for test orders). Owner only.
//   Status: processing, on-hold, completed, cancelled. "Refunded" is set automatically by a full refund.
//   Refund: money goes back to the customer's card through Square. Optional: put the items back in stock, email the customer.
//   Delete: removes the order from HQ and the customer's history. Square keeps its own payment record.
//           The order is kept as a hidden marker so Square can never bring it back.
import crypto from 'node:crypto';
import { square } from './square.mjs';
import { getJSON, setJSON } from './store.mjs';
import { putIndex, orderSummary, orderStatus, customerSummary } from './data.mjs';
import { recordRefund, fetchOrder, orderRecord, recalcCustomer } from './record.mjs';
import { returnToStock } from './ledger.mjs';
import { sendMail } from './mailer.mjs';

const bad = (m, status = 400) => Object.assign(new Error(m), { status });
const money = (c) => '$' + (c / 100).toFixed(2);
const clean = (n, max = 500) => String(n || '').replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const SETTABLE = ['processing', 'on-hold', 'completed', 'cancelled'];

async function load(id) {
  id = String(id || '');
  if (!/^[A-Za-z0-9_:-]{6,64}$/.test(id)) throw bad('Bad order id');
  const rec = await getJSON('orders', id);
  if (!rec || rec.deleted) throw bad('Order not found', 404);
  return rec;
}
const note = (rec, by, text) => { rec.notes = [...(rec.notes || []), { at: new Date().toISOString(), by: by || null, text: clean(text) }].slice(-50); };
async function save(rec) { await setJSON('orders', rec.id, rec); await putIndex('orders', rec.id, orderSummary(rec)); return orderSummary(rec); }

async function restock(rec, member, why, opts, deps) {
  if (rec.restocked || !rec.units || !Object.keys(rec.units).length) return false;
  await (deps.returnToStock || returnToStock)(rec.units, rec.id, member, why, opts);
  rec.restocked = new Date().toISOString();
  return true;
}

// b: { orderId, status, restock }
export async function setOrderStatus(b, member, opts, deps = {}) {
  const rec = await load(b.orderId);
  if (!SETTABLE.includes(b.status)) throw bad('Pick a status.');
  if (orderStatus(rec) === 'refunded') throw bad('This order is fully refunded. Its status stays Refunded.');
  const before = orderStatus(rec);
  rec.hqStatus = b.status;
  note(rec, member?.id, `Status changed from ${before} to ${b.status}.`);
  if (b.status === 'cancelled' && b.restock && (await restock(rec, member, 'Order cancelled', opts, deps))) note(rec, member?.id, 'Items put back in stock.');
  return { ok: true, order: await save(rec) };
}

// b: { orderId, note }
export async function addOrderNote(b, member) {
  const rec = await load(b.orderId);
  if (!clean(b.note)) throw bad('Write a note first.');
  note(rec, member?.id, b.note);
  return { ok: true, order: await save(rec) };
}

export function refundEmail(rec, amount, reason) {
  const first = String(rec.name || '').trim().split(/\s+/)[0];
  const ref = String(rec.id).slice(-8).toUpperCase();
  const full = rec.refunded >= rec.total;
  const subject = `Your REWILD refund for order #${ref}`;
  const lines = [
    first ? `Hi ${first},` : 'Hi there,',
    `We've refunded ${money(amount)} for ${full ? 'your' : 'part of your'} order #${ref}. It goes back to the card you paid with. Most banks show it within 5 to 10 business days.`,
    ...(reason ? [`Reason: ${reason}`] : []),
  ];
  const text = [subject + '.', '', ...lines.flatMap((l) => [l, '']), 'Questions? Just reply to this email.', '', '~ The REWILD crew', '', 'REWILD Mushrooms, Box 18, Crescent Valley, BC V0G 1H0'].join('\n');
  const html = `<!doctype html><html><body style="margin:0;background:#F3F2EE;font-family:Helvetica,Arial,sans-serif;color:#121310">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F2EE;padding:24px 0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:4px">
<tr><td style="background:#121310;padding:18px 28px;color:#fff;font-weight:800;letter-spacing:.3em;font-size:16px">REWILD</td></tr>
<tr><td style="padding:32px 28px 8px"><p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#9A8400">Order #${esc(ref)}</p>
<h1 style="margin:0 0 14px;font-size:26px;line-height:1.2;text-transform:uppercase">Your refund is on the way.</h1>
${lines.map((l) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3D3F38">${esc(l)}</p>`).join('')}
<p style="margin:8px 0 0;font-size:15px;line-height:1.6;color:#3D3F38">Questions? Just reply to this email.</p>
<p style="margin:24px 0 0;font-size:15px;line-height:1.5">~ The REWILD crew</p></td></tr>
<tr><td style="padding:24px 28px;font-size:12px;line-height:1.5;color:#6B6D64">You're getting this because you ordered from rewildmushrooms.com.<br>REWILD Mushrooms, Box 18, Crescent Valley, BC V0G 1H0</td></tr>
</table></td></tr></table></body></html>`;
  return { subject, text, html };
}

// b: { orderId, amount (dollars, optional: blank = everything left), reason, restock, notify }
export async function refundOrder(b, member, opts, deps = {}) {
  const rec = await load(b.orderId);
  if (rec.source === 'offline') throw bad('Offline sales were not paid through the website. Refund the cash or e-transfer by hand, then add a note.');
  const order = await (deps.fetchOrder || fetchOrder)(rec.id, opts);
  const now = orderRecord(order, rec.email, rec.name);
  const already = Math.max(now.refunded, rec.refunded || 0); // a just-made refund can take a moment to show on the Square order
  const left = now.total - already;
  if (left <= 0) throw bad('This order has already been fully refunded.');
  const amount = b.amount === '' || b.amount == null ? left : Math.round(Number(b.amount) * 100);
  if (!(amount > 0)) throw bad('Enter the amount to refund.');
  if (amount > left) throw bad(`You can refund up to ${money(left)} on this order.`);
  const tender = (order.tenders || []).find((t) => t.payment_id || t.id);
  if (!tender) throw bad('No card payment was found on this order in Square.');
  const reason = clean(b.reason, 190);
  const res = await (deps.square || square)('POST', '/refunds', {
    idempotency_key: `rf-${rec.id.slice(-12)}-${crypto.randomBytes(6).toString('hex')}`,
    payment_id: tender.payment_id || tender.id,
    amount_money: { amount, currency: order.total_money?.currency || 'CAD' },
    ...(reason ? { reason } : {}),
  }, opts);
  const refund = res.refund || {};
  // Update totals from Square (the refund may still be pending there, so count it ourselves too)
  let updated = rec;
  try { updated = (await (deps.recordRefund || recordRefund)(await (deps.fetchOrder || fetchOrder)(rec.id, opts))) || rec; } catch (e) { console.error('refund record failed', e.message); }
  if (updated.skipped) updated = rec;
  updated.refunded = Math.max(updated.refunded || 0, already + amount);
  updated.refundLog = [...(updated.refundLog || []), { at: new Date().toISOString(), by: member?.id || null, amount, reason: reason || null, id: refund.id || null, status: refund.status || null }];
  note(updated, member?.id, `Refunded ${money(amount)}${reason ? ` (${reason})` : ''}. Square status: ${String(refund.status || 'pending').toLowerCase()}.`);
  if (b.restock) {
    try { if (await restock(updated, member, 'Order refunded', opts, deps)) note(updated, member?.id, 'Items put back in stock.'); }
    catch (e) { console.error('restock failed', e.message); note(updated, member?.id, 'Could not put the items back in stock. Do it in Stock.'); }
  }
  if (b.notify && updated.email) {
    try { const m = refundEmail(updated, amount, reason); await (deps.sendMail || sendMail)({ to: updated.email, subject: m.subject, text: m.text, html: m.html, fromName: 'REWILD Mushrooms', replyTo: 'hello@rewildmushrooms.com' }); note(updated, member?.id, 'Customer emailed about the refund.'); }
    catch (e) { console.error('refund email failed', e.message); note(updated, member?.id, 'Refund email could not be sent.'); }
  }
  if (updated.email) {
    const c = await getJSON('customers', updated.email);
    if (c?.orders?.[updated.id]) { c.orders[updated.id].total = updated.total - updated.refunded; const m = recalcCustomer(c); await setJSON('customers', updated.email, m); await putIndex('customers', updated.email, customerSummary(m)); }
  }
  return { ok: true, refunded: amount, order: await save(updated) };
}

// b: { orderId, restock }   Removes the order from HQ (use it for test orders). Does not refund.
export async function deleteOrder(b, member, opts, deps = {}) {
  const rec = await load(b.orderId);
  let restocked = false;
  if (b.restock) restocked = await restock(rec, member, 'Order deleted', opts, deps);
  await setJSON('orders', rec.id, { id: rec.id, deleted: true, deletedAt: new Date().toISOString(), deletedBy: member?.id || null, steps: rec.steps || {}, restocked: rec.restocked || null, total: rec.total, email: rec.email });
  await putIndex('orders', rec.id, null);
  if (rec.email) {
    const c = await getJSON('customers', rec.email);
    if (c?.orders?.[rec.id]) {
      delete c.orders[rec.id];
      if (rec.code) c.codesUsed = (c.codesUsed || []).filter((x) => x !== rec.code);
      const m = recalcCustomer(c);
      await setJSON('customers', rec.email, m);
      await putIndex('customers', rec.email, customerSummary(m));
    }
  }
  return { ok: true, deleted: rec.id, restocked };
}
