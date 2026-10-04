// Tiny Netlify Blobs client (no dependencies). Stores small JSON records for REWILD HQ
// (hashed passwords and one-time reset links). Netlify gives every function a blobs context;
// we talk to the blobs edge API directly. Tests swap in an in-memory map.

let memory = null;
export const _useMemoryStore = (m = new Map()) => { memory = m; return m; };

export function blobsContext() {
  const raw = globalThis.netlifyBlobsContext || process.env.NETLIFY_BLOBS_CONTEXT;
  if (!raw) return null;
  try { return JSON.parse(Buffer.from(raw, 'base64').toString('utf8')); } catch { return null; }
}

function blobURL(c, store, key) {
  const base = c.uncachedEdgeURL || c.edgeURL; // uncached = always the latest value
  let path = `/${c.siteID}/site:${encodeURIComponent(store)}/${encodeURIComponent(key)}`;
  if (c.primaryRegion) path = `/region:${c.primaryRegion}${path}`;
  return new URL(path, base).toString();
}

async function call(method, store, key, body) {
  const c = blobsContext();
  if (!c || !c.token || !(c.edgeURL || c.uncachedEdgeURL)) throw new Error('Storage is not available here.');
  const res = await fetch(blobURL(c, store, key), {
    method,
    headers: { authorization: `Bearer ${c.token}`, ...(body ? { 'content-type': 'application/json' } : {}) },
    ...(body ? { body } : {}),
  });
  if (method === 'GET' && res.status === 404) return null;
  if (!res.ok) throw new Error(`Storage ${method} failed (${res.status})`);
  return method === 'GET' ? res.json() : true;
}

const rawGet = async (store, key) => { if (memory) { const v = memory.get(`${store}/${key}`); return v === undefined ? null : JSON.parse(v); } return call('GET', store, key); };
const rawSet = async (store, key, value) => { if (memory) { memory.set(`${store}/${key}`, JSON.stringify(value)); return true; } return call('PUT', store, key, JSON.stringify(value)); };
const rawDel = async (store, key) => { if (memory) { memory.delete(`${store}/${key}`); return true; } return call('DELETE', store, key); };

// Test data is cleared once, automatically, before anything in these stores is read or saved:
//   - when the site first runs on live Square (SQUARE_ENV=production). Marker: store "data", key "live-since".
//   - in test mode, once per TEST_RESET value. Change TEST_RESET and deploy to start test mode clean again.
// Clears test orders, customers, carts and stock history. Promo codes, HQ logins and the team list are kept.
// The marker's time is also where HQ's Square numbers start (dataStartsAt), so old test orders in Square are ignored.
const TEST_RESET = '2026-10-04';
const TEST_STORES = ['customers', 'orders', 'carts'];
const isProd = () => (process.env.SQUARE_ENV || '').toLowerCase() === 'production';
const resetKey = () => (isProd() ? 'live-since' : `test-reset-${TEST_RESET}`);
let liveChecked = false;
export const _resetLiveCheck = () => { liveChecked = false; };
export async function dataStartsAt() {
  await clearTestDataOnce();
  return (await rawGet('data', resetKey()))?.at || null;
}
export async function clearTestDataOnce() {
  if (liveChecked) return null;
  if (await rawGet('data', resetKey())) { liveChecked = true; return null; }
  const idx = await Promise.all(TEST_STORES.map((n) => rawGet('data', `${n}-index`)));
  const keys = TEST_STORES.flatMap((n, i) => Object.keys(idx[i] || {}).map((k) => [n, k]));
  for (let i = 0; i < keys.length; i += 20) await Promise.all(keys.slice(i, i + 20).map(([st, k]) => rawDel(st, k).catch(() => null)));
  await Promise.all([...TEST_STORES.map((n) => rawDel('data', `${n}-index`)), rawDel('data', 'ledger'), rawDel('alerts', 'low-stock')].map((p) => p.catch(() => null)));
  const cleared = Object.fromEntries(TEST_STORES.map((n, i) => [n, Object.keys(idx[i] || {}).length]));
  await rawSet('data', resetKey(), { at: new Date().toISOString(), cleared });
  liveChecked = true;
  console.log('test data cleared', resetKey(), JSON.stringify(cleared));
  return cleared;
}
const guard = (store) => (TEST_STORES.includes(store) || store === 'data' || store === 'alerts' ? clearTestDataOnce() : null);

export async function getJSON(store, key) { await guard(store); return rawGet(store, key); }
export async function setJSON(store, key, value) { await guard(store); return rawSet(store, key, value); }
export async function delKey(store, key) { await guard(store); return rawDel(store, key); }
