// Shared look for website emails (same style as reorder, win-back and shipped emails).
// email({ eyebrow?, head, paras: [...], code?, cta?: { text, link }, after?: [...], foot, optout? })
export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const ADDRESS = 'REWILD Mushrooms, Box 18, Crescent Valley, BC V0G 1H0';

export function email({ eyebrow, head, paras = [], code, cta, after = [], foot, optout }) {
  const text = [head, '', ...paras.flatMap((p) => [p, '']), ...(code ? [`Your code: ${code}`, ''] : []), ...(cta ? [`${cta.text}: ${cta.link}`, ''] : []),
    ...after.flatMap((p) => [p, '']), 'Return to your natural state.', '~ The REWILD crew', '', '---', foot, ...(optout ? [`Stop these emails: ${optout}`] : []), ADDRESS].join('\n');
  const p = (t) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3D3F38">${esc(t)}</p>`;
  const html = `<!doctype html><html><body style="margin:0;background:#F3F2EE;font-family:Helvetica,Arial,sans-serif;color:#121310">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F2EE;padding:24px 0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:4px">
<tr><td style="background:#121310;padding:18px 28px;color:#fff;font-weight:800;letter-spacing:.3em;font-size:16px">REWILD</td></tr>
<tr><td style="padding:32px 28px 8px">${eyebrow ? `<p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#9A8400">${esc(eyebrow)}</p>` : ''}
<h1 style="margin:0 0 14px;font-size:26px;line-height:1.2;text-transform:uppercase">${esc(head)}</h1>
${paras.map(p).join('')}
${code ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 18px"><tr><td align="center" style="border:2px dashed #121310;padding:14px 8px;font-size:22px;font-weight:800;letter-spacing:.06em">${esc(code)}</td></tr></table>` : ''}
${cta ? `<a href="${esc(cta.link)}" style="display:inline-block;background:#E8C800;color:#121310;text-decoration:none;font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:15px 26px;border-radius:2px">${esc(cta.text)}</a>` : ''}
${after.length ? `<div style="margin-top:24px">${after.map(p).join('')}</div>` : ''}
<p style="margin:24px 0 0;font-size:15px;line-height:1.5">Return to your natural state.<br>~ The REWILD crew</p></td></tr>
<tr><td style="padding:24px 28px;font-size:12px;line-height:1.5;color:#6B6D64">${esc(foot)}${optout ? ` <a href="${esc(optout)}" style="color:#6B6D64">Stop these emails</a>.` : ''}<br>${ADDRESS}</td></tr>
</table></td></tr></table></body></html>`;
  return { text, html };
}

export const firstNameOf = (name) => String(name || '').trim().split(/\s+/)[0] || '';
