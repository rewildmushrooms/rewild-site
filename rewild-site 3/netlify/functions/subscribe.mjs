// POST /api/subscribe { email, website (honeypot), source?, quiz?, utm?, page? }
// Everyone joins the one Rewilders list, so everyone gets the one welcome series (the MailerLite segment
// decides who enters it). Existing subscribers are never re-enrolled: their signup_source and first-touch
// fields are left alone; only last_source is updated. Unsubscribed people stay unsubscribed (no resubscribe flag).
import { addSubscriber, getSubscriber, isEmail } from './_shared/mailerlite.mjs';
import { json } from './_shared/square.mjs';
import { touchCustomer } from './_shared/carts.mjs';

export const SOURCES = ['quiz', 'popup', 'launch', 'blackfriday', 'spmc', 'rewild'];
const clean = (v, n = 60) => String(v || '').replace(/[^\w.\-\/]/g, '').slice(0, n);

// Fields for a NEW subscriber vs an EXISTING one (pure, tested).
export function signupFields({ source, quiz, utm, page, existing, today }) {
  const last = { last_source: source };
  if (existing) return last;
  const f = {
    signup_source: source === 'quiz' ? 'quiz' : 'website', // welcome segment: website = welcome, quiz = quiz emails
    marketing_consent: 'yes', marketing_consent_source: source, marketing_consent_at: today,
    first_source: source, ...last,
  };
  if (page) f.landing_page = clean(page, 80);
  if (utm && typeof utm === 'object') {
    for (const k of ['source', 'medium', 'campaign', 'content']) if (utm[k]) f['utm_' + k] = clean(utm[k]);
    if (utm.landing) f.landing_page = clean(utm.landing, 80);
  }
  if (quiz) for (const k of ['stack', 'stack_names', 'how_to', 'why', 'want', 'day', 'when', 'coffee', 'how', 'format', 'start']) if (quiz[k]) f['quiz_' + k] = String(quiz[k]).slice(0, k === 'how_to' ? 250 : 80);
  return f;
}

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
    const source = SOURCES.includes(body.source) ? body.source : 'footer';
    const q = body.quiz && typeof body.quiz === 'object' ? body.quiz : null;
    let existing = null;
    try { existing = await getSubscriber(email); } catch (e) { console.error('subscriber lookup failed', e.message); }
    const fields = signupFields({ source, quiz: q, utm: body.utm, page: body.page, existing: !!existing, today: new Date().toISOString().slice(0, 10) });
    // A returning quiz taker still gets their new stack fields.
    if (existing && q) Object.assign(fields, Object.fromEntries(Object.entries(signupFields({ source, quiz: q, today: '' })).filter(([k]) => k.startsWith('quiz_'))));
    const LAUNCH_GROUP = '201059337792128079'; // Launch party early access (Oct 2026)
    const SPMC_GROUP = '201881883229816543'; // Spirit Plant Medicine 2026 table signups
    const groups = [process.env.MAILERLITE_GROUP_ID, q && process.env.MAILERLITE_QUIZ_GROUP_ID, source === 'launch' && LAUNCH_GROUP, source === 'spmc' && SPMC_GROUP].filter(Boolean);
    try {
      await addSubscriber(email, fields, { groups });
    } catch (e) {
      // Custom fields may not exist in MailerLite yet: retry with the basics (never touch signup_source on existing).
      console.error('subscribe with fields failed', e.message);
      await addSubscriber(email, existing ? {} : { signup_source: fields.signup_source }, { groups });
    }
    try { await touchCustomer(email, { consent: true, source, quiz: q ? { stack: q.stack, stack_names: q.stack_names } : null }); } catch (e) { console.error('customer save failed', e.message); }
    return json(200, { ok: true });
  } catch (err) {
    console.error('subscribe error', err.message);
    return json(500, { error: 'Could not sign you up just now. Please try again.' });
  }
};

export const config = { path: '/api/subscribe' };
