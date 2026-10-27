// Telegram order alerts (free). Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (one id, or several separated by commas).
// To post into a forum topic, add the topic id after a slash: -1001234567890/177
// If either is missing, nothing is sent and nothing breaks. Bot: @Rewildmushroomsbot (set up Oct 2026, team channel).
const money = (c) => '$' + (Number(c || 0) / 100).toFixed(2);
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export const telegramReady = () => !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);

export async function sendTelegram(text, { fetchImpl = fetch } = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chats = String(process.env.TELEGRAM_CHAT_ID || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!token || !chats.length) return { skipped: true, reason: 'Telegram is not set up yet (TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID).' };
  let sent = 0;
  const errs = [];
  for (const entry of chats) {
    const [chat_id, topic] = entry.split('/').map((s) => s.trim());
    const res = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, ...(topic ? { message_thread_id: Number(topic) } : {}), text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) errs.push(`chat ending ${chat_id.slice(-4)}: ${data.description || res.status}`);
    else sent++;
  }
  if (errs.length) throw new Error(`Telegram (${sent} of ${chats.length} sent): ` + errs.join('; '));
  return { sent };
}

// "🍄 New order · $130.00" with items, place, code and a link to HQ.
export function orderAlertText(rec, order, siteUrl = '') {
  const items = (rec.items || []).filter((i) => i.qty > 0).map((i) => `${i.qty}× ${esc(i.name)}`).join('\n');
  const addr = order?.fulfillments?.[0]?.shipment_details?.recipient?.address || {};
  const place = [addr.locality, addr.administrative_district_level_1, addr.country || rec.country].filter(Boolean).join(', ');
  const lines = [
    `🍄 <b>New order · ${money(rec.total)}</b>`,
    items,
    rec.name ? `👤 ${esc(rec.name)}` : '',
    place ? `📍 ${esc(place)}` : '',
    order?.metadata?.fulfillment === 'local' || rec.local ? '🚗 <b>Local pickup / delivery</b>: email them to set it up' : '',
    rec.code ? `🏷 Code: ${esc(rec.code)}` : '',
    rec.discount ? `Discount: −${money(rec.discount)}` : '',
    siteUrl ? `<a href="${siteUrl}/hq/">Open HQ</a>` : '',
  ];
  return lines.filter(Boolean).join('\n');
}
