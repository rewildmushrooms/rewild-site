// Google Analytics 4 numbers for REWILD HQ (no dependencies).
// Env: GA_PROPERTY_ID (the number from GA Admin > Property details)
//      GA_SERVICE_ACCOUNT (the whole JSON key file of a Google Cloud service account that has
//      "Viewer" access to the GA property; read-only).
import crypto from 'node:crypto';

const GA_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
let tokenCache = {}; // one token per scope
export const _resetGaCache = () => { tokenCache = {}; };

export const gaConfigured = () => !!(process.env.GA_PROPERTY_ID && process.env.GA_SERVICE_ACCOUNT);

function serviceAccount() {
  let raw = String(process.env.GA_SERVICE_ACCOUNT || '').trim();
  if (raw && !raw.startsWith('{')) { try { raw = Buffer.from(raw, 'base64').toString('utf8'); } catch {} }
  let sa;
  try { sa = JSON.parse(raw); } catch { throw Object.assign(new Error('GA_SERVICE_ACCOUNT is not a valid key file. Paste the whole JSON file.'), { status: 500 }); }
  if (!sa.client_email || !sa.private_key) throw Object.assign(new Error('GA_SERVICE_ACCOUNT is missing client_email or private_key.'), { status: 500 });
  return sa;
}

const b64url = (v) => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url');

export function signedJwt(sa, now = Math.floor(Date.now() / 1000), scope = GA_SCOPE) {
  const head = b64url({ alg: 'RS256', typ: 'JWT' });
  const claim = b64url({ iss: sa.client_email, scope, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const sig = crypto.createSign('RSA-SHA256').update(`${head}.${claim}`).sign(sa.private_key).toString('base64url');
  return `${head}.${claim}.${sig}`;
}

// The same Google key (service account) is reused for the metrics Google Sheet, with a different scope.
export function serviceAccountInfo() {
  if (!process.env.GA_SERVICE_ACCOUNT) return null;
  try { const sa = serviceAccount(); return { email: sa.client_email, project: sa.project_id || null }; } catch { return null; }
}

export async function accessToken({ fetchImpl = fetch } = {}, scope = GA_SCOPE) {
  const c = tokenCache[scope];
  if (c && Date.now() < c.exp - 60000) return c.token;
  const res = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: signedJwt(serviceAccount(), undefined, scope) }).toString(),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.access_token) throw new Error(`Google sign-in failed: ${j.error_description || j.error || res.status}`);
  tokenCache[scope] = { token: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return j.access_token;
}

async function runReport(body, opts = {}, method = 'runReport') {
  const fetchImpl = opts.fetchImpl || fetch;
  const id = String(process.env.GA_PROPERTY_ID).replace(/\D/g, '');
  const res = await fetchImpl(`https://analyticsdata.googleapis.com/v1beta/properties/${id}:${method}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await accessToken(opts)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = j.error?.message || `Google Analytics error ${res.status}`;
    throw new Error(/permission|PERMISSION_DENIED/i.test(msg) ? 'The Google key cannot read this property yet. Add its email as a Viewer in GA Admin > Property access management.' : msg);
  }
  return j;
}

const num = (v) => Number(v || 0);
const rows = (r, map) => (r.rows || []).map((row) => map(row.dimensionValues || [], (row.metricValues || []).map((m) => num(m.value))));

// Who's on the site right now (Google Analytics realtime: the last 30 minutes). Counts only, never individuals.
export async function live(opts) {
  if (!gaConfigured()) return { configured: false };
  const rt = (body) => runReport(body, opts, 'runRealtimeReport');
  const users = [{ name: 'activeUsers' }];
  const top = (dims, limit = 8) => rt({ dimensions: dims.map((name) => ({ name })), metrics: users, orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }], limit });
  const [tot, five, pages, places, devices, events] = await Promise.all([
    rt({ metrics: users }),
    rt({ metrics: users, minuteRanges: [{ startMinutesAgo: 4, endMinutesAgo: 0 }] }),
    top(['unifiedScreenName']),
    top(['city', 'country']),
    top(['deviceCategory'], 4),
    rt({ dimensions: [{ name: 'eventName' }], metrics: [{ name: 'eventCount' }], dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: ['add_to_cart', 'begin_checkout', 'purchase', 'quiz_complete'] } } } }),
  ]);
  const first = (r) => num(r.rows?.[0]?.metricValues?.[0]?.value);
  return {
    configured: true,
    last30: first(tot),
    last5: first(five),
    pages: rows(pages, (d, m) => ({ page: (d[0]?.value || '').replace(/\s*\|\s*REWILD.*$/i, '') || '(not set)', users: m[0] })),
    places: rows(places, (d, m) => ({ city: d[0]?.value, country: d[1]?.value, users: m[0] })),
    devices: rows(devices, (d, m) => ({ device: d[0]?.value, users: m[0] })),
    events: Object.fromEntries(rows(events, (d, m) => [d[0]?.value, m[0]])),
    at: Date.now(),
  };
}

// Visitors per month for the metrics sheet (last 13 months, including this one).
export async function monthlyTraffic(opts) {
  if (!gaConfigured()) return {};
  const d = new Date(); const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 12, 1)).toISOString().slice(0, 10);
  const r = await runReport({ dateRanges: [{ startDate: start, endDate: 'today' }], dimensions: [{ name: 'yearMonth' }], metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }], limit: 20 }, opts);
  return Object.fromEntries(rows(r, (dv, m) => [`${dv[0].value.slice(0, 4)}-${dv[0].value.slice(4, 6)}`, { visitors: m[0], sessions: m[1], pageviews: m[2] }]));
}

export async function traffic(days, opts) {
  if (!gaConfigured()) return { configured: false };
  const dateRanges = [{ startDate: `${days - 1}daysAgo`, endDate: 'today' }];
  const prevRanges = [{ startDate: `${2 * days - 1}daysAgo`, endDate: `${days}daysAgo` }];
  const [tot, byDay, pages, channels, countries, prevTot, events] = await Promise.all([
    runReport({ dateRanges, metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }, { name: 'engagementRate' }, { name: 'averageSessionDuration' }] }, opts),
    runReport({ dateRanges, dimensions: [{ name: 'date' }], metrics: [{ name: 'activeUsers' }, { name: 'sessions' }], orderBys: [{ dimension: { dimensionName: 'date' } }], limit: 400 }, opts),
    runReport({ dateRanges, dimensions: [{ name: 'pagePath' }], metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }], orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 10 }, opts),
    runReport({ dateRanges, dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 8 }, opts),
    runReport({ dateRanges, dimensions: [{ name: 'country' }], metrics: [{ name: 'activeUsers' }], orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }], limit: 6 }, opts),
    runReport({ dateRanges: prevRanges, metrics: [{ name: 'activeUsers' }, { name: 'sessions' }] }, opts),
    runReport({ dateRanges, dimensions: [{ name: 'eventName' }], metrics: [{ name: 'eventCount' }], dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: ['add_to_cart', 'begin_checkout', 'quiz_complete'] } } } }, opts),
  ]);
  const pt = (prevTot.rows?.[0]?.metricValues || []).map((m) => num(m.value));
  const ev = Object.fromEntries(rows(events, (d, m) => [d[0]?.value, m[0]]));
  const t = (tot.rows?.[0]?.metricValues || []).map((m) => num(m.value));
  const fromDay = Object.fromEntries(rows(byDay, (d, m) => [d[0]?.value, { visitors: m[0], sessions: m[1] }]));
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86400000);
    const key = d.toISOString().slice(0, 10).replace(/-/g, '');
    return { date: d.toISOString().slice(0, 10), ...(fromDay[key] || { visitors: 0, sessions: 0 }) };
  });
  return {
    configured: true,
    visitors: t[0] || 0, sessions: t[1] || 0, pageviews: t[2] || 0,
    engagementRate: t[3] || 0, avgSessionSeconds: Math.round(t[4] || 0),
    previous: { visitors: pt[0] || 0, sessions: pt[1] || 0 },
    events: { addToCart: ev.add_to_cart || 0, beginCheckout: ev.begin_checkout || 0, quizComplete: ev.quiz_complete || 0 },
    series,
    pages: rows(pages, (d, m) => ({ path: d[0]?.value || '', views: m[0], visitors: m[1] })),
    channels: rows(channels, (d, m) => ({ name: d[0]?.value || 'Other', sessions: m[0] })),
    countries: rows(countries, (d, m) => ({ name: d[0]?.value || 'Unknown', visitors: m[0] })),
  };
}
