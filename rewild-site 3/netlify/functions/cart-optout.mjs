// GET /api/cart-optout?c=<cart id>&t=<token>  One-click stop for cart reminders (link in every reminder).
import { getJSON, setJSON } from './_shared/store.mjs';
import { getCart, saveCart, setOpenCart } from './_shared/carts.mjs';
import { putIndex, customerSummary } from './_shared/data.mjs';

const page = (msg) => new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>REWILD</title><body style="font-family:Helvetica,Arial,sans-serif;background:#F3F2EE;color:#121310;display:grid;place-items:center;min-height:90vh;margin:0;padding:20px"><div style="max-width:460px;background:#fff;padding:32px;border-radius:4px"><h1 style="text-transform:uppercase;font-size:22px;margin:0 0 12px">${msg}</h1><p><a href="/" style="color:#121310">Back to rewildmushrooms.com</a></p></div></body>`, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });

export default async (req) => {
  const u = new URL(req.url);
  const cart = await Promise.resolve(getCart(u.searchParams.get('c'))).catch(() => null);
  if (!cart || cart.optout !== u.searchParams.get('t')) return page('That link has expired.');
  if (cart.status === 'open') { cart.status = 'optout'; await saveCart(cart); await setOpenCart(cart.email, false); }
  const c = await getJSON('customers', cart.email);
  if (c && !c.noReminders) { c.noReminders = true; await setJSON('customers', cart.email, c); await putIndex('customers', cart.email, customerSummary(c)); }
  return page("Done. You won't get any more cart reminders.");
};

export const config = { path: '/api/cart-optout' };
