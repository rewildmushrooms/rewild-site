// Build Your Stack follow-ups: for quiz takers who said yes to emails and haven't bought yet.
// Runs hourly with the cart reminders. Stops the moment they order, opt out, or start a cart (the cart reminders take over).
//   Day 1: your stack is still waiting   Day 4: one-time 10% code, valid 72 hours   Day 6: last call, code ends in 24 hours
// During a sale the offer emails show the sale instead of a code (codes are paused during sales).
import { getJSON, setJSON } from './store.mjs';
import { readIndex, putIndex, customerSummary } from './data.mjs';
import { createOnetimeCode } from './carts.mjs';
import { saleNow } from './pricing.mjs';
import { optoutLink } from './lifecycle.mjs';

const H = 3600000, DAY = 24 * H;
export const QUIZ_PERCENT = 10;
export const QUIZ_CODE_DAYS = 3;
export const QUIZ_STEPS = [
  { n: 1, after: 1 * DAY },
  { n: 2, after: 4 * DAY },
  { n: 3, after: 6 * DAY },
];
const STALE = 10 * DAY; // never start or continue a sequence older than this

// The sale shoppers can see right now (early access or live), else null.
export function saleShowing(now = Date.now()) {
  const s = saleNow(now);
  return s && s.phase !== 'soon' ? s : null;
}

// Which follow-up (if any) is due now for this customer record.
export function dueQuizStep(c, now = Date.now()) {
  if (!c?.quizAt || !c.quiz?.stack || !c.marketingConsent || c.noReminders) return null;
  const start = Date.parse(c.quizAt);
  const age = now - start;
  if (age > STALE) return null;
  if (c.lastOrderAt && Date.parse(c.lastOrderAt) >= start) return null; // bought
  if (c.openCart) return null; // cart reminders handle them
  const qf = c.quizFollow || { sent: [] };
  if (qf.done) return null;
  const due = QUIZ_STEPS.filter((s) => age >= s.after).at(-1);
  if (!due) return null;
  const sentMax = Math.max(0, ...qf.sent.map((s) => s.step));
  if (due.n <= sentMax) return null;
  // Last call only makes sense if an unused code went out in step 2 (or a sale is on).
  if (due.n === 3 && !qf.code && !saleShowing(now)) return null;
  return due.n;
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const firstName = (c) => String(c?.name || '').trim().split(/\s+/)[0] || '';

export function stackLink(site, c, code, campaign) {
  return `${site}/shop/?cart=${encodeURIComponent(c.quiz.stack)}${code ? `&code=${encodeURIComponent(code)}` : ''}&utm_source=email&utm_medium=quiz_followup&utm_campaign=${campaign}`;
}

export function quizEmail(step, c, { site, code, optout, sale }) {
  const hi = firstName(c) ? `Hi ${firstName(c)},` : 'Hi there,';
  const names = c.quiz.stack_names || 'Your REWILD stack';
  let copy;
  if (step === 1) {
    copy = { subject: 'Your stack is still waiting', head: 'Your stack is still waiting.', body: [hi, 'You built it. We saved it. One tap puts it right back in your cart.'], cta: 'Load my stack', campaign: 'day1',
      small: "Not for you? Email us within 14 days of delivery for a full refund. No questions asked." };
  } else if (sale) {
    const tier = sale.tier ? `${sale.tier.percent}% off your whole order when you spend $${sale.tier.at / 100}+` : '';
    copy = { subject: `Your stack is ${sale.percent}% off this weekend`, head: 'Good timing.', body: [hi, `Our launch party is on, so your stack is ${sale.percent}% off right now. This weekend only, and there are only ${sale.stockEach} of each.`], big: `${sale.percent}% off everything`, sub: tier, cta: 'Load my stack', campaign: 'sale',
      small: 'The sale price is applied automatically in your cart. It ends Monday at 9am PT.' };
  } else if (step === 2) {
    copy = { subject: `${QUIZ_PERCENT}% off your stack`, head: 'A little nudge.', body: [hi, `Your stack has been sitting here for a few days, so here's ${QUIZ_PERCENT}% off to get you started. The code works once and ends in 72 hours.`], cta: `Claim my ${QUIZ_PERCENT}%`, campaign: 'offer',
      small: 'The button puts your stack and your code in the cart.' };
  } else {
    copy = { subject: `Your ${QUIZ_PERCENT}% ends tomorrow`, head: `Last call on your ${QUIZ_PERCENT}%.`, body: [hi, 'Your code ends in 24 hours. After that, your stack goes back to the regular price.'], cta: `Use my ${QUIZ_PERCENT}%`, campaign: 'last_call',
      small: "Not for you? Email us within 14 days of delivery for a full refund. No questions asked." };
  }
  const link = stackLink(site, c, sale ? null : code, copy.campaign);
  const foot = "You're getting this because you built your stack at rewildmushrooms.com and said yes to emails.";
  const text = [copy.head, '', ...copy.body.flatMap((p) => [p, '']), `Your stack: ${names}`, '', ...(copy.big ? [copy.big.toUpperCase(), copy.sub, ''] : []), ...(code && !sale ? [`Your code: ${code}`, ''] : []), `${copy.cta}: ${link}`, '', copy.small, '', 'Return to your natural state.', '~ The REWILD crew', '', '---', foot, `Stop these emails: ${optout}`, 'REWILD Mushrooms, Box 18, Crescent Valley, BC V0G 1H0'].join('\n');
  const html = `<!doctype html><html><body style="margin:0;background:#F3F2EE;font-family:Helvetica,Arial,sans-serif;color:#121310">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F2EE;padding:24px 0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:4px">
<tr><td align="left" style="background:#121310;padding:20px 28px"><a href="https://rewildmushrooms.com/" style="text-decoration:none"><img src="https://rewildmushrooms.com/img/rewild-logo-email-white.png" width="200" height="56" alt="REWILD Mushrooms" style="display:block;border:0;outline:none;width:200px;height:56px"></a></td></tr>
<tr><td style="padding:32px 28px 8px"><h1 style="margin:0 0 14px;font-size:26px;line-height:1.2;text-transform:uppercase">${esc(copy.head)}</h1>
${copy.body.map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3D3F38">${esc(p)}</p>`).join('')}
${copy.big ? `<p style="margin:8px 0 4px;font-size:34px;line-height:1.05;font-weight:800;text-transform:uppercase;color:#121310">${esc(copy.big)}</p><p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#8A8B84">${esc(copy.sub)}</p>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px"><tr><td style="background:#F3F2EE;border-left:4px solid #E8C800;padding:14px 18px;font-size:15px;line-height:1.5;color:#121310"><span style="font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#6B6D64">Your stack</span><br><b>${esc(names)}</b></td></tr></table>
${code && !sale ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px"><tr><td align="center" style="border:2px dashed #121310;padding:14px 8px;font-size:22px;font-weight:800;letter-spacing:.08em">${esc(code)}</td></tr></table>` : ''}
<a href="${esc(link)}" style="display:inline-block;background:#E8C800;color:#121310;text-decoration:none;font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:15px 26px;border-radius:2px">${esc(copy.cta)}</a>
<p style="margin:18px 0 0;font-size:13px;line-height:1.5;color:#8A8B84">${esc(copy.small)}</p>
<p style="margin:28px 0 0;font-size:15px;line-height:1.5">Return to your natural state.<br>~ The REWILD crew</p></td></tr>
<tr><td style="padding:24px 28px;font-size:12px;line-height:1.5;color:#6B6D64">${esc(foot)} <a href="${esc(optout)}" style="color:#6B6D64">Stop these emails</a>.<br>REWILD Mushrooms, Box 18, Crescent Valley, BC V0G 1H0</td></tr>
</table></td></tr></table></body></html>`;
  return { subject: copy.subject, text, html, unsubscribe: optout };
}

export async function runQuizFollowups(now = Date.now(), { send, site }) {
  const report = { checked: 0, sent: [] };
  const index = await readIndex('customers');
  for (const [email, s] of Object.entries(index)) {
    if (!s?.quiz) continue; // only quiz leads
    const c = await getJSON('customers', email);
    report.checked += 1;
    const step = dueQuizStep(c, now);
    if (!step) continue;
    const sale = step > 1 ? saleShowing(now) : null;
    const qf = c.quizFollow || { sent: [] };
    let code = null;
    if (step === 2 && !sale) {
      const rec = await createOnetimeCode({ prefix: 'COMEBACK', percentOff: QUIZ_PERCENT, days: QUIZ_CODE_DAYS, email, source: 'quiz' }, now);
      code = rec.code; qf.code = code;
    } else if (step === 3 && !sale) {
      const rec = await getJSON('onetime', qf.code);
      if (!rec || rec.used || rec.expiresAt * 1000 < now) { qf.done = true; c.quizFollow = qf; await setJSON('customers', email, c); continue; }
      code = qf.code;
    }
    const optout = await optoutLink(site, email, c);
    const msg = quizEmail(step, c, { site, code, optout, sale });
    await send({ to: email, subject: msg.subject, text: msg.text, html: msg.html, fromName: 'REWILD Mushrooms', replyTo: 'hello@rewildmushrooms.com', unsubscribe: msg.unsubscribe });
    qf.sent.push({ step, at: new Date(now).toISOString(), sale: !!sale });
    if (step === 3) qf.done = true;
    c.quizFollow = qf;
    await setJSON('customers', email, c);
    try { await putIndex('customers', email, customerSummary(c)); } catch (e) { console.error('index update failed', e.message); }
    report.sent.push({ email: email.replace(/^(.).*@/, '$1***@'), step, sale: !!sale });
  }
  return report;
}
