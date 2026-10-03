// REWILD HQ password reset.
//   POST /api/hq-auth { action:'forgot', user }                    -> emails a one-time reset link
//   POST /api/hq-auth { action:'reset', user, token, password }    -> saves the new password
//   GET  /api/hq-auth?action=status                                -> is storage + email set up? (no secrets)
import { json } from './_shared/square.mjs';
import { memberById } from './_shared/team.mjs';
import { startReset, finishReset, PASSWORD_RULES } from './_shared/auth.mjs';
import { getJSON, setJSON, blobsContext } from './_shared/store.mjs';
import { mailConfigured } from './_shared/mailer.mjs';

const SENT = 'If that name has HQ access, a reset link is on its way to their @rewildmushrooms.com inbox. It works for 30 minutes.';

export default async (req) => {
  try {
    if (req.method === 'GET') {
      const action = new URL(req.url).searchParams.get('action');
      if (action !== 'status') return json(400, { error: 'Unknown action' });
      let storage = 'missing';
      if (blobsContext()) {
        try { await setJSON('hq-auth', 'status-check', { at: Date.now() }); storage = (await getJSON('hq-auth', 'status-check')) ? 'ok' : 'read failed'; } catch (e) { storage = e.message; }
      }
      return json(200, { storage, email: mailConfigured() ? 'configured' : 'missing', rules: PASSWORD_RULES });
    }
    if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
    const b = await req.json().catch(() => ({}));
    const member = memberById(b.user);
    if (b.action === 'forgot') {
      const siteUrl = process.env.SITE_URL || new URL(req.url).origin;
      const r = member ? await startReset(member, siteUrl) : { sent: false };
      if (r.wait) return json(429, { error: 'A reset email was just sent. Check your inbox (and spam), or try again in 2 minutes.' });
      return json(200, { ok: true, message: SENT });
    }
    if (b.action === 'reset') {
      await finishReset(member, String(b.token || ''), String(b.password || ''));
      return json(200, { ok: true });
    }
    return json(400, { error: 'Unknown action' });
  } catch (err) {
    console.error('hq-auth error', err.message);
    return json(err.status && err.status < 600 ? err.status : 500, { error: err.status ? err.message : 'Something went wrong. Please try again.' });
  }
};

export const config = { path: '/api/hq-auth' };
