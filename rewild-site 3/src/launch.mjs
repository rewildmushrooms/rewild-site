// Launch party flash sale page (/launch-party/). Dates, % and limits come from SALES in pricing.mjs;
// the page switches itself between "coming soon" (early-access signup), "live" (shop) and "over" in the browser.
import { esc } from './layout.mjs';
import { PRODUCTS, PRODUCT_BY_ID, money } from '../netlify/functions/_shared/catalog.mjs';
import { SALES } from '../netlify/functions/_shared/pricing.mjs';

const S = SALES.find((s) => s.id === 'launch40');
const pt = (iso, opts) => new Date(iso).toLocaleString('en-CA', { timeZone: 'America/Vancouver', ...opts });
const day = (iso) => pt(iso, { weekday: 'long', month: 'long', day: 'numeric' });
const time = (iso) => pt(iso, { hour: 'numeric', minute: '2-digit' }).replace(':00', '').replace(' a.m.', 'am').replace(' p.m.', 'pm');
const off = (c) => Math.round(c * (100 - S.percent) / 100);
const LIST = ['all4', 'energy', 'clarity', 'strength', 'peace', 'tincture', 'duo'];
const listValue = (p) => (p.id === 'all4' ? ['energy', 'clarity', 'strength', 'peace'].reduce((a, k) => a + PRODUCT_BY_ID[k].price, 0) : p.id === 'duo' ? PRODUCT_BY_ID.energy.price + PRODUCT_BY_ID.tincture.price : p.price);

const card = (p) => `<article class="card lp-card">
  <a class="img-link" href="${p.isBundle ? '/shop/' : `/shop/${p.slug}/`}"><img src="${p.image}" alt="${esc(p.alt || p.name)}" width="600" height="600" loading="lazy"></a>
  <div class="meta">
    <h3 style="font-size:22px">${esc(p.name)}</h3>
    <div class="price-line">${esc(p.format)}</div>
    <p class="lp-price"><s>${money(listValue(p))}</s> <b>${money(off(listValue(p)))}</b></p>
    ${p.isBundle ? '' : `<p class="small lp-left" data-sale-left="${p.id}" hidden></p>`}
  </div>
  <div class="actions"><button type="button" class="btn btn-yellow" data-add="${p.id}">Add to cart</button></div>
</article>`;

export const launchPage = {
  path: '/launch-party/',
  title: `Launch Party: ${S.percent}% Off Everything for 48 Hours | REWILD`,
  description: `REWILD's launch party flash sale: ${S.percent}% off every mushroom powder and the tincture, ${day(S.start)} to ${day(S.end)}. Only ${S.stockEach} of each.`,
  body: `
<section class="page-hero dark hero-photo hero-larches lp-hero"><div class="wrap stack-sm" style="gap:16px">
  <p class="eyebrow" style="color:var(--accent)">Launch party · 48 hours only</p>
  <h1 class="h1" style="font-size:clamp(44px,7vw,92px);color:#fff">${S.percent}% off<br>everything.</h1>
  <p class="lead" style="color:var(--on-dark);max-width:640px">We're celebrating the launch of rewildmushrooms.com with our biggest offer yet. ${day(S.start)}, ${time(S.start)} PT to ${day(S.end)}, ${time(S.end)} PT. Only ${S.stockEach} of each product at this price. When they're gone, they're gone.</p>
  <div class="lp-cd" aria-live="polite"><span class="lp-cd-label" data-lp-label>Starts in</span><span class="lp-cd-time" data-lp-cd>--:--:--</span></div>
  <div data-lp-phase="soon">
    <form class="signup lp-signup" data-lp-form novalidate>
      <label for="lp-email" class="sr-only">Email address</label>
      <input id="lp-email" name="email" type="email" placeholder="Your email" autocomplete="email" required>
      <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button type="submit" class="btn btn-yellow">Get early access</button>
    </form>
    <p class="small" style="color:var(--on-dark);margin-top:10px" data-lp-msg>Join the list and shop ${time(S.earlyStart)} PT ${pt(S.earlyStart, { weekday: 'long' })}, ${Math.round((Date.parse(S.start) - Date.parse(S.earlyStart)) / 3600000)} hours before everyone else.</p>
  </div>
  <div data-lp-phase="live" hidden><a class="btn btn-yellow" href="#lp-shop">Shop the launch party</a></div>
  <div data-lp-phase="over" hidden><p class="lead" style="color:#fff">The launch party is over. Thank you for celebrating with us.</p><a class="btn btn-yellow" href="/shop/">Shop the mushrooms</a></div>
</div></section>
<section class="section" id="lp-shop"><div class="wrap">
  <div class="stack-sm" style="max-width:680px;gap:14px;margin-bottom:36px">
    <p class="eyebrow">Launch party prices</p>
    <h2 class="h2" style="font-size:clamp(30px,3.6vw,44px)">Every product. ${S.percent}% off.</h2>
    <p class="lead" data-lp-shopnote>These prices go live ${day(S.start)} at ${time(S.start)} PT. Until then, the cart shows regular prices.</p>
  </div>
  <div class="grid-4 lp-grid">${LIST.map((id) => card(PRODUCT_BY_ID[id])).join('')}</div>
</div></section>
<section class="section stone"><div class="wrap grid-3">
  <div class="stack-sm"><h2 class="h3" style="font-size:22px">The details</h2><ul class="ticks" style="font-size:16px">
    <li>${S.percent}% off every product, bundles included</li>
    <li>Only ${S.stockEach} of each product at this price</li>
    <li>Limit ${S.maxEach} of each per order</li>
    <li>Codes are paused during the sale</li>
  </ul></div>
  <div class="stack-sm"><h2 class="h3" style="font-size:22px">Shipping</h2><p class="muted">Free shipping in Canada on orders of $175 or more (counted on what you pay), $20 flat under that. Launch party orders ship ${day(S.end)}.</p></div>
  <div class="stack-sm"><h2 class="h3" style="font-size:22px">Still risk-free</h2><p class="muted">Every order comes with our 100% Risk-Free Guarantee. Don't love it? Email us within 14 days of delivery for a full refund.</p></div>
</div></section>`,
  scripts: `<script>
(function(){
  var S=${JSON.stringify({ earlyStart: S.earlyStart, start: S.start, end: S.end })};
  var cd=document.querySelector('[data-lp-cd]'), label=document.querySelector('[data-lp-label]'), note=document.querySelector('[data-lp-shopnote]');
  function early(){try{return !!localStorage.getItem('rewild_early');}catch(e){return false;}}
  function fmt(ms){var s=Math.max(0,Math.floor(ms/1000)),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),x=s%60;return (d?d+'d ':'')+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(x).padStart(2,'0');}
  function phase(){var n=Date.now();if(n>=Date.parse(S.end))return 'over';if(n>=Date.parse(S.start)||(early()&&n>=Date.parse(S.earlyStart)))return 'live';return 'soon';}
  function tick(){var p=phase(),n=Date.now();
    document.querySelectorAll('[data-lp-phase]').forEach(function(el){el.hidden=el.getAttribute('data-lp-phase')!==p;});
    document.documentElement.classList.toggle('lp-live',p==='live');
    if(p==='soon'){label.textContent='Starts in';cd.textContent=fmt(Date.parse(S.start)-n);}
    else if(p==='live'){label.textContent='Ends in';cd.textContent=fmt(Date.parse(S.end)-n);if(note)note.textContent='Live now. Add to your cart and the launch party price is applied automatically.';}
    else{label.textContent='';cd.textContent='';if(note)note.textContent='The launch party has ended. These were the launch party prices.';}
  }
  tick();setInterval(tick,1000);
  var f=document.querySelector('[data-lp-form]');
  if(f)f.addEventListener('submit',function(e){e.preventDefault();var m=document.querySelector('[data-lp-msg]'),b=f.querySelector('button');b.disabled=true;
    fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:f.email.value,website:f.website.value,source:'launch'})})
      .then(function(r){return r.json().then(function(d){if(!r.ok)throw new Error(d.error||'Something went wrong.');});})
      .then(function(){m.textContent="You're in. Watch your inbox Friday evening for your early-access link.";f.reset();if(window.gtag)window.gtag('event','sign_up',{method:'launch_party'});})
      .catch(function(err){m.textContent=err.message;}).then(function(){b.disabled=false;});});
})();
</script>`,
};
