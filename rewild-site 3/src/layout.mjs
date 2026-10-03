import { SITE } from './site.mjs';
import { SHIPPING } from '../netlify/functions/_shared/catalog.mjs';

export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const NAV = [
  ['/', 'Home'],
  ['/shop/', 'Shop'],
  ['/build-your-stack/', 'Build Your Stack'],
  ['/lab-results/', 'Lab Results'],
  ['/our-story/', 'Our Story'],
  ['/journal/', 'Journal'],
];

export const icons = {
  cart: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>',
  menu: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  trophy: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E8C800" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>',
  flask: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E8C800" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7.5 14h9"/></svg>',
  mountain: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E8C800" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 20l6-11 4 6 3-4 5 9H3z"/><circle cx="17" cy="6" r="2"/></svg>',
  leaf: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E8C800" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19l7-7"/></svg>',
  circle: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E8C800" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></svg>',
};

export function proofStrip() {
  const items = [
    [icons.trophy, 'Cordy Cup Winner', '2025, Sweden · Best Cordyceps militaris (Fruiting Body / Full Spectrum)'],
    [icons.flask, 'Third-Party Tested', 'Every batch. Lab results on request.'],
    [icons.mountain, 'Grown in BC', 'On certified organic sorghum in a 45,000 sq ft solar-powered facility'],
    [icons.leaf, '100% Organic', 'No fillers. Nothing added.'],
    [icons.circle, 'Full Spectrum', 'Fruiting body + mycelium. The whole mushroom, not just one part.'],
  ];
  return `<section class="dark" aria-label="Why Rewild"><div class="wrap proof">${items
    .map(([i, t, s]) => `<div class="proof-item">${i}<div><strong>${t}</strong><span>${s}</span></div></div>`)
    .join('')}</div></section>`;
}

export function signupForm(id = 'footer') {
  return `<form class="signup" data-subscribe novalidate>
    <label for="email-${id}" class="sr-only">Email address</label>
    <input id="email-${id}" name="email" type="email" placeholder="Your email" autocomplete="email" required>
    <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
    <button type="submit" class="btn btn-yellow">Join</button>
    <p data-msg role="status" class="small" style="flex-basis:100%"></p>
  </form>`;
}

const keepBrandCase = (html) =>
  html.replace(/(<(script|title|style)[\s\S]*?<\/\2>)|(<[^>]+>)|CordyFuel™/g, (m, block, _t, tag) => block || tag || '<span class="cf">CordyFuel™</span>');

export function layout(page) {
  page = { ...page, body: keepBrandCase(page.body) };
  const url = SITE.url + page.path;
  const title = page.title;
  const desc = page.description;
  const image = SITE.url + (page.image || '/img/og-default.jpg');
  const ld = [].concat(page.jsonld || []);
  const navHtml = NAV.map(([href, label]) => `<a href="${href}"${(href === '/' ? page.path === '/' : page.path.startsWith(href)) ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  return `<!doctype html>
<html lang="en-CA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
${page.noindex ? '<meta name="robots" content="noindex, nofollow">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<meta property="og:type" content="${page.ogType || 'website'}">
<meta property="og:site_name" content="REWILD Mushrooms">
<meta property="og:title" content="${esc(page.ogTitle || title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:locale" content="en_CA">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#121310">
<link rel="icon" href="/favicon-48.png" sizes="48x48" type="image/png">
<link rel="icon" href="/favicon-512.png" sizes="512x512" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Noto+Sans:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/site.css?v=${SITE.build}">
${page.preload ? `<link rel="preload" as="image" href="${page.preload}" fetchpriority="high">` : ''}
${ld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
${page.head || ''}
</head>
<body>
<a href="#main" class="sr-only">Skip to content</a>
<div class="announce">Free shipping in Canada on orders over $${SHIPPING.CA.freeOver / 100} · Now shipping to the US</div>
<header class="site-header">
  <div class="wrap">
    <a href="/" class="brand" aria-label="REWILD home"><img src="/img/emblem-dark.png" alt="" width="38" height="38"><span>REWILD</span></a>
    <nav id="site-nav" class="nav" aria-label="Main">${navHtml}</nav>
    <div class="header-actions">
      <button type="button" class="icon-btn" data-open-cart aria-label="Open cart">${icons.cart}<span class="cart-count" data-count="0">0</span></button>
      <button type="button" class="icon-btn menu-btn" id="menu-btn" aria-label="Menu" aria-expanded="false" aria-controls="site-nav">${icons.menu}</button>
    </div>
  </div>
</header>
<main id="main">
${page.body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-top">
      <div class="stack-sm">
        <div class="brand" style="color:#fff"><img src="/img/emblem-light.png" alt="" width="38" height="38"><span style="color:#fff">REWILD</span></div>
        <p>Organic, full-spectrum mushrooms grown in British Columbia.</p>
        <p style="font-style:italic">Return to your natural state.</p>
        <div style="margin-top:12px"><p style="color:#fff;font-weight:700;margin-bottom:8px">Join the Rewilders</p>${signupForm('footer')}</div>
      </div>
      <nav class="footer-col" aria-label="Shop"><h2>Shop</h2>
        <a href="/shop/cordyceps-tincture/"><span class="new-tag">New</span> CordyFuel™ Tincture</a>
        <a href="/shop/cordyceps-militaris-powder/">Energy · CordyFuel™</a>
        <a href="/shop/lions-mane-powder/">Clarity · Lion's Mane</a>
        <a href="/shop/chaga-powder/">Strength · Chaga</a>
        <a href="/shop/reishi-powder/">Peace · Reishi</a>
      </nav>
      <nav class="footer-col" aria-label="Learn"><h2>Learn</h2>
        <a href="/build-your-stack/">Build Your Stack</a>
        <a href="/lab-results/">Lab Results</a>
        <a href="/manifesto/">The Manifesto</a>
        <a href="/our-story/">Our Story</a>
        <a href="/journal/">Journal</a>
      </nav>
      <nav class="footer-col" aria-label="Help"><h2>Help</h2>
        <a href="/shipping/">Shipping &amp; Returns</a>
        <a href="/faq/">FAQ</a>
        <a href="/contact/">Contact</a>
        <a href="/privacy/">Privacy</a>
        <a href="/terms/">Terms</a>
      </nav>
    </div>
    <p class="disclaimer">The information on this site is for educational purposes only and is not medical advice. Our products are not intended to diagnose, treat, cure or prevent any disease. Speak with a healthcare practitioner before use if you are pregnant, nursing or taking medication. CordyFuel™ is a trademark of our grower, used with permission.</p>
    <div class="footer-bottom"><span>© ${new Date().getFullYear()} REWILD Mushrooms · Slocan Valley, British Columbia</span><span><a href="https://instagram.com/rewildmushrooms" rel="me noopener">@rewildmushrooms</a></span></div>
  </div>
</footer>

<div class="drawer-backdrop" aria-hidden="true"></div>
<aside id="cart-drawer" class="drawer" aria-label="Cart" aria-hidden="true">
  <div class="drawer-head"><h2>Your cart</h2><button type="button" class="icon-btn" id="cart-close" aria-label="Close cart">${icons.close}</button></div>
  <div class="drawer-body" id="cart-lines"></div>
  <div class="drawer-foot">
    <fieldset style="border:0;padding:0;margin:0"><legend class="small" style="font-weight:700;margin-bottom:8px">Shipping to</legend>
      <div class="dest"><label><input type="radio" name="dest" value="CA" checked> Canada</label><label><input type="radio" name="dest" value="US"> United States</label></div>
    </fieldset>
    <div id="cart-progress" hidden><p class="small" style="margin-bottom:6px"></p><div class="progress"><span style="width:0"></span></div></div>
    <div class="totals"><span>Subtotal</span><span id="cart-subtotal">$0</span><span>Shipping</span><span id="cart-shipping">n/a</span><span class="grand">Total</span><span class="grand" id="cart-total">$0</span></div>
    <p class="small muted" id="cart-ship-note"></p>
    <button type="button" class="btn btn-yellow btn-block" id="checkout-btn">Checkout</button>
    <p class="error-msg" id="cart-error" role="alert"></p>
    <p class="small muted" style="text-align:center">Secure payment by Stripe. Cards, Apple Pay and Google Pay.</p>
  </div>
</aside>
<div id="toast" class="toast" role="status"></div>
<script src="/js/catalog.js?v=${SITE.build}"></script>
<script src="/js/cart.js?v=${SITE.build}" defer></script>
${page.scripts || ''}
</body>
</html>`;
}
