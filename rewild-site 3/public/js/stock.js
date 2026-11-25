// Live stock on the site (from /api/stock, which reads Square): sold-out products get a "Sold out"
// button that can't be clicked, and low ones (10 or fewer) get a "Low stock" tag by the price.
(function () {
  const LABEL = { out: 'Sold out', low: 'Low stock' };
  function paint(status) {
    document.querySelectorAll('[data-add]').forEach((b) => {
      const s = status[b.dataset.add];
      if (!('origText' in b.dataset)) b.dataset.origText = b.textContent;
      if (s === 'out') { b.disabled = true; b.setAttribute('aria-disabled', 'true'); b.classList.add('is-sold-out'); b.textContent = 'Sold out'; }
      else if (b.classList.contains('is-sold-out')) { b.disabled = false; b.removeAttribute('aria-disabled'); b.classList.remove('is-sold-out'); b.textContent = b.dataset.origText; }
    });
    document.querySelectorAll('[data-pid][data-list]').forEach((el) => {
      const s = status[el.dataset.pid];
      let tag = el.nextElementSibling && el.nextElementSibling.matches('[data-stock-tag]') ? el.nextElementSibling : null;
      if (!LABEL[s]) { if (tag) tag.remove(); return; }
      if (!tag) { tag = document.createElement('span'); tag.setAttribute('data-stock-tag', ''); el.after(tag); }
      tag.className = 'stock-tag stock-' + s;
      tag.textContent = LABEL[s];
    });
  }
  let status = {};
  window.RewildStock = { status: (id) => status[id] || 'in' };
  function load() {
    fetch('/api/stock').then((r) => r.json()).then((d) => {
      status = (d && d.status) || {};
      paint(status);
      window.dispatchEvent(new Event('rewild:stock'));
    }).catch(() => {});
  }
  // sale.js rewrites prices when a sale starts; repaint after it.
  window.addEventListener('rewild:sale', () => paint(status));
  window.addEventListener('rewild:sale-left', () => paint(status));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load); else load();
})();
