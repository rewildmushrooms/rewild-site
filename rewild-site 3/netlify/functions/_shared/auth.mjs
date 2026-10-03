// REWILD HQ passwords.
// - Each person's Netlify variable (HQ_PASSWORD, HQ_PASSWORD_SEAN, HQ_PASSWORD_PETE) is their on/off switch
//   and their first password. Delete the variable and that person is locked out, whatever else is saved.
// - "Forgot password?" emails a one-time link (30 minutes) to their @rewildmushrooms.com inbox.
//   The new password is saved hashed (scrypt) in Netlify Blobs and replaces the Netlify one.
import crypto from 'node:crypto';
import { getJSON, setJSON, delKey } from './store.mjs';
import { sendMail } from './mailer.mjs';

const STORE = 'hq-auth';
const RESET_MINUTES = 30;
const RESEND_WAIT_MS = 2 * 60 * 1000;

export const PASSWORD_RULES = 'At least 14 characters, with upper and lower case letters, a number and a symbol.';
export const strongEnough = (p) =>
  typeof p === 'string' && p.length >= 14 && p.length <= 128 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p);

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
export const same = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));

const scrypt = (pw, salt) => new Promise((resolve, reject) =>
  crypto.scrypt(pw, salt, 32, { N: 16384, r: 8, p: 1 }, (e, k) => (e ? reject(e) : resolve(k))));

export async function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  return `scrypt$${salt.toString('base64')}$${(await scrypt(pw, salt)).toString('base64')}`;
}

export async function matchesHash(pw, stored) {
  const [kind, s, h] = String(stored || '').split('$');
  if (kind !== 'scrypt' || !s || !h) return false;
  const key = await scrypt(String(pw), Buffer.from(s, 'base64'));
  const want = Buffer.from(h, 'base64');
  return want.length === key.length && crypto.timingSafeEqual(key, want);
}

export const accessEnabled = (member) => (process.env[member.env] || '').length >= 10;

export async function checkPassword(member, given) {
  if (!member || !accessEnabled(member) || !given) return false;
  let saved = null;
  try { saved = await getJSON(STORE, `pw-${member.id}`); } catch (e) { console.error('password store read failed', e.message); }
  if (saved?.hash) return matchesHash(given, saved.hash);
  return same(given, process.env[member.env]);
}

const bad = (m, status = 400) => Object.assign(new Error(m), { status });

export async function startReset(member, siteUrl, now = Date.now()) {
  if (!member?.email || !accessEnabled(member)) return { sent: false };
  const prev = await getJSON(STORE, `reset-${member.id}`).catch(() => null);
  if (prev && now - prev.at < RESEND_WAIT_MS) return { sent: false, wait: true };
  const token = crypto.randomBytes(32).toString('base64url');
  await setJSON(STORE, `reset-${member.id}`, { hash: sha(token).toString('hex'), exp: now + RESET_MINUTES * 60000, at: now });
  const link = `${siteUrl.replace(/\/$/, '')}/hq/?reset=${member.id}.${token}`;
  try {
    await sendMail({
      to: member.email,
      subject: 'Reset your REWILD HQ password',
      text: `Hi ${member.name.split(' ')[0]},\n\nSomeone (hopefully you) asked to reset your REWILD HQ password.\n\nChoose a new one here. The link works once, for the next ${RESET_MINUTES} minutes:\n${link}\n\nDidn't ask for this? Ignore this email and nothing changes.\n\nREWILD HQ`,
    });
  } catch (e) {
    await delKey(STORE, `reset-${member.id}`).catch(() => {});
    throw bad(`The reset email could not be sent. ${e.message}`, 502);
  }
  return { sent: true };
}

export async function finishReset(member, token, password, now = Date.now()) {
  if (!member || !accessEnabled(member)) throw bad('This reset link is not valid.');
  const rec = await getJSON(STORE, `reset-${member.id}`);
  if (!rec || now > rec.exp || !crypto.timingSafeEqual(Buffer.from(rec.hash, 'hex'), sha(token))) {
    throw bad('This reset link has expired or was already used. Ask for a new one.');
  }
  if (!strongEnough(password)) throw bad(PASSWORD_RULES);
  await setJSON(STORE, `pw-${member.id}`, { hash: await hashPassword(password), at: now });
  await delKey(STORE, `reset-${member.id}`);
  return { ok: true };
}
