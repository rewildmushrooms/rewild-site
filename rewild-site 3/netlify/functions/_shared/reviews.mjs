// Customer reviews.
//   Ask: one email, 14 days after the order is marked shipped in HQ (or 18 days after the order if it never was).
//     Once per order, never twice in 30 days to the same person, never after "Stop these emails".
//     Orders that came due more than 10 days ago are skipped (HQ has a button to ask recent past customers once).
//   Review: /review/?o=<order>&t=<token>. Stars, a few words, display name. 15% thank-you code (THANKS-, 60 days,
//     one use) for every review, good or bad. Reviews never go live on their own: Jade approves them in HQ > Reviews
//     (and can trim anything that reads like a health claim). Only reviews the customer allowed us to show are shown.
// Stored in Netlify Blobs: store "reviews", key "all". Order records keep { review: { token, askedAt, doneAt } }.
import crypto from 'node:crypto';
import { getJSON, setJSON } from './store.mjs';
import { readIndex, putIndex, customerSummary } from './data.mjs';
import { createOnetimeCode } from './carts.mjs';
import { PRODUCT_BY_ID } from './catalog.mjs';
import { email as emailHtml, firstNameOf } from './emailtpl.mjs';
import { referralFor, sharePage, REFERRAL } from './referrals.mjs';
import { optoutLink } from './lifecycle.mjs';
import { sendTelegram, telegramReady } from './telegram.mjs';

export const REVIEW = { afterShipDays: 14, afterOrderDays: 18, staleDays: 10, gapDays: 30, thanksPercent: 15, thanksDays: 60 };
const DAY = 86400000;
const STORE = 'reviews';
const KEY = 'all';
const bad = (m, status = 400) => Object.assign(new Error(m), { status });
const clean = (s, n) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const SELLABLE = ['energy', 'clarity', 'strength', 'peace', 'tincture'];

async function loadDoc() { return (await getJSON(STORE, KEY)) || { list: [] }; }
async function saveDoc(d) { d.updatedAt = new Date().toISOString(); await setJSON(STORE, KEY, d); }

// Products in an order, with bundles opened up (Duo = Energy + tincture, All Four = the four powders).
export function orderProducts(rec) {
  const ids = new Set();
  for (const [id, n] of Object.entries(rec.units || {})) if (n > 0 && SELLABLE.includes(id)) ids.add(id);
  for (const i of rec.items || []) if (SELLABLE.includes(i.id)) ids.add(i.id);
  return [...ids];
}

export function dueAt(rec) {
  const base = rec.shipment?.at ? Date.parse(rec.shipment.at) + REVIEW.afterShipDays * DAY : Date.parse(rec.createdAt) + REVIEW.afterOrderDays * DAY;
  return Number.isFinite(base) ? base : null;
}

export function askEmail(rec, { site, link, refCode, optout }) {
  const first = firstNameOf(rec.name);
  const ids = orderProducts(rec);
  const one = ids.length === 1 ? PRODUCT_BY_ID[ids[0]]?.name : null;
  const m = emailHtml({
    eyebrow: 'Two minutes?',
    head: one ? `How's your ${one}?` : 'How are your mushrooms?',
    paras: [first ? `Hi ${first},` : 'Hi there,', "It's been about two weeks since your REWILD order arrived. We'd love to hear how it's going, in your own words. It takes about two minutes.",
      `As a thank-you, everyone who leaves a review gets ${REVIEW.thanksPercent}% off their next order, whatever they say. Honest is all we ask.`],
    cta: { text: 'Leave a review', link },
    after: refCode ? [`P.S. Know someone who'd like REWILD? Your friend code ${refCode} gives them $${REFERRAL.friendOff / 100} off their first order of $${REFERRAL.min / 100} or more, and you get $${REFERRAL.rewardOff / 100} when they order. Share it here: ${sharePage(site, refCode)}`] : [],
    foot: "You're getting this because you ordered from rewildmushrooms.com.",
    optout,
  });
  return { subject: one ? `How's your ${one}?` : 'How are your mushrooms?', ...m, unsubscribe: optout };
}

// Daily (customer-emails.mjs). backfillDays: HQ button, asks orders that came due within that many days.
export async function runReviewRequests(now = Date.now(), { send, site, backfillDays = 0 }) {
  const report = { checked: 0, sent: 0 };
  const index = await readIndex('orders');
  const limit = (backfillDays || REVIEW.staleDays) * DAY;
  for (const [id, s] of Object.entries(index)) {
    if (!s.email || s.source === 'offline' || ['refunded', 'cancelled'].includes(s.status) || s.refunded > 0) continue;
    report.checked += 1;
    const rec = await getJSON('orders', id);
    if (!rec || rec.deleted || rec.review?.askedAt || !orderProducts(rec).length) continue;
    const due = dueAt(rec);
    if (!due || now < due || now - due > limit) continue;
    const c = await getJSON('customers', rec.email);
    if (!c || c.noReminders) continue;
    if (c.reviewAskedAt && now - Date.parse(c.reviewAskedAt) < REVIEW.gapDays * DAY) continue;
    const token = crypto.randomBytes(12).toString('hex');
    const link = `${site}/review/?o=${encodeURIComponent(id)}&t=${token}&utm_source=email&utm_medium=lifecycle&utm_campaign=review`;
    let refCode = null;
    try { refCode = (await referralFor(rec.email, c.name || rec.name))?.code || null; } catch (e) { console.error('referral code failed', e.message); }
    const optout = await optoutLink(site, rec.email, c);
    const m = askEmail(rec, { site, link, refCode, optout });
    await send({ to: rec.email, subject: m.subject, text: m.text, html: m.html, fromName: 'REWILD Mushrooms', replyTo: 'hello@rewildmushrooms.com', unsubscribe: m.unsubscribe });
    rec.review = { token, askedAt: new Date(now).toISOString() };
    await setJSON('orders', id, rec);
    c.reviewAskedAt = new Date(now).toISOString();
    await setJSON('customers', rec.email, c);
    try { await putIndex('customers', rec.email, customerSummary(c)); } catch (e) { console.error('index update failed', e.message); }
    report.sent += 1;
  }
  return report;
}

async function orderForToken(o, t) {
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(o || '') || !/^[a-f0-9]{24}$/.test(t || '')) throw bad('That review link is not right. Please use the button in your email.');
  const rec = await getJSON('orders', o);
  if (!rec || rec.deleted || !rec.review?.token || rec.review.token !== t) throw bad('That review link has expired. Reply to our email and we’ll send a new one.');
  return rec;
}

const shortName = (name) => { const p = String(name || '').trim().split(/\s+/).filter(Boolean); return p.length ? p[0] + (p.length > 1 ? ` ${p.at(-1)[0].toUpperCase()}.` : '') : ''; };

// GET /api/review?o=&t=
export async function reviewForm(o, t) {
  const rec = await orderForToken(o, t);
  return { firstName: firstNameOf(rec.name) || null, displayName: shortName(rec.name), done: !!rec.review.doneAt,
    products: orderProducts(rec).map((id) => ({ id, name: PRODUCT_BY_ID[id].name, mushroom: PRODUCT_BY_ID[id].commonName || null, image: PRODUCT_BY_ID[id].image })) };
}

export function thanksEmail(rec, code, site, refCode) {
  const first = firstNameOf(rec.name);
  const exp = new Date(code.expiresAt * 1000).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Vancouver' });
  const m = emailHtml({
    eyebrow: 'Thank you',
    head: 'Thanks for the review.',
    paras: [first ? `Hi ${first},` : 'Hi there,', `We read every one. Here's ${REVIEW.thanksPercent}% off your next order, as promised. It works once and is good until ${exp}.`],
    code: code.code,
    cta: { text: `Shop with ${REVIEW.thanksPercent}% off`, link: `${site}/shop/?code=${encodeURIComponent(code.code)}&utm_source=email&utm_medium=lifecycle&utm_campaign=review_thanks` },
    after: refCode ? [`Want to share REWILD? Your friend code ${refCode} gives a friend $${REFERRAL.friendOff / 100} off their first order, and you get $${REFERRAL.rewardOff / 100}: ${sharePage(site, refCode)}`] : [],
    foot: 'You left a review on rewildmushrooms.com.',
  });
  return { subject: `Thank you. Here's ${REVIEW.thanksPercent}% off.`, ...m };
}

// POST /api/review { o, t, rating, title, text, name, location, products, consent }
export async function submitReview(b, { send, site } = {}, deps = {}) {
  const rec = await orderForToken(b.o, b.t);
  if (rec.review.doneAt) throw bad('Thanks, we already have your review for this order.');
  const rating = Math.round(Number(b.rating));
  if (!(rating >= 1 && rating <= 5)) throw bad('Please choose 1 to 5 stars.');
  const text = String(b.text ?? '').trim().replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').slice(0, 1500);
  if (text.length < 10) throw bad('Please write a few words (at least 10 characters).');
  const name = clean(b.name, 40) || shortName(rec.name) || 'Verified buyer';
  const inOrder = orderProducts(rec);
  const products = (Array.isArray(b.products) ? b.products : []).filter((id) => inOrder.includes(id));
  const review = {
    id: 'r_' + crypto.randomBytes(6).toString('hex'),
    orderId: rec.id, email: rec.email, rating, title: clean(b.title, 80), text, name, location: clean(b.location, 40),
    products: products.length ? products : inOrder, consent: !!b.consent, status: 'pending', createdAt: new Date().toISOString(),
  };
  const code = await createOnetimeCode({ prefix: 'THANKS', percentOff: REVIEW.thanksPercent, days: REVIEW.thanksDays, email: rec.email, source: 'review' });
  review.thanksCode = code.code;
  const d = await loadDoc();
  d.list.push(review);
  await saveDoc(d);
  rec.review.doneAt = review.createdAt; rec.review.id = review.id;
  await setJSON('orders', rec.id, rec);
  let ref = null;
  try { ref = await referralFor(rec.email, rec.name); } catch (e) { console.error('referral code failed', e.message); }
  if (send && rec.email) {
    try { const m = thanksEmail(rec, code, site, ref?.code); await send({ to: rec.email, subject: m.subject, text: m.text, html: m.html, fromName: 'REWILD Mushrooms', replyTo: 'hello@rewildmushrooms.com' }); }
    catch (e) { console.error('thanks email failed', e.message); }
  }
  if (deps.sendTelegram || telegramReady()) {
    try { await (deps.sendTelegram || sendTelegram)(`⭐ New ${rating}-star review from ${name}${review.consent ? '' : ' (private, not for the website)'}. Approve it in HQ > Reviews.`); } catch (e) { console.error('telegram failed', e.message); }
  }
  return { ok: true, code: code.code, percentOff: REVIEW.thanksPercent, expiresAt: code.expiresAt, referral: ref ? { code: ref.code, page: sharePage(site || '', ref.code) } : null };
}

// Public list for product pages: approved, and the customer said we could show it.
export async function publicReviews(product) {
  const d = await loadDoc();
  return d.list.filter((r) => r.status === 'approved' && r.consent && (!product || r.products.includes(product)))
    .sort((a, b) => (b.approvedAt || b.createdAt).localeCompare(a.approvedAt || a.createdAt)).slice(0, 30)
    .map((r) => ({ id: r.id, rating: r.rating, title: r.title, text: r.text, name: r.name, location: r.location, products: r.products, at: r.createdAt.slice(0, 10) }));
}

// HQ
export async function listReviews() {
  const d = await loadDoc();
  const list = [...d.list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const rated = list.filter((r) => r.rating);
  return { list, pending: list.filter((r) => r.status === 'pending').length, average: rated.length ? Math.round((rated.reduce((a, r) => a + r.rating, 0) / rated.length) * 10) / 10 : null, rules: REVIEW };
}

export async function updateReview(b) {
  const d = await loadDoc();
  const r = d.list.find((x) => x.id === b.id);
  if (!r) throw bad('Review not found');
  if (b.title !== undefined) r.title = clean(b.title, 80);
  if (b.text !== undefined) { const t = String(b.text).trim().slice(0, 1500); if (t.length < 3) throw bad('The review text can’t be empty.'); if (t !== r.text) { r.originalText = r.originalText || r.text; r.text = t; } }
  if (b.name !== undefined) r.name = clean(b.name, 40) || r.name;
  if (b.location !== undefined) r.location = clean(b.location, 40);
  if (Array.isArray(b.products)) { const p = b.products.filter((id) => SELLABLE.includes(id)); if (p.length) r.products = p; }
  if (b.status) {
    if (!['pending', 'approved', 'hidden'].includes(b.status)) throw bad('Bad status');
    if (b.status === 'approved' && !r.consent) throw bad('This customer did not say we could show their review on the website.');
    r.status = b.status;
    if (b.status === 'approved') r.approvedAt = new Date().toISOString();
  }
  r.updatedAt = new Date().toISOString();
  await saveDoc(d);
  return { ok: true, review: r };
}
