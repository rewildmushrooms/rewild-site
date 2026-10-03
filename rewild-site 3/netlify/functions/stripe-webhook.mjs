// POST /api/stripe-webhook  (add this URL in Stripe > Developers > Webhooks)
// Event: checkout.session.completed
// Adds customers who opted in at checkout to the MailerLite Rewilders group.
import { verifySignature, json } from './_shared/stripe.mjs';
import { addSubscriber, isEmail } from './_shared/mailerlite.mjs';

export async function handleEvent(event, deps = {}) {
  if (event.type !== 'checkout.session.completed') return { ignored: event.type };
  const s = event.data.object;
  const optIn = (s.custom_fields || []).find((f) => f.key === 'newsletter')?.dropdown?.value === 'yes';
  const email = s.customer_details?.email;
  if (optIn && isEmail(email)) {
    const name = (s.customer_details?.name || '').split(' ')[0];
    const extraGroups = [process.env.MAILERLITE_GROUP_ID, process.env.MAILERLITE_CUSTOMERS_GROUP_ID].filter(Boolean);
    await (deps.addSubscriber || addSubscriber)(email, { name, source: 'checkout' }, { groups: extraGroups });
    return { subscribed: email };
  }
  return { subscribed: false };
}

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
  const payload = await req.text();
  const ok = verifySignature(payload, req.headers.get('stripe-signature'), process.env.STRIPE_WEBHOOK_SECRET);
  if (!ok) return json(400, { error: 'Bad signature' });
  try {
    const result = await handleEvent(JSON.parse(payload));
    return json(200, { received: true, ...result });
  } catch (err) {
    // Log but still 200 so Stripe does not retry forever over an email-list hiccup.
    console.error('webhook handler error', err.message);
    return json(200, { received: true, warning: 'handler error logged' });
  }
};

export const config = { path: '/api/stripe-webhook' };
