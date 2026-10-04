# How the REWILD site works

Static pages built by `build.mjs` from `src/`, plus small Netlify Functions in `netlify/functions/`. No frameworks, no npm packages.

## Payments: Square (not Stripe)
- The cart lives in the visitor's browser. `/api/checkout` re-prices everything on the server from `catalog.mjs`, checks promo codes, and creates a **Square payment link**. Card details only ever touch Square.
- Orders carry `metadata.source = rewildmushrooms.com`, plus `promo`, `ref` (partner link), `destination` and `newsletter`.
- When an order is paid, Square calls **`/api/square-webhook`**. We check the signature, then read the order back from Square (the message itself is never trusted). Each event id is handled once.
- `_shared/record.mjs` then: lowers stock, sends a low-stock email if needed, adds the buyer to MailerLite **only if they ticked the box**, and saves the order and customer record. It is safe to run many times. The order-confirmed page runs the same step in case it arrives first, and HQ catches anything missed.
- Refunds are recorded on the order and customer. Stock is not put back automatically.
- US shipping is invoiced after the order with a Square invoice from HQ.

## Data (Netlify Blobs)
| Store | Key | Contents |
|---|---|---|
| `orders` | Square order id | items, totals, discount code, partner, newsletter yes/no, refunds, steps done. No addresses. |
| `customers` | email (lowercase) | name, orders, lifetime value, average order, products, codes used, marketing consent (yes, when, source) |
| `square-events` | Square event id | processed marker |
| `promo-rules` | `all` | on/off, expiry, minimum per Square discount id |
| `alerts` | `low-stock` | which products already had an alert |
| `hq-auth` | `pw-<user>`, `reset-<user>` | hashed passwords and one-time reset tokens |

To export or delete a customer: their record is under `customers/<email>`; MailerLite and Square hold their own copies.

## Stock
Counts live in **Square Inventory** (one item per product, SKU `REWILD-<ID>`), so sales in the Square app also count. Web orders are deducted with adjustments tagged `web:<order id>` and a fixed idempotency key, so never twice. The Duo uses 1 Energy powder + 1 tincture. HQ shows stock and lets anyone on the team set a count. Low-stock email at 10 or fewer, once, reset after restock.

## Email
- MailerLite: footer signup, quiz signup (with quiz answers), and buyers who ticked the box. Automations live in MailerLite.
- SMTP (SiteGround `noreply@`): HQ password resets and low-stock alerts.

## Promo codes
Square catalog discounts (name = code). Web rules (on/off, expiry, minimum) live in Blobs. Festival codes SEAN30WW and PETEMOSS30WW end Oct 15, 2026 at 11:59 pm Pacific.

## Analytics
GA4 on every page with ecommerce events: `view_item`, `add_to_cart`, `remove_from_cart`, `view_cart`, `begin_checkout`, `purchase` (once per order, on the confirmation page), `sign_up` (footer / quiz), `quiz_complete`. HQ shows a traffic summary through the GA Data API; deeper analysis stays in GA4.

## HQ (`/awesomesauce` → `/hq/`)
Per-person logins (passwords in env vars, resets hashed in Blobs). Jade sees everything; Sean and Pete see Inventory and their own Commissions. All data comes through `/api/hq`, which checks the login on every call.
