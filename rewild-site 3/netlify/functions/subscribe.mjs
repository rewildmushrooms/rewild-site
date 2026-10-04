// POST /api/subscribe { email, website (honeypot) }
import { addSubscriber, isEmail } from './_shared/mailerlite.mjs';
import { json } from './_shared/square.mjs';
import { touchCustomer } from './_shared/carts.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
  let body = {};
  const type = req.headers.get('content-type') || '';
  try {
    body = type.includes('application/json') ? await req.json() : Object.fromEntries(await req.formData());
  } catch {
    return json(400, { error: 'Invalid request' });
  }
  if (body.website) return json(200, { ok: true }); // bot filled the hidden field
  const email = String(body.email || '').trim().toLowerCase();
  if (!isEmail(email)) return json(400, { error: 'Please enter a valid email address.' });
  try {
    const source = body.source === 'quiz' ? 'quiz' : body.source === 'popup' ? 'popup' : 'footer';
    const fields = { signup_source: source === 'quiz' ? 'quiz' : 'website', marketing_consent: 'yes', marketing_consent_source: source, marketing_consent_at: new Date().toISOString().slice(0, 10) };
    const q = body.quiz && typeof body.quiz === 'object' ? body.quiz : null;
    if (q) for (const k of ['stack', 'stack_names', 'how_to', 'why', 'want', 'day', 'when', 'coffee', 'how', 'format', 'start']) if (q[k]) fields['quiz_' + k] = String(q[k]).slice(0, k === 'how_to' ? 250 : 80);
    const groups = [process.env.MAILERLITE_GROUP_ID, q && process.env.MAILERLITE_QUIZ_GROUP_ID].filter(Boolean);
    try {
      await addSubscriber(email, fields, { groups });
    } catch (e) {
      // Custom fields may not exist in MailerLite yet: retry with the basics.
      await addSubscriber(email, { signup_source: fields.signup_source }, { groups });
    }
    try { await touchCustomer(email, { consent: true, source, quiz: q ? { stack: q.stack, stack_names: q.stack_names } : null }); } catch (e) { console.error('customer save failed', e.message); }
    return json(200, { ok: true });
  } catch (err) {
    console.error('subscribe error', err.message);
    return json(500, { error: 'Could not sign you up just now. Please try again.' });
  }
};

export const config = { path: '/api/subscribe' };
