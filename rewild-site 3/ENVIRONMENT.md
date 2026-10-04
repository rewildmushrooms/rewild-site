# Environment variables

Set in Netlify: Project configuration > Environment variables. **Never put the values in code, GitHub or chat.**
Secrets are entered by Jade. After changing any value, run a deploy (or push a `[deploy]` commit) so functions pick it up.

| Name | Secret? | What it does | Example / notes |
|---|---|---|---|
| `SITE_URL` | no | The site's public address. Used in emails, Square return links and the webhook check. | `https://rewild-mushrooms.netlify.app` now, `https://rewildmushrooms.com` at launch |
| `SQUARE_ACCESS_TOKEN` | **yes** | Square API token. | Sandbox token now, Production token at launch |
| `SQUARE_ENV` | no | `sandbox` or `production` | `sandbox` until launch |
| `SQUARE_LOCATION_ID` | no | Only if Square has more than one location | optional |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | **yes** | Proves order notifications really come from Square. From Square Developer Dashboard > Webhooks > your subscription. | Different key for sandbox and production |
| `SQUARE_WEBHOOK_URL` | no | Only if the webhook address in Square differs from `SITE_URL/api/square-webhook` | optional |
| `MAILERLITE_API_KEY` | **yes** | MailerLite API token | |
| `MAILERLITE_GROUP_ID` | no | Main "Rewilders" group | |
| `MAILERLITE_QUIZ_GROUP_ID` | no | Quiz group (starts "send my stack") | |
| `MAILERLITE_CUSTOMERS_GROUP_ID` | no | Buyers who ticked the email box | |
| `HQ_PASSWORD` | **yes** | Jade's first HQ password (on/off switch for her access) | |
| `HQ_PASSWORD_SEAN`, `HQ_PASSWORD_PETE` | **yes** | Partner HQ passwords. Delete to remove access. | |
| `SMTP_HOST` | no | Mail server | `mail.rewildmushrooms.com` |
| `SMTP_PORT` | no | | `465` (default) |
| `SMTP_USER` | no | Sending mailbox | `noreply@rewildmushrooms.com` |
| `SMTP_PASSWORD` | **yes** | That mailbox's password | |
| `LOW_STOCK_EMAIL` | no | Where low-stock alerts go | default `rewildmushrooms@protonmail.com` |
| `LOW_STOCK_THRESHOLD` | no | Alert when stock is at or below this | default `10` |
| `GA_MEASUREMENT_ID` | no | GA4 tag, added to pages at build | `G-4JY0P7ELLM` |
| `GA_PROPERTY_ID` | no | GA4 property number for HQ traffic | `557221740` |
| `GA_SERVICE_ACCOUNT` | **yes** | Google service account key (JSON) with Viewer access to GA | |

Not used (safe to delete if present): any `STRIPE_...` variable.

Netlify sets `URL` and the Blobs storage context by itself.
