// Minimal Stripe REST client (no SDK, no dependencies).
// API version is pinned so Stripe changes never break checkout silently.
import crypto from 'node:crypto';

const API = 'https://api.stripe.com/v1';
const VERSION = '2024-06-20';

export function encode(obj, prefix = '', out = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item !== null && typeof item === 'object') encode(item, `${key}[${i}]`, out);
        else out.push(`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(item)}`);
      });
    } else if (typeof v === 'object') {
      encode(v, key, out);
    } else {
      out.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
    }
  }
  return out;
}

export async function stripe(method, path, params, { fetchImpl = fetch } = {}) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  let url = API + path;
  const init = {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Stripe-Version': VERSION,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };
  if (params) {
    const body = encode(params).join('&');
    if (method === 'GET') url += (url.includes('?') ? '&' : '?') + body;
    else init.body = body;
  }
  const res = await fetchImpl(url, init);
  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json?.error?.message || `Stripe error ${res.status}`);
    err.status = res.status;
    err.stripe = json?.error;
    throw err;
  }
  return json;
}

// Walk every page of a Stripe list endpoint (capped for safety).
export async function listAll(path, params = {}, max = 1000, opts) {
  const out = [];
  let starting_after;
  while (out.length < max) {
    const page = await stripe('GET', path, { ...params, limit: 100, starting_after }, opts);
    out.push(...page.data);
    if (!page.has_more || page.data.length === 0) break;
    starting_after = page.data[page.data.length - 1].id;
  }
  return out;
}

// Verify the Stripe-Signature header (v1 scheme, 5 minute tolerance).
export function verifySignature(payload, header, secret, toleranceSec = 300, now = Date.now()) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(
    header.split(',').map((kv) => {
      const i = kv.indexOf('=');
      return [kv.slice(0, i).trim(), kv.slice(i + 1).trim()];
    })
  );
  const sigs = header
    .split(',')
    .filter((kv) => kv.trim().startsWith('v1='))
    .map((kv) => kv.trim().slice(3));
  const t = Number(parts.t);
  if (!t || sigs.length === 0) return false;
  if (Math.abs(now / 1000 - t) > toleranceSec) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${t}.${payload}`, 'utf8').digest('hex');
  return sigs.some((s) => {
    const a = Buffer.from(s, 'hex');
    const b = Buffer.from(expected, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

export const json = (status, body, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
