// Refer a friend: give $20, get $20.
//   Every customer gets a personal friend code, like JADE-7K3Q, and a share link (rewildmushrooms.com/shop/?code=JADE-7K3Q).
//   Friend: $20 off their FIRST order of $75 or more (products, before shipping). Not on bundle prices (Duo, All Four),
//     same as every dollar-off code. Checked at checkout: their email must have no paid orders yet, and it can't be the owner's.
//   Customer: once the friend's order has passed 21 days (the 14-day guarantee plus shipping) without a refund,
//     the website emails them a one-time REWARD- code: $20 off their next order of $75+, valid 6 months. One reward per friend.
//   Same shipping address as the customer's own orders: the reward waits for Jade to approve it in HQ (Referrals).
// Everything lives in Netlify Blobs: store "referrals", key "all".
import crypto from 'node:crypto';
import { getJSON, setJSON } from './store.mjs';
import { createOnetimeCode } from './carts.mjs';
import { email as emailHtml, firstNameOf } from './emailtpl.mjs';
import { sendTelegram, telegramReady } from './telegram.mjs';

export const REFERRAL = { friendOff: 2000, rewardOff: 2000, min: 7500, holdDays: 21, rewardDays: 180 };
export const REFERRAL_RE = /^[A-Z]{2,10}-[A-Z2-9]{4}$/;
const STORE = 'referrals';
const KEY = 'all';
const DAY = 86400000;
const norm = (c) => String(c || '').trim().toUpperCase();
const key = (e) => String(e || '').trim().toLowerCase();
const mask = (e) => String(e || '').replace(/^(.).*@/, '$1***@');

async function loadDoc() { return (await getJSON(STORE, KEY)) || { codes: {}, byEmail: {} }; }
async function saveDoc(d) { d.updatedAt = new Date().toISOString(); await setJSON(STORE, KEY, d); }

export async function getReferral(code) {
  code = norm(code);
  if (!REFERRAL_RE.test(code)) return null;
  return (await loadDoc()).codes[code] || null;
}

export const sharePage = (site, code) => `${site}/refer/?c=${encodeURIComponent(code)}`; // ?c= so cart.js doesn't apply it to their own cart
export const shareLink = (site, code) => `${site}/shop/?code=${encodeURIComponent(code)}&utm_source=referral&utm_medium=friend`;

// Get (or make) this customer's friend code.
export async function referralFor(emailAddr, name) {
  const e = key(emailAddr);
  if (!e) return null;
  const d = await loadDoc();
  if (d.byEmail[e] && d.codes[d.byEmail[e]]) return d.codes[d.byEmail[e]];
  const first = firstNameOf(name);
  const base = (first.normalize('NFD').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 10)) || 'FRIEND';
  const prefix = base.length >= 2 ? base : 'FRIEND';
  let code;
  do code = `${prefix}-` + crypto.randomBytes(8).toString('base64').toUpperCase().replace(/[^A-Z2-9]/g, '').replace(/[IO]/g, '').padEnd(4, '7').slice(0, 4);
  while (d.codes[code]);
  d.codes[code] = { code, email: e, first: first || null, createdAt: new Date().toISOString(), active: true, rewards: [] };
  d.byEmail[e] = code;
  await saveDoc(d);
  return d.codes[code];
}

const addrKey = (s) => (s && s.line1 && s.postal ? `${String(s.line1).toLowerCase().replace(/[^a-z0-9]/g, '')}|${String(s.postal).toLowerCase().replace(/\s/g, '')}` : null);

// Called once per paid order (record.mjs). If the order used a friend code, note the reward that comes due later.
export async function recordReferralOrder(rec, deps = {}) {
  const code = norm(rec.code);
  if (!REFERRAL_RE.test(code)) return null;
  const d = await loadDoc();
  const ref = d.codes[code];
  if (!ref) return null;
  if (ref.rewards.some((r) => r.orderId === rec.id)) return ref;
  let status = 'pending', note = null;
  if (key(rec.email) === ref.email) { status = 'void'; note = 'Used their own code'; }
  else {
    // Same address as one of the customer's own orders? Hold it for a quick check.
    const owner = await getJSON('customers', ref.email);
    const here = addrKey(rec.shipTo);
    if (here && owner?.orders) {
      for (const id of Object.keys(owner.orders)) {
        const o = await getJSON('orders', id);
        if (o && addrKey(o.shipTo) === here) { status = 'check'; note = 'Ships to the same address as their own order'; break; }
      }
    }
  }
  const at = rec.createdAt || new Date().toISOString();
  ref.rewards.push({ orderId: rec.id, friend: mask(rec.email), friendName: firstNameOf(rec.name) || null, total: rec.total, at, unlockAt: new Date(Date.parse(at) + REFERRAL.holdDays * DAY).toISOString(), status, note });
  await saveDoc(d);
  if (deps.sendTelegram || telegramReady()) {
    try { await (deps.sendTelegram || sendTelegram)(`🤝 Friend code ${code} (${ref.first || mask(ref.email)}) was just used on a new order.${status === 'check' ? ' Same address as their own order: check it in HQ > Referrals.' : ''}`); } catch (e) { console.error('telegram failed', e.message); }
  }
  return ref;
}

export function rewardEmail(ref, reward, rcode, site) {
  const hi = ref.first ? `Hi ${ref.first},` : 'Hi there,';
  const who = reward.friendName || 'A friend';
  const link = `${site}/shop/?code=${encodeURIComponent(rcode.code)}&utm_source=email&utm_medium=referral&utm_campaign=reward`;
  const exp = new Date(rcode.expiresAt * 1000).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Vancouver' });
  const m = emailHtml({
    eyebrow: 'Refer a friend',
    head: "Here's your $20.",
    paras: [hi, `${who} tried REWILD with your friend code. Thank you for sharing us. Here's $20 off your next order of $75 or more.`, `It works once and is good until ${exp}.`],
    code: rcode.code,
    cta: { text: 'Use my $20', link },
    after: [`Keep sharing: every friend who places a first order with your code ${ref.code} gets $20 off, and you get another $20.`],
    foot: "You're getting this because a friend used your REWILD friend code.",
  });
  return { subject: "Your friend ordered. Here's $20.", ...m };
}

// Runs daily (customer-emails.mjs): rewards whose 21 days have passed get their code and email.
export async function runReferralRewards(now = Date.now(), { send, site }) {
  const d = await loadDoc();
  const report = { issued: 0, void: 0 };
  let changed = false;
  for (const ref of Object.values(d.codes)) {
    for (const r of ref.rewards) {
      if (r.status !== 'pending' || now < Date.parse(r.unlockAt)) continue;
      const o = await getJSON('orders', r.orderId);
      if (!o || o.deleted || (o.refunded || 0) > 0 || ['cancelled', 'refunded'].includes(o.hqStatus)) {
        r.status = 'void'; r.note = 'Order was refunded or cancelled'; changed = true; report.void += 1; continue;
      }
      const rc = await createOnetimeCode({ prefix: 'REWARD', amountOff: REFERRAL.rewardOff, min: REFERRAL.min, days: REFERRAL.rewardDays, email: ref.email, source: 'referral' }, now);
      r.status = 'issued'; r.rewardCode = rc.code; r.issuedAt = new Date(now).toISOString(); changed = true;
      try {
        const m = rewardEmail(ref, r, rc, site);
        await send({ to: ref.email, subject: m.subject, text: m.text, html: m.html, fromName: 'REWILD Mushrooms', replyTo: 'hello@rewildmushrooms.com' });
        r.emailed = true;
      } catch (e) { console.error('reward email failed', e.message); r.emailed = false; }
      report.issued += 1;
    }
  }
  if (changed) await saveDoc(d);
  return report;
}

// "Email me my link" on /refer/. Only past customers get a link; the answer is the same either way.
export function linkEmail(ref, site) {
  const link = shareLink(site, ref.code);
  const m = emailHtml({
    eyebrow: 'Refer a friend',
    head: 'Give $20. Get $20.',
    paras: [ref.first ? `Hi ${ref.first},` : 'Hi there,', `Here's your friend code: share it with anyone you think would love REWILD. They get $20 off their first order of $75 or more. When their order is in (and past our 14-day guarantee), we email you $20 off your next one.`, 'Share the link, or just tell them the code.'],
    code: ref.code,
    cta: { text: 'Open my share page', link: sharePage(site, ref.code) },
    after: [`Your link: ${link}`],
    foot: 'You asked for your REWILD friend code on rewildmushrooms.com.',
  });
  return { subject: 'Your REWILD friend code', ...m };
}

export async function sendLinkTo(emailAddr, { send, site }) {
  const e = key(emailAddr);
  const c = await getJSON('customers', e);
  if (!c || !(c.orderCount > 0)) return { sent: false };
  const ref = await referralFor(e, c.name);
  const m = linkEmail(ref, site);
  await send({ to: e, subject: m.subject, text: m.text, html: m.html, fromName: 'REWILD Mushrooms', replyTo: 'hello@rewildmushrooms.com' });
  return { sent: true };
}

// HQ
export async function listReferrals() {
  const d = await loadDoc();
  const list = Object.values(d.codes).filter((r) => r.rewards.length || r.shared).map((r) => ({ ...r, email: r.email }));
  const all = Object.values(d.codes);
  const rewards = all.flatMap((r) => r.rewards);
  return {
    codes: all.length,
    friends: rewards.filter((r) => r.status !== 'void').length,
    issued: rewards.filter((r) => r.status === 'issued').length,
    waiting: rewards.filter((r) => r.status === 'pending').length,
    check: rewards.filter((r) => r.status === 'check').length,
    sales: rewards.filter((r) => r.status !== 'void').reduce((a, r) => a + (r.total || 0), 0),
    list: list.sort((a, b) => (b.rewards.at(-1)?.at || '').localeCompare(a.rewards.at(-1)?.at || '')),
    rules: REFERRAL,
  };
}

// HQ: approve (check -> pending, issued on the next daily run once 21 days have passed) or void a reward.
export async function setRewardStatus(code, orderId, status) {
  if (!['pending', 'void'].includes(status)) throw Object.assign(new Error('Bad status'), { status: 400 });
  const d = await loadDoc();
  const r = d.codes[norm(code)]?.rewards.find((x) => x.orderId === orderId);
  if (!r) throw Object.assign(new Error('Reward not found'), { status: 400 });
  if (r.status === 'issued') throw Object.assign(new Error('That reward was already sent.'), { status: 400 });
  r.status = status; r.note = status === 'void' ? 'Turned down in HQ' : 'Approved in HQ';
  await saveDoc(d);
  return { ok: true };
}
