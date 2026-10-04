// GET /api/email-optout?e=<email>&t=<token>  One-click stop for website emails to buyers
// (reorder reminders, win-back, cart reminders). Link is in every one of those emails.
import { getJSON, setJSON } from './_shared/store.mjs';
import { putIndex, customerSummary } from './_shared/data.mjs';

const page = (msg) => new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>REWILD</title><body style="font-family:Helvetica,Arial,sans-serif;background:#F3F2EE;color:#121310;display:grid;place-items:center;min-height:90vh;margin:0;padding:20px"><div style="max-width:460px;background:#fff;padding:32px;border-radius:4px"><h1 style="text-transform:uppercase;font-size:22px;margin:0 0 12px">${msg}</h1><p><a href="/" style="color:#121310">Back to rewildmushrooms.com</a></p></div></body>`, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });

export default async (req) => {
  const u = new URL(req.url);
  const email = String(u.searchParams.get('e') || '').trim().toLowerCase();
  const t = u.searchParams.get('t') || '';
  const c = email ? await getJSON('customers', email).catch(() => null) : null;
  if (!c || !c.optoutToken || c.optoutToken !== t) return page('That link has expired.');
  if (!c.noReminders) { c.noReminders = true; c.noRemindersAt = new Date().toISOString(); await setJSON('customers', email, c); await putIndex('customers', email, customerSummary(c)); }
  return page("Done. You won't get any more of these emails.");
};

export const config = { path: '/api/email-optout' };
