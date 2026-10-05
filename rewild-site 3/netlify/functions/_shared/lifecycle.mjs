// Emails to past buyers, sent by the website (they need each customer's real order dates and products):
//   Reorder reminder: about 5 days before their last order should run out.
//   Win-back: 120 days after their last order with no new order. One-time 15% code, valid 7 days.
// Only to buyers who ticked the email box at checkout, never after they click "Stop these emails",
// and only once per order. No health claims.
import crypto from 'node:crypto';
import { getJSON, setJSON } from './store.mjs';
import { readIndex, putIndex, customerSummary } from './data.mjs';
import { PRODUCT_BY_ID } from './catalog.mjs';
import { createRecoveryCode, RECOVERY_PERCENT } from './carts.mjs';

const DAY = 86400000;
// How long one unit lasts with daily use (website FAQ: a 100g bag is about 2 to 3 months; a tincture bottle 5 to 10 servings).
export const LASTS_DAYS = { energy: 60, clarity: 60, strength: 60, peace: 60, tincture: 10 };
export const REORDER_LEAD_DAYS = 5;
export const WINBACK_DAYS = 120;
export const WINBACK_CODE_HOURS = 7 * 24;
const STALE_DAYS = 21; // a reminder that is this late is skipped, so a backlog never floods inboxes

export function runsOutInDays(units = {}) {
  const days = Object.entries(units).filter(([id, n]) => LASTS_DAYS[id] && n > 0).map(([id, n]) => LASTS_DAYS[id] * n);
  return days.length ? Math.min(180, Math.min(...days)) : null;
}

export function lastOrder(c) {
  const list = Object.entries(c?.orders || {}).map(([id, o]) => ({ id, ...o })).filter((o) => o.at && o.total > 0);
  return list.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0] || null;
}

// Which email (if any) this customer should get now: 'reorder' | 'winback' | null
export function dueEmail(c, now = Date.now()) {
  if (!c?.marketingConsent || c.noReminders) return null;
  const last = lastOrder(c);
  if (!last) return null;
  const at = Date.parse(last.at);
  const sent = c.lifecycle || {};
  const winbackAt = at + WINBACK_DAYS * DAY;
  if (now >= winbackAt) return sent.winbackFor !== last.id && now - winbackAt < STALE_DAYS * DAY ? 'winback' : null;
  const lasts = runsOutInDays(last.items);
  if (!lasts) return null;
  const reorderAt = at + (lasts - REORDER_LEAD_DAYS) * DAY;
  if (now >= reorderAt && sent.reorderFor !== last.id && now - reorderAt < STALE_DAYS * DAY) return 'reorder';
  return null;
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const firstName = (c) => String(c?.name || '').trim().split(/\s+/)[0] || '';

export function lifecycleEmail(kind, c, { site, code, optout }) {
  const last = lastOrder(c);
  const ids = Object.keys(last?.items || {}).filter((id) => PRODUCT_BY_ID[id]);
  const names = ids.map((id) => PRODUCT_BY_ID[id].name);
  const cart = ids.map((id) => (last.items[id] > 1 ? `${id}:${last.items[id]}` : id)).join(',');
  const hi = firstName(c) ? `Hi ${firstName(c)},` : 'Hi there,';
  const copy = kind === 'reorder'
    ? {
        subject: 'Running low?',
        head: 'Running low?',
        body: [hi, `If you've been using it daily, your ${names.join(' and ')} should be running low around now. Reorder today and it arrives before you run out, so you never miss a day.`, 'Canadian orders ship in 1 to 3 business days. Orders over $175 ship free.'],
        cta: 'Reorder in one click',
        link: `${site}/shop/?cart=${encodeURIComponent(cart)}&utm_source=email&utm_medium=lifecycle&utm_campaign=reorder`,
      }
    : {
        subject: `We saved you ${RECOVERY_PERCENT}% off`,
        head: 'We miss you around here.',
        body: [hi, "It's been a while since your last REWILD order. If life got busy, we get it. Here's a little nudge to get back to it.", `Use code ${code?.code} for ${RECOVERY_PERCENT}% off your next order. It works once and ends in 7 days.`],
        cta: `Shop with ${RECOVERY_PERCENT}% off`,
        link: `${site}/shop/?${cart ? `cart=${encodeURIComponent(cart)}&` : ''}code=${encodeURIComponent(code?.code || '')}&utm_source=email&utm_medium=lifecycle&utm_campaign=winback`,
      };
  const foot = "You're getting this because you ordered from rewildmushrooms.com and said yes to emails.";
  const text = [copy.head, '', ...copy.body.flatMap((p) => [p, '']), `${copy.cta}: ${copy.link}`, '', 'Return to your natural state.', '~ The REWILD crew', '', '---', foot, `Stop these emails: ${optout}`, 'REWILD Mushrooms, Box 18, Crescent Valley, BC V0G 1H0'].join('\n');
  const html = `<!doctype html><html><body style="margin:0;background:#F3F2EE;font-family:Helvetica,Arial,sans-serif;color:#121310">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F2EE;padding:24px 0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:4px">
<tr><td style="background:#121310;padding:18px 28px;color:#fff;font-weight:800;letter-spacing:.3em;font-size:16px">REWILD</td></tr>
<tr><td style="padding:32px 28px 8px"><h1 style="margin:0 0 14px;font-size:26px;line-height:1.2;text-transform:uppercase">${esc(copy.head)}</h1>
${copy.body.map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3D3F38">${esc(p)}</p>`).join('')}
${code ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 18px"><tr><td align="center" style="border:2px dashed #121310;padding:14px 8px;font-size:22px;font-weight:800;letter-spacing:.06em">${esc(code.code)}</td></tr></table>` : ''}
<a href="${esc(copy.link)}" style="display:inline-block;background:#E8C800;color:#121310;text-decoration:none;font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:15px 26px;border-radius:2px">${esc(copy.cta)}</a>
<p style="margin:28px 0 0;font-size:15px;line-height:1.5">Return to your natural state.<br>~ The REWILD crew</p></td></tr>
<tr><td style="padding:24px 28px;font-size:12px;line-height:1.5;color:#6B6D64">${esc(foot)} <a href="${esc(optout)}" style="color:#6B6D64">Stop these emails</a>.<br>REWILD Mushrooms, Box 18, Crescent Valley, BC V0G 1H0</td></tr>
</table></td></tr></table></body></html>`;
  return { subject: copy.subject, text, html, unsubscribe: optout };
}

export async function optoutLink(site, email, c) {
  if (!c.optoutToken) c.optoutToken = crypto.randomBytes(12).toString('hex');
  return `${site}/api/email-optout?e=${encodeURIComponent(email)}&t=${c.optoutToken}`;
}

export async function runLifecycle(now = Date.now(), { send, site }) {
  const report = { checked: 0, sent: [] };
  const index = await readIndex('customers');
  for (const email of Object.keys(index)) {
    const c = await getJSON('customers', email);
    report.checked += 1;
    const kind = dueEmail(c, now);
    if (!kind) continue;
    const last = lastOrder(c);
    let code = null;
    if (kind === 'winback') code = await createRecoveryCode({ id: null, email }, now, WINBACK_CODE_HOURS, 'winback');
    const optout = await optoutLink(site, email, c);
    const msg = lifecycleEmail(kind, c, { site, code, optout });
    await send({ to: email, subject: msg.subject, text: msg.text, html: msg.html, fromName: 'REWILD Mushrooms', replyTo: 'hello@rewildmushrooms.com', unsubscribe: msg.unsubscribe });
    c.lifecycle = { ...(c.lifecycle || {}), [kind === 'reorder' ? 'reorderFor' : 'winbackFor']: last.id, [kind + 'At']: new Date(now).toISOString() };
    await setJSON('customers', email, c);
    try { await putIndex('customers', email, customerSummary(c)); } catch (e) { console.error('index update failed', e.message); }
    report.sent.push({ email: email.replace(/^(.).*@/, '$1***@'), kind });
  }
  return report;
}
