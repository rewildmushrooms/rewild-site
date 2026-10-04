// REWILD cart: localStorage cart, drawer UI, destination-aware shipping, promo codes, Square checkout handoff.
// Product + shipping data comes from /js/catalog.js (generated at build from catalog.mjs).
(function () {
  const C = window.REWILD_CATALOG;
  const KEY = 'rewild_cart_v1';
  function partnerRef() { try { const r = JSON.parse(localStorage.getItem('rewild_ref')); if (r && r.ref && Date.now() - r.at < 30 * 86400000) return r.ref; } catch (e) {} return undefined; }
  const byId = Object.fromEntries(C.products.map((p) => [p.id, p]));
  const money = (c) => '$' + (c / 100).toFixed(c % 100 === 0 ? 0 : 2);
  // GA4 ecommerce events (CAD). Does nothing if Google Analytics is not on the page.
  const gaItem = (id, qty) => ({ item_id: id, item_name: byId[id] ? byId[id].name : id, price: byId[id] ? byId[id].price / 100 : 0, quantity: qty || 1 });
  function ga(name, items, extra) {
    if (!window.gtag) return;
    const value = items.reduce((a, i) => a + i.price * i.quantity, 0);
    window.gtag('event', name, Object.assign({ currency: 'CAD', value: Math.round(value * 100) / 100, items }, extra || {}));
  }

  const store = {
    read() {
      try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.items)) return s; } catch (e) {}
      return { items: [], country: 'CA' };
    },
    write(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} },
  };
  let state = store.read();
  state.items = state.items.filter((i) => byId[i.id]);

  function quote() {
    const ship = C.shipping[state.country] || C.shipping.CA;
    let subtotal = 0;
    for (const i of state.items) subtotal += byId[i.id].price * i.qty;
    const free = ship.freeOver != null && subtotal >= ship.freeOver;
    const shipping = state.items.length === 0 ? 0 : free ? 0 : ship.flatRate;
    const p = state.promo && !state.promo.pending ? state.promo : null;
    const discount = !p || (p.minimumAmount && subtotal < p.minimumAmount) ? 0
      : p.percentOff ? Math.round(subtotal * p.percentOff / 100) : Math.min(subtotal, p.amountOff || 0);
    return { subtotal, shipping, free, discount, total: subtotal - discount + shipping, ship };
  }

  function save() { store.write(state); render(); }
  function count() { return state.items.reduce((a, i) => a + i.qty, 0); }

  function add(id, qty) {
    qty = Math.max(1, Math.min(20, parseInt(qty, 10) || 1));
    const ex = state.items.find((i) => i.id === id);
    if (ex) ex.qty = Math.min(20, ex.qty + qty); else state.items.push({ id, qty });
    save();
  }
  function setQty(id, qty) {
    qty = parseInt(qty, 10) || 0;
    const before = (state.items.find((i) => i.id === id) || {}).qty || 0;
    if (qty < before) ga('remove_from_cart', [gaItem(id, before - Math.max(0, qty))]);
    if (qty <= 0) state.items = state.items.filter((i) => i.id !== id);
    else { const ex = state.items.find((i) => i.id === id); if (ex) ex.qty = Math.min(20, qty); }
    save();
  }

  const $ = (s, r = document) => r.querySelector(s);
  const drawer = () => document.documentElement;

  function open() {
    drawer().classList.add('drawer-open');
    if (state.items.length) ga('view_cart', state.items.map((i) => gaItem(i.id, i.qty)));
    $('#cart-drawer').setAttribute('aria-hidden', 'false');
    setTimeout(() => $('#cart-close') && $('#cart-close').focus(), 50);
  }
  function close() {
    drawer().classList.remove('drawer-open');
    $('#cart-drawer').classList.remove('step-email');
    $('#cart-drawer').setAttribute('aria-hidden', 'true');
  }

  function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  function render() {
    document.querySelectorAll('.cart-count').forEach((el) => { el.textContent = count(); el.dataset.count = count(); });
    const body = $('#cart-lines'); if (!body) return;
    const q = quote();
    if (state.items.length === 0) {
      body.innerHTML = '<div class="empty"><p>Your cart is empty.</p><p style="margin-top:16px"><a class="btn btn-outline" href="/shop/">Shop mushrooms</a></p></div>';
    } else {
      body.innerHTML = state.items.map((i) => {
        const p = byId[i.id];
        return `<div class="line"><img src="${p.image}" alt="" width="72" height="72">
          <div><div class="name">${esc(p.name)}</div><div class="sub">${esc(p.format)}</div>
          <div class="row" style="gap:12px;margin-top:6px"><div class="qty" role="group" aria-label="Quantity for ${esc(p.name)}">
          <button type="button" data-dec="${p.id}" aria-label="Decrease">&minus;</button><input type="number" min="0" max="20" value="${i.qty}" data-qty="${p.id}" aria-label="Quantity"><button type="button" data-inc="${p.id}" aria-label="Increase">+</button></div>
          <button type="button" class="remove" data-remove="${p.id}">Remove</button></div></div>
          <div class="price">${money(p.price * i.qty)}</div></div>`;
      }).join('');
    }
    document.querySelectorAll('input[name=dest]').forEach((r) => { r.checked = r.value === state.country; });
    const prog = $('#cart-progress');
    if (prog) {
      if (q.ship.freeOver && state.items.length) {
        const pct = Math.min(100, Math.round((q.subtotal / q.ship.freeOver) * 100));
        prog.hidden = false;
        prog.querySelector('p').textContent = q.free ? 'You have free shipping.' : `${money(q.ship.freeOver - q.subtotal)} away from free shipping in Canada.`;
        prog.querySelector('.progress span').style.width = pct + '%';
      } else prog.hidden = true;
    }
    const shipTxt = !state.items.length ? 'n/a' : q.ship.quoted ? 'Quoted by email' : (q.free ? 'Free' : money(q.shipping));
    const p = state.promo;
    $('#cart-totals').innerHTML = `<span>Subtotal</span><span>${money(q.subtotal)}</span>` +
      (p && !p.pending && q.discount ? `<span class="disc">${esc(p.code)}</span><span class="disc">&minus;${money(q.discount)}</span>` : '') +
      `<span>Shipping</span><span>${shipTxt}</span>` +
      `<span class="grand">Total</span><span class="grand">${money(q.total)}${q.ship.quoted && state.items.length ? ' + shipping' : ''}</span>`;
    const pm = $('#promo-msg');
    if (pm) {
      pm.className = 'small';
      if (!p) pm.innerHTML = '';
      else if (p.pending) pm.innerHTML = `${esc(p.code)} will be checked at checkout. <button type="button" class="link-btn" data-promo-remove>Remove</button>`;
      else if (p.minimumAmount && q.subtotal < p.minimumAmount) { pm.className = 'small err'; pm.innerHTML = `${esc(p.code)} needs an order of ${money(p.minimumAmount)} or more. <button type="button" class="link-btn" data-promo-remove>Remove</button>`; }
      else pm.innerHTML = `${esc(p.code)} applied: ${p.percentOff ? p.percentOff + '% off' : money(p.amountOff) + ' off'}. <button type="button" class="link-btn" data-promo-remove>Remove</button>`;
    }
    const news = $('#cart-news'); if (news) news.checked = !!state.newsletter;
    const ct = $('#co-total'); if (ct) ct.textContent = `${count()} item${count() === 1 ? '' : 's'} · ${money(q.total)} CAD${q.discount ? ' after your code' : ''}`;
    if (!state.items.length) $('#cart-drawer').classList.remove('step-email');
    $('#cart-ship-note').textContent = state.country === 'US' ? 'US shipping and duties vary by parcel. After you order, we email a quote you can pay online before we ship.' : '';
    $('#checkout-btn').disabled = state.items.length === 0;
  }

  // Step 1: email (+ optional marketing consent), then Square.
  function emailStep() {
    if (!state.items.length) return;
    const d = $('#cart-drawer'); d.classList.add('step-email');
    const e = $('#co-email'); if (e && !e.value) { try { e.value = localStorage.getItem('rewild_email') || ''; } catch (x) {} }
    setTimeout(() => e && e.focus(), 60);
  }
  async function checkout(btn) {
    const err = $('#cart-error'); err.textContent = '';
    const email = ($('#co-email').value || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { err.textContent = 'Please enter a valid email so we can send your confirmation.'; $('#co-email').focus(); return; }
    try { localStorage.setItem('rewild_email', email); } catch (x) {}
    btn.disabled = true; const label = btn.textContent; btn.textContent = 'Opening secure checkout…';
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, items: state.items, country: state.country, code: state.promo && !state.promo.pending ? state.promo.code : undefined, ref: partnerRef(), newsletter: !!state.newsletter }) });
      let data = {};
      try { data = await res.json(); } catch (x) {}
      if (!res.ok || !data.url) throw new Error(data.error || 'Checkout is unavailable right now. Please try again in a minute.');
      try { localStorage.setItem('rewild_last_order', data.orderId || ''); } catch (x) {}
      ga('begin_checkout', state.items.map((i) => gaItem(i.id, i.qty)), state.promo && !state.promo.pending ? { coupon: state.promo.code } : {});
      if (window.gtag) window.gtag('event', 'checkout_email_capture', { consent: !!state.newsletter });
      window.location.href = data.url;
    } catch (e) {
      err.textContent = e.message; btn.disabled = false; btn.textContent = label;
    }
  }

  async function applyCode(code, quiet) {
    code = String(code || '').trim().toUpperCase();
    if (!code) return;
    const pm = $('#promo-msg');
    if (!state.items.length) { state.promo = { code, pending: true }; save(); return; }
    if (pm && !quiet) { pm.className = 'small'; pm.textContent = 'Checking…'; }
    try {
      const res = await fetch('/api/promo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, items: state.items, country: state.country }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not check that code.');
      state.promo = { code: data.code, percentOff: data.percentOff, amountOff: data.amountOff, minimumAmount: data.minimumAmount };
      const inp = $('#promo-code'); if (inp) inp.value = '';
      save();
    } catch (e) {
      if (state.promo && state.promo.code === code) state.promo = null;
      save();
      if (pm) { pm.className = 'small err'; pm.textContent = e.message; }
    }
  }

  function toast(msg) {
    let t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2400);
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('button, a'); if (!t) return;
    if (t.matches('[data-open-cart]')) { e.preventDefault(); open(); }
    else if (t.matches('#cart-close') || t.matches('.drawer-backdrop')) close();
    else if (t.dataset.add) {
      const qtyEl = t.dataset.qtyFrom ? document.querySelector(t.dataset.qtyFrom) : null;
      const q = Math.max(1, Math.min(20, parseInt(qtyEl ? qtyEl.value : 1, 10) || 1));
      add(t.dataset.add, q);
      ga('add_to_cart', [gaItem(t.dataset.add, q)]);
      open();
    }
    else if (t.dataset.addMany) {
      const ids = t.dataset.addMany.split(',').filter((id) => byId[id]);
      ids.forEach((id) => add(id, 1)); ga('add_to_cart', ids.map((id) => gaItem(id, 1))); open();
    }
    else if (t.dataset.inc) setQty(t.dataset.inc, (state.items.find((i) => i.id === t.dataset.inc)?.qty || 0) + 1);
    else if (t.dataset.dec) setQty(t.dataset.dec, (state.items.find((i) => i.id === t.dataset.dec)?.qty || 0) - 1);
    else if (t.dataset.remove) setQty(t.dataset.remove, 0);
    else if (t.id === 'checkout-btn') emailStep();
    else if (t.id === 'co-back') $('#cart-drawer').classList.remove('step-email');
    else if (t.matches('[data-promo-remove]')) { state.promo = null; save(); }
  });
  document.addEventListener('click', (e) => { if (e.target.classList && e.target.classList.contains('drawer-backdrop')) close(); });
  document.addEventListener('change', (e) => {
    if (e.target.dataset && e.target.dataset.qty) setQty(e.target.dataset.qty, e.target.value);
    if (e.target.name === 'dest') { state.country = e.target.value === 'US' ? 'US' : 'CA'; save(); }
    if (e.target.id === 'cart-news') { state.newsletter = e.target.checked; save(); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer().classList.contains('drawer-open')) close(); });

  // Product page quantity steppers
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-qty-step]'); if (!b) return;
    const input = document.querySelector(b.dataset.target); if (!input) return;
    input.value = Math.max(1, Math.min(20, (parseInt(input.value, 10) || 1) + Number(b.dataset.qtyStep)));
  });

  // Learn dropdown
  document.querySelectorAll('.nav-toggle').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation(); const g = b.closest('.nav-group'); const o = g.classList.toggle('open'); b.setAttribute('aria-expanded', o);
  }));
  document.addEventListener('click', (e) => { if (!e.target.closest('.nav-group')) document.querySelectorAll('.nav-group.open').forEach((g) => { g.classList.remove('open'); g.querySelector('.nav-toggle').setAttribute('aria-expanded', 'false'); }); });

  // Mobile menu
  const mb = $('#menu-btn');
  if (mb) mb.addEventListener('click', () => { const n = $('#site-nav'); const o = n.classList.toggle('open'); mb.setAttribute('aria-expanded', o); });

  // Newsletter forms
  document.querySelectorAll('form[data-subscribe]').forEach((f) => f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = f.querySelector('[data-msg]'); const btn = f.querySelector('button');
    btn.disabled = true;
    try {
      const res = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(f))) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      f.reset(); msg.textContent = 'Welcome, Rewilder. Check your inbox.';
      if (window.gtag) window.gtag('event', 'sign_up', { method: 'footer' });
    } catch (err) { msg.textContent = err.message || 'Something went wrong. Please try again.'; }
    btn.disabled = false;
  }));

  // Gallery thumbnails
  document.querySelectorAll('[data-thumb]').forEach((b) => b.addEventListener('click', () => {
    const main = document.querySelector('#gallery-main');
    main.src = b.dataset.thumb; main.alt = b.dataset.alt || main.alt;
    main.classList.toggle('contain', b.dataset.thumb.includes('/label-'));
    document.querySelectorAll('[data-thumb]').forEach((x) => x.setAttribute('aria-pressed', x === b));
  }));

  const es = $('#email-step');
  if (es) es.addEventListener('submit', (e) => { e.preventDefault(); checkout($('#co-continue')); });
  const pf = $('#promo-form');
  if (pf) pf.addEventListener('submit', (e) => { e.preventDefault(); applyCode($('#promo-code').value); });
  // Partner share links like /?ref=sean credit that partner for 30 days (no discount).
  const urlRef = new URLSearchParams(location.search).get('ref');
  if (urlRef && /^[a-z0-9_-]{2,30}$/i.test(urlRef)) { try { localStorage.setItem('rewild_ref', JSON.stringify({ ref: urlRef.toLowerCase(), at: Date.now() })); } catch (e) {} }
  // Shareable links like /shop/?code=SEAN20 apply the code automatically.
  const urlCode = new URLSearchParams(location.search).get('code');
  if (urlCode) setTimeout(() => { applyCode(urlCode, true); toast(urlCode.toUpperCase() + ' will be applied in your cart.'); }, 200);
  // Email links like /shop/?cart=energy,tincture put that stack in the cart (if not there already) and open it.
  const urlCart = new URLSearchParams(location.search).get('cart');
  if (urlCart) setTimeout(() => { urlCart.split(',').map((x) => x.trim().split(':')).forEach(([id, q]) => { if (byId[id] && !state.items.some((i) => i.id === id)) add(id, q || 1); }); open(); }, 150);
  // A code saved before items were added gets checked once there is something in the cart.
  const recheck = () => { if (state.promo && state.promo.pending && state.items.length) applyCode(state.promo.code, true); };
  document.addEventListener('click', (e) => { if (e.target.closest('[data-add],[data-add-many],[data-open-cart]')) setTimeout(recheck, 50); });

  if (new URLSearchParams(location.search).get('checkout') === 'cancelled') setTimeout(() => toast('Checkout cancelled. Your cart is saved.'), 300);

  // Product page: view_item
  const pageAdd = document.querySelector('[data-add][data-qty-from]');
  if (pageAdd && byId[pageAdd.dataset.add]) ga('view_item', [gaItem(pageAdd.dataset.add, 1)]);

  // Welcome popup: once per visitor (14 days after "No thanks", never after signing up).
  (function () {
    const pop = $('#join-pop'); if (!pop) return;
    const KEYP = 'rewild_pop';
    let st = {}; try { st = JSON.parse(localStorage.getItem(KEYP)) || {}; } catch (e) {}
    const path = location.pathname;
    const skip = st.joined || (st.closed && Date.now() - st.closed < 14 * 86400000) || /^\/(hq|order-confirmed|build-your-stack|contact|privacy|terms)\b/.test(path) || /[?&](cart|code|checkout)=/.test(location.search) || navigator.webdriver;
    if (skip) return;
    let shown = false, last = null;
    const save = (k) => { st[k] = Date.now(); try { localStorage.setItem(KEYP, JSON.stringify(st)); } catch (e) {} };
    function show() {
      if (shown || document.documentElement.classList.contains('drawer-open')) return;
      shown = true; last = document.activeElement; pop.hidden = false;
      setTimeout(() => $('#pop-email').focus(), 80);
      if (window.gtag) window.gtag('event', 'popup_view');
    }
    function hide(record) { pop.hidden = true; if (record) save('closed'); if (last && last.focus) last.focus(); }
    pop.addEventListener('click', (e) => { if (e.target.closest('[data-pop-close]')) hide(true); });
    document.addEventListener('keydown', (e) => { if (!pop.hidden && e.key === 'Escape') hide(true); });
    const timer = setTimeout(show, 12000);
    const onScroll = () => { if (window.scrollY > (document.body.scrollHeight - innerHeight) * 0.5) { window.removeEventListener('scroll', onScroll); clearTimeout(timer); show(); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    $('#pop-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target, msg = f.querySelector('.pop-msg'), btn = f.querySelector('button[type=submit]');
      const email = f.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { msg.textContent = 'Please enter a valid email.'; return; }
      btn.disabled = true; msg.textContent = '';
      try {
        const res = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, website: f.website.value, source: 'popup' }) });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(d.error || 'Something went wrong. Please try again.');
        save('joined'); try { localStorage.setItem('rewild_email', email); } catch (x) {}
        f.querySelector('h2').textContent = "You're in. Welcome, Rewilder.";
        f.querySelector('p:not(.eyebrow)').textContent = 'Check your inbox. Your 20% off code is on its way.';
        f.email.hidden = true; btn.hidden = true; f.querySelector('.pop-fine').hidden = true;
        if (window.gtag) window.gtag('event', 'sign_up', { method: 'popup' });
        setTimeout(() => hide(false), 3500);
      } catch (err) { msg.textContent = err.message; btn.disabled = false; }
    });
  })();

  window.RewildCart = { add, setQty, open, close, clear() { state.items = []; save(); }, state: () => state };
  render();
})();
