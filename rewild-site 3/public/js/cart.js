// REWILD cart: localStorage cart, drawer UI, destination-aware shipping, Stripe Checkout handoff.
// Product + shipping data comes from /js/catalog.js (generated at build from catalog.mjs).
(function () {
  const C = window.REWILD_CATALOG;
  const KEY = 'rewild_cart_v1';
  const byId = Object.fromEntries(C.products.map((p) => [p.id, p]));
  const money = (c) => '$' + (c / 100).toFixed(c % 100 === 0 ? 0 : 2);

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
    return { subtotal, shipping, free, total: subtotal + shipping, ship };
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
    if (qty <= 0) state.items = state.items.filter((i) => i.id !== id);
    else { const ex = state.items.find((i) => i.id === id); if (ex) ex.qty = Math.min(20, qty); }
    save();
  }

  const $ = (s, r = document) => r.querySelector(s);
  const drawer = () => document.documentElement;

  function open() {
    drawer().classList.add('drawer-open');
    $('#cart-drawer').setAttribute('aria-hidden', 'false');
    setTimeout(() => $('#cart-close') && $('#cart-close').focus(), 50);
  }
  function close() {
    drawer().classList.remove('drawer-open');
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
    $('#cart-subtotal').textContent = money(q.subtotal);
    $('#cart-shipping').textContent = !state.items.length ? 'n/a' : q.ship.quoted ? 'Quoted by email' : (q.free ? 'Free' : money(q.shipping));
    $('#cart-total').textContent = money(q.total) + (q.ship.quoted && state.items.length ? ' + shipping' : '');
    $('#cart-ship-note').textContent = state.country === 'US' ? 'US shipping and duties vary by parcel. After you order, we email a quote you can pay online before we ship.' : 'Promo codes are added at checkout.';
    $('#checkout-btn').disabled = state.items.length === 0;
  }

  async function checkout(btn) {
    const err = $('#cart-error'); err.textContent = '';
    btn.disabled = true; const label = btn.textContent; btn.textContent = 'Opening secure checkout…';
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: state.items, country: state.country }) });
      let data = {};
      try { data = await res.json(); } catch (x) {}
      if (!res.ok || !data.url) throw new Error(data.error || 'Checkout is unavailable right now. Please try again in a minute.');
      window.location.href = data.url;
    } catch (e) {
      err.textContent = e.message; btn.disabled = false; btn.textContent = label;
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
      add(t.dataset.add, qtyEl ? qtyEl.value : 1);
      open();
      if (window.gtag) window.gtag('event', 'add_to_cart', { items: [{ item_id: t.dataset.add }] });
    }
    else if (t.dataset.addMany) {
      t.dataset.addMany.split(',').forEach((id) => byId[id] && add(id, 1)); open();
    }
    else if (t.dataset.inc) setQty(t.dataset.inc, (state.items.find((i) => i.id === t.dataset.inc)?.qty || 0) + 1);
    else if (t.dataset.dec) setQty(t.dataset.dec, (state.items.find((i) => i.id === t.dataset.dec)?.qty || 0) - 1);
    else if (t.dataset.remove) setQty(t.dataset.remove, 0);
    else if (t.id === 'checkout-btn') checkout(t);
  });
  document.addEventListener('click', (e) => { if (e.target.classList && e.target.classList.contains('drawer-backdrop')) close(); });
  document.addEventListener('change', (e) => {
    if (e.target.dataset && e.target.dataset.qty) setQty(e.target.dataset.qty, e.target.value);
    if (e.target.name === 'dest') { state.country = e.target.value === 'US' ? 'US' : 'CA'; save(); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer().classList.contains('drawer-open')) close(); });

  // Product page quantity steppers
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-qty-step]'); if (!b) return;
    const input = document.querySelector(b.dataset.target); if (!input) return;
    input.value = Math.max(1, Math.min(20, (parseInt(input.value, 10) || 1) + Number(b.dataset.qtyStep)));
  });

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

  if (new URLSearchParams(location.search).get('checkout') === 'cancelled') setTimeout(() => toast('Checkout cancelled. Your cart is saved.'), 300);

  window.RewildCart = { add, setQty, open, close, clear() { state.items = []; save(); }, state: () => state };
  render();
})();
