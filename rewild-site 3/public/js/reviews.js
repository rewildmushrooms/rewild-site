// Verified-buyer reviews on product pages (approved in HQ > Reviews). Hidden when there are none.
(function () {
  const band = document.getElementById('reviews');
  if (!band) return;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  fetch('/api/reviews?product=' + encodeURIComponent(band.dataset.product)).then((r) => (r.ok ? r.json() : null)).then((d) => {
    const list = (d && d.reviews) || [];
    if (!list.length) return;
    const avg = list.reduce((a, r) => a + r.rating, 0) / list.length;
    band.querySelector('[data-vr-sum]').textContent = `${avg.toFixed(1)} out of 5 from ${list.length} verified buyer${list.length === 1 ? '' : 's'}`;
    band.querySelector('[data-vr-list]').innerHTML = list.map((r) => `<figure class="vreview"><div class="review-stars" aria-label="${r.rating} out of 5 stars">${'★'.repeat(r.rating)}<span style="opacity:.25">${'★'.repeat(5 - r.rating)}</span></div>${r.title ? `<h3>${esc(r.title)}</h3>` : ''}<blockquote>${esc(r.text).replace(/\n/g, '<br>')}</blockquote><figcaption><b>${esc(r.name)}</b>${r.location ? `<span>${esc(r.location)}</span>` : ''}<span class="vr-badge">Verified buyer</span></figcaption></figure>`).join('');
    band.hidden = false;
  }).catch(() => {});
})();
