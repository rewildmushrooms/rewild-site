# Going live on rewildmushrooms.com

Moving from `rewild-mushrooms.netlify.app` (Square sandbox) to `rewildmushrooms.com` (real payments).
Steps marked **Jade** involve passwords, secret keys or account settings. Claude can do the rest.

## A. Before launch day (test mode)
1. **Jade:** one test order on rewild-mushrooms.netlify.app with Square's test card `4111 1111 1111 1111`, any future date, CVV `111`, any postal code. Tick the email box. Then check: the thank-you page shows the order, HQ shows it, stock went down, MailerLite has the email.
2. **Jade:** Square Developer Dashboard > your app > **Sandbox** > Webhooks > Add subscription. URL `https://rewild-mushrooms.netlify.app/api/square-webhook`, events `payment.created`, `payment.updated`, `order.updated`, `refund.created`, `refund.updated`. Copy its **Signature key** into Netlify as `SQUARE_WEBHOOK_SIGNATURE_KEY`. Click **Send test event**: it should say 200.
3. Contact form: Netlify > Forms > notifications go to rewildmushrooms@protonmail.com. Send a test.

## B. Switch Square to real payments
1. **Jade:** Square Developer Dashboard > **Production** > Credentials: copy the Production access token into Netlify `SQUARE_ACCESS_TOKEN` (replace the sandbox one).
2. Set `SQUARE_ENV` = `production`.
3. **Jade:** Production > Webhooks > Add subscription, URL `https://rewildmushrooms.com/api/square-webhook`, same events. Put its signature key in `SQUARE_WEBHOOK_SIGNATURE_KEY` (the production key replaces the sandbox one).
4. Deploy.
5. In HQ (`/awesomesauce`) > Promo codes: **Add all REWILD codes** (live codes are separate from test codes; festival codes keep their Oct 15 end).
6. In HQ > Inventory: enter the opening counts: Energy 50, Clarity 50, Strength 50, Peace 50, Tincture 30.

## C. Point the domain
1. Netlify > Domain management > **Add a domain** > `rewildmushrooms.com`, and make it the **primary** domain (`www` redirects to it).
2. **Jade, SiteGround > Site Tools > Domain > DNS Zone Editor:** change **only** the website records, never the MX, mail, SPF, DKIM or DMARC records (email stays on SiteGround):
   - `A` record for `rewildmushrooms.com`: the address Netlify shows (usually `75.2.60.5`).
   - `CNAME` for `www`: `rewild-mushrooms.netlify.app`.
   - Remove any other `A`/`AAAA` records for `@` and `www` that point at SiteGround.
3. Wait for Netlify to show the HTTPS certificate as active (minutes to a few hours).
4. Set `SITE_URL` = `https://rewildmushrooms.com`, then deploy. This updates canonical links, sitemap, Square return links, password-reset links and the webhook check.

## D. After the domain works
- Place one small **real** order (then refund it in Square). Check thank-you page, HQ, stock, MailerLite, Square receipt.
- MailerLite: check that buttons in the "send my stack" emails and follow-ups point to `rewildmushrooms.com`. Switch the sender to `hello@rewildmushrooms.com` once that domain is verified in MailerLite (pause, edit, resume).
- GA4: Admin > Data streams > the web stream: update the URL to `rewildmushrooms.com` (data keeps flowing either way).
- Google Search Console: add `rewildmushrooms.com`, submit `https://rewildmushrooms.com/sitemap.xml`.
- **Old site:** turn off checkout on the old Stripe site, keep the Stripe account for refunds on past orders, and keep a SiteGround backup of WordPress before removing it. Old WordPress URLs already redirect (see `netlify.toml`).
- HQ password reset: test once from the live domain.
- Delete any `STRIPE_...` env vars in Netlify.

## What changes with the domain (checked)
| Thing | How it follows the domain |
|---|---|
| Canonical URLs, sitemap, Open Graph | Built from `SITE_URL` / Netlify `URL` |
| Square checkout return page | `SITE_URL` + `/order-confirmed/` |
| Square webhook | New subscription per environment; signature check uses `SITE_URL` |
| HQ reset emails, low-stock email link | `SITE_URL` |
| `/awesomesauce` | Relative redirect, works on any domain |
| API calls from pages | Relative (`/api/...`), work on any domain, no CORS needed |
| Cookies / login | HQ login is per browser tab, works on any domain |
| GA4 | Same tag, nothing to change |
