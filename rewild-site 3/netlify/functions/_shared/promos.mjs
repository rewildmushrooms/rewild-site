// Promo codes. The website keeps its own list in Netlify Blobs (store "promo-codes", key "all"),
// keyed by the code itself, so codes carry over unchanged when Square moves from sandbox to live.
// Each code: { code, percentOff | amountOff, on, exp, min, once, archived, archivedAt, note, createdAt, squareId }
//   on: switched on      exp: last day it works (YYYY-MM-DD, Pacific)     min: minimum order in cents
//   once: one use per customer (checked by email against paid orders)
//   archived: switched off and hidden in HQ. Never deleted, so old orders, reports and commissions keep their history.
// Discounts made in the Square app (Items > Discounts) are picked up automatically the next time HQ lists codes.
// Square only needs the code at checkout: the order gets an ad hoc discount with the code as its name.
import { square, idem, pages } from './square.mjs';
import { getJSON, setJSON } from './store.mjs';
import { getRecoveryCode, RECOVERY_RE } from './carts.mjs';
import { getReferral, REFERRAL } from './referrals.mjs';

export const CODE_RE = /^[A-Z0-9_-]{3,30}$/;
export const normCode = (c) => String(c || '').trim().toUpperCase();
const STORE = 'promo-codes';
const KEY = 'all';
const bad = (m) => Object.assign(new Error(m), { status: 400 });

let cache = { at: 0, list: null };
export const _resetPromoCache = () => { cache = { at: 0, list: null }; };

// Codes made before rules were saved. Only used once, when old Square codes are first copied in.
export const DEFAULT_RULES = {
  SEAN30WW: { on: true, exp: '2026-10-15' },
  PETEMOSS30WW: { on: true, exp: '2026-10-15' },
};

// End of the expiry day in Pacific time (handles PDT/PST).
export function endOfDayPacific(ymd) {
  const guess = Date.parse(`${ymd}T23:59:59-08:00`);
  const pdt = Date.parse(`${ymd}T23:59:59-07:00`);
  const offset = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', timeZoneName: 'short' }).format(new Date(pdt)).includes('PDT');
  return Math.floor((offset ? pdt : guess) / 1000);
}

export function toPromo(r) {
  return {
    id: r.code,
    code: r.code,
    percentOff: r.percentOff || null,
    amountOff: r.amountOff || null,
    active: r.on !== false && !r.archived,
    archived: !!r.archived,
    archivedAt: r.archivedAt || null,
    oncePerCustomer: !!r.once,
    expiresAt: r.exp ? endOfDayPacific(r.exp) : null,
    expiresOn: r.exp || null,
    minimumAmount: r.min || null,
    note: r.note || '',
    createdAt: r.createdAt || null,
  };
}

// Square catalog discount -> our record (used when copying codes in from Square).
function fromSquare(obj, rules = {}) {
  const d = obj.discount_data || {};
  const code = normCode(d.name);
  const r = { code, on: true, createdAt: (obj.updated_at || new Date().toISOString()).slice(0, 10), squareId: obj.id, ...(DEFAULT_RULES[code] || {}), ...rules };
  if (d.discount_type === 'FIXED_PERCENTAGE') r.percentOff = Number(d.percentage);
  else r.amountOff = Number(d.amount_money?.amount || 0);
  return r;
}

async function squareDiscounts(opts) {
  const objs = await pages((cursor) => square('GET', `/catalog/list?types=DISCOUNT${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, null, opts), 'objects', 2000);
  return objs.filter((o) => !o.is_deleted && ['FIXED_PERCENTAGE', 'FIXED_AMOUNT'].includes(o.discount_data?.discount_type) && CODE_RE.test(normCode(o.discount_data?.name)));
}

async function loadDoc() { return (await getJSON(STORE, KEY)) || { codes: {} }; }
async function saveDoc(doc) { doc.updatedAt = new Date().toISOString(); await setJSON(STORE, KEY, doc); _resetPromoCache(); }

// Copy in any Square discounts we do not have yet (first run, or codes made in the Square app).
// Never overwrites a code we already keep. If Square is unreachable, our own list is used as is.
async function syncFromSquare(doc, opts) {
  let objs;
  try { objs = await squareDiscounts(opts); } catch (e) { console.error('square discounts list failed', e.message); return false; }
  const oldRules = doc.importedAt ? {} : ((await getJSON('promo-rules', 'all').catch(() => null)) || {});
  let added = 0;
  for (const o of objs) {
    const code = normCode(o.discount_data.name);
    if (doc.codes[code]) continue;
    const r = oldRules[o.id] || {};
    doc.codes[code] = fromSquare(o, { ...(r.on === false ? { on: false } : {}), ...(r.exp ? { exp: r.exp } : {}), ...(r.min ? { min: r.min } : {}), ...(r.once ? { once: true } : {}), ...(r.archived ? { archived: true, archivedAt: r.archivedAt || null } : {}) });
    added += 1;
  }
  if (added || !doc.importedAt) { doc.importedAt = doc.importedAt || new Date().toISOString(); await saveDoc(doc); }
  return true;
}

export async function listPromos(opts, { fresh = false } = {}) {
  if (!fresh && cache.list && Date.now() - cache.at < 60000) return cache.list;
  const doc = await loadDoc();
  if (fresh || !doc.importedAt) await syncFromSquare(doc, opts);
  const list = Object.values(doc.codes).map(toPromo).sort((a, b) => a.code.localeCompare(b.code));
  cache = { at: Date.now(), list };
  return list;
}

// Customer records (store "customers", key = lowercased email) keep codesUsed from paid orders.
export async function usedByCustomer(code, email) {
  const key = String(email || '').trim().toLowerCase();
  if (!key) return false;
  const c = await getJSON('customers', key);
  return (c?.codesUsed || []).map(normCode).includes(normCode(code));
}

// Returns { promo, discount } or throws a friendly 400.
// email (optional): when given, one-use-per-customer codes are checked against that customer's paid orders.
export async function validatePromo(code, subtotal, opts, now = Date.now(), email = '') {
  code = normCode(code);
  if (!CODE_RE.test(code)) throw bad('That code does not look right.');
  if (RECOVERY_RE.test(code)) {
    // One-time code from a cart reminder or win-back email.
    const r = await getRecoveryCode(code);
    if (!r) throw bad(`${code} is not a valid code.`);
    if (r.used) throw bad(`${code} has already been used.`);
    if (now / 1000 > r.expiresAt) throw bad(`${code} has expired.`);
    const promo = { id: null, code, percentOff: r.percentOff || null, amountOff: r.amountOff || null, active: true, expiresAt: r.expiresAt, minimumAmount: r.min || null, oneTime: true };
    if (promo.minimumAmount && subtotal < promo.minimumAmount) throw bad(`${code} needs an order of $${(promo.minimumAmount / 100).toFixed(0)} or more.`);
    return { promo, discount: discountFor(promo, subtotal) };
  }
  let promo = (await listPromos(opts)).find((p) => p.code === code);
  if (!promo) {
    // A customer's refer-a-friend code: $20 off a first order of $75+.
    const ref = await getReferral(code);
    if (ref && ref.active !== false) {
      const key = String(email || '').trim().toLowerCase();
      if (key && key === ref.email) throw bad('That\u2019s your own friend code. Share it with friends and you\u2019ll get $20 when they order.');
      if (key) {
        const c = await getJSON('customers', key);
        if ((c?.orderCount || 0) > 0) throw bad(`${code} is a friend code for first orders. Welcome back! It can\u2019t be used on this order.`);
      }
      promo = { id: null, code, percentOff: null, amountOff: REFERRAL.friendOff, active: true, expiresAt: null, minimumAmount: REFERRAL.min, referral: true, referrer: ref.first || null };
      if (subtotal < promo.minimumAmount) throw bad(`${code} needs an order of $${(promo.minimumAmount / 100).toFixed(0)} or more.`);
      return { promo, discount: discountFor(promo, subtotal) };
    }
  }
  if (!promo || !promo.active) throw bad(`${code} is not a valid code.`);
  if (promo.expiresAt && now / 1000 > promo.expiresAt) throw bad(`${code} has expired.`);
  if (promo.minimumAmount && subtotal < promo.minimumAmount) throw bad(`${code} needs an order of $${(promo.minimumAmount / 100).toFixed(0)} or more.`);
  if (promo.oncePerCustomer && email && (await usedByCustomer(code, email))) throw bad(`${code} can be used once per customer, and it has already been used with this email.`);
  return { promo, discount: discountFor(promo, subtotal) };
}

export function discountFor(promo, subtotal) {
  if (promo.percentOff) return Math.round((subtotal * promo.percentOff) / 100);
  return Math.min(subtotal, promo.amountOff || 0);
}

// Square order discount (ad hoc, so the receipt shows the code name).
export function orderDiscount(promo) {
  const base = { uid: 'promo', name: promo.code, scope: 'ORDER' };
  return promo.percentOff
    ? { ...base, type: 'FIXED_PERCENTAGE', percentage: String(promo.percentOff) }
    : { ...base, type: 'FIXED_AMOUNT', amount_money: { amount: promo.amountOff, currency: 'CAD' } };
}

const cleanNote = (n) => String(n || '').replace(/\s+/g, ' ').trim().slice(0, 300);

export async function createPromo(b, opts) {
  const code = normCode(b.code);
  if (!CODE_RE.test(code)) throw bad('Code must be 3 to 30 letters, numbers, - or _.');
  if (RECOVERY_RE.test(code)) throw bad('Codes starting with COMEBACK-, THANKS- or REWARD- are reserved for website emails.');
  if (await getReferral(code)) throw bad(`${code} is already a customer\u2019s friend code.`);
  const pct = b.percentOff ? Number(b.percentOff) : null;
  const amt = b.amountOff ? Math.round(Number(b.amountOff) * 100) : null;
  if (!(pct > 0 && pct <= 100) && !(amt > 0)) throw bad('Enter a percent off (1 to 100) or a dollar amount off.');
  const doc = await loadDoc();
  if (!doc.importedAt) await syncFromSquare(doc, opts);
  if (doc.codes[code]) throw bad(`${code} already exists${doc.codes[code].archived ? ' (archived). Restore it instead' : ''}.`);
  const r = { code, on: true, createdAt: new Date().toISOString().slice(0, 10) };
  if (pct) r.percentOff = pct; else r.amountOff = amt;
  if (b.expiresAt && /^\d{4}-\d{2}-\d{2}$/.test(b.expiresAt)) r.exp = b.expiresAt;
  if (b.minimumAmount) r.min = Math.round(Number(b.minimumAmount) * 100);
  if (b.oncePerCustomer) r.once = true;
  if (cleanNote(b.note)) r.note = cleanNote(b.note);
  // Also add it to Square (Items > Discounts) so it can be used in the Square app. Optional: the website does not need it.
  try {
    const object = { type: 'DISCOUNT', id: '#new', present_at_all_locations: true,
      discount_data: pct ? { name: code, discount_type: 'FIXED_PERCENTAGE', percentage: String(pct) } : { name: code, discount_type: 'FIXED_AMOUNT', amount_money: { amount: amt, currency: 'CAD' } } };
    const res = await square('POST', '/catalog/object', { idempotency_key: idem(), object }, opts);
    r.squareId = res.catalog_object?.id || null;
  } catch (e) { console.error('square discount create failed (website code still works)', e.message); }
  doc.codes[code] = r;
  await saveDoc(doc);
  return toPromo(r);
}

async function patch(code, fn) {
  code = normCode(code);
  if (!CODE_RE.test(code)) throw bad('Bad code');
  const doc = await loadDoc();
  const cur = doc.codes[code];
  if (!cur) throw bad(`${code} was not found.`);
  doc.codes[code] = fn({ ...cur });
  await saveDoc(doc);
  return { ok: true, promo: toPromo(doc.codes[code]) };
}

export const setPromoActive = (code, active) => patch(code, (r) => {
  if (active && r.archived) throw bad('Restore this code before turning it on.');
  return { ...r, on: !!active };
});

// Archive = switch off and hide. Restore brings it back switched off, so nothing goes live by surprise.
export const setPromoArchived = (code, archived) => patch(code, (r) => (archived
  ? { ...r, on: false, archived: true, archivedAt: new Date().toISOString().slice(0, 10) }
  : { ...r, archived: false, archivedAt: null }));

export const setPromoOnce = (code, once) => patch(code, (r) => ({ ...r, once: !!once }));
export const setPromoNote = (code, note) => patch(code, (r) => ({ ...r, note: cleanNote(note) }));
