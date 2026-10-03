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

export const isEmail = (s) => typeof s === 'string' && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
