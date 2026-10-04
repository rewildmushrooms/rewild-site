// Promo codes live in Square as catalog Discounts (Items > Discounts in the Square dashboard).
// The discount's name is the code customers type (e.g. SEAN20).
// Extra web rules (on/off, expiry date, minimum order, one use per customer, archived) are managed
// from REWILD HQ and saved in Netlify Blobs (store "promo-rules", key "all" =
// { [squareDiscountId]: { on, exp, min, once, archived } }).
// Archived codes are never deleted (old orders, reports and commissions still point at them);
// they stop working and are hidden in HQ until restored.
// Square does not allow custom attributes on discounts, so rules live on our side.
// Older codes may still carry rules in a "rewild_rules" custom attribute; those are read as a fallback.
import { square, idem, pages } from './square.mjs';
import { getJSON, setJSON } from './store.mjs';
import { getRecoveryCode, RECOVERY_RE } from './carts.mjs';

const RULES_KEY = 'rewild_rules';
export const CODE_RE = /^[A-Z0-9_-]{3,30}$/;
export const normCode = (c) => String(c || '').trim().toUpperCase();

let cache = { at: 0, list: null };
export const _resetPromoCache = () => { cache = { at: 0, list: null }; };

export function readRules(obj) {
  const cav = obj.custom_attribute_values || {};
  const hit = Object.entries(cav).find(([k, v]) => k === RULES_KEY || v?.key === RULES_KEY || k.endsWith(':' + RULES_KEY));
  if (!hit) return null;
  try { return JSON.parse(hit[1].string_value || '{}'); } catch { return null; }
}

// Built-in rules for codes made before rules were saved in Blobs. Saved rules win over these.
export const DEFAULT_RULES = {
  SEAN30WW: { on: true, exp: '2026-10-15' },
  PETEMOSS30WW: { on: true, exp: '2026-10-15' },
};

const RULES_STORE = 'promo-rules';
export async function loadRules() {
  try { return (await getJSON(RULES_STORE, 'all')) || {}; } catch (e) { console.error('promo rules load failed', e.message); return {}; }
}
async function saveRule(id, rules) {
  const all = (await getJSON(RULES_STORE, 'all')) || {}; // throws if storage is down, so we never wipe saved rules
  all[id] = rules;
  await setJSON(RULES_STORE, 'all', all);
}

// End of the expiry day in Pacific time (handles PDT/PST).
export function endOfDayPacific(ymd) {
  const guess = Date.parse(`${ymd}T23:59:59-08:00`);
  const pdt = Date.parse(`${ymd}T23:59:59-07:00`);
  const offset = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', timeZoneName: 'short' }).format(new Date(pdt)).includes('PDT');
  return Math.floor((offset ? pdt : guess) / 1000);
}

// Square discount object -> plain promo
export function toPromo(obj, saved) {
  const d = obj.discount_data || {};
  const name = normCode(d.name);
  const rules = saved || readRules(obj) || DEFAULT_RULES[name] || {};
  const pct = d.discount_type === 'FIXED_PERCENTAGE' ? Number(d.percentage) : null;
  const amt = d.discount_type === 'FIXED_AMOUNT' ? Number(d.amount_money?.amount || 0) : null;
  return {
    id: obj.id,
    version: obj.version,
    code: normCode(d.name),
    percentOff: pct,
    amountOff: amt,
    active: rules.on !== false && !rules.archived,
    archived: !!rules.archived,
    oncePerCustomer: !!rules.once,
    expiresAt: rules.exp ? endOfDayPacific(rules.exp) : null,
    expiresOn: rules.exp || null,
    minimumAmount: rules.min || null,
    hasRules: !!(saved || readRules(obj) || DEFAULT_RULES[name]),
  };
}

export async function listPromos(opts, { fresh = false } = {}) {
  if (!fresh && cache.list && Date.now() - cache.at < 60000) return cache.list;
  const objs = await pages((cursor) => square('GET', `/catalog/list?types=DISCOUNT${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, null, opts), 'objects', 2000);
  const saved = await loadRules();
  const list = objs
    .filter((o) => !o.is_deleted && (o.discount_data?.discount_type === 'FIXED_PERCENTAGE' || o.discount_data?.discount_type === 'FIXED_AMOUNT'))
    .map((o) => toPromo(o, saved[o.id]))
    .filter((p) => CODE_RE.test(p.code));
  cache = { at: Date.now(), list };
  return list;
}

// Returns { promo, discount } or throws a friendly 400.
// email (optional): when given, one-use-per-customer codes are checked against that customer's paid orders.
export async function validatePromo(code, subtotal, opts, now = Date.now(), email = '') {
  code = normCode(code);
  const bad = (m) => Object.assign(new Error(m), { status: 400 });
  if (!CODE_RE.test(code)) throw bad('That code does not look right.');
  if (RECOVERY_RE.test(code)) {
    // One-time cart recovery code from a reminder email.
    const r = await getRecoveryCode(code);
    if (!r) throw bad(`${code} is not a valid code.`);
    if (r.used) throw bad(`${code} has already been used.`);
    if (now / 1000 > r.expiresAt) throw bad(`${code} has expired.`);
    const promo = { id: null, code, percentOff: r.percentOff, amountOff: null, active: true, expiresAt: r.expiresAt, minimumAmount: null, oneTime: true };
    return { promo, discount: discountFor(promo, subtotal) };
  }
  const promo = (await listPromos(opts)).find((p) => p.code === code);
  if (!promo || !promo.active) throw bad(`${code} is not a valid code.`);
  if (promo.expiresAt && now / 1000 > promo.expiresAt) throw bad(`${code} has expired.`);
  if (promo.minimumAmount && subtotal < promo.minimumAmount) throw bad(`${code} needs an order of $${(promo.minimumAmount / 100).toFixed(0)} or more.`);
  if (promo.oncePerCustomer && email && (await usedByCustomer(code, email))) throw bad(`${code} can be used once per customer, and it has already been used with this email.`);
  return { promo, discount: discountFor(promo, subtotal) };
}

// Customer records (store "customers", key = lowercased email) keep codesUsed from paid orders.
export async function usedByCustomer(code, email) {
  const key = String(email || '').trim().toLowerCase();
  if (!key) return false;
  const c = await getJSON('customers', key);
  return (c?.codesUsed || []).map(normCode).includes(normCode(code));
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

export const _resetDef = () => {};

export async function createPromo(b, opts) {
  const code = normCode(b.code);
  const bad = (m) => Object.assign(new Error(m), { status: 400 });
  if (!CODE_RE.test(code)) throw bad('Code must be 3 to 30 letters, numbers, - or _.');
  const pct = b.percentOff ? Number(b.percentOff) : null;
  const amt = b.amountOff ? Math.round(Number(b.amountOff) * 100) : null;
  if (!(pct > 0 && pct <= 100) && !(amt > 0)) throw bad('Enter a percent off (1 to 100) or a dollar amount off.');
  if ((await listPromos(opts, { fresh: true })).some((p) => p.code === code)) throw bad(`${code} already exists.`);
  const rules = { on: true };
  if (b.expiresAt && /^\d{4}-\d{2}-\d{2}$/.test(b.expiresAt)) rules.exp = b.expiresAt;
  if (b.minimumAmount) rules.min = Math.round(Number(b.minimumAmount) * 100);
  if (b.oncePerCustomer) rules.once = true;
  const object = {
    type: 'DISCOUNT',
    id: '#new',
    present_at_all_locations: true,
    discount_data: pct
      ? { name: code, discount_type: 'FIXED_PERCENTAGE', percentage: String(pct) }
      : { name: code, discount_type: 'FIXED_AMOUNT', amount_money: { amount: amt, currency: 'CAD' } },
  };
  const res = await square('POST', '/catalog/object', { idempotency_key: idem(), object }, opts);
  _resetPromoCache();
  let saved = true;
  try { await saveRule(res.catalog_object.id, rules); } catch (e) { saved = false; console.error('promo rules save failed', e.message); }
  const p = toPromo(res.catalog_object, saved ? rules : undefined);
  if (!saved && (rules.exp || rules.min)) p.warning = 'Created, but the expiry or minimum could not be saved.';
  return p;
}

async function patchRule(id, patch, opts) {
  if (!/^[A-Z0-9]{10,40}$/i.test(id || '')) throw Object.assign(new Error('Bad id'), { status: 400 });
  const { object } = await square('GET', `/catalog/object/${id}`, null, opts);
  if (object?.type !== 'DISCOUNT') throw Object.assign(new Error('Not a promo code'), { status: 400 });
  const all = await loadRules();
  const current = all[id] || readRules(object) || DEFAULT_RULES[normCode(object.discount_data?.name)] || {};
  const next = typeof patch === 'function' ? patch(current) : { ...current, ...patch };
  await saveRule(id, next);
  _resetPromoCache();
  return { ok: true };
}

export const setPromoActive = (id, active, opts) =>
  patchRule(id, (r) => {
    if (active && r.archived) throw Object.assign(new Error('Restore this code before turning it on.'), { status: 400 });
    return { ...r, on: !!active };
  }, opts);

// Archive = switch off and hide. Restore brings it back switched off, so nothing goes live by surprise.
export const setPromoArchived = (id, archived, opts) =>
  patchRule(id, (r) => (archived ? { ...r, on: false, archived: true, archivedAt: new Date().toISOString().slice(0, 10) } : { ...r, archived: false, archivedAt: null }), opts);

export const setPromoOnce = (id, once, opts) => patchRule(id, { once: !!once }, opts);
