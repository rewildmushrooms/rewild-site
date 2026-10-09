// /api/refer  GET ?code=JADE-7K3Q -> { first } so a friend's landing page can say who sent them (public, nothing private)
//             POST { email } -> emails a past customer their friend code. Same answer whether or not they are a customer.
import { json } from './_shared/square.mjs';
import { getReferral, sendLinkTo, REFERRAL } from './_shared/referrals.mjs';
import { sendMail, mailConfigured } from './_shared/mailer.mjs';
import { isEmail } from './_shared/mailerlite.mjs';

export default async (req) => {
  const url = new URL(req.url);
  try {
    if (req.method === 'GET') {
      const r = await getReferral(url.searchParams.get('code'));
      return r && r.active !== false ? json(200, { code: r.code, first: r.first || null, friendOff: REFERRAL.friendOff, min: REFERRAL.min }) : json(404, { error: 'Not found' });
    }
    if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
    let b;
    try { b = await req.json(); } catch { return json(400, { error: 'Invalid request' }); }
    const email = String(b?.email || '').trim().toLowerCase();
    if (b?.website) return json(200, { ok: true });
    if (!isEmail(email)) return json(400, { error: 'Please check your email address.' });
    if (!mailConfigured()) return json(500, { error: 'Email is not set up yet. Please email hello@rewildmushrooms.com.' });
    const site = (process.env.SITE_URL || url.origin).replace(/\/$/, '');
    await sendLinkTo(email, { send: sendMail, site });
    return json(200, { ok: true });
  } catch (err) {
    console.error('refer error', err.message);
    return json(500, { error: 'Something went wrong. Please try again.' });
  }
};

export const config = { path: '/api/refer' };
