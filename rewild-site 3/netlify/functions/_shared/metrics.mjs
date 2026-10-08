// REWILD Metrics Google Sheet: rebuilt every night from our own order records + Google Analytics.
// Tabs written by the website: Monthly KPIs, Orders, Cohorts, Products, Traffic.
// Tab YOU fill in (never overwritten): Costs (cost per unit, shipping cost, monthly ad spend).
// Customer emails never go into the sheet; customers are numbered (C001, C002...).
import { readIndex } from './data.mjs';
import { getJSON, setJSON } from './store.mjs';
import { accessToken, monthlyTraffic, serviceAccountInfo, gaConfigured } from './ga.mjs';
import { groupStats } from './mailerlite.mjs';
import { PRODUCTS } from './catalog.mjs';

export const METRICS_SHEET_ID = '1WoZDS9rj7tbbHHqOkxaxpLP624AIcF5nzew-uSMZolM';
export const sheetUrl = () => `https://docs.google.com/spreadsheets/d/${METRICS_SHEET_ID}/edit`;
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const API = `https://sheets.googleapis.com/v4/spreadsheets/${METRICS_SHEET_ID}`;
const TABS = ['Monthly KPIs', 'Orders', 'Cohorts', 'Products', 'Traffic', 'Costs'];
const $ = (c) => Math.round(Number(c || 0)) / 100; // cents -> dollars
const month = (iso) => String(iso || '').slice(0, 7);
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : '');

async function gs(method, path, body, opts = {}) {
  const res = await (opts.fetchImpl || fetch)(API + path, {
    method,
    headers: { Authorization: `Bearer ${await accessToken(opts, SCOPE)}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = j.error?.message || `Google Sheets error ${res.status}`;
    if (/has not been used|is disabled|SERVICE_DISABLED/i.test(msg)) throw new Error('Turn on the Google Sheets API for the website\'s Google key (link in HQ).');
    if (res.status === 403 || res.status === 404) throw new Error('The website can\'t open the sheet yet. Share it with the website\'s Google key as Editor (email in HQ).');
    throw new Error(msg);
  }
  return j;
}

const COSTS_TEMPLATE = [
  ['Cost per unit (CAD). Fill in column C. The website reads this tab and never changes it.', '', ''],
  ['Product id', 'Product', 'Cost per unit'],
  ...PRODUCTS.filter((p) => !p.isBundle).map((p) => [p.id, `${p.name} (${p.size})`, '']),
  ['', '', ''],
  ['Shipping', 'Average shipping + packaging cost per order', ''],
  ['', '', ''],
  ['Month (YYYY-MM)', 'Ad spend', 'Other marketing spend'],
];

async function ensureTabs(opts) {
  const meta = await gs('GET', '?fields=sheets.properties', null, opts);
  const have = new Set((meta.sheets || []).map((s) => s.properties.title));
  const add = TABS.filter((t) => !have.has(t));
  if (add.length) {
    await gs('POST', ':batchUpdate', { requests: add.map((title) => ({ addSheet: { properties: { title, gridProperties: { frozenRowCount: title === 'Costs' ? 2 : 1 } } } })) }, opts);
  }
  if (add.includes('Costs')) await writeTab('Costs', COSTS_TEMPLATE, opts, false);
}

async function writeTab(tab, rows, opts, clear = true) {
  const range = encodeURIComponent(`'${tab}'!A1`);
  if (clear) await gs('POST', `/values/${encodeURIComponent(`'${tab}'`)}:clear`, {}, opts);
  await gs('PUT', `/values/${range}?valueInputOption=USER_ENTERED`, { values: rows }, opts);
}

// Reads unit costs, shipping cost and monthly ad spend from the Costs tab.
export function parseCosts(values = []) {
  const unit = {}, spend = {}; let shipping = 0, inSpend = false;
  for (const r of values) {
    const [a = '', b = '', c = ''] = r.map((x) => String(x ?? '').trim());
    const money = (v) => Number(String(v).replace(/[$,\s]/g, '')) || 0;
    if (/^month/i.test(a)) { inSpend = true; continue; }
    if (inSpend && /^\d{4}-\d{2}$/.test(a)) { spend[a] = { ads: money(b), other: money(c) }; continue; }
    if (/^shipping$/i.test(a)) { shipping = money(c); continue; }
    if (a && PRODUCTS.some((p) => p.id === a)) unit[a] = money(c);
  }
  return { unit, shipping, spend };
}

// Pure: turns order records into sheet rows (easy to test).
export function buildRows(records, traffic = {}, costs = { unit: {}, shipping: 0, spend: {} }, list = null, now = new Date()) {
  const orders = records.filter((r) => r && !r.deleted && r.createdAt && r.state !== 'CANCELED').sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const custNo = {}, firstMonth = {}, monthsBought = {};
  let n = 0;
  const key = (r) => r.email || r.name || r.id;
  const rowsOrders = [['Date', 'Order', 'Source', 'Customer #', 'New or repeat', 'Products', 'Units', 'Gross ($)', 'Discount ($)', 'Code', 'Refunded ($)', 'Net ($)', 'Province/State', 'Country']];
  const byMonth = {};
  const prodMonth = {}; // month -> id -> units
  for (const r of orders) {
    const k = key(r); const m = month(r.createdAt);
    const isNew = !custNo[k];
    if (isNew) { custNo[k] = 'C' + String(++n).padStart(3, '0'); firstMonth[k] = m; monthsBought[k] = new Set(); }
    monthsBought[k].add(m);
    const units = (r.items || []).reduce((a, i) => a + (Number(i.qty) || 0), 0);
    const gross = (r.total || 0) + (r.discount || 0);
    const net = (r.total || 0) - (r.refunded || 0);
    rowsOrders.push([r.createdAt.slice(0, 10), String(r.id).slice(-8).toUpperCase(), r.source || 'online', custNo[k], isNew ? 'New' : 'Repeat',
      (r.items || []).map((i) => `${i.qty}x ${i.name}`).join(', '), units, $(gross), $(r.discount), r.code || '', $(r.refunded), $(net), r.shipTo?.region || '', r.shipTo?.country || r.country || '']);
    const b = (byMonth[m] = byMonth[m] || { orders: 0, gross: 0, discount: 0, refunded: 0, net: 0, units: 0, newC: 0, repeatOrders: 0, cogs: 0, ship: 0 });
    b.orders++; b.gross += gross; b.discount += r.discount || 0; b.refunded += r.refunded || 0; b.net += net; b.units += units;
    if (isNew) b.newC++; else b.repeatOrders++;
    b.ship += costs.shipping * 100;
    for (const [id, q] of Object.entries(r.units || {})) b.cogs += (costs.unit[id] || 0) * 100 * q;
    for (const i of r.items || []) { if (!i.id) continue; (prodMonth[m] = prodMonth[m] || {})[i.id] = (prodMonth[m][i.id] || 0) + (Number(i.qty) || 0); }
  }
  // Months from the first order (or 12 months of traffic) to now
  const months = [];
  const startM = [orders[0] && month(orders[0].createdAt), ...Object.keys(traffic)].filter(Boolean).sort()[0] || month(now.toISOString());
  for (let d = new Date(startM + '-01T00:00:00Z'); month(d.toISOString()) <= month(now.toISOString()); d.setUTCMonth(d.getUTCMonth() + 1)) months.push(month(d.toISOString()));
  const haveCosts = Object.values(costs.unit).some((v) => v > 0);
  const kpis = [['Month', 'Orders', 'Gross sales ($)', 'Discounts ($)', 'Refunds ($)', 'Net revenue ($)', 'Avg order ($)', 'Units', 'New customers', 'Repeat orders', 'Repeat order %', 'Visitors', 'Conversion %',
    'Product cost ($)', 'Shipping cost ($)', 'Gross profit ($)', 'Gross margin %', 'Ad spend ($)', 'Other marketing ($)', 'Cost per new customer ($)', 'Revenue per ad $']];
  for (const m of months) {
    const b = byMonth[m] || { orders: 0, gross: 0, discount: 0, refunded: 0, net: 0, units: 0, newC: 0, repeatOrders: 0, cogs: 0, ship: 0 };
    const v = traffic[m]?.visitors ?? '';
    const sp = costs.spend[m] || { ads: 0, other: 0 };
    const profit = b.net - b.cogs - b.ship;
    kpis.push([m, b.orders, $(b.gross), $(b.discount), $(b.refunded), $(b.net), b.orders ? $(b.net / b.orders) : '', b.units, b.newC, b.repeatOrders, pct(b.repeatOrders, b.orders), v, v ? pct(b.orders, v) : '',
      haveCosts ? $(b.cogs) : '', costs.shipping ? $(b.ship) : '', haveCosts ? $(profit) : '', haveCosts && b.net ? pct(profit, b.net) : '',
      sp.ads || '', sp.other || '', sp.ads && b.newC ? Math.round((sp.ads / b.newC) * 100) / 100 : '', sp.ads ? Math.round(($(b.net) / sp.ads) * 100) / 100 : '']);
  }
  // Snapshot block under the monthly table
  const buyers = Object.keys(custNo);
  const repeaters = buyers.filter((k) => monthsBought[k].size > 1 || orders.filter((r) => key(r) === k).length > 1);
  const netAll = orders.reduce((a, r) => a + (r.total || 0) - (r.refunded || 0), 0);
  kpis.push([], ['Snapshot', `Updated ${now.toISOString().slice(0, 16).replace('T', ' ')} UTC`],
    ['Customers (all time)', buyers.length], ['Customers who bought more than once', repeaters.length], ['Repeat customer rate %', pct(repeaters.length, buyers.length)],
    ['Net revenue (all time, $)', $(netAll)], ['Average revenue per customer ($)', buyers.length ? $(netAll / buyers.length) : ''],
    ['Email list (MailerLite, active)', list ?? '']);
  if (!haveCosts) kpis.push([], ['Fill in the Costs tab to see product cost, profit, margin and cost per new customer.']);

  // Cohorts: of customers who first bought in month X, % who bought again in a later month within N months
  const cohorts = [['First order month', 'Customers', 'Bought again by month 1 %', 'By month 2 %', 'By month 3 %', 'By month 6 %', 'Ever bought again %']];
  const mIndex = (m) => Number(m.slice(0, 4)) * 12 + Number(m.slice(5, 7));
  const cohortMonths = [...new Set(Object.values(firstMonth))].sort();
  for (const cm of cohortMonths) {
    const members = buyers.filter((k) => firstMonth[k] === cm);
    const within = (nm) => members.filter((k) => [...monthsBought[k]].some((m) => mIndex(m) > mIndex(cm) && mIndex(m) - mIndex(cm) <= nm)).length;
    const ever = members.filter((k) => monthsBought[k].size > 1).length;
    cohorts.push([cm, members.length, pct(within(1), members.length), pct(within(2), members.length), pct(within(3), members.length), pct(within(6), members.length), pct(ever, members.length)]);
  }
  // Products: units per product per month
  const sellIds = PRODUCTS.map((p) => p.id);
  const products = [['Month', ...PRODUCTS.map((p) => p.name)]];
  for (const m of months) products.push([m, ...sellIds.map((id) => prodMonth[m]?.[id] || 0)]);
  // Traffic
  const trafficRows = [['Month', 'Visitors', 'Sessions', 'Page views', 'Orders', 'Conversion % (orders / visitors)']];
  for (const m of months) { const t = traffic[m]; const o = byMonth[m]?.orders || 0; trafficRows.push([m, t?.visitors ?? '', t?.sessions ?? '', t?.pageviews ?? '', o, t?.visitors ? pct(o, t.visitors) : '']); }
  return { kpis, orders: rowsOrders, cohorts, products, traffic: trafficRows };
}

export async function updateMetricsSheet(opts = {}) {
  const started = new Date();
  try {
    if (!serviceAccountInfo()) throw new Error('The website\'s Google key (GA_SERVICE_ACCOUNT) is not set.');
    await ensureTabs(opts);
    const idx = await readIndex('orders');
    const records = (await Promise.all(Object.keys(idx).map(async (id) => (await getJSON('orders', id)) || null))).filter(Boolean);
    const [traffic, costsRaw, list] = await Promise.all([
      gaConfigured() ? monthlyTraffic().catch(() => ({})) : {},
      gs('GET', `/values/${encodeURIComponent("'Costs'!A1:C80")}`, null, opts).then((r) => r.values || []),
      groupStats().then((g) => g?.active ?? null).catch(() => null),
    ]);
    const out = buildRows(records, traffic, parseCosts(costsRaw), list, started);
    await writeTab('Monthly KPIs', out.kpis, opts);
    await writeTab('Orders', out.orders, opts);
    await writeTab('Cohorts', out.cohorts, opts);
    await writeTab('Products', out.products, opts);
    await writeTab('Traffic', out.traffic, opts);
    const status = { ok: true, at: started.toISOString(), orders: records.length };
    await setJSON('metrics', 'lastRun', status);
    return status;
  } catch (e) {
    const status = { ok: false, at: started.toISOString(), error: e.message };
    try { await setJSON('metrics', 'lastRun', status); } catch {}
    return status;
  }
}

export async function metricsInfo() {
  const sa = serviceAccountInfo();
  return {
    sheetUrl: sheetUrl(),
    keyEmail: sa?.email || null,
    enableApiUrl: sa?.project ? `https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=${encodeURIComponent(sa.project)}` : 'https://console.cloud.google.com/apis/library/sheets.googleapis.com',
    lastRun: (await getJSON('metrics', 'lastRun')) || null,
  };
}
