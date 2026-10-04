// Low-stock email: when a product reaches LOW_STOCK_THRESHOLD (default 10) or fewer, email
// LOW_STOCK_EMAIL once. The "already sent" flag clears when stock goes back above the line,
// so the next drop sends a fresh alert. Flags live in Netlify Blobs (store "alerts", key "low-stock").
import { PRODUCTS } from './catalog.mjs';
import { getJSON, setJSON } from './store.mjs';
import { sendMail, mailConfigured } from './mailer.mjs';
import { SITE_EMAIL } from './config.mjs';

export const lowStockThreshold = () => {
  const n = Number(process.env.LOW_STOCK_THRESHOLD);
  return Number.isFinite(n) && n >= 0 ? n : 10;
};
const label = (id) => {
  const p = PRODUCTS.find((x) => x.id === id);
  return p ? `${p.name} (${p.commonName || p.mushroom || p.format})` : id;
};

// levels: { productId: count | null }. Returns the list of product ids emailed this time.
export async function checkLowStock(levels, deps = {}) {
  const send = deps.sendMail || sendMail;
  const line = lowStockThreshold();
  const flags = (await getJSON('alerts', 'low-stock')) || {};
  const sent = [];
  let changed = false;
  for (const [id, n] of Object.entries(levels || {})) {
    if (n == null) continue;
    if (n > line && flags[id]) { delete flags[id]; changed = true; continue; }
    if (n <= line && !flags[id]) {
      if (!deps.sendMail && !mailConfigured()) continue;
      const name = label(id);
      await send({
        to: process.env.LOW_STOCK_EMAIL || SITE_EMAIL,
        subject: `Low Stock: ${name}`,
        text: `Low Stock: ${name}\n\nCurrent inventory: ${n}\n\nYou'll get this email once. It resets after you restock above ${line}.\nCheck or update stock in REWILD HQ: ${(process.env.SITE_URL || 'https://rewildmushrooms.com').replace(/\/$/, '')}/awesomesauce`,
      });
      flags[id] = { at: new Date().toISOString(), count: n };
      sent.push(id);
      changed = true;
    }
  }
  if (changed) await setJSON('alerts', 'low-stock', flags);
  return sent;
}
