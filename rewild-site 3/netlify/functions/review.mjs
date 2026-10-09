// /api/review   GET ?o=<order>&t=<token>  -> the review form's details
//               POST { o, t, rating, title, text, name, location, products, consent } -> saves it, returns the 15% thank-you code
// /api/reviews  GET ?product=energy        -> approved reviews for product pages (public)
import { json } from './_shared/square.mjs';
import { reviewForm, submitReview, publicReviews } from './_shared/reviews.mjs';
import { sendMail, mailConfigured } from './_shared/mailer.mjs';

const site = (req) => (process.env.SITE_URL || new URL(req.url).origin).replace(/\/$/, '');

export default async (req) => {
  const url = new URL(req.url);
  try {
    if (url.pathname.endsWith('/reviews')) {
      const p = url.searchParams.get('product') || '';
      const list = await publicReviews(/^[a-z0-9]{2,20}$/.test(p) ? p : '');
      return new Response(JSON.stringify({ reviews: list }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' } });
    }
    if (req.method === 'GET') return json(200, await reviewForm(url.searchParams.get('o'), url.searchParams.get('t')));
    if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
    let b;
    try { b = await req.json(); } catch { return json(400, { error: 'Invalid request' }); }
    if (b?.website) return json(400, { error: 'Invalid request' }); // honeypot
    return json(200, await submitReview(b, { send: mailConfigured() ? sendMail : null, site: site(req) }));
  } catch (err) {
    if (err.status !== 400) console.error('review error', err.message);
    return json(err.status === 400 ? 400 : 500, { error: err.status === 400 ? err.message : 'Something went wrong. Please try again, or reply to our email.' });
  }
};

export const config = { path: ['/api/review', '/api/reviews'] };
