# REWILD website: launch guide

Plain-language steps to take this site live. About 60 to 90 minutes, most of it waiting on DNS.
Nothing here touches your current site until Step 6.

## What's in this folder

| Path | What it is |
|---|---|
| `netlify/functions/_shared/catalog.mjs` | **Prices, products and shipping rules.** Change a price here and it changes everywhere, including Stripe. |
| `src/pages.mjs` | All page copy (home, shop, product pages, story, FAQ, legal) |
| `src/journal.mjs` | Journal articles. Your 3 existing articles keep their old URLs. |
| `src/lab.mjs` | Certificates of analysis. Drop PDFs in `public/coa/` and fill in the line. |
| `public/` | Images, styles, scripts, and REWILD HQ (`public/hq/`) |
| `netlify/functions/` | Checkout, Stripe webhook, email signup, order lookup, HQ API |
| `tests/` | Automated checks (`npm test`) |

No WordPress, no plugins, no monthly platform fee. Hosting is Netlify's free tier.

---

## Step 1: Put the code on GitHub (5 min)

1. Create a free account at github.com if you don't have one.
2. New repository → name it `rewild-site` → **Private** → Create.
3. On the repo page click **uploading an existing file**, drag in everything from this folder (not the `dist` folder), and Commit.

## Step 2: Create the Netlify site (5 min)

1. Sign up at netlify.com with your GitHub account.
2. **Add new site → Import an existing project → GitHub → rewild-site**.
3. Netlify reads the settings automatically (build: `node build.mjs`, publish: `dist`). Click **Deploy**.
4. You'll get a temporary address like `rewild-xyz.netlify.app`. The site works there right away (checkout won't until Step 3).

## Step 3: Connect Stripe (10 min)

Start in **test mode** (toggle top-right in Stripe) so you can place fake orders first.

1. Stripe → Developers → **API keys** → copy the **Secret key** (`sk_test_...`).
2. Stripe → Developers → **Webhooks** → **Add endpoint**
   - URL: `https://YOUR-SITE.netlify.app/api/stripe-webhook`
   - Event: `checkout.session.completed`
   - Copy the **Signing secret** (`whsec_...`).
3. Stripe → Settings → **Payment methods**: turn on Apple Pay and Google Pay.
4. Stripe → Settings → **Customer emails**: turn on **Successful payments** (receipts) and **Refunds**.
5. Stripe → Settings → **Branding**: add the REWILD logo and colours (#121310, #E8C800) so checkout looks like you.

## Step 4: Connect MailerLite (10 min)

1. Sign up at mailerlite.com (free to 1,000 subscribers).
2. **Export your MailPoet list** from WordPress (MailPoet → Subscribers → Export → CSV) and import it into MailerLite.
3. In MailerLite create a group called **Rewilders**. Open it and copy the number in the URL. That's the Group ID.
4. Optional: create a second group **Customers** for people who buy and opt in.
5. MailerLite → Integrations → **API** → Generate new token.
6. Build a welcome automation in MailerLite triggered by "joins group Rewilders".
7. **Quiz answers:** in MailerLite → Subscribers → Fields, add text fields `source`, `quiz_stack`, `quiz_why`, `quiz_want`, `quiz_day`, `quiz_when`, `quiz_coffee`, `quiz_how`, `quiz_start`. Optional: a **Quiz takers** group, with its ID added to Netlify as `MAILERLITE_QUIZ_GROUP_ID`. Then you can send emails that match each person's stack.

## Step 5: Add your keys to Netlify (5 min)

Netlify → your site → **Site configuration → Environment variables → Add a variable**:

| Key | Value |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` (switch to `sk_live_...` at launch) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `MAILERLITE_API_KEY` | your MailerLite token |
| `MAILERLITE_GROUP_ID` | Rewilders group ID |
| `MAILERLITE_CUSTOMERS_GROUP_ID` | Customers group ID (optional) |
| `HQ_PASSWORD` | a long password only you know (at least 10 characters) |
| `SITE_URL` | `https://rewildmushrooms.com` |

Then **Deploys → Trigger deploy**.

### Test it (test mode)

1. Add products to the cart, check out with card `4242 4242 4242 4242`, any future date, any CVC.
2. Try a promo code: open `/hq/`, log in, click **Add all REWILD codes**, then use one at checkout.
3. Try shipping: under $175 in Canada shows $20, over $175 shows free, US shows "quoted by email".
4. Place a US test order, then in `/hq/` → Recent orders, enter an amount and click **Send quote**. Check the invoice email arrives.
4. Opt in to the email list at checkout and check MailerLite.
5. Submit the contact form, then find it in Netlify → **Forms**. Turn on email notifications there.

## Step 6: Go live and point the domain (15 min + DNS wait)

1. In Stripe switch to **live mode**, repeat Step 3 for live keys and a live webhook (with the real domain), and update the two Stripe variables in Netlify.
2. Open `/hq/` and add your promo codes again (test and live codes are separate in Stripe).
3. Netlify → **Domain management → Add a domain** → `rewildmushrooms.com`.
4. Netlify shows you the DNS records. Change them wherever your domain is registered (likely SiteGround). Netlify sets up HTTPS automatically.
5. Once the new site shows up on rewildmushrooms.com, you can cancel the WordPress hosting. Keep a SiteGround backup first.

---

## Before launch: things only you can confirm

- [ ] **US orders.** Customers pay for products only. You declare the parcel in Zonos, then send the shipping + duties quote from `/hq/` (Recent orders → Send quote). Stripe emails a pay link. Ship once it shows **Paid**. If they decline, refund the order in Stripe.
- [ ] **Stripe invoices.** Turn on Stripe → Settings → Invoices → email customers, and add your logo. Stripe charges a small fee per paid invoice.
- [ ] **COA PDFs.** Add to `public/coa/` and fill in `src/lab.mjs`.
- [ ] **NuCelium.** Confirm the "CordyFuel™ is a trademark of NuCelium" wording and that "Best Fruiting Body / Full Spectrum at the 2025 Cordy Cup" is fine for you to use.
- [ ] **50g Energy and 200g bags.** Your old order form sold these. They're not on the new site. Tell Claude if you want them back.
- [ ] **Nelson hand delivery.** Offered at checkout for Canadian orders, same price as shipping. Turn off in `catalog.mjs` (`localDelivery.enabled: false`).
- [ ] **GST/HST.** Not charged. When you pass $30,000 in sales over four quarters you'll need to register. Stripe Tax can then add it automatically.
- [ ] **Google Search Console.** Add the new site, submit `https://rewildmushrooms.com/sitemap.xml`.

## Day to day

- **Orders:** Stripe emails you on each sale. Full details in Stripe → Payments. Ship, then reply to the customer from your email.
- **Metrics, promo codes and US shipping quotes:** `rewildmushrooms.com/hq/`
- **Refunds:** Stripe → Payments → the order → Refund.
- **Changes to the site:** ask Claude. Edits go to GitHub and Netlify redeploys in about a minute.
