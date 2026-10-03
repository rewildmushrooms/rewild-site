// Minimal SMTP sender (no dependencies) for REWILD HQ emails, sent through the SiteGround mailbox.
// Env: SMTP_HOST (default mail.rewildmushrooms.com), SMTP_PORT (default 465, TLS),
//      SMTP_USER (the full mailbox address), SMTP_PASSWORD (that mailbox's password).
import tls from 'node:tls';
import crypto from 'node:crypto';

let transport = null; // tests replace the network part
export const _setTransport = (fn) => { transport = fn; };

export const mailConfigured = () => !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD);

export function buildMessage({ from, to, subject, text }) {
  const domain = String(from).split('@')[1] || 'rewildmushrooms.com';
  const body = String(text).replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..');
  return [
    `From: REWILD HQ <${from}>`,
    `To: <${to}>`,
    `Subject: ${subject}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    body,
  ].join('\r\n');
}

function smtp({ host, port, user, pass, from, to, data }) {
  return new Promise((resolve, reject) => {
    const sock = tls.connect({ host, port, servername: host, timeout: 8000 });
    let buf = '';
    let step = 0;
    const b64 = (s) => Buffer.from(s).toString('base64');
    const steps = [
      [220, () => `EHLO ${from.split('@')[1] || 'localhost'}`],
      [250, () => 'AUTH LOGIN'],
      [334, () => b64(user)],
      [334, () => b64(pass)],
      [235, () => `MAIL FROM:<${from}>`],
      [250, () => `RCPT TO:<${to}>`],
      [250, () => 'DATA'],
      [354, () => `${data}\r\n.`],
      [250, () => 'QUIT'],
    ];
    const fail = (e) => { sock.destroy(); reject(e); };
    sock.on('timeout', () => fail(new Error('Email server timed out')));
    sock.on('error', fail);
    sock.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      // wait for a complete reply (last line is "NNN " not "NNN-")
      const lines = buf.split('\r\n').filter(Boolean);
      const last = lines[lines.length - 1] || '';
      if (!buf.endsWith('\r\n') || !/^\d{3} /.test(last)) return;
      buf = '';
      const code = Number(last.slice(0, 3));
      if (step >= steps.length) { sock.end(); return resolve(true); }
      const [want, next] = steps[step];
      if (code !== want) {
        const msg = step === 3 || step === 4 ? 'Email login failed (check SMTP_USER / SMTP_PASSWORD)' : `Email server said: ${last.slice(0, 120)}`;
        return fail(new Error(msg));
      }
      step += 1;
      sock.write(next() + '\r\n');
      if (step === steps.length) { sock.end(); resolve(true); }
    });
  });
}

export async function sendMail({ to, subject, text }) {
  const user = process.env.SMTP_USER, pass = process.env.SMTP_PASSWORD;
  if (!user || !pass) throw Object.assign(new Error('Email is not set up yet (SMTP_USER / SMTP_PASSWORD).'), { status: 503 });
  const msg = { host: process.env.SMTP_HOST || 'mail.rewildmushrooms.com', port: Number(process.env.SMTP_PORT) || 465, user, pass, from: user, to, data: buildMessage({ from: user, to, subject, text }) };
  return (transport || smtp)(msg);
}
