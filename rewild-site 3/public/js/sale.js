// Flash sale on the site: banner with countdown, sale prices on product cards and pages, "only N left",
// and the early-access link (?early=KEY, checked by the server). Rules and dates: pricing.mjs (SALES).
(function () {
  const P = window.REWILD_PRICING;
  if (!P || !P.saleNow) return;
  const KEY = 'rewild_early';
  const getEarly = () => { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } };
  const money = (c) => '$' + (c / 100).toFixed(c % 100 === 0 ? 0 : 2);
  const qs = new URLSearchParams(location.search);
  let left = null;

  // Early-access link: keep the key only if the server says it's right.
  const urlEarly = qs.get('early');
  if (urlEarly) {
    fetch('/api/sale?early=' + encodeURIComponent(urlEarly), { cache: 'no-store' }).then((r) => r.json()).then((d) => {
      if (d.sale && d.sale.earlyOk) { try { localStorage.setItem(KEY, urlEarly.trim().toLowerCase()); } catch (e) {} window.dispatchEvent(new Event('rewild:early')); }
    }).catch(() => {});
  }

  const fmtLeft = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return (d ? d + 'd ' : '') + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
  };
  const when = (iso) => { const d = new Date(iso), o = { timeZone: 'America/Vancouver' };
    const h = Number(d.toLocaleString('en-US', { ...o, hour: 'numeric', hour12: false })) % 24, m = d.toLocaleString('en-US', { ...o, minute: '2-digit' });
    return d.toLocaleString('en-CA', { ...o, weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + (h % 12 || 12) + (Number(m) ? ':' + String(m).padStart(2, '0') : '') + (h < 12 ? 'am' : 'pm') + ' PT'; };

  const tierTxt = (s) => (s.tier ? `${s.tier.percent}% off $${s.tier.at / 100}+ · ` : '');
  function bar(s) {
    const a = document.querySelector('.announce');
    if (!a) return;
    if (!a.dataset.orig) a.dataset.orig = a.innerHTML;
    if (!s) { a.innerHTML = a.dataset.orig; a.classList.remove('sale-on'); return; }
    const now = Date.now();
    let txt;
    if (s.phase === 'live') txt = `<b>Launch party: ${s.percent}% off everything</b><span class="ann-sep"> · </span><span class="ann-l2">${tierTxt(s)}<span class="ann-opt">Oct 17 &amp; 18 · </span>ends in <span class="cd">${fmtLeft(Date.parse(s.end) - now)}</span><span class="ann-opt"> · only ${s.stockEach} of each</span></span>`;
    else if (s.phase === 'early') txt = `<b>Early access is open</b><span class="ann-opt"> for the list</span><span class="ann-sep"> · </span><span class="ann-l2">${s.percent}% off for everyone in <span class="cd">${fmtLeft(Date.parse(s.start) - now)}</span></span>`;
    else if (Date.parse(s.start) - now < 7 * 86400000) txt = `<b>Launch party: ${s.percent}% off everything</b><span class="ann-sep"> · </span><span class="ann-l2">${tierTxt(s)}Oct 17 &amp; 18<span class="ann-opt"> · starts in <span class="cd">${fmtLeft(Date.parse(s.start) - now)}</span></span></span>`;
    else { a.innerHTML = a.dataset.orig; a.classList.remove('sale-on'); return; }
    a.innerHTML = `<a href="/launch-party/" style="color:inherit;text-decoration:none">${txt}</a>`;
    a.classList.add('sale-on');
    stick(a);
  }

  // Keep the sale banner pinned above the sticky header while it's showing.
  let stuck = false;
  function stick(a) {
    const set = () => document.documentElement.style.setProperty('--ann-h', (a.classList.contains('sale-on') ? a.offsetHeight : 0) + 'px');
    set();
    document.documentElement.classList.add('ann-sticky');
    if (!stuck) { stuck = true; addEventListener('resize', set, { passive: true }); }
  }

  function prices(s) {
    document.querySelectorAll('[data-pid][data-list]').forEach((el) => {
      if (!el.dataset.orig) el.dataset.orig = el.innerHTML;
      const id = el.dataset.pid, list = Number(el.dataset.list);
      const on = s && s.phase === 'live' && s.ids.includes(id);
      if (!on) { el.innerHTML = el.dataset.orig; return; }
      const out = left && left[id] === 0;
      el.innerHTML = out ? `<s>${money(list)}</s> <b>Sold out</b>` : `<s>${money(list)}</s> <b class="sale-price">${money(Math.round(list * (100 - s.percent) / 100))}</b>`;
    });
    document.querySelectorAll('[data-sale-left]').forEach((el) => {
      const id = el.dataset.saleLeft;
      if (!(s && s.phase === 'live' && left && id in left)) { el.hidden = true; return; }
      el.hidden = false;
      el.textContent = left[id] === 0 ? 'Sold out at the launch party price' : `Only ${left[id]} left at ${s.percent}% off · limit ${s.maxEach} per order`;
    });
  }

  let lastPhase = null;
  function tick() {
    const s = P.saleNow(Date.now(), !!getEarly());
    bar(s);
    const phase = s ? s.id + s.phase : 'none';
    if (phase !== lastPhase) { lastPhase = phase; prices(s); window.dispatchEvent(new Event('rewild:sale')); }
    document.documentElement.classList.toggle('sale-live', !!(s && s.phase === 'live'));
  }
  function loadLeft() {
    fetch('/api/sale', { cache: 'no-store' }).then((r) => r.json()).then((d) => { left = d.sale && d.sale.left; prices(P.saleNow(Date.now(), !!getEarly())); window.dispatchEvent(new Event('rewild:sale-left')); }).catch(() => {});
  }
  window.RewildSale = { early: getEarly, left: () => left };
  window.addEventListener('rewild:early', () => { lastPhase = null; });
  tick();
  setInterval(tick, 1000);
  if (P.saleNow(Date.now())) { loadLeft(); setInterval(loadLeft, 60000); }
})();
