// /api/review-admin?id=<review>&t=<token>  The link in Jade's "New review" email.
//   GET  shows the review with editable wording and two buttons (Approve and post / Hide).
//   POST saves the choice. A button press (not just opening the link) is needed, so email link scanners can't approve anything.
import { reviewByToken, updateReview } from './_shared/reviews.mjs';
import { PRODUCT_BY_ID } from './_shared/catalog.mjs';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STATUS = { pending: 'Waiting for you', approved: 'On the website', hidden: 'Hidden' };
const page = (body, status = 200) => new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Review · REWILD</title>
<style>body{margin:0;background:#F3F2EE;font-family:Helvetica,Arial,sans-serif;color:#121310}main{max-width:620px;margin:0 auto;padding:24px 16px}.card{background:#fff;border-radius:6px;padding:24px}
h1{font-size:20px;text-transform:uppercase;letter-spacing:.06em;margin:0 0 16px}.stars{font-size:26px;color:#C9A800;letter-spacing:2px;margin:0 0 12px}label{display:block;font-size:13px;font-weight:700;margin:14px 0 6px}
input,textarea{width:100%;box-sizing:border-box;font:inherit;font-size:16px;padding:12px;border:1.5px solid #C9C8C1;border-radius:3px}textarea{min-height:170px;line-height:1.5}
.meta{font-size:14px;color:#55574F;margin:14px 0 0}.row{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}button{font:inherit;font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:14px 20px;border:0;border-radius:2px;cursor:pointer}
.ok{background:#E8C800;color:#121310}.no{background:#fff;border:1.5px solid #121310;color:#121310}.chip{display:inline-block;font-size:12px;font-weight:700;padding:3px 10px;border-radius:12px;background:#F3F2EE}.note{font-size:13px;color:#55574F;margin:14px 0 0}.done{font-size:18px;line-height:1.5}a{color:#121310}</style></head><body><main>${body}</main></body></html>`, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });

const form = (r, msg = '') => page(`<div class="card"><h1>New review</h1>
<p class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</p>
<p><span class="chip">${STATUS[r.status] || r.status}</span></p>
${msg ? `<p class="done">${esc(msg)}</p>` : ''}
<form method="POST">
<input type="hidden" name="id" value="${esc(r.id)}"><input type="hidden" name="t" value="${esc(r.adminToken)}">
<label for="title">Headline</label><input id="title" name="title" maxlength="80" value="${esc(r.title)}">
<label for="text">Review (trim anything that sounds like a health claim; use "..." where you cut)</label><textarea id="text" name="text" maxlength="1500">${esc(r.text)}</textarea>
<label for="name">Name shown</label><input id="name" name="name" maxlength="40" value="${esc(r.name)}">
<label for="location">Location</label><input id="location" name="location" maxlength="40" value="${esc(r.location || '')}">
<p class="meta">Shows on: ${esc(r.products.map((id) => PRODUCT_BY_ID[id]?.name || id).join(', '))} · ${esc(r.email)}</p>
${r.originalText ? `<p class="note">You've edited this. Original: "${esc(r.originalText)}"</p>` : ''}
<div class="row">${r.consent ? '<button class="ok" name="a" value="approve">Approve and post</button>' : ''}<button class="no" name="a" value="hide">Hide</button><button class="no" name="a" value="save">Save wording only</button></div>
${r.consent ? '' : '<p class="note">They did not allow us to post this one, so it can only stay private.</p>'}
</form></div><p class="note"><a href="/hq/">Open HQ</a> to see all reviews.</p>`);

export default async (req) => {
  try {
    if (req.method === 'GET') {
      const u = new URL(req.url);
      return form(await reviewByToken(u.searchParams.get('id'), u.searchParams.get('t')));
    }
    if (req.method !== 'POST') return page('<p>Not allowed.</p>', 405);
    const f = new URLSearchParams(await req.text());
    const r = await reviewByToken(f.get('id'), f.get('t'));
    const a = f.get('a');
    const out = await updateReview({ id: r.id, title: f.get('title') ?? r.title, text: f.get('text') ?? r.text, name: f.get('name') ?? r.name, location: f.get('location') ?? r.location,
      ...(a === 'approve' ? { status: 'approved' } : a === 'hide' ? { status: 'hidden' } : {}) });
    return form(out.review, a === 'approve' ? 'Done. It’s on the website now (it can take up to 5 minutes to show).' : a === 'hide' ? 'Hidden. It won’t show on the website.' : 'Saved.');
  } catch (err) {
    if (err.status !== 400) console.error('review admin error', err.message);
    return page(`<div class="card"><h1>Hmm.</h1><p>${esc(err.status === 400 ? err.message : 'Something went wrong. Try HQ > Reviews & referrals.')}</p><p><a href="/hq/">Open HQ</a></p></div>`, err.status === 400 ? 400 : 500);
  }
};

export const config = { path: '/api/review-admin' };
