// MailerLite (new API) helper. Adds or updates a subscriber in the Rewilders group.
export async function addSubscriber(email, fields = {}, { fetchImpl = fetch, groups } = {}) {
  const key = process.env.MAILERLITE_API_KEY;
  if (!key) throw new Error('MAILERLITE_API_KEY is not set');
  const groupIds = groups || [process.env.MAILERLITE_GROUP_ID].filter(Boolean);
  const res = await fetchImpl('https://connect.mailerlite.com/api/subscribers', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, fields, groups: groupIds }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MailerLite ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export async function groupStats({ fetchImpl = fetch } = {}) {
  const key = process.env.MAILERLITE_API_KEY;
  const id = process.env.MAILERLITE_GROUP_ID;
  if (!key || !id) return null;
  const res = await fetchImpl(`https://connect.mailerlite.com/api/groups/${id}`, {
    headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const { data } = await res.json();
  return { name: data.name, active: data.active_count, total: data.total ?? data.active_count, openRate: data.open_rate?.float ?? null };
}

// Existing subscriber or null (404). Used so a second signup never rewrites where someone first came from.
export async function getSubscriber(email, { fetchImpl = fetch } = {}) {
  const key = process.env.MAILERLITE_API_KEY;
  if (!key) throw new Error('MAILERLITE_API_KEY is not set');
  const res = await fetchImpl(`https://connect.mailerlite.com/api/subscribers/${encodeURIComponent(email)}`, { headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`MailerLite ${res.status}`);
  const { data } = await res.json();
  return data || null;
}

// Fields to save when a buyer ticks the email box at checkout (pure, tested).
// existing = MailerLite subscriber or null; undefined means the lookup failed.
// Where someone first came from and when/where they first consented are set ONCE and never overwritten
// (same rule as /api/subscribe). If the lookup failed, record consent anyway (CASL), as before.
export function checkoutFields(existing, { today, name, utm } = {}) {
  const f = { last_source: 'checkout' };
  if (name) f.name = name;
  const have = existing?.fields || {};
  const once = {
    signup_source: 'checkout', first_source: 'checkout',
    marketing_consent: 'yes', marketing_consent_source: 'checkout', marketing_consent_at: today,
  };
  if (existing === null || existing === undefined) {
    if (utm && typeof utm === 'object') {
      const clean = (v, n = 60) => String(v || '').replace(/[^\w.\-\/]/g, '').slice(0, n);
      for (const k of ['source', 'medium', 'campaign', 'content']) if (utm[k]) once['utm_' + k] = clean(utm[k]);
      if (utm.landing) once.landing_page = clean(utm.landing, 80);
    }
    return Object.assign(once, f);
  }
  for (const [k, v] of Object.entries(once)) if (!have[k] && v) f[k] = v;
  return f;
}

export const isEmail = (s) => typeof s === 'string' && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);

export async function groupCount(id, { fetchImpl = fetch } = {}) {
  const key = process.env.MAILERLITE_API_KEY;
  if (!key || !id) return null;
  const res = await fetchImpl(`https://connect.mailerlite.com/api/groups/${id}`, { headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' } });
  if (!res.ok) return null;
  const { data } = await res.json();
  return data?.active_count ?? null;
}
