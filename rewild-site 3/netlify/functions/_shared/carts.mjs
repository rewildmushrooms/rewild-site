// Saved carts (from the email step before checkout) and abandoned-cart reminders.
// Reminders go only to people who ticked the email box, and stop the moment the cart is paid.
//   1 hour: reminder   24 hours: second reminder   48 hours: one-time 15% code, valid 24 hours
import crypto from 'node:crypto';
import { getJSON, setJSON } from './store.mjs';
import { readIndex, putIndex, customerSummary } from './data.mjs';
import { PRODUCT_BY_ID } from './catalog.mjs';

export const STEPS = [
  { n: 1, after: 60 * 60 * 1000 },
  { n: 2, after: 24 * 60 * 60 * 1000 },
  { n: 3, after: 48 * 60 * 60 * 1000 },
];
export const CODE_HOURS = 24;
export const EXPIRE_AFTER = 7 * 24 * 60 * 60 * 1000; // stop tracking a cart after a week
export const RECOVERY_PERCENT = 15;
export const RECOVERY_RE = /^COMEBACK-[A-Z0-9]{6}$/;

const cartSummary = (c) => ({ id: c.id, email: c.email, at: c.createdAt, value: c.value, items: c.items, status: c.status, consent: c.consent, sent: c.sent.length, recovered: !!c.recovered, code: c.code || null, orderId: c.orderId || null });

export async function saveCart(c) {
  await setJSON('carts', c.id, c);
  await putIndex('carts', c.id, cartSummary(c));
  return c;
}
export const getCart = (id) => (/^c_[a-f0-9]{16}$/.test(id || '') ? getJSON('carts', id) : null);

export function newCart({ email, items, value, consent, country, code, ref }) {
  return {
    id: 'c_' + crypto.randomBytes(8).toString('hex'),
    email, items, value, consent: !!consent, country, code: code || null, ref: ref || null,
    createdAt: new Date().toISOString(), status: 'open', sent: [], orderId: null,
    optout: crypto.randomBytes(12).toString('hex'),
  };
}

// Customer record touch from the email step (no order yet).
export async function touchCustomer(email, { consent, source, quiz, name } = {}, now = new Date().toISOString()) {
  const c = (await getJSON('customers', email)) || { email, createdAt: now, orders: {}, firstSource: source };
  if (name && !c.name) c.name = name;
  if (quiz) c.quiz = quiz;
  if (consent && !c.marketingConsent) { c.marketingConsent = true; c.marketingConsentAt = now; c.marketingConsentSource = source; }
  if (!c.firstSource) c.firstSource = source;
  c.lastActivityAt = now;
  c.updatedAt = now;
  await setJSON('customers', email, c);
  await putIndex('customers', email, customerSummary(c));
  return c;
}

export async function setOpenCart(email, open) {
  if (!email) return;
  const c = await getJSON('customers', email);
  if (!c || !!c.openCart === !!open) return;
  c.openCart = !!open;
  await setJSON('customers', email, c);
  await putIndex('customers', email, customerSummary(c));
}

export async function markPurchased(cartId, orderId) {
  const c = await getCart(cartId);
  if (!c || c.status === 'purchased') return c;
  c.status = 'purchased';
  c.purchasedAt = new Date().toISOString();
  c.orderId = orderId || c.orderId;
  c.recovered = c.sent.length > 0;
  await saveCart(c);
  await setOpenCart(c.email, false);
  return c;
}

// One-time recovery codes (not stored in Square; checkout applies them server-side).
export async function createRecoveryCode(cart, now = Date.now(), hours = CODE_HOURS, source = 'cart') {
  let code;
  do code = 'COMEBACK-' + crypto.randomBytes(4).toString('hex').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6).padEnd(6, '7');
  while (await getJSON('onetime', code));
  const rec = { code, cartId: cart.id || null, email: cart.email, source, percentOff: RECOVERY_PERCENT, createdAt: new Date(now).toISOString(), expiresAt: Math.floor((now + hours * 3600000) / 1000), used: false };
  await setJSON('onetime', code, rec);
  return rec;
}
export const getRecoveryCode = (code) => (RECOVERY_RE.test(code) ? getJSON('onetime', code) : null);
export async function useRecoveryCode(code, orderId) {
  const r = await getRecoveryCode(code);
  if (!r || r.used) return;
  r.used = true; r.usedAt = new Date().toISOString(); r.orderId = orderId;
  await setJSON('onetime', code, r);
}

export const cartLink = (site, cart, code) => {
  const items = (cart.items || []).map((i) => (i.qty > 1 ? `${i.id}:${i.qty}` : i.id)).join(',');
  return `${site}/shop/?cart=${encodeURIComponent(items)}${code ? `&code=${encodeURIComponent(code)}` : ''}&utm_source=email&utm_medium=cart_reminder`;
};

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = (c) => '$' + (c / 100).toFixed(c % 100 ? 2 : 0);

// The three reminder emails. Plain, friendly, no health claims.
export function reminderEmail(step, cart, { site, code }) {
  const list = (cart.items || []).map((i) => `${i.qty} × ${PRODUCT_BY_ID[i.id]?.name || i.id}`);
  const link = cartLink(site, cart, code?.code);
  const optout = `${site}/api/cart-optout?c=${cart.id}&t=${cart.optout}`;
  const copy = {
    1: { subject: 'You left something in your cart', head: 'Your cart is saved.', body: 'Looks like checkout got interrupted. Your mushrooms are still waiting, right where you left them.', cta: 'Finish checkout' },
    2: { subject: 'Still thinking it over?', head: 'Still thinking it over?', body: 'Totally fair. Every REWILD lot is third-party tested, one mushroom per bag, nothing else added. Canadian orders ship in 1 to 3 business days, and you have 14 days for a full refund if it is not for you.', cta: 'View your cart' },
    3: { subject: `${RECOVERY_PERCENT}% off your cart, for the next 24 hours`, head: `Here's ${RECOVERY_PERCENT}% off, just for you.`, body: `Use code ${code?.code} at checkout for ${RECOVERY_PERCENT}% off this cart. It works once and ends in 24 hours.`, cta: `Checkout with ${RECOVERY_PERCENT}% off` },
  }[step];
  const text = [copy.head, '', copy.body, '', 'In your cart:', ...list.map((l) => '  ' + l), `  Total: ${money(cart.value)}`, '', `${copy.cta}: ${link}`, '', 'Return to your natural state.', '~ The REWILD crew', '', '---', "You're getting this because you started a checkout at rewildmushrooms.com and said yes to emails.", `Stop cart reminders: ${optout}`, 'REWILD Mushrooms, Box 18, Crescent Valley, BC V0G 1H0'].join('\n');
  const html = `<!doctype html><html><body style="margin:0;background:#F3F2EE;font-family:Helvetica,Arial,sans-serif;color:#121310">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F2EE;padding:24px 0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:4px">
<tr><td style="background:#121310;padding:18px 28px;color:#fff;font-weight:800;letter-spacing:.3em;font-size:16px">REWILD</td></tr>
<tr><td style="padding:32px 28px 8px"><h1 style="margin:0 0 12px;font-size:26px;line-height:1.2;text-transform:uppercase">${esc(copy.head)}</h1>
<p style="margin:0 0 20px;font-size:16px;line-height:1.55;color:#3D3F38">${esc(copy.body)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E6E5E0;border-bottom:1px solid #E6E5E0;margin-bottom:22px">
${list.map((l) => `<tr><td style="padding:10px 0;font-size:15px">${esc(l)}</td></tr>`).join('')}
<tr><td style="padding:10px 0;font-size:15px;font-weight:700">Total ${money(cart.value)}</td></tr></table>
${code ? `<p style="margin:0 0 18px;font-size:15px">Your code: <strong style="font-size:18px;letter-spacing:.06em">${esc(code.code)}</strong></p>` : ''}
<a href="${esc(link)}" style="display:inline-block;background:#E8C800;color:#121310;text-decoration:none;font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:15px 26px;border-radius:2px">${esc(copy.cta)}</a>
<p style="margin:28px 0 0;font-size:15px;line-height:1.5">Return to your natural state.<br>~ The REWILD crew</p></td></tr>
<tr><td style="padding:24px 28px;font-size:12px;line-height:1.5;color:#6B6D64">You're getting this because you started a checkout at rewildmushrooms.com and said yes to emails. <a href="${esc(optout)}" style="color:#6B6D64">Stop cart reminders</a>.<br>REWILD Mushrooms, Box 18, Crescent Valley, BC V0G 1H0</td></tr>
</table></td></tr></table></body></html>`;
  return { subject: copy.subject, text, html };
}

// Which reminder (if any) is due now. Only the latest due step is sent, so a late run never sends three at once.
export function dueStep(cart, now = Date.now()) {
  if (cart.status !== 'open' || !cart.consent) return null;
  const age = now - Date.parse(cart.createdAt);
  const due = STEPS.filter((s) => age >= s.after).at(-1);
  if (!due) return null;
  const sentMax = Math.max(0, ...cart.sent.map((s) => s.step));
  return due.n > sentMax ? due.n : null;
}

export async function openCarts() {
  return Object.values(await readIndex('carts')).filter((c) => c.status === 'open');
}

export function cartStats(index, sinceMs = 0) {
  const list = Object.values(index).filter((c) => Date.parse(c.at) >= sinceMs);
  const abandoned = list.filter((c) => c.status !== 'purchased');
  const recovered = list.filter((c) => c.recovered);
  return {
    started: list.length,
    abandoned: abandoned.length,
    abandonedValue: abandoned.reduce((a, c) => a + (c.value || 0), 0),
    recovered: recovered.length,
    recoveredValue: recovered.reduce((a, c) => a + (c.value || 0), 0),
    reminded: list.filter((c) => c.sent > 0).length,
  };
}
