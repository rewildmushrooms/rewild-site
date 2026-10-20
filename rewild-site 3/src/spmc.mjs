// Spirit Plant Medicine Conference table page (/spmc/). The QR code at the REWILD table points here.
// Short email form -> code SPMC10 (10% off everything, bundles included, until Nov 1) -> shop.
import { esc } from './layout.mjs';
import { PRODUCT_BY_ID, money } from '../netlify/functions/_shared/catalog.mjs';
import { reviewsSection } from './testimonials.mjs';

const CODE = 'SPMC10';
const PCT = 10;
const ENDS = 'Sunday, November 1';
const LIST = ['all4', 'energy', 'tincture', 'duo', 'clarity', 'strength', 'peace'];
const off = (c) => Math.round(c * (100 - PCT) / 100);

const card = (p) => `<article class="card lp-card">
  <a class="img-link" href="${p.isBundle ? '/shop/' : `/shop/${p.slug}/`}"><img src="${p.image}" alt="${esc(p.alt || p.name)}" width="600" height="600" loading="lazy"></a>
  <div class="meta">
    <h3 style="font-size:22px">${esc(p.name)}</h3>
    <div class="price-line">${esc(p.format)}</div>
    ${p.tagline ? `<p class="small muted" style="margin:4px 0 0">${esc(p.tagline)}</p>` : ''}
    <p class="lp-price"><s>${money(p.price)}</s> <b>${money(off(p.price))}</b> <span class="small muted">with ${CODE}</span></p>
  </div>
  <div class="actions"><button type="button" class="btn btn-yellow" data-add="${p.id}">Add to cart</button></div>
</article>`;

const form = (n) => `<form class="signup lp-signup" data-spmc-form novalidate>
      <label for="spmc-email-${n}" class="sr-only">Email address</label>
      <input id="spmc-email-${n}" name="email" type="email" placeholder="Your email" autocomplete="email" required>
      <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button type="submit" class="btn btn-yellow">Get my 10% code</button>
    </form>
    <p class="small" style="margin-top:10px" data-spmc-msg>Join Rewilders and get your code right here. We'll email it to you too.</p>
    <div data-spmc-code hidden class="stack-sm" style="gap:10px;margin-top:6px">
      <p class="lead" style="margin:0">Your code: <b style="letter-spacing:.06em">${CODE}</b></p>
      <p class="small" style="margin:0">Show this screen at our table, or shop online until ${ENDS}.</p>
      <a class="btn btn-yellow" href="/shop/?code=${CODE}&utm_source=spmc&utm_medium=qr">Shop with 10% off</a>
    </div>`;

export const spmcPage = {
  path: '/spmc/',
  title: 'Spirit Plant Medicine: 10% Off REWILD Mushrooms | REWILD',
  description: `Met us at Spirit Plant Medicine? Get ${PCT}% off organic mushroom powders and CordyFuel™ tincture, bundles included, until ${ENDS}.`,
  body: `
<section class="page-hero dark hero-photo hero-larches lp-hero"><div class="wrap stack-sm" style="gap:16px">
  <p class="eyebrow" style="color:var(--accent)">Spirit Plant Medicine · Oct 23 to 25 · South Hall, Vancouver</p>
  <h1 class="h1" style="font-size:clamp(40px,6.4vw,84px);color:#fff">Bring the mushrooms<br>home with you.</h1>
  <p class="lead" style="color:var(--on-dark);max-width:640px">Thanks for stopping by our table. Conference guests get <b>${PCT}% off everything</b>, bundles included, until ${ENDS}.</p>
  <div style="color:var(--on-dark)">${form(1)}</div>
</div></section>
<section class="section" id="spmc-shop"><div class="wrap">
  <div class="stack-sm" style="max-width:680px;gap:14px;margin-bottom:36px">
    <p class="eyebrow">Pick your mushrooms</p>
    <h2 class="h2" style="font-size:clamp(30px,3.6vw,44px)">Everything is ${PCT}% off with ${CODE}.</h2>
    <p class="lead" style="margin:0">Start with the All Four Set to try every mushroom, or the Energy Duo for CordyFuel™ two ways.</p>
  </div>
  <div class="grid-4 lp-grid">${LIST.map((id) => card(PRODUCT_BY_ID[id])).join('')}</div>
</div></section>
<section class="section stone"><div class="wrap grid-3">
  <div class="stack-sm"><h2 class="h3" style="font-size:22px">Grown in BC</h2><p class="muted">Grown in a solar-powered facility in Coldstream, BC. Certified organic.</p></div>
  <div class="stack-sm"><h2 class="h3" style="font-size:22px">Lab tested</h2><p class="muted">Every lot is third-party tested for purity and potency. <a href="/lab-results/">See the results</a>.</p></div>
  <div class="stack-sm"><h2 class="h3" style="font-size:22px">Risk-free</h2><p class="muted">Don't love it? Email us within 14 days of delivery for a full refund. Free shipping in Canada on orders of $175+.</p></div>
</div></section>
${reviewsSection({ eyebrow: 'What Rewilders are saying', title: 'Real people. Their words.' })}
<section class="section"><div class="wrap stack-sm" style="max-width:680px;gap:14px">
  <p class="eyebrow">${PCT}% off until ${ENDS}</p>
  <h2 class="h2" style="font-size:clamp(30px,3.6vw,44px)">Get your code and take your mushrooms home.</h2>
  ${form(2)}
</div></section>`,
  scripts: `<script>
(function(){
  function show(){document.querySelectorAll('[data-spmc-form]').forEach(function(f){f.hidden=true;});document.querySelectorAll('[data-spmc-msg]').forEach(function(m){m.hidden=true;});document.querySelectorAll('[data-spmc-code]').forEach(function(c){c.hidden=false;});}
  try{if(localStorage.getItem('rewild_spmc'))show();}catch(e){}
  document.querySelectorAll('[data-spmc-form]').forEach(function(f){
    f.addEventListener('submit',function(e){e.preventDefault();var m=f.parentNode.querySelector('[data-spmc-msg]'),b=f.querySelector('button');b.disabled=true;
      fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:f.email.value,website:f.website.value,source:'spmc'})})
        .then(function(r){return r.json().then(function(d){if(!r.ok)throw new Error(d.error||'Something went wrong.');});})
        .then(function(){try{localStorage.setItem('rewild_spmc','1');localStorage.setItem('rewild_email',f.email.value);}catch(x){}show();if(window.gtag)window.gtag('event','sign_up',{method:'spmc'});})
        .catch(function(err){m.textContent=err.message;}).then(function(){b.disabled=false;});});
  });
})();
</script>`,
};
