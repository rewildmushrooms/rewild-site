// POST /api/subscribe { email, website (honeypot) }
import { addSubscriber, isEmail } from './_shared/mailerlite.mjs';
import { json } from './_shared/stripe.mjs';

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
    const fields = { source: body.source === 'quiz' ? 'quiz' : 'website' };
    const q = body.quiz && typeof body.quiz === 'object' ? body.quiz : null;
    if (q) for (const k of ['stack', 'why', 'want', 'day', 'when', 'coffee', 'how', 'start']) if (q[k]) fields['quiz_' + k] = String(q[k]).slice(0, 60);
    const groups = [process.env.MAILERLITE_GROUP_ID, q && process.env.MAILERLITE_QUIZ_GROUP_ID].filter(Boolean);
    try {
      await addSubscriber(email, fields, { groups });
    } catch (e) {
      // Custom quiz fields may not exist in MailerLite yet: retry with the basics.
      if (!q) throw e;
      await addSubscriber(email, { source: fields.source }, { groups });
    }
    return json(200, { ok: true });
  } catch (err) {
    console.error('subscribe error', err.message);
    return json(500, { error: 'Could not sign you up just now. Please try again.' });
  }
};

export const config = { path: '/api/subscribe' };
