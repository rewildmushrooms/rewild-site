// Promo codes live in Square as catalog Discounts (Items > Discounts in the Square dashboard).
// The discount's name is the code customers type (e.g. SEAN20).
// Extra web rules (on/off, expiry date, minimum order) are stored on the discount in a hidden
// custom attribute called "rewild_rules", managed from REWILD HQ.
import { square, idem, pages } from './square.mjs';

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

// Square discount object -> plain promo
export function toPromo(obj) {
  const d = obj.discount_data || {};
  const rules = readRules(obj) || {};
  const pct = d.discount_type === 'FIXED_PERCENTAGE' ? Number(d.percentage) : null;
  const amt = d.discount_type === 'FIXED_AMOUNT' ? Number(d.amount_money?.amount || 0) : null;
  return {
    id: obj.id,
    version: obj.version,
    code: normCode(d.name),
    percentOff: pct,
    amountOff: amt,
    active: rules.on !== false,
    expiresAt: rules.exp ? Math.floor(Date.parse(`${rules.exp}T23:59:00-07:00`) / 1000) : null,
    expiresOn: rules.exp || null,
    minimumAmount: rules.min || null,
    hasRules: !!readRules(obj),
  };
}

export async function listPromos(opts, { fresh = false } = {}) {
  if (!fresh && cache.list && Date.now() - cache.at < 60000) return cache.list;
  const objs = await pages((cursor) => square('GET', `/catalog/list?types=DISCOUNT${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, null, opts), 'objects', 2000);
  const list = objs
    .filter((o) => !o.is_deleted && (o.discount_data?.discount_type === 'FIXED_PERCENTAGE' || o.discount_data?.discount_type === 'FIXED_AMOUNT'))
    .map(toPromo)
    .filter((p) => CODE_RE.test(p.code));
  cache = { at: Date.now(), list };
  return list;
}

// Returns { promo, discount } or throws a friendly 400.
export async function validatePromo(code, subtotal, opts, now = Date.now()) {
  code = normCode(code);
  const bad = (m) => Object.assign(new Error(m), { status: 400 });
  if (!CODE_RE.test(code)) throw bad('That code does not look right.');
  const promo = (await listPromos(opts)).find((p) => p.code === code);
  if (!promo || !promo.active) throw bad(`${code} is not a valid code.`);
  if (promo.expiresAt && now / 1000 > promo.expiresAt) throw bad(`${code} has expired.`);
  if (promo.minimumAmount && subtotal < promo.minimumAmount) throw bad(`${code} needs an order of $${(promo.minimumAmount / 100).toFixed(0)} or more.`);
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

let defReady = false;
async function ensureRulesDefinition(opts) {
  if (defReady) return true;
  const { objects = [] } = await square('GET', '/catalog/list?types=CUSTOM_ATTRIBUTE_DEFINITION', null, opts);
  if (!objects.some((o) => o.custom_attribute_definition_data?.key === RULES_KEY)) {
    await square('POST', '/catalog/object', {
      idempotency_key: idem(),
      object: {
        type: 'CUSTOM_ATTRIBUTE_DEFINITION',
        id: '#rewild_rules',
        custom_attribute_definition_data: {
          type: 'STRING',
          name: 'REWILD web code rules',
          description: 'On/off, expiry and minimum order for website promo codes. Managed by REWILD HQ.',
          allowed_object_types: ['DISCOUNT'],
          key: RULES_KEY,
          seller_visibility: 'SELLER_VISIBILITY_HIDDEN',
          app_visibility: 'APP_VISIBILITY_READ_WRITE_VALUES',
          string_config: { enforce_uniqueness: false },
        },
      },
    }, opts);
  }
  defReady = true;
  return true;
}
export const _resetDef = () => { defReady = false; };

const rulesValue = (rules) => ({ [RULES_KEY]: { string_value: JSON.stringify(rules) } });

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
  let withRules = true;
  try { await ensureRulesDefinition(opts); } catch (e) { withRules = false; console.error('rules definition failed', e.message); }
  const object = {
    type: 'DISCOUNT',
    id: '#new',
    present_at_all_locations: true,
    discount_data: pct
      ? { name: code, discount_type: 'FIXED_PERCENTAGE', percentage: String(pct) }
      : { name: code, discount_type: 'FIXED_AMOUNT', amount_money: { amount: amt, currency: 'CAD' } },
  };
  if (withRules) object.custom_attribute_values = rulesValue(rules);
  const res = await square('POST', '/catalog/object', { idempotency_key: idem(), object }, opts);
  _resetPromoCache();
  const p = toPromo(res.catalog_object);
  if (!withRules && (rules.exp || rules.min)) p.warning = 'Created, but the expiry or minimum could not be saved.';
  return p;
}

export async function setPromoActive(id, active, opts) {
  if (!/^[A-Z0-9]{10,40}$/i.test(id || '')) throw Object.assign(new Error('Bad id'), { status: 400 });
  await ensureRulesDefinition(opts);
  const { object } = await square('GET', `/catalog/object/${id}`, null, opts);
  if (object?.type !== 'DISCOUNT') throw Object.assign(new Error('Not a promo code'), { status: 400 });
  const rules = { ...(readRules(object) || {}), on: !!active };
  const others = Object.fromEntries(Object.entries(object.custom_attribute_values || {})
    .filter(([k, v]) => !(k === RULES_KEY || v?.key === RULES_KEY || k.endsWith(':' + RULES_KEY))));
  await square('POST', '/catalog/object', {
    idempotency_key: idem(),
    object: { ...object, custom_attribute_values: { ...others, ...rulesValue(rules) } },
  }, opts);
  _resetPromoCache();
  return { ok: true };
}
