// Minimal Square REST client (no SDK, no dependencies).
// Env: SQUARE_ACCESS_TOKEN (required), SQUARE_ENV = 'sandbox' | 'production' (default sandbox),
//      SQUARE_LOCATION_ID (optional: the first active location is used if not set).
import crypto from 'node:crypto';

const VERSION = '2025-09-24';

export const isLive = () => (process.env.SQUARE_ENV || '').toLowerCase() === 'production';
const base = () => (isLive() ? 'https://connect.squareup.com/v2' : 'https://connect.squareupsandbox.com/v2');

export async function square(method, path, body, { fetchImpl = fetch } = {}) {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) throw new Error('SQUARE_ACCESS_TOKEN is not set');
  const init = {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Square-Version': VERSION, 'Content-Type': 'application/json', Accept: 'application/json' },
  };
  if (body && method !== 'GET') init.body = JSON.stringify(body);
  const res = await fetchImpl(base() + path, init);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.errors?.length) {
    const e = json.errors?.[0];
    const err = new Error(e?.detail || e?.code || `Square error ${res.status}`);
    err.status = res.status;
    err.square = json.errors;
    throw err;
  }
  return json;
}

export const idem = () => crypto.randomUUID();

let locationCache = null;
export async function locationId(opts) {
  if (process.env.SQUARE_LOCATION_ID) return process.env.SQUARE_LOCATION_ID;
  if (locationCache) return locationCache;
  const { locations = [] } = await square('GET', '/locations', null, opts);
  const loc = locations.find((l) => l.status === 'ACTIVE') || locations[0];
  if (!loc) throw new Error('No Square location found');
  locationCache = loc.id;
  return loc.id;
}
export const _resetLocationCache = () => { locationCache = null; };

// Follow Square cursors until done (capped for safety).
export async function pages(fetchPage, key, max = 1000) {
  const out = [];
  let cursor;
  do {
    const page = await fetchPage(cursor);
    out.push(...(page[key] || []));
    cursor = page.cursor;
  } while (cursor && out.length < max);
  return out;
}

export const json = (status, body, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
