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

export async function getJSON(store, key) {
  if (memory) { const v = memory.get(`${store}/${key}`); return v === undefined ? null : JSON.parse(v); }
  return call('GET', store, key);
}

export async function setJSON(store, key, value) {
  if (memory) { memory.set(`${store}/${key}`, JSON.stringify(value)); return true; }
  return call('PUT', store, key, JSON.stringify(value));
}

export async function delKey(store, key) {
  if (memory) { memory.delete(`${store}/${key}`); return true; }
  return call('DELETE', store, key);
}
