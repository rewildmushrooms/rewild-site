// Attribution + consent rules (Nov 2026).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkoutFields } from '../netlify/functions/_shared/mailerlite.mjs';
import { signupFields } from '../netlify/functions/subscribe.mjs';

const today = '2026-11-19';

test('checkout: existing popup subscriber keeps first source and original consent', () => {
  const existing = { status: 'active', fields: { signup_source: 'website', first_source: 'popup', marketing_consent: 'yes', marketing_consent_source: 'popup', marketing_consent_at: '2026-11-12' } };
  const f = checkoutFields(existing, { today, name: 'Erik' });
  assert.deepEqual(f, { last_source: 'checkout', name: 'Erik' });
});

test('checkout: existing subscriber with empty consent fields gets them filled', () => {
  const existing = { status: 'active', fields: { signup_source: 'website', first_source: 'footer' } };
  const f = checkoutFields(existing, { today });
  assert.equal(f.marketing_consent_source, 'checkout');
  assert.equal(f.marketing_consent_at, today);
  assert.equal(f.signup_source, undefined);
  assert.equal(f.first_source, undefined);
});

test('checkout: brand new buyer gets consent, first touch and UTMs', () => {
  const f = checkoutFields(null, { today, utm: { source: 'instagram', medium: 'social', campaign: 'bio', landing: '/' } });
  assert.equal(f.signup_source, 'checkout');
  assert.equal(f.first_source, 'checkout');
  assert.equal(f.marketing_consent_source, 'checkout');
  assert.equal(f.marketing_consent_at, today);
  assert.equal(f.utm_source, 'instagram');
  assert.equal(f.landing_page, '/');
});

test('checkout: lookup failed still records consent (as before)', () => {
  const f = checkoutFields(undefined, { today });
  assert.equal(f.marketing_consent, 'yes');
  assert.equal(f.marketing_consent_at, today);
});

test('signup: existing subscriber only gets last_source', () => {
  assert.deepEqual(signupFields({ source: 'popup', existing: true, today }), { last_source: 'popup' });
});

test('cart.js referrer fallback', () => {
  const src = readFileSync(new URL('../public/js/cart.js', import.meta.url), 'utf8');
  const refSource = eval('(' + src.match(/function refSource[\s\S]*?\n  }\n/)[0] + ')');
  const own = 'rewildmushrooms.com';
  assert.deepEqual(refSource('https://www.google.com/', own), { source: 'google', medium: 'organic' });
  assert.deepEqual(refSource('https://www.google.co.uk/', own), { source: 'google', medium: 'organic' });
  assert.deepEqual(refSource('https://l.instagram.com/?u=x', own), { source: 'instagram', medium: 'referral' });
  assert.deepEqual(refSource('https://lm.facebook.com/l.php', own), { source: 'facebook', medium: 'referral' });
  assert.equal(refSource('https://rewildmushrooms.com/shop/', own), null);
  assert.equal(refSource('https://squareup.com/checkout/x', own), null);
  assert.equal(refSource('https://checkout.square.site/x', own), null);
  assert.equal(refSource('', own), null);
});
