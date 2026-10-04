// Runs every hour (Netlify scheduled function). Sends abandoned-cart reminders.
// Before every email it checks Square: if the order was paid, the cart is marked purchased and nothing is sent.
import { getJSON } from './_shared/store.mjs';
import { isPaid } from './_shared/orders.mjs';
import { fetchOrder, recordPaidOrder } from './_shared/record.mjs';
import { getCart, saveCart, setOpenCart, openCarts, dueStep, reminderEmail, createRecoveryCode, EXPIRE_AFTER } from './_shared/carts.mjs';
import { sendMail, mailConfigured } from './_shared/mailer.mjs';

export async function runReminders(now = Date.now(), deps = {}) {
  const send = deps.sendMail || sendMail;
  const site = (process.env.SITE_URL || process.env.URL || 'https://rewildmushrooms.com').replace(/\/$/, '');
  const report = { checked: 0, sent: [], purchased: 0, expired: 0, skipped: 0 };
  if (!deps.sendMail && !mailConfigured()) return { ...report, error: 'email not set up' };
  for (const s of await openCarts()) {
    const cart = await getCart(s.id);
    if (!cart || cart.status !== 'open') continue;
    report.checked += 1;
    if (now - Date.parse(cart.createdAt) > EXPIRE_AFTER) { cart.status = 'expired'; await saveCart(cart); await setOpenCart(cart.email, false); report.expired += 1; continue; }
    const step = dueStep(cart, now);
    if (!step) continue;
    // Paid already? (covers a missed webhook)
    if (cart.orderId) {
      try {
        const order = await (deps.fetchOrder || fetchOrder)(cart.orderId);
        if (isPaid(order)) { await recordPaidOrder(order, undefined, deps); report.purchased += 1; continue; }
      } catch (e) { console.error('reminder: order check failed', cart.id, e.message); continue; } // never email if we cannot check
    }
    const cust = await getJSON('customers', cart.email);
    if (cust?.noReminders) { cart.status = 'optout'; await saveCart(cart); report.skipped += 1; continue; }
    if (cust?.lastOrderAt && Date.parse(cust.lastOrderAt) > Date.parse(cart.createdAt)) { cart.status = 'bought_other'; await saveCart(cart); await setOpenCart(cart.email, false); report.skipped += 1; continue; }
    const fresh = await getCart(cart.id); // re-read right before sending
    if (!fresh || fresh.status !== 'open') continue;
    let code = null;
    if (step === 3) { code = await createRecoveryCode(fresh, now); fresh.code = code.code; }
    const msg = reminderEmail(step, fresh, { site, code });
    await send({ to: fresh.email, subject: msg.subject, text: msg.text, html: msg.html, fromName: 'REWILD Mushrooms', replyTo: 'hello@rewildmushrooms.com' });
    fresh.sent.push({ step, at: new Date(now).toISOString() });
    await saveCart(fresh);
    report.sent.push({ cart: fresh.id, step });
  }
  return report;
}

export default async () => {
  try {
    const r = await runReminders();
    console.log('cart reminders', JSON.stringify(r));
  } catch (e) { console.error('cart reminders failed', e.message); }
};

export const config = { schedule: '@hourly' };
