// The Rewild Field Guide: the free guide new subscribers get in the welcome email (lead magnet).
// Built only from what the website already says. No health claims: describe taste, timing and use, never effects.
import { esc } from './layout.mjs';
import { PRODUCT_BY_ID } from '../netlify/functions/_shared/catalog.mjs';

const PICKS = [
  { id: 'energy', when: 'Mornings and before you move', taste: 'Mild and slightly sweet. Caramel, toasty.', how: 'Most people take it earlier in the day, before training or a long afternoon. It disappears into coffee, matcha, smoothies and oats.', learn: '/learn/cordyceps/' },
  { id: 'clarity', when: 'Workdays and deep focus time', taste: 'Gentle and savoury. Delicate, earthy.', how: 'Many people take it with their morning cup, or before deep work. Works in coffee, tea, soups, sauces and smoothies.', learn: '/learn/lions-mane/' },
  { id: 'strength', when: 'Any time of day', taste: 'Smooth and a little smoky. Toasty, nutty.', how: 'Try it in coffee, as a tea with a splash of milk and maple, or stirred into a smoothie.', learn: '/learn/chaga/' },
  { id: 'peace', when: 'The quiet end of the day', taste: 'Bitter and bold. Herbal, woody.', how: 'Pair it with something rich: hot cacao, a chai, golden milk or a dark roast. Many people save it for the evening.', learn: '/learn/reishi/' },
];

const STACKS = [
  ['The morning ritual', 'Rewild Energy + Rewild Clarity', '½ teaspoon of each, stirred into your coffee.'],
  ['The full day', 'Energy in the morning, Peace at night', 'Energy in your morning cup. Peace in a hot cacao after dinner.'],
  ['The one-bag start', 'Pick the one that fits your day', 'Take it daily for a few weeks before adding a second. Small daily choices compound.'],
];

const pick = (p) => {
  const prod = PRODUCT_BY_ID[p.id];
  return `<article class="fg-pick">
  <img src="${esc(prod.image)}" alt="${esc(prod.name)}" width="300" height="300" loading="lazy">
  <div>
    <p class="eyebrow" style="margin:0 0 4px">${esc(p.when)}</p>
    <h3>${esc(prod.word)} <span>· ${esc(prod.commonName || prod.mushroom)}</span></h3>
    <p><b>Taste:</b> ${esc(p.taste)}</p>
    <p>${esc(p.how)}</p>
    <p class="small"><a href="/shop/${esc(prod.slug)}/">See ${esc(prod.name)}</a> · <a href="${esc(p.learn)}">Learn more</a></p>
  </div>
</article>`;
};

export const fieldGuide = {
  path: '/field-guide/',
  title: 'The Rewild Field Guide | Which Mushroom, When, and How | REWILD',
  description: 'A two-minute guide to Cordyceps, Lion’s Mane, Chaga and Reishi: which one fits your day, how to take it, and what to look for in any mushroom product.',
  noindex: true,
  head: `<style>
.fg-picks{display:grid;gap:18px}
.fg-sec h2{margin:4px 0 12px}.fg-sec>p{margin:0 0 20px}
.fg-pick{display:grid;grid-template-columns:120px 1fr;gap:20px;align-items:start;background:#fff;border-radius:var(--radius);padding:20px;border-left:5px solid var(--accent)}
.fg-pick img{width:120px;height:120px;object-fit:cover;border-radius:var(--radius)}
.fg-pick h3{margin:0 0 8px;font-family:var(--display);text-transform:uppercase;font-size:24px;line-height:1.1}
.fg-pick h3 span{font-size:16px;color:var(--soft);text-transform:none;font-family:var(--body);font-weight:400}
.fg-pick p{margin:0 0 8px;font-size:16px;line-height:1.55}
.fg-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:16px}
.fg-card{background:var(--stone,#F3F2EE);border-radius:var(--radius);padding:20px}
.fg-card b{display:block;font-family:var(--display);text-transform:uppercase;font-size:18px;margin-bottom:6px}
.stone .fg-card{background:#fff}
.fg-card p{margin:0;font-size:15px;line-height:1.5}
.fg-check{list-style:none;padding:0;margin:0;display:grid;gap:12px}
.fg-check li{background:var(--stone,#F3F2EE);border-radius:var(--radius);padding:16px 18px 16px 52px;position:relative;font-size:16px;line-height:1.5}
.fg-check li::before{content:"\\2713";position:absolute;left:18px;top:14px;font-weight:800;color:var(--ink);background:var(--accent);width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:14px}
@media (max-width:560px){.fg-pick{grid-template-columns:1fr}.fg-pick img{width:100%;height:160px}}
@media print{.site-header,.site-footer,.pop,.cart,.no-print,#toast{display:none!important}body{background:#fff}.section{padding:18px 0!important}.fg-pick,.fg-card,.fg-check li{break-inside:avoid;border:1px solid #ddd}}
</style>`,
  body: `
<section class="page-hero"><div class="wrap narrow stack">
  <p class="eyebrow">Free guide · for Rewilders</p>
  <h1 class="h1" style="font-size:clamp(38px,5vw,62px)">The Rewild Field Guide</h1>
  <p class="lead">Four mushrooms. One job each. Here's how to pick yours, when to take it, and what to look for in any mushroom product. Two minutes, start to finish.</p>
  <p class="no-print"><button type="button" class="btn btn-outline" onclick="window.print()">Save as PDF</button></p>
</div></section>

<section class="section stone"><div class="wrap narrow fg-sec">
  <p class="eyebrow">Step 1</p>
  <h2 class="h2" style="font-size:clamp(28px,3.4vw,42px)">Pick by your day</h2>
  <p style="max-width:640px">Each REWILD bag is one mushroom, so you always know what you're taking. Start with the moment of the day you want to build a ritual around.</p>
  <div class="fg-picks">${PICKS.map(pick).join('')}</div>
  <p class="small" style="margin-top:16px">Prefer a liquid? <a href="/shop/cordyceps-tincture/">Rewild Energy Tincture</a> is the same CordyFuel™ Cordyceps, alcohol-free. Take 10 to 20 ml per serving, straight or in a drink.</p>
</div></section>

<section class="section"><div class="wrap narrow fg-sec">
  <p class="eyebrow">Step 2</p>
  <h2 class="h2" style="font-size:clamp(28px,3.4vw,42px)">How to take it</h2>
  <p style="max-width:640px"><b>½ teaspoon a day</b>, added to food or drink. That's it. A 100g bag holds roughly 70 to 100 servings, so about two to three months of daily use.</p>
  <div class="fg-grid">
    <div class="fg-card"><b>Coffee</b><p>Stir it into your morning cup.</p></div>
    <div class="fg-card"><b>Cacao</b><p>Whisk it into an afternoon or evening cacao.</p></div>
    <div class="fg-card"><b>Smoothies</b><p>Blend it with everything else.</p></div>
    <div class="fg-card"><b>Food</b><p>Soups, sauces, oats. Whatever you cook.</p></div>
  </div>
</div></section>

<section class="section stone"><div class="wrap narrow fg-sec">
  <p class="eyebrow">Step 3</p>
  <h2 class="h2" style="font-size:clamp(28px,3.4vw,42px)">Three simple stacks</h2>
  <div class="fg-grid">${STACKS.map(([t, w, h]) => `<div class="fg-card"><b>${esc(t)}</b><p style="font-weight:700;margin-bottom:6px">${esc(w)}</p><p>${esc(h)}</p></div>`).join('')}</div>
  <p style="margin-top:18px">The secret isn't the mushroom. It's the ritual. Same time, same cup, every day.</p>
</div></section>

<section class="section"><div class="wrap narrow fg-sec">
  <p class="eyebrow">Before you buy any mushroom product</p>
  <h2 class="h2" style="font-size:clamp(28px,3.4vw,42px)">The 5-point checklist</h2>
  <p style="max-width:640px">Whoever you buy from, ask these five questions. If a brand can't answer them, keep looking.</p>
  <ol class="fg-check">
    <li><b>Is it one mushroom, clearly labelled?</b> Blends make it hard to know what you're actually getting, or how much.</li>
    <li><b>Is it third-party lab tested, and can you see the results?</b> Every REWILD lot is tested before release, and <a href="/lab-results/">the numbers are public</a>.</li>
    <li><b>Do you know where it was grown?</b> Ours comes from a specialist grower in British Columbia, from DNA-verified strains, on certified organic sorghum.</li>
    <li><b>Is it organic?</b> Look for it on the label, not just in the ads.</li>
    <li><b>Is it full spectrum?</b> Ours is harvested whole: fruiting body, mycelium and what the mycelium releases as it grows.</li>
  </ol>
</div></section>

<section class="section stone no-print"><div class="wrap narrow stack" style="text-align:center;align-items:center">
  <h2 class="h2" style="font-size:clamp(28px,3.4vw,42px)">Still not sure? Let us pick for you.</h2>
  <p style="max-width:560px">Eight quick questions. We'll match you with the mushrooms that fit how you actually live, plus when and how to take them.</p>
  <div class="row" style="justify-content:center"><a class="btn btn-yellow" href="/build-your-stack/?utm_source=field-guide">Build your stack</a><a class="btn btn-outline" href="/shop/?utm_source=field-guide">Shop all</a></div>
  <p class="small muted">Your welcome code works on your first order. Find it in your welcome email.</p>
</div></section>`,
};
