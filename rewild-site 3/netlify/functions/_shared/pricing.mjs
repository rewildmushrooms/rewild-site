// One pricing engine for the cart (browser) and checkout (server), so the customer always sees what Square charges.
// build.mjs copies this file to /js/pricing.js for the browser, so keep it free of imports and Node APIs.
//
// Offers (amounts in cents, CAD):
//   Bundles: priced in the catalog (Duo, All Four set). Their "list value" is the sum of what's inside.
//   Stock up: 2+ single powder bags (any mix) = 10% off those bags.
//   Best deal wins, item by item: each item gets its offer price or the code price, whichever is lower. Never both.
//     offer price = bundle price, or the bag price less stock up     code price = code % off the item's full list value
//   Bundles (Duo, All Four) are already discounted: a % code only touches them if it is MORE than 20%, and then it
//   replaces the bundle price (25% code = 25% off the full value), it never stacks on it. Dollar-off codes skip bundles.
//   Tincture add-on (checkout tick box): one tincture at 15% off, only if no tincture is in the cart. Always applies.
//   Free tincture: when what they pay for products (after discounts, before shipping/tax) reaches $200.

export const OFFERS = {
  stockUp: { ids: ['energy', 'clarity', 'strength', 'peace'], minBags: 2, percent: 10, name: 'Stock up 10%' },
  addon: { id: 'tincture', percent: 15 },
  freeGift: { id: 'tincture', over: 20000, name: 'Free gift: Rewild Energy Tincture' },
  bundles: { duo: { energy: 1, tincture: 1 }, all4: { energy: 1, clarity: 1, strength: 1, peace: 1 } },
};

export const BUNDLE_CODE_OVER = 20; // a % code must beat this to touch a bundle

const hasTincture = (items) => items.some((i) => i.id === 'tincture' || i.id === 'duo');

// items: [{id, qty}]   catalog: { byId: {id: {price}}, shipping: {CA: {flatRate, freeOver, quoted}} }
// promo: validated code or null { code, percentOff, amountOff, minimumAmount }   addon: true if the add-on box is ticked
export function priceCart(items, country, catalog, promo = null, addon = false) {
  const byId = catalog.byId;
  const ship = catalog.shipping[country] || catalog.shipping.CA;
  const lines = [];
  for (const it of items || []) {
    const p = byId[it.id];
    const qty = Math.floor(Number(it.qty));
    if (!p || !(qty >= 1 && qty <= 20)) continue;
    const parts = OFFERS.bundles[it.id];
    const listUnit = parts ? Object.entries(parts).reduce((a, [k, n]) => a + byId[k].price * n, 0) : p.price;
    lines.push({ id: it.id, qty, unit: p.price, listUnit });
  }
  const itemsTotal = lines.reduce((a, l) => a + l.unit * l.qty, 0); // catalog prices (bundles already discounted)
  const listTotal = lines.reduce((a, l) => a + l.listUnit * l.qty, 0); // full value, nothing discounted
  const bundleSaving = listTotal - itemsTotal;

  // Offers price
  const su = OFFERS.stockUp;
  const bagLines = lines.filter((l) => su.ids.includes(l.id));
  const bags = bagLines.reduce((a, l) => a + l.qty, 0);
  const stockUpSaving = bags >= su.minBags ? Math.round(bagLines.reduce((a, l) => a + l.unit * l.qty, 0) * su.percent / 100) : 0;
  const offersTotal = itemsTotal - stockUpSaving;

  // Code, item by item (best price per item, never stacked)
  let codeNote = '', useCode = false, bundleKept = false, codeTotal = 0;
  if (promo && lines.length) {
    if (promo.minimumAmount && listTotal < promo.minimumAmount) codeNote = 'minimum';
    else {
      const suOn = bags >= su.minBags;
      const isBundle = (l) => !!OFFERS.bundles[l.id];
      const offerLine = (l) => l.unit * l.qty - (suOn && su.ids.includes(l.id) ? Math.round(l.unit * l.qty * su.percent / 100) : 0);
      const pct = Number(promo.percentOff) || 0;
      if (pct) {
        for (const l of lines) {
          const off = offerLine(l);
          const touch = !isBundle(l) || pct > BUNDLE_CODE_OVER;
          const code = touch ? l.listUnit * l.qty - Math.round(l.listUnit * l.qty * pct / 100) : Infinity;
          if (code < off) { codeTotal += code; useCode = true; } else { codeTotal += off; if (isBundle(l)) bundleKept = true; }
        }
      } else {
        const nb = lines.filter((l) => !isBundle(l)), bl = lines.filter(isBundle);
        const nbOffer = nb.reduce((a, l) => a + offerLine(l), 0), nbList = nb.reduce((a, l) => a + l.listUnit * l.qty, 0);
        const nbCode = nbList - Math.min(nbList, Number(promo.amountOff) || 0);
        const blTotal = bl.reduce((a, l) => a + offerLine(l), 0);
        bundleKept = bl.length > 0;
        if (nb.length && nbCode < nbOffer) { codeTotal = blTotal + nbCode; useCode = true; } else codeTotal = blTotal + nbOffer;
      }
    }
  }
  const productsTotal = useCode ? Math.min(codeTotal, offersTotal) : offersTotal;
  const discount = itemsTotal - productsTotal; // order-level discount sent to Square (on top of bundle prices)
  const discountName = useCode ? promo.code : stockUpSaving ? su.name : '';

  // Add-on and free gift
  const addonEligible = lines.length > 0 && !hasTincture(lines);
  const addonApplied = !!addon && addonEligible;
  const addonUnit = Math.round(byId[OFFERS.addon.id].price * (100 - OFFERS.addon.percent) / 100);
  const paid = productsTotal + (addonApplied ? addonUnit : 0);
  const gift = lines.length > 0 && paid >= OFFERS.freeGift.over;

  // Shipping: free over the threshold, counted on item prices before codes (same as before)
  const shipBase = itemsTotal + (addonApplied ? addonUnit : 0);
  const free = ship.freeOver != null && shipBase >= ship.freeOver;
  const shipping = lines.length === 0 ? 0 : ship.quoted ? 0 : free ? 0 : ship.flatRate;

  // Next goal for the progress bar
  const goals = [];
  if (ship.freeOver != null && !ship.quoted) goals.push({ kind: 'shipping', at: ship.freeOver, have: shipBase });
  goals.push({ kind: 'gift', at: OFFERS.freeGift.over, have: paid });
  const next = goals.find((g) => g.have < g.at) || null;

  return {
    lines, itemsTotal, listTotal, bundleSaving, stockUpSaving, bags,
    codeApplied: useCode ? promo.code : null,
    codeBeaten: !!(promo && lines.length && codeNote !== 'minimum' && !useCode), // a code was entered but the offers save more
    bundleKept, // a bundle in the cart kept its own price (codes don't stack on bundles)
    codeNote, discount, discountName,
    addonEligible, addonApplied, addonUnit, addonFull: byId[OFFERS.addon.id].price,
    gift, paid, shipping, free, total: paid + shipping, quoted: !!ship.quoted, freeOver: ship.freeOver,
    savings: listTotal - productsTotal + (addonApplied ? byId[OFFERS.addon.id].price - addonUnit : 0) + (gift ? byId[OFFERS.freeGift.id].price : 0),
    next: next ? { kind: next.kind, short: next.at - next.have, pct: Math.min(100, Math.round(next.have / next.at * 100)) } : null,
  };
}

// One cart suggestion ("pairs well with"). Returns null or { kind, ids, add, text, cta }.
const PAIRS = { energy: 'peace', peace: 'energy', clarity: 'strength', strength: 'clarity' };
export function suggestion(items, catalog) {
  const byId = catalog.byId;
  const ids = new Set((items || []).map((i) => i.id));
  if (ids.has('all4')) return null;
  const four = OFFERS.bundles.all4;
  const have = Object.keys(four).filter((k) => ids.has(k));
  const money = (c) => '$' + (c / 100).toFixed(c % 100 ? 2 : 0);
  if (have.length >= 2) {
    const missing = Object.keys(four).filter((k) => !ids.has(k));
    // What the cart really goes up by (stock-up savings on the singles are lost when they become the set)
    const swapped = [];
    for (const i of items) { const n = have.includes(i.id) ? i.qty - 1 : i.qty; if (n > 0) swapped.push({ id: i.id, qty: n }); }
    swapped.push({ id: 'all4', qty: 1 });
    const extra = priceCart(swapped, 'CA', catalog).itemsTotal - priceCart(swapped, 'CA', catalog).stockUpSaving
      - (priceCart(items, 'CA', catalog).itemsTotal - priceCart(items, 'CA', catalog).stockUpSaving);
    const saving = Object.keys(four).reduce((a, k) => a + byId[k].price, 0) - byId.all4.price;
    return { kind: 'all4', swap: have, add: 'all4',
      text: `Add ${missing.map((k) => byId[k].word).join(' and ')} for ${money(extra)} more and get the All Four set.`,
      sub: `All four mushrooms for ${money(byId.all4.price)} (${money(byId.all4.price + saving)} value).`, cta: 'Upgrade' };
  }
  if (have.length === 1) {
    const pick = PAIRS[have[0]];
    if (!ids.has(pick)) {
      return { kind: 'pair', add: pick, text: `Pairs well with ${byId[pick].name} (${byId[pick].commonName || byId[pick].word}).`, sub: 'Add a second bag and save 10% on both.', cta: `Add ${money(byId[pick].price)}` };
    }
  }
  return null;
}
