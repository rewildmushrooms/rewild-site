import { SITE } from './site.mjs';
import { esc, proofStrip, signupForm } from './layout.mjs';
import { PRODUCTS, PRODUCT_BY_ID, SHIPPING, money } from '../netlify/functions/_shared/catalog.mjs';
import { POSTS } from './journal.mjs';
import { LAB, TESTS, PROCESS } from './lab.mjs';
import { cordyfuelPage } from './cordyfuel.mjs';
import { GUIDES, GUIDE_BY_PRODUCT, GROWN, CLEAN, MICRO, HEAVY } from './learn.mjs';

const powders = PRODUCTS.filter((p) => !p.isTincture && !p.isBundle);
const SELLABLE = PRODUCTS.filter((p) => !p.isBundle);
const abs = (p) => SITE.url + p;
const org = {
  '@type': 'Organization',
  '@id': SITE.url + '/#org',
  name: 'REWILD Mushrooms',
  url: SITE.url + '/',
  logo: SITE.url + '/favicon-512.png',
  email: SITE.email,
  sameAs: [SITE.instagram],
  address: { '@type': 'PostalAddress', addressRegion: 'BC', addressCountry: 'CA' },
};
const crumbs = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
});
const faqLd = (faqs) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })),
});
const GUARANTEE_TEXT = "Don't love it? Email us within 14 days of delivery for a full refund. No questions asked.";
const SHIELD = '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>';
const guarantee = (extra = '') => `<div class="guarantee${extra}">${SHIELD}<div><b>100% Risk-Free Guarantee</b><span>${GUARANTEE_TEXT}</span></div></div>`;
const faqHtml = (faqs) => faqs.map(([q, a]) => `<details class="faq"><summary>${esc(q)}</summary><div class="answer">${a}</div></details>`).join('');

function productCard(p, { headingLevel = 3 } = {}) {
  const h = `h${headingLevel}`;
  return `<article class="card">
    <a class="img-link" href="/shop/${p.slug}/"><img src="${p.image}" alt="${esc(p.alt)}" width="600" height="600" loading="lazy"></a>
    <div class="meta">
      <div class="dot-label"><span class="dot" style="background:${p.color}"></span>${esc(p.mushroom)}</div>
      <${h}><a href="/shop/${p.slug}/">${esc(p.name)}</a></${h}>
      <div class="latin">${esc(p.latin)}</div>
      <div class="price-line">${esc(p.format)} · <span class="price">${money(p.price)}</span></div>
    </div>
    <div class="actions"><button type="button" class="btn btn-dark" data-add="${p.id}">Add to cart</button><a class="btn btn-outline" href="/shop/${p.slug}/">Details</a></div>
  </article>`;
}


const CORDYFUEL_SECTION = `<section class="section stone" id="cordyfuel"><div class="wrap split">
  <div><img class="cover sq" src="/img/cordyfuel-duo-square.webp" alt="REWILD Energy CordyFuel™ powder pouch and tincture bottle with fresh Cordyceps militaris by a mountain lake" width="1024" height="1024" loading="lazy"></div>
  <div class="stack">
    <p class="eyebrow ember">If you try one thing, start here</p>
    <h2 class="h2">This is<br>Rewild Energy.</h2>
    <p class="lead">Rewild Energy is powered by CordyFuel™ <em>Cordyceps militaris</em>. In 2025 CordyFuel™ won Best Fruiting Body / Full Spectrum at the Cordy Cup in Sweden. The numbers are hard to ignore.</p>
    <div class="stats">
      <div class="stat inverse"><b>3+ mg/g</b><span>Cordycepin minimum. Every batch. Third-party verified.</span></div>
      <div class="stat"><b>7.1 mg/g</b><span>Our highest independent lab result to date</span></div>
      <div class="stat"><b style="color:#6B6D64">0.1 to 0.5</b><span>mg/g, where most commercial Cordyceps tests</span></div>
    </div>
    <p>Every batch is third-party tested. Want to see the lab report? <a class="link" href="/contact/?subject=Lab%20results">Just ask</a> and we'll send it.</p>
    <div class="offer" id="cordyfuel-options" role="group" aria-label="Choose your Rewild Energy">
      <div class="offer-row"><div><b>Powder</b><span>100g · stir into coffee, smoothies, food</span></div><span class="offer-price">$80</span><button type="button" class="btn btn-dark" data-add="energy">Add</button></div>
      <div class="offer-row"><div><b>Tincture</b><span>100 ml · alcohol-free, take it anywhere</span></div><span class="offer-price">$30</span><button type="button" class="btn btn-dark" data-add="tincture">Add</button></div>
      <div class="offer-row best"><div><b>Get both <em class="save-tag">Save $20</em></b><span>Powder at home, tincture on the go</span></div><span class="offer-price"><s>$110</s> $90</span><button type="button" class="btn btn-yellow" data-add="duo">Add</button></div>
    </div>
    ${guarantee(' compact')}
  </div>
</div></section>`;
const signupBanner = (id) => `<section class="hero hero-signup"><div class="wrap"><div class="hero-copy" style="max-width:560px">
  <h2 class="h2">An invitation to come back.</h2>
  <p class="body">Join the Rewilders. Field notes, new batches and lab results, a few times a month. No noise.</p>
  ${signupForm(id)}
</div></div></section>`;

/* ---------------- HOME ---------------- */
const USES = [
  ['coffee', 'Coffee', 'Stir a scoop into your morning cup.'],
  ['cacao', 'Cacao', 'Whisk it into an afternoon cacao.'],
  ['smoothie', 'Smoothies', 'Blend it with everything else.'],
  ['food', 'Food', 'Soups, sauces, oats. Whatever you cook.'],
];

const home = {
  path: '/',
  title: 'REWILD | Organic Mushroom Powder Grown in BC, Canada',
  description:
    "Organic, full-spectrum Cordyceps, Lion's Mane, Chaga and Reishi powders grown in British Columbia. One mushroom per product. Every batch third-party tested.",
  preload: '/img/hero-tincture-mountains.webp',
  jsonld: [
    { '@context': 'https://schema.org', ...org },
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'REWILD Mushrooms', url: SITE.url + '/', publisher: { '@id': SITE.url + '/#org' } },
  ],
  body: `
<section class="hero hero-home">
  <div class="wrap"><div class="hero-copy">
    <p class="eyebrow">For people who already believe in the power of mushrooms</p>
    <h1 class="h1">Feel more alive.</h1>
    <p class="tag">Energy. Clarity. Strength. Peace.</p>
    <p class="body">Exceptionally grown mushrooms for people doing meaningful things in the world. Organic. Full-spectrum. Grown in BC. Third-party lab tested.</p>
    <div class="row" style="margin-top:8px"><a class="btn btn-yellow" href="#cordyfuel-options">Start with Rewild Energy</a><a class="btn btn-ghost" href="/shop/">Shop all mushrooms</a></div>
    <p class="note">Return to your natural state.</p>
  </div></div>
</section>
${proofStrip()}
<section class="section manifesto-band"><img class="manifesto-mark" src="/img/emblem-dark-lg.webp" alt="" width="600" height="600" loading="lazy" aria-hidden="true"><div class="narrow stack center" style="text-align:center;position:relative">
  <img src="/img/emblem-dark-sm.webp" alt="REWILD emblem" width="88" height="88" style="margin-bottom:4px">
  <p class="eyebrow">The Rewild Manifesto</p>
  <h2 class="h2" style="font-size:clamp(30px,4vw,48px);line-height:1.12">Somewhere along the way, we forgot that we are part of nature.</h2>
  <p class="lead" style="max-width:680px;font-size:20px">We drink energy to wake up. We scroll to relax. We take in more information in a day than our ancestors did in a year. And many of us feel more tired, distracted and disconnected than ever.</p>
  <p class="lead" style="max-width:680px;font-size:20px">Rewild isn't about rejecting modern life. It's about remembering what you've forgotten. Small, intentional choices. One at a time.</p>
  <a class="btn btn-outline" href="/manifesto/" style="margin-top:8px">Read the manifesto</a>
</div></section>
${CORDYFUEL_SECTION}
<section class="section" id="shop"><div class="wrap">
  <div class="row" style="justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:52px">
    <div class="stack-sm" style="max-width:640px;gap:16px">
      <p class="eyebrow">Organic mushroom powders, grown in BC</p>
      <h2 class="h2" style="font-size:clamp(30px,3.6vw,46px)">Which mushrooms belong in your life?</h2>
      <p class="lead" style="font-size:18px">Mushrooms are tools. Not miracles. Not shortcuts.</p>
    </div>
    <a class="btn btn-outline" href="/shop/">Shop all</a>
  </div>
  <div class="grid-4">${powders.map((p) => productCard(p)).join('')}</div>
</div></section>
<section class="section dark" id="stack"><div class="wrap split">
  <div class="stack">
    <p class="eyebrow">Build your stack</p>
    <h2 class="h2">Know what you're choosing.</h2>
    <p class="lead" style="color:var(--on-dark);max-width:560px">Your days aren't like anyone else's. Neither is what you need from them. Choose the mushrooms that match how you actually live, and get exactly what you came for.</p>
    <div class="row" style="margin-top:6px"><a class="btn btn-yellow" href="/build-your-stack/">Build your stack</a><a class="btn btn-ghost" href="/shop/">Shop all</a></div>
  </div>
  <ol class="steps">
    <li><span class="n">01</span><div><b>Answer three questions</b><span>About your day, your rhythm and how you like to take things.</span></div></li>
    <li><span class="n">02</span><div><b>Get your stack</b><span>One mushroom or a few, matched to your day.</span></div></li>
    <li><span class="n">03</span><div><b>Make it part of your day</b><span>Small daily choices compound.</span></div></li>
  </ol>
</div></section>
<section class="section" id="tincture"><div class="wrap split" style="flex-wrap:wrap-reverse">
  <div class="stack">
    <span style="align-self:flex-start;background:var(--accent);font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;padding:6px 12px;border-radius:2px">New · Liquid tincture</span>
    <h2 class="h2">Rewild Energy,<br>without the powder.</h2>
    <p class="small" style="font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">100 ml · Take 10-20 ml per serving · 5-10 servings</p>
    <p class="lead">Same CordyFuel™ Cordyceps. A different way to take it. Simple, portable and easy to work into your day. Even people who don't love the taste of mushrooms tend to love this one.</p>
    <p>100% Cordyceps militaris. Alcohol-free. Nothing added. Take it straight, or add it to whatever you're already drinking.</p>
    <div class="row"><button type="button" class="btn btn-dark" data-add="tincture">Add the tincture · $30</button><a class="btn btn-outline" href="/shop/cordyceps-tincture/">Details</a></div>
  </div>
  <div><img class="cover wide" src="/img/tincture-river-wide.webp" alt="CordyFuel™ Cordyceps militaris tincture on moss beside a mountain river in the Kootenays" width="1400" height="933" loading="lazy"></div>
</div></section>
<section class="section stone"><div class="wrap stack" style="gap:48px">
  <div class="stack-sm" style="max-width:720px;gap:16px">
    <p class="eyebrow">How to take mushroom powder</p>
    <h2 class="h2" style="font-size:clamp(30px,3.6vw,46px)">Mushrooms that fit<br>real life.</h2>
    <p class="lead">Coffee. Cacao. Smoothies. Food. Or whatever is already part of your day. Returning to your natural state doesn't have to be complicated.</p>
  </div>
  <div class="grid-4">${USES.map(([k, t, s]) => `<div class="use-tile"><img src="/img/use-${k}.webp" alt="${t} with REWILD mushroom powder" width="477" height="489" loading="lazy"><b>${t}</b><span class="muted" style="font-size:16px;margin-top:-8px">${s}</span></div>`).join('')}</div>
</div></section>
<section class="section" id="team"><div class="wrap split">
  <div><img class="cover sq" src="/img/rewild-team-2026.webp" alt="REWILD founders Pete, Jade and Sean in the forest with Reishi, Lion's Mane and Cordyceps, and an orange cat" width="1100" height="1100" loading="lazy"></div>
  <div class="stack">
    <p class="eyebrow">Meet the team</p>
    <h2 class="h2" style="font-size:clamp(30px,3.6vw,44px)">Built on trust, integrity and a solid passion for 'shrooms.</h2>
    <div class="stack-sm" style="gap:18px;font-size:17px;color:var(--text)">
      <p><strong style="color:var(--ink)">Pete Moss, co-founder.</strong> A longtime mushroom enthusiast and lifelong mountain guy, Pete forages, makes his own tinctures and explores the Kootenays on a snowboard and a mountain bike. He brings a hands-on, back-to-nature approach to REWILD.</p>
      <p><strong style="color:var(--ink)">Jade Stevens, founder.</strong> A self-taught designer, marketer and lifelong explorer, Jade has spent 20 years turning ideas into things people can experience. At REWILD she leads brand, design, marketing and tech, following the mushrooms wherever they lead next.</p>
      <p><strong style="color:var(--ink)">Sean Turner, co-founder.</strong> With 16 years studying nutrition, human optimization and supplementation, Sean brings a whole-food, back-to-basics approach to Rewild. He sees functional mushrooms as simple, natural tools for helping the body perform, adapt and recover.</p>
    </div>
    <a class="btn btn-outline" href="/our-story/" style="align-self:flex-start">Our story</a>
  </div>
</div></section>
${signupBanner('home')}`,
};

/* ---------------- SHOP ---------------- */
const shop = {
  path: '/shop/',
  title: 'Shop Organic Mushroom Powder in Canada | REWILD',
  description: "Shop organic, BC-grown Cordyceps (CordyFuel™), Lion's Mane, Chaga and Reishi powders plus the alcohol-free Rewild Energy tincture. Free shipping in Canada over $175.",
  jsonld: [
    crumbs([['Home', '/'], ['Shop', '/shop/']]),
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: SELLABLE.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`/shop/${p.slug}/`), name: p.name })),
    },
  ],
  body: `
<section class="page-hero"><div class="wrap stack-sm" style="gap:16px">
  <p class="eyebrow">Shop organic mushroom powder in Canada</p>
  <h1 class="h1" style="font-size:clamp(40px,5vw,64px)">The mushrooms serious people take seriously.</h1>
  <p class="lead" style="max-width:640px">Organic, full-spectrum mushroom powders grown in British Columbia on certified organic sorghum. Choose the ones that fit your life, or <a class="link" href="/build-your-stack/">build your stack</a>.</p>
</div></section>
<section class="section tight"><div class="wrap">
  <div class="grid-4">${powders.map((p) => productCard(p, { headingLevel: 2 })).join('')}</div>
</div></section>
${CORDYFUEL_SECTION}
<section class="section dark tincture-feature" id="tincture"><div class="wrap split">
  <div class="tf-media"><img class="cover" src="/img/tincture-river-wide.webp" alt="Rewild Energy alcohol-free Cordyceps militaris tincture, powered by CordyFuel™, on moss beside a mountain river" width="1400" height="933" loading="lazy"><span class="tf-badge">New</span></div>
  <div class="stack">
    <p class="eyebrow">Alcohol-free Cordyceps tincture</p>
    <h2 class="h2">Rewild Energy,<br>without the powder.</h2>
    <p class="lead" style="color:var(--on-dark)">The same award-winning CordyFuel™ <em>Cordyceps militaris</em>, in a bottle that goes wherever you go. Even people who don't love the taste of mushrooms tend to love this one.</p>
    <ul class="lp-badges" aria-label="At a glance"><li>Alcohol-free</li><li>100% Cordyceps militaris</li><li>Caffeine-free</li><li>Grown in BC</li></ul>
    <ul class="ticks" style="font-size:17px">
      <li>Take it straight, or add it to water, coffee or a smoothie</li>
      <li>Fits in a pocket, a gym bag or a ski jacket</li>
      <li>100 ml bottle · 10 to 20 ml per serving · 5 to 10 servings</li>
    </ul>
    <div class="tf-buy">
      <div class="tf-price">${money(PRODUCT_BY_ID.tincture.price)}<span>100 ml</span></div>
      <button type="button" class="btn btn-yellow" data-add="tincture">Add to cart</button>
      <a class="btn btn-ghost" href="/shop/cordyceps-tincture/">Details</a>
    </div>
    <p class="small" style="color:var(--on-dark)">Want both? The <button type="button" class="link-btn tf-duo" data-add="duo">Rewild Energy Duo</button> is powder + tincture for ${money(PRODUCT_BY_ID.duo.price)} (save $20). <a class="link" style="color:#fff" href="/cordyfuel/">What is CordyFuel™?</a></p>
    ${guarantee(' on-dark compact')}
  </div>
</div></section>
<section class="section tight"><div class="wrap grid-3">
  <div class="stack-sm"><h2 class="h3" style="font-size:22px">Free shipping over $175</h2><p class="muted">Anywhere in Canada. $20 flat rate under that.</p></div>
  <div class="stack-sm"><h2 class="h3" style="font-size:22px">Shipping to the US</h2><p class="muted">Yes. US shipping and duties are calculated for each parcel. After you order, we email a quote you can pay online before it ships.</p></div>
  <div class="stack-sm"><h2 class="h3" style="font-size:22px">Promo codes</h2><p class="muted">Have a code? Add it in your cart before checkout.</p></div>
</div>
<div class="wrap" style="margin-top:40px">${guarantee(' wide')}</div></section>`,
};

/* ---------------- PRODUCT PAGES ---------------- */
const USE_TEXT = {
  powder: 'Add ½ teaspoon to your favourite smoothie, elixir, soup, tea, coffee, or hot water and honey.',
  tincture: 'Take 10 to 20 ml per serving, straight or added to a drink. A 100 ml bottle holds 5 to 10 servings.',
};
const PRODUCT_DETAILS = {
  energy: {
    intro: `<p>Rewild Energy is powered by CordyFuel™ <em>Cordyceps militaris</em>, grown in British Columbia and awarded <strong>Best Fruiting Body / Full Spectrum at the 2025 Cordy Cup</strong>.</p><p>Cordycepin is the compound Cordyceps militaris is best known for. CordyFuel™ is standardized to a minimum of 3 mg/g in every batch, verified by third-party testing before release. Our highest result so far, from an independent lab, came in at 7.1 mg/g. Most commercial Cordyceps tests between 0.1 and 0.5 mg/g.</p><p>Bright, savoury and slightly sweet. A natural fit for your morning coffee or smoothie.</p>`,
    ticks: ['Minimum 3 mg/g cordycepin, every batch', '2025 Cordy Cup: Best Fruiting Body / Full Spectrum', 'Full spectrum: fruiting body + mycelium', 'Grown in BC on certified organic sorghum', 'Third-party tested · No fillers · Non-GMO', 'Caffeine-free'],
    faqs: [
      ['What is cordycepin?', 'Cordycepin is a naturally occurring compound found in Cordyceps militaris. We use it as a marker of quality and consistency: every batch of CordyFuel™ is tested and standardized to a minimum of 3 mg/g.'],
      ['Does CordyFuel™ contain caffeine?', 'No. CordyFuel™ is pure Cordyceps militaris powder with no caffeine or stimulants added.'],
      ['Cordyceps militaris vs Cordyceps sinensis?', 'Wild Cordyceps sinensis is rare and expensive. Cordyceps militaris is a related species that can be cultivated, and it naturally contains cordycepin. CordyFuel™ is 100% Cordyceps militaris.'],
    ],
  },
  clarity: {
    intro: `<p>Lion's Mane (<em>Hericium erinaceus</em>) grows in long, cascading white spines on hardwood trees. It has been eaten and respected in traditional kitchens for generations.</p><p>Ours is grown in British Columbia as a full-spectrum powder: fruiting body and mycelium together. Mild, a little sweet and easy to add to coffee, tea or a smoothie.</p>`,
    ticks: ["100% Lion's Mane, nothing else in the bag", 'Full spectrum: fruiting body + mycelium', 'Grown in BC on certified organic sorghum', 'Third-party tested · No fillers · Non-GMO'],
    faqs: [["What does Lion's Mane taste like?", 'Mild and slightly sweet. It disappears into coffee, cacao and smoothies.']],
  },
  strength: {
    intro: `<p>Chaga (<em>Inonotus obliquus</em>) has quietly grown in northern forests for thousands of years, taking its character from its host and the forest around it.</p><p>Ours is grown in British Columbia as a full-spectrum powder. Earthy, rich and a little vanilla-like. Perfect in coffee, tea or broth.</p>`,
    ticks: ['100% Chaga, nothing else in the bag', 'Full spectrum: fruiting body + mycelium', 'Grown in BC on certified organic sorghum', 'Third-party tested · No fillers · Non-GMO'],
    faqs: [['Is your Chaga wild harvested?', 'No. It is cultivated indoors by our partner grower in British Columbia, so no wild birch forests are stripped and every batch can be tested and traced.']],
  },
  peace: {
    intro: `<p>Reishi (<em>Ganoderma lucidum</em>) has been revered for centuries as the mushroom of stillness. Glossy, woody and deeply rooted in tradition.</p><p>Ours is grown in British Columbia as a full-spectrum powder. Bitter and grounding. Many people enjoy it in an evening tea or cacao.</p>`,
    ticks: ['100% Reishi, nothing else in the bag', 'Full spectrum: fruiting body + mycelium', 'Grown in BC on certified organic sorghum', 'Third-party tested · No fillers · Non-GMO'],
    faqs: [['Reishi tastes bitter. How do I take it?', 'Pair it with something rich: cacao, a little honey, or a nut milk latte. A small amount goes a long way.']],
  },
  tincture: {
    intro: `<p>Same CordyFuel™ Cordyceps militaris as our Energy powder, in a portable, alcohol-free liquid. Simple, easy to carry and easy to work into your day.</p><p>Even people who don't love the taste of mushrooms tend to love this one. Take it straight, or add it to whatever you're already drinking.</p>`,
    ticks: ['Made with CordyFuel™ Cordyceps militaris', 'Alcohol-free', '100 ml bottle: 5 to 10 servings of 10 to 20 ml', 'Grown in BC · Lab tested'],
    faqs: [['Powder or tincture?', 'Same mushroom, different format. Powder works best stirred into food and drinks. The tincture is for straight-up, on-the-go days.']],
  },
};
const COMMON_FAQS = [
  ['How much should I take?', 'Our labels suggest ½ teaspoon of powder a day, added to food or drink. Start there and see what works for you.'],
  ['What does full spectrum mean?', 'It means the powder includes both the fruiting body (the mushroom you can see) and the mycelium (the root-like network). Ours is grown on certified organic sorghum in British Columbia by our partner grower. <a href="/fruiting-body-vs-mycelium-whats-the-difference-in-functional-mushroom-products/">Read more</a>.'],
  ['How long does a bag last?', 'A 100g bag holds roughly 70 to 100 half-teaspoon servings, so about two to three months of daily use.'],
  ['What if I don\u2019t like it?', `Our 100% Risk-Free Guarantee has you covered. ${GUARANTEE_TEXT} <a href="/shipping/#guarantee">How it works</a>.`],
  ['How should I store it?', 'In a cool, dry place away from direct sunlight. Reseal the pouch after use. Best within 3 years of purchase.'],
  ['Is this medical advice?', 'No. Our products are foods, not medicine. They are not intended to diagnose, treat, cure or prevent any disease. Talk to your healthcare practitioner before use if you are pregnant, nursing or taking medication.'],
];

function productPage(p) {
  const d = PRODUCT_DETAILS[p.id];
  const faqs = [...d.faqs, ...COMMON_FAQS.filter((f) => !(p.isTincture && f[0].startsWith('How long')))];
  const others = powders.filter((x) => x.id !== p.id).slice(0, 3);
  const lab = LAB.find((l) => l.id === p.id);
  return {
    path: `/shop/${p.slug}/`,
    title: p.seoTitle,
    description: p.seoDescription,
    image: p.image.replace('.webp', '.jpg'),
    ogType: 'product',
    preload: p.image,
    jsonld: [
      crumbs([['Home', '/'], ['Shop', '/shop/'], [p.name, `/shop/${p.slug}/`]]),
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: `${p.name}: ${p.mushroom} ${p.format}`,
        description: p.seoDescription,
        image: p.gallery.filter((g) => !g.includes('label-back')).map((g) => abs(g.replace('.webp', '.jpg'))),
        sku: `REWILD-${p.id.toUpperCase()}-${p.size.replace(/\s/g, '')}`,
        brand: { '@type': 'Brand', name: 'REWILD' },
        manufacturer: { '@id': SITE.url + '/#org' },
        countryOfOrigin: 'CA',
        material: p.latin,
        offers: {
          '@type': 'Offer',
          url: abs(`/shop/${p.slug}/`),
          priceCurrency: 'CAD',
          price: (p.price / 100).toFixed(2),
          availability: 'https://schema.org/InStock',
          itemCondition: 'https://schema.org/NewCondition',
          seller: { '@id': SITE.url + '/#org' },
          shippingDetails: [
            {
              '@type': 'OfferShippingDetails',
              shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'CA' },
              shippingRate: { '@type': 'MonetaryAmount', value: (SHIPPING.CA.flatRate / 100).toFixed(2), currency: 'CAD' },
              deliveryTime: {
                '@type': 'ShippingDeliveryTime',
                handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' },
                transitTime: { '@type': 'QuantitativeValue', minValue: SHIPPING.CA.minDays, maxValue: SHIPPING.CA.maxDays, unitCode: 'DAY' },
              },
            }
          ],
        },
      },
      faqLd(faqs),
    ],
    body: `
<section class="section tight"><div class="wrap">
  <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/shop/">Shop</a><span aria-hidden="true">/</span><span aria-current="page">${esc(p.name)}</span></nav>
  <div class="pdp">
    <div>
      <img id="gallery-main" class="gallery-main" src="${p.image}" alt="${esc(p.alt)}" width="1100" height="1100">
      <div class="thumbs">${p.gallery.map((g, i) => `<button type="button" data-thumb="${g}" data-alt="${esc(g.includes('label') ? `${p.name} label` : p.alt)}" aria-pressed="${i === 0}" aria-label="Show image ${i + 1}"><img src="${g}" alt="" loading="lazy" width="84" height="84"></button>`).join('')}</div>
    </div>
    <div class="buybox">
      <div class="dot-label"><span class="dot" style="background:${p.color}"></span>${esc(p.mushroom)}</div>
      <h1 class="h1" style="font-size:clamp(38px,4.4vw,58px)">${esc(p.name)}<span class="h1-sub">${esc(p.isTincture ? 'Alcohol-free Cordyceps militaris tincture' : `Organic ${p.commonName} mushroom powder`)}</span></h1>
      <p class="latin" style="font-size:17px">${esc(p.latin)} · ${esc(p.format)}</p>
      <p class="lead">${esc(p.tagline)}</p>
      <div class="big-price">${money(p.price)} <span class="small muted" style="font-family:var(--body);font-weight:400;letter-spacing:0;text-transform:none">CAD</span></div>
      <div class="row">
        <div class="qty" role="group" aria-label="Quantity"><button type="button" data-qty-step="-1" data-target="#qty" aria-label="Decrease">&minus;</button><input id="qty" type="number" min="1" max="20" value="1" aria-label="Quantity"><button type="button" data-qty-step="1" data-target="#qty" aria-label="Increase">+</button></div>
        <button type="button" class="btn btn-yellow" style="flex:1" data-add="${p.id}" data-qty-from="#qty">Add to cart</button>
      </div>
      <p class="small muted">Free shipping in Canada over $175 · $20 flat rate under that · <a href="/shipping/">US shipping quoted per order</a></p>
      ${guarantee(' compact')}
      <ul class="ticks">${d.ticks.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    </div>
  </div>
</div></section>
<section class="section tight stone"><div class="wrap split" style="align-items:flex-start">
  <div class="stack prose" style="max-width:none">${d.intro}</div>
  <div class="stack">
    <h2 class="h3" style="font-size:24px">On the label</h2>
    <dl class="spec">
      <dt>Ingredients</dt><dd>${p.isTincture ? `CordyFuel™ ${esc(p.latin)} (alcohol-free tincture)` : `Full spectrum (fruiting body + mycelium) ${esc(p.commonName)} mushroom powder (<em>${esc(p.latin)}</em>)`}</dd>
      <dt>Suggested use</dt><dd>${p.isTincture ? USE_TEXT.tincture : USE_TEXT.powder}</dd>
      <dt>Grown</dt><dd>British Columbia, Canada${p.isTincture ? '' : ', on certified organic sorghum'}, by our partner grower</dd>
      <dt>Storage</dt><dd>Cool, dry place away from direct sunlight. Reseal after use.</dd>
      <dt>Best before</dt><dd>Use within 3 years of purchase.</dd>
      <dt>Testing</dt><dd>Third-party tested. ${lab && lab.pdf ? `<a href="${lab.pdf}">Read the current COA</a>.` : '<a href="/lab-results/">See lab results</a>.'}</dd>
      ${GUIDE_BY_PRODUCT[p.isTincture ? 'energy' : p.id] ? `<dt>Learn more</dt><dd><a href="/learn/${GUIDE_BY_PRODUCT[p.isTincture ? 'energy' : p.id].slug}/">The ${esc(GUIDE_BY_PRODUCT[p.isTincture ? 'energy' : p.id].name)} guide</a>: what it is, where it grows and how it's tested.</dd>` : ''}
    </dl>
  </div>
</div></section>
<section class="section tight"><div class="narrow">
  <h2 class="h3" style="margin-bottom:20px">Questions</h2>
  ${faqHtml(faqs)}
</div></section>
<section class="section tight stone"><div class="wrap">
  <h2 class="h3" style="margin-bottom:32px">Build your stack</h2>
  <div class="grid-3">${others.map((o) => productCard(o)).join('')}</div>
</div></section>`,
  };
}

/* ---------------- BUILD YOUR STACK (quiz) ---------------- */
const quiz = {
  path: '/build-your-stack/',
  title: 'Build Your Mushroom Stack | Find Your Mushrooms | REWILD',
  description: 'Eight quick questions to match Cordyceps, Lion\u2019s Mane, Chaga and Reishi to how you actually live. Get your stack and how to take it in about a minute.',
  jsonld: [crumbs([['Home', '/'], ['Build Your Stack', '/build-your-stack/']])],
  body: `
<section class="page-hero dark"><div class="wrap stack-sm" style="gap:16px">
  <p class="eyebrow">Build your stack</p>
  <h1 class="h1" style="font-size:clamp(40px,5vw,64px);color:#fff">Find the mushrooms that fit your life.</h1>
  <p class="lead" style="color:var(--on-dark);max-width:620px">Eight quick questions about how you actually live. About a minute. You'll get your stack, when to take it and how.</p>
</div></section>
<section class="section tight"><div class="wrap narrow-quiz" id="quiz">
  <div id="quiz-app" class="stack" aria-live="polite"><noscript><p>Please turn on JavaScript to use the quiz, or <a href="/shop/">browse the shop</a>.</p></noscript></div>
</div></section>`,
  scripts: `<script src="/js/quiz.js?v=${SITE.build}" defer></script>`,
};


const LAB_FAQS = [
  ['What is a certificate of analysis (COA)?', 'A COA is the lab report for a specific production lot. It lists what was tested, the standard it had to meet and the actual result.'],
  ['Why are full reports on request?', 'Each report is tied to a specific lot and includes our grower\u2019s details. Ask and we\u2019ll email you the full PDF for the lot you have, usually within a business day.'],
  ['What is cordycepin?', 'Cordycepin is a naturally occurring compound in Cordyceps militaris. We use it as a marker of quality: every lot of CordyFuel™ must test at 3 mg/g or higher.'],
  ['What are beta-glucans?', 'Beta-glucans are naturally occurring polysaccharides found in mushroom cell walls. We measure them to confirm each lot is consistent and the real thing.'],
  ['Is the tincture tested?', 'The tincture is made with CordyFuel™ Cordyceps militaris. Ask and we\u2019ll send the reports that apply to your bottle.'],
  ['Is this a health claim?', 'No. These are lab measurements of what is in the product. Our products are foods and are not intended to diagnose, treat, cure or prevent any disease.'],
];

/* ---------------- LAB RESULTS ---------------- */
const lab = {
  path: '/lab-results/',
  title: 'Lab Results | Third-Party Tested Mushroom Powder Canada | REWILD',
  description: 'Every lot of REWILD mushroom powder is tested for identity, potency and purity. CordyFuel™ is standardized to 3+ mg/g cordycepin. Full COAs on request.',
  jsonld: [crumbs([['Home', '/'], ['Lab Results', '/lab-results/']]), faqLd(LAB_FAQS)],
  body: `
<section class="page-hero dark"><div class="wrap split" style="align-items:center">
  <div class="stack">
    <p class="eyebrow">Third-party lab results</p>
    <h1 class="h1" style="font-size:clamp(40px,5vw,64px);color:#fff">What's on the label is what's inside.</h1>
    <p class="lead" style="color:var(--on-dark)">Every pouch and every bottle starts as a tested lot. Identity, potency and purity, checked before anything is released. Here's what every lot is tested for, and the numbers.</p>
    <div class="row"><a class="btn btn-yellow" href="#request">Request a full report</a><a class="btn btn-ghost" href="#results">See the numbers</a></div>
  </div>
  <div class="stats lab-hero-stats" style="align-self:center">
    <div class="stat inverse" style="background:#1E201B"><b>3+ mg/g</b><span>Cordycepin minimum in every lot of CordyFuel™</span></div>
    <div class="stat inverse" style="background:#1E201B"><b>7.1 mg/g</b><span>Our highest result, from an independent lab</span></div>
    <div class="stat inverse" style="background:#1E201B"><b>13+</b><span>Lab checks on every lot: identity, potency, purity, stability</span></div>
    <div class="stat inverse" style="background:#1E201B"><b>2025</b><span>Cordy Cup winner, Sweden. Best Cordyceps militaris (Fruiting Body / Full Spectrum)</span></div>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <div class="stack-sm" style="max-width:720px;margin-bottom:40px;gap:14px">
    <p class="eyebrow">What every lot is tested for</p>
    <h2 class="h2" style="font-size:clamp(30px,3.6vw,46px)">Four questions every lot has to answer.</h2>
  </div>
  <div class="grid-4">${TESTS.map(([t, sub, body], i) => `<div class="stat stack-sm" style="background:var(--stone);gap:10px;padding:28px"><span class="eyebrow ember">0${i + 1} · ${esc(t)}</span><h3 style="font-size:22px">${esc(sub)}</h3><p class="muted" style="font-size:16px">${body}</p></div>`).join('')}</div>
</div></section>

<section class="section stone" id="results"><div class="wrap">
  <div class="stack-sm" style="max-width:720px;margin-bottom:40px;gap:14px">
    <p class="eyebrow">The numbers</p>
    <h2 class="h2" style="font-size:clamp(30px,3.6vw,46px)">Recent results, by product.</h2>
    <p class="lead">Each product has to meet its standard to be released. Here's the standard, and what a recent lot actually measured.</p>
  </div>
  <div class="grid-4 lab-grid">${LAB.map((l) => {
    const p = PRODUCT_BY_ID[l.id];
    return `<article class="lab-card">
      <img src="${p.image}" alt="" width="600" height="600" loading="lazy">
      <div class="stack-sm" style="gap:8px;padding:22px">
        <div class="dot-label"><span class="dot" style="background:${p.color}"></span>${esc(p.mushroom)}</div>
        <h3 style="font-size:22px"><a href="/shop/${p.slug}/" style="text-decoration:none">${esc(p.name)}</a></h3>
        <table class="lab-table"><thead><tr><th>Test</th><th>Standard</th><th>Result</th></tr></thead><tbody>
          <tr><td>Species identity</td><td>Positive</td><td><b>Positive</b></td></tr>
          ${l.results.map(([a, b, c]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td><td><b>${esc(c)}</b></td></tr>`).join('')}
          <tr><td>Microbial panel (7 tests)</td><td>Within limits</td><td><b>Pass</b></td></tr>
          <tr><td>Gluten</td><td>&lt; 15 ppm</td><td><b>&lt; 10 ppm</b></td></tr>
        </tbody></table>
      </div>
    </article>`;
  }).join('')}</div>
  <p class="small muted" style="margin-top:20px">Results are from recent lots. Every lot is tested, and numbers vary naturally from lot to lot. Measurements describe composition only and are not health claims.</p>
</div></section>

<section class="section"><div class="wrap">
  <div class="stack-sm" style="max-width:720px;margin-bottom:40px;gap:14px">
    <p class="eyebrow">From grain to powder</p>
    <h2 class="h2" style="font-size:clamp(30px,3.6vw,46px)">How our mushrooms are grown.</h2>
    <p class="lead">REWILD doesn't grow its own mushrooms. We partner with a specialist grower in British Columbia that cultivates them on certified organic sorghum in a 45,000 sq ft solar-powered facility. Nothing is imported from overseas.</p>
  </div>
  <ol class="process">${PROCESS.map(([t, d], i) => `<li><span class="n">${String(i + 1).padStart(2, '0')}</span><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join('')}</ol>
</div></section>

<section class="section dark"><div class="narrow stack" style="gap:18px">
  <p class="eyebrow">Why this matters</p>
  <h2 class="h2" style="font-size:clamp(30px,3.6vw,46px);color:#fff">Most mushroom products ask you to take their word for it.</h2>
  <p class="lead" style="color:var(--on-dark)">A label can say anything. A lab report can't. We think you should be able to see exactly what's inside before you make it part of your day, so every lot is tested and we'll show you the report.</p>
</div></section>

<section class="section" id="request"><div class="wrap split" style="align-items:flex-start">
  <div class="stack">
    <p class="eyebrow">Request a report</p>
    <h2 class="h2" style="font-size:clamp(30px,3.6vw,46px)">Want the full COA?</h2>
    <p class="lead">Tell us which product you have and we'll email you the complete certificate of analysis, usually within one business day.</p>
  </div>
  <form name="coa-request" method="POST" action="/contact/thanks/" data-netlify="true" netlify-honeypot="company" class="stack" style="gap:16px">
    <input type="hidden" name="form-name" value="coa-request">
    <p class="hp"><label>Leave this empty <input name="company"></label></p>
    <div class="field"><label for="r-product">Product</label><select id="r-product" name="product" required>
      <option value="">Choose a product</option>${SELLABLE.map((p) => `<option>${esc(p.name)} (${esc(p.mushroom)})</option>`).join('')}<option>All products</option></select></div>
    <div class="field"><label for="r-lot">Lot number <span class="muted" style="font-weight:400">(optional, if you have it)</span></label><input id="r-lot" name="lot" type="text"></div>
    <div class="field"><label for="r-name">Name</label><input id="r-name" name="name" type="text" autocomplete="name" required></div>
    <div class="field"><label for="r-email">Email</label><input id="r-email" name="email" type="email" autocomplete="email" required></div>
    <button type="submit" class="btn btn-dark" style="align-self:flex-start">Send me the report</button>
  </form>
</div></section>

<section class="section tight stone"><div class="narrow">
  <h2 class="h3" style="margin-bottom:20px">Lab questions</h2>
  ${faqHtml(LAB_FAQS)}
</div></section>`,
};


/* ---------------- OUR STORY ---------------- */
const story = {
  path: '/our-story/',
  title: 'Our Story | Canadian Mushroom Company, Slocan Valley BC | REWILD',
  description: 'REWILD is a small Canadian mushroom company from the Slocan Valley, BC. Meet the team, our grower and the idea behind single-mushroom powders.',
  jsonld: [crumbs([['Home', '/'], ['Our Story', '/our-story/']]), { '@context': 'https://schema.org', '@type': 'AboutPage', name: 'Our Story', about: { '@id': SITE.url + '/#org' } }],
  body: `
<section class="page-hero"><div class="wrap split">
  <div class="stack">
    <p class="eyebrow">Our story · Slocan Valley, BC</p>
    <h1 class="h1" style="font-size:clamp(40px,5vw,64px)">Rewild isn't really about mushrooms.</h1>
    <p class="lead">It's about returning to your natural state. The version of you beneath the noise. The mushrooms are simply good tools for the journey.</p>
  </div>
  <div><img class="cover sq" src="/img/rewild-team-forest.webp" alt="Pete, Jade and Sean in the forest holding Lion's Mane and Reishi" width="1100" height="1100"></div>
</div></section>
<section class="section"><div class="wrap split" style="align-items:flex-start">
  <div class="founder-photo"><img class="cover portrait" src="/img/jade-stevens-founder-mountains.webp" alt="Jade Stevens, founder of REWILD Mushrooms, hiking in the snowy Rockies with her black and white cat" width="800" height="1000" loading="lazy"><p class="small muted" style="margin-top:10px">Jade Stevens, founder</p></div>
  <div class="prose" style="max-width:640px">
    <p class="eyebrow" style="margin-bottom:12px">From the founder</p>
    <h2 style="margin-top:0">I didn't go looking for mushrooms. They found me.</h2>
    <p>I'm Jade, and I started REWILD. It began with a trade: mushrooms as payment for my work. That one yes kept leading somewhere.</p>
    <p>I've spent 20 years in design and marketing, from the Calgary Sun to my own studio, Humble Bee Design. I've also been a bartender, a roadie, a snowboarder and a relentless traveller. REWILD brings it all together.</p>
    <p>Lion's Mane and Cordyceps are the two I take most. But to me, REWILD isn't really about mushrooms. It's about getting outside, slowing down and moving more. Returning to your natural state. <a href="/manifesto/">Read the Rewild Manifesto</a>.</p>
    <p>I'm a humble shepherd. The mushrooms are leading the way.</p>
    <p style="font-style:italic;color:var(--muted)">Jade</p>
  </div>
</div></section>
<section class="section stone"><div class="wrap split" style="align-items:flex-start">
  <div class="prose" style="max-width:640px">
    <p class="eyebrow" style="margin-bottom:12px">Co-founder</p>
    <h2 style="margin-top:0">Pete Moss</h2>
    <p>A longtime mushroom enthusiast and lifelong mountain guy, Pete has spent years exploring both the outdoors and the world of functional mushrooms, including foraging and making his own tinctures.</p>
    <p>Snowboarding, mountain biking and hiking keep him connected to the wild, while DJing keeps things interesting. That same hands-on, back-to-nature approach is what connects him to REWILD and the idea that some of the best tools for feeling good have been around all along.</p>
    <p>Based in the Kootenays, Pete also helps people create healthier homes through <a href="https://radonboss.ca" rel="noopener" target="_blank">RadonBoss.ca</a>.</p>
  </div>
  <div class="founder-photo"><img class="cover portrait" src="/img/pete-moss-snowboarding.webp" alt="Pete Moss, co-founder of REWILD Mushrooms, snowboarding mid-air above a mountain event" width="684" height="856" loading="lazy"><p class="small muted" style="margin-top:10px">Pete Moss, co-founder</p></div>
</div></section>
<section class="section"><div class="wrap split" style="align-items:flex-start">
  <div class="founder-photo"><img class="cover portrait" src="/img/sean-turner-fire-performer.webp" alt="Sean Turner, co-founder of REWILD Mushrooms, performing with fire on stage" width="800" height="1000" loading="lazy"><p class="small muted" style="margin-top:10px">Sean Turner, co-founder</p></div>
  <div class="prose" style="max-width:640px">
    <p class="eyebrow" style="margin-bottom:12px">Co-founder</p>
    <h2 style="margin-top:0">Sean Turner</h2>
    <p>Sean Turner has a background in holistic nutrition, with Ayurveda as his first area of study. For 16 years, he has studied and practiced nutrition, human optimization, and supplementation. He has championed functional mushrooms throughout.</p>
    <p>Alongside a whole-food foundation, he considers functional mushrooms one of his first choices for proactive wellness. Cordyceps is among the first supplements he adds to his fitness and performance regimen.</p>
    <p>Sean is also a fire arts performer who has appeared on some of the biggest stages in Canada. These days, he's powered by CordyFuel™ seven days a week.</p>
  </div>
</div></section>
<section class="section stone"><div class="narrow prose" style="max-width:780px">
  <h2 style="margin-top:0">Where our mushrooms come from</h2>
  <p>We don't grow our own mushrooms. We work with a specialist grower in British Columbia that cultivates them from DNA-verified strains, on certified organic sorghum, in a solar-powered facility. We chose them for their science, their testing and their award-winning CordyFuel™. The whole organism is harvested together: fruiting body, mycelium and the compounds the mycelium releases as it grows. Then it's dried, milled and lab tested before it ever reaches a pouch or a bottle. <a href="/lab-results/">See how it's grown and tested</a>.</p>
  <p>Our job is choosing what goes into every REWILD pouch and bottle, and making sure you can know exactly where it came from.</p>
  <h2>What we believe</h2>
  <ul><li>Mushrooms are tools. Not miracles. Not shortcuts.</li><li>You should know exactly what's inside. One mushroom per product, clearly labelled.</li><li>Trust comes from transparency, not hype. That's why every lot is lab tested and <a href="/lab-results/">the numbers are public</a>.</li><li>Small daily choices compound.</li></ul>
</div></section>
<section class="section"><div class="wrap split">
  <div><img class="cover sq" src="/img/rewild-team-2026.webp" alt="REWILD founders Pete, Jade and Sean in the forest with mushrooms and an orange cat" width="1100" height="1100" loading="lazy"></div>
  <div class="stack">
    <p class="eyebrow">The team</p>
    <h2 class="h2" style="font-size:clamp(30px,3.6vw,44px)">Built on trust, integrity and a solid passion for 'shrooms.</h2>
    <div class="stack-sm" style="gap:18px;font-size:17px;color:var(--text)">
      <p><strong style="color:var(--ink)">Pete Moss, co-founder.</strong> A longtime mushroom enthusiast and lifelong mountain guy, Pete forages, makes his own tinctures and explores the Kootenays on a snowboard and a mountain bike. He brings a hands-on, back-to-nature approach to REWILD.</p>
      <p><strong style="color:var(--ink)">Jade Stevens, founder.</strong> A self-taught designer, marketer and lifelong explorer, Jade has spent 20 years turning ideas into things people can experience. At REWILD she leads brand, design, marketing and tech, following the mushrooms wherever they lead next.</p>
      <p><strong style="color:var(--ink)">Sean Turner, co-founder.</strong> With 16 years studying nutrition, human optimization and supplementation, Sean brings a whole-food, back-to-basics approach to Rewild. He sees functional mushrooms as simple, natural tools for helping the body perform, adapt and recover.</p>
    </div>
  </div>
</div></section>
<section class="section"><div class="narrow stack center" style="text-align:center">
  <h2 class="h2">Read the manifesto.</h2>
  <a class="btn btn-dark" href="/manifesto/">The Rewild Manifesto</a>
</div></section>`,
};

/* ---------------- MANIFESTO ---------------- */
const manifesto = {
  path: '/manifesto/',
  title: 'The Rewild Manifesto | Return to Your Natural State | REWILD',
  description: 'Somewhere along the way, we forgot that we are part of nature. The Rewild Manifesto: simple, intentional choices and mushrooms as tools, not miracles.',
  jsonld: [crumbs([['Home', '/'], ['The Manifesto', '/manifesto/']])],
  body: `
<section class="page-hero dark"><div class="narrow stack-sm" style="gap:16px">
  <p class="eyebrow">The Rewild Manifesto</p>
  <h1 class="h1" style="font-size:clamp(36px,5vw,60px);color:#fff;line-height:1.05">Somewhere along the way, we forgot that we are part of nature.</h1>
</div></section>
<section class="section"><div class="narrow prose" style="font-size:20px;max-width:720px">
  <p>Not separate from it. Not above it. Part of it.</p>
  <p>We've built lives around convenience, speed, stimulation, and comfort. We spend our days under artificial light, staring at glowing screens, rushing from one thing to the next. We drink energy to wake up. We scroll to relax. We consume more information in a day than our ancestors did in a year.</p>
  <p>And yet many of us feel more exhausted, distracted, disconnected, and unfulfilled than ever.</p>
  <p><strong>Something doesn't add up.</strong></p>
  <p>Rewild isn't about rejecting modern life. It's about remembering what you've forgotten.</p>
  <p>It's about questioning the idea that newer is always better. That more is always better. That the answer to every problem comes in a package, an app, or a prescription.</p>
  <p>Sometimes the answer is simpler than that. Sometimes it's getting outside. Sometimes it's slowing down. Sometimes it's sleeping more, moving more, breathing deeper, or paying attention to what you're putting into your body. Sometimes it's reconnecting with the rhythms that humans have lived by for thousands of years.</p>
  <p>It's not about perfection. It's not about living off-grid. It's not about becoming some version of you who only eats wild plants and bathes in rivers.</p>
  <p>It's about becoming more intentional. More aware. More connected. More human.</p>
  <p>The mushrooms we offer are part of that. Not because they're magical. Not because they're a shortcut. And not because one product can fix everything.</p>
  <p><strong>They're tools.</strong> Simple, natural tools that have been used for generations and that still have a place in your life today.</p>
  <p>That's why we don't hide ingredients behind mystery blends. That's why we keep things simple. Because you should understand what you're taking, and choose what works for you.</p>
  <p>At the end of the day, Rewild isn't really about mushrooms.</p>
  <p>It's about returning to your natural state. The version of you beneath the noise. The version of you that knows how to think clearly, rest deeply, adapt, recover, create, and connect. The version of you that modern life keeps trying to pull away from.</p>
  <p>Rewild is simply an invitation to come back.</p>
  <p><strong>One choice at a time.</strong></p>
  <p style="font-style:italic;color:var(--muted)">Jade Stevens, founder</p>
</div></section>
<section class="section tight stone"><div class="narrow stack center" style="text-align:center">
  <h2 class="h3">Start with one choice.</h2>
  <div class="row" style="justify-content:center"><a class="btn btn-dark" href="/build-your-stack/">Build your stack</a><a class="btn btn-outline" href="/shop/">Shop</a></div>
</div></section>`,
};

/* ---------------- JOURNAL ---------------- */
const journalIndex = {
  path: '/journal/',
  title: 'Journal | Functional Mushrooms in Canada, Explained | REWILD',
  description: 'Plain-language guides to functional mushrooms in Canada: how to read a label, fruiting body vs mycelium, sourcing, testing and building your own stack.',
  jsonld: [crumbs([['Home', '/'], ['Journal', '/journal/']])],
  body: `
<section class="page-hero"><div class="wrap stack-sm" style="gap:16px">
  <p class="eyebrow">Functional mushroom journal</p>
  <h1 class="h1" style="font-size:clamp(40px,5vw,64px)">Field notes.</h1>
</div></section>
<section class="section tight"><div class="wrap grid-3">
  ${POSTS.map((p) => `<a class="post-card" href="/${p.slug}/"><img src="${p.image}" alt="${esc(p.imageAlt)}" width="800" height="533" loading="lazy"><span class="eyebrow">${new Date(p.date + 'T12:00:00').toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })} · ${p.readMins} min read</span><h2 class="h3" style="font-size:22px;line-height:1.15">${esc(p.title)}</h2><p class="muted" style="font-size:16px">${esc(p.description)}</p><span class="link small">Read</span></a>`).join('')}
</div></section>
${signupBanner('journal')}`,
};

function postPage(post) {
  return {
    path: `/${post.slug}/`,
    title: post.seoTitle,
    description: post.description,
    ogType: 'article',
    ogTitle: post.title,
    jsonld: [
      crumbs([['Home', '/'], ['Journal', '/journal/'], [post.title, `/${post.slug}/`]]),
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.description,
        datePublished: post.date,
        dateModified: post.modified,
        author: { '@type': 'Person', name: 'Jade Stevens' },
        publisher: { '@id': SITE.url + '/#org' },
        mainEntityOfPage: abs(`/${post.slug}/`),
        image: SITE.url + post.image.replace('.webp', '.jpg'),
      },
    ],
    body: `
<article>
<section class="page-hero"><div class="narrow stack-sm" style="gap:16px">
  <nav class="breadcrumb" aria-label="Breadcrumb" style="margin:0"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/journal/">Journal</a></nav>
  <h1 class="h1" style="font-size:clamp(32px,4.2vw,52px);line-height:1.08">${esc(post.title)}</h1>
  <p class="muted small">By Jade Stevens · ${new Date(post.date + 'T12:00:00').toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })} · ${post.readMins} min read</p>
</div></section>
<section class="section tight" style="padding-bottom:0"><div class="narrow"><img class="cover wide" src="${post.image}" alt="${esc(post.imageAlt)}" width="1200" height="800"></div></section>
<section class="section tight"><div class="narrow"><div class="prose">${post.body}</div></div></section>
</article>
<section class="section tight stone"><div class="wrap">
  <div class="stack-sm" style="margin-bottom:32px;gap:12px"><p class="eyebrow">Explore Rewild Mushrooms</p><h2 class="h3">Canadian-grown. Full spectrum. One mushroom per product.</h2></div>
  <div class="grid-4">${powders.map((p) => productCard(p)).join('')}</div>
</div></section>`,
  };
}

/* ---------------- HELP & LEGAL ---------------- */
const simple = (path, title, description, h1, html, extra = {}) => ({
  path, title, description,
  jsonld: [crumbs([['Home', '/'], [h1, path]])],
  body: `<section class="page-hero"><div class="narrow"><h1 class="h1" style="font-size:clamp(36px,4.6vw,56px)">${esc(h1)}</h1></div></section><section class="section tight"><div class="narrow"><div class="prose">${html}</div></div></section>`,
  ...extra,
});

const shipping = simple('/shipping/', 'Shipping & Returns | Free Shipping in Canada Over $175 | REWILD', 'REWILD ships across Canada ($20 flat rate, free over $175) and to the US with duties quoted per order. Every order has a 14-day, 100% risk-free guarantee.', 'Shipping & Returns', `
<h2>Canada</h2>
<ul><li><strong>$20 flat rate</strong> on orders under $175.</li><li><strong>Free shipping</strong> on orders of $175 or more (before discounts).</li><li>Orders ship within 1 to 3 business days with tracking. Most arrive in 2 to 7 business days.</li><li><strong>Nelson, BC hand delivery</strong> is available at checkout. Local deliveries happen Monday and Tuesday.</li></ul>
<h2>United States</h2>
<p>Yes, we ship to the US. Every US parcel now goes through customs, so shipping and duties depend on what's in your order. Here's how it works:</p>
<ol><li>Place your order. You pay for the products only.</li><li>We declare your parcel with customs and work out the exact shipping and duties.</li><li>We email you a quote with a secure link to pay it online, usually within 1 business day.</li><li>As soon as it's paid, your order ships. Most US orders arrive in 5 to 12 business days.</li></ol>
<p>If the quote doesn't work for you, just reply and we'll cancel and fully refund your order.</p>
<h2 id="guarantee">Returns: our 100% Risk-Free Guarantee</h2>
<p>Try it. If you don't love it, email us at <a href="mailto:${SITE.email}">${SITE.email}</a> within 14 days of delivery and we'll give you a full refund. No questions asked, and no need to send anything back.</p>
<p>If your order arrives damaged, or we sent the wrong thing, email us a photo within 14 days and we'll replace it or refund it, whichever you prefer.</p>
<h2>Questions?</h2>
<p><a href="/contact/">Contact us</a>. A real person answers.</p>`);

const FAQS = [
  ['Where are your mushrooms grown?', 'In British Columbia, Canada, on certified organic sorghum, from DNA-verified strains.'],
  ['Who grows your mushrooms?', 'REWILD is not the grower. Our mushrooms are grown by <a href="https://nucelium.com" rel="noopener" target="_blank">NuCelium</a>, a certified organic cultivator in British Columbia and the maker of CordyFuel™. We choose the products, brand them, pack them and share the lab results for every lot.'],
  ['What does full spectrum mean?', 'Our powders contain the whole organism: fruiting body and mycelium together. <a href="/fruiting-body-vs-mycelium-whats-the-difference-in-functional-mushroom-products/">Read the full explainer</a>.'],
  ['How do I take the powder?', 'Our labels suggest ½ teaspoon a day in a smoothie, elixir, soup, tea, coffee, or hot water and honey.'],
  ['How do I take the tincture?', '10 to 20 ml per serving, straight or in a drink. Each 100 ml bottle holds 5 to 10 servings.'],
  ['Are your products tested?', 'Yes. Every lot is tested for species identity, potency (polysaccharides, beta-glucans, and cordycepin for CordyFuel™), a seven-test microbial panel, gluten and water activity. See the numbers on our <a href="/lab-results/">lab results</a> page.'],
  ['Can I see the lab report?', 'Yes. Full certificates of analysis are sent on request. <a href="/lab-results/#request">Request one here</a> and we\u2019ll email it, usually within one business day.'],
  ['How much is shipping?', `$20 flat rate in Canada, free on orders of $175 or more. US shipping and duties are quoted per order by email after you check out.`],
  ['Do you ship to the United States?', 'Yes. Choose United States in your cart. After you order, we email a quote for shipping and duties that you can pay online before it ships.'],
  ['What if I don\u2019t like it?', `Every order comes with our 100% Risk-Free Guarantee. ${GUARANTEE_TEXT} <a href="/shipping/#guarantee">How it works</a>.`],
  ['I have a promo code. Where do I enter it?', 'Open your cart and type it in the promo code box, then tap Apply. You will see the discount before you check out.'],
  ['Is CordyFuel™ caffeinated?', 'No. CordyFuel™ is pure Cordyceps militaris with no caffeine or stimulants added.'],
  ['Is this medical advice?', 'No. Our products are foods and are not intended to diagnose, treat, cure or prevent any disease. Talk to your healthcare practitioner before use if you are pregnant, nursing or taking medication.'],
];
const faq = {
  ...simple('/faq/', 'FAQ | Mushroom Powder Questions Answered | REWILD', 'Answers about REWILD mushroom powders: where they are grown, full spectrum, how to take them, testing, shipping to Canada and the US, and promo codes.', 'Mushroom powder questions, answered', faqHtml(FAQS)),
};
faq.jsonld.push(faqLd(FAQS));

const contact = simple('/contact/', 'Contact REWILD Mushrooms', 'Questions about our mushrooms, an order or wholesale? Contact REWILD Mushrooms in the Slocan Valley, BC. A real person answers.', 'Contact us', `
<p>Questions about an order, our mushrooms or wholesale? Send a note and a real person will get back to you, usually within a day or two.</p>
<p>Email: <a href="mailto:${SITE.email}">${SITE.email}</a></p>
<form name="contact" method="POST" action="/contact/thanks/" data-netlify="true" netlify-honeypot="company" class="stack" style="margin-top:28px;gap:16px">
  <input type="hidden" name="form-name" value="contact">
  <p class="hp"><label>Leave this empty <input name="company"></label></p>
  <div class="field"><label for="c-name">Name</label><input id="c-name" name="name" type="text" autocomplete="name" required></div>
  <div class="field"><label for="c-email">Email</label><input id="c-email" name="email" type="email" autocomplete="email" required></div>
  <div class="field"><label for="c-subject">Subject</label><input id="c-subject" name="subject" type="text"></div>
  <div class="field"><label for="c-msg">Message</label><textarea id="c-msg" name="message" required></textarea></div>
  <button type="submit" class="btn btn-dark" style="align-self:flex-start">Send</button>
</form>`, { scripts: `<script>(function(){var s=new URLSearchParams(location.search).get('subject');if(s){document.getElementById('c-subject').value=s;}})();</script>` });

const contactThanks = { ...simple('/contact/thanks/', 'Message sent | REWILD', 'Thanks for reaching out.', 'Thank you', '<p>Your message is on its way. We\'ll be in touch soon.</p><p><a class="btn btn-outline" href="/shop/">Back to the shop</a></p>'), noindex: true };

const privacy = simple('/privacy/', 'Privacy Policy | REWILD Mushrooms', 'How REWILD Mushrooms collects, uses and protects your personal information.', 'Privacy Policy', `
<p><em>Last updated: October 2026</em></p>
<p>REWILD Mushrooms ("we") respects your privacy and handles personal information in line with Canada's Personal Information Protection and Electronic Documents Act (PIPEDA).</p>
<h2>What we collect</h2>
<ul><li><strong>Orders:</strong> your name, email, phone, shipping and billing address, and what you bought. Payments are processed by Square. We never see or store your full card number.</li><li><strong>Email list:</strong> your email address if you join the Rewilders, through MailerLite. You can unsubscribe any time from any email.</li><li><strong>Contact form:</strong> what you send us, through Netlify Forms.</li><li><strong>Your cart:</strong> stored in your own browser (local storage) so it is still there when you come back. It is not sent to us until you check out.</li></ul>
<h2>How we use it</h2>
<p>To fulfil and ship your order, answer your questions, send emails you signed up for, and meet our legal and accounting obligations. We do not sell your information.</p>
<h2>Who we share it with</h2>
<p>Only the services we need to run the shop: Square (payments), MailerLite (email), Netlify (website hosting and forms), and shipping carriers (to deliver your order). These providers may store data outside Canada, including in the United States.</p>
<h2>Your choices</h2>
<p>You can ask to see, correct or delete your personal information by emailing <a href="mailto:${SITE.email}">${SITE.email}</a>.</p>`);

const terms = simple('/terms/', 'Terms of Service | REWILD Mushrooms', 'Terms of service for purchases from REWILD Mushrooms.', 'Terms of Service', `
<p><em>Last updated: October 2026</em></p>
<h2>Products</h2>
<p>Our mushroom powders and tinctures are sold as foods. Information on this site is for educational purposes only and is not medical advice. Our products are not intended to diagnose, treat, cure or prevent any disease. Speak with a healthcare practitioner before use if you are pregnant, nursing or taking medication.</p>
<h2>Pricing and payment</h2>
<p>Prices are in Canadian dollars. Payment is taken securely by Square when you place your order. We may correct pricing errors and cancel affected orders with a full refund.</p>
<h2>Promo codes</h2>
<p>One promo code per order. Codes have no cash value, may expire, and may be limited in number of uses.</p>
<h2>Shipping and returns</h2>
<p>Every order comes with our 100% Risk-Free Guarantee: if you don't love it, email us within 14 days of delivery for a full refund, no questions asked. Details are on our <a href="/shipping/">Shipping &amp; Returns</a> page.</p>
<h2>Trademarks</h2>
<p>CordyFuel™ is a trademark of <a href="https://nucelium.com" rel="noopener" target="_blank">NuCelium</a>, used with permission. REWILD's mushrooms are grown by NuCelium in British Columbia. REWILD and the REWILD emblem belong to REWILD Mushrooms.</p>
<h2>Governing law</h2>
<p>These terms are governed by the laws of British Columbia and the federal laws of Canada that apply there.</p>`);


/* ---------------- LEARN: MUSHROOM GUIDES ---------------- */
const guideImg = (g, cls = 'cover sq', lazy = false) => g.image
  ? `<img class="${cls}" src="${g.image}" alt="${esc(g.alt)}" width="640" height="640"${lazy ? ' loading="lazy"' : ''}>`
  : `<div class="img-placeholder ${cls}" role="img" aria-label="${esc(g.alt)}"><span>${esc(g.name)}<br><small>Photo coming soon</small></span></div>`;

const learnIndex = {
  path: '/learn/',
  title: 'Learn About Functional Mushrooms | Guides and Journal | REWILD',
  description: "Plain-language guides to Cordyceps, Lion's Mane, Reishi and Chaga: what they are, where they grow, their history, and how REWILD grows and tests them.",
  jsonld: [crumbs([['Home', '/'], ['Learn', '/learn/']])],
  body: `
<section class="page-hero"><div class="wrap stack-sm" style="gap:16px">
  <p class="eyebrow">Functional mushroom guides</p>
  <h1 class="h1" style="font-size:clamp(40px,5vw,64px)">Know your mushrooms.</h1>
  <p class="lead" style="max-width:640px">What each one is, where it grows, where it comes from, and exactly how ours are grown and tested.</p>
</div></section>
<section class="section tight"><div class="wrap grid-4 learn-grid">
  ${GUIDES.map((g) => `<a class="post-card" href="/learn/${g.slug}/">${guideImg(g, 'cover sq', true)}<span class="eyebrow">Mushroom guide</span><h2 class="h3" style="font-size:24px;line-height:1.15">${esc(g.name)}</h2><p class="latin" style="margin-top:-6px">${esc(g.latin)}</p><p class="muted" style="font-size:16px">${esc(g.intro)}</p><span class="link small">Read the guide</span></a>`).join('')}
</div></section>
<section class="section stone"><div class="wrap split">
  <div class="stack">
    <p class="eyebrow">Journal</p>
    <h2 class="h2" style="font-size:clamp(30px,3.6vw,44px)">Field notes.</h2>
    <p class="lead">Guides to reading labels, fruiting body vs mycelium, testing and building your own stack.</p>
    <div><a class="btn btn-dark" href="/journal/">Read the journal</a></div>
  </div>
  <div class="stack-sm">${POSTS.map((p) => `<a class="link" style="display:block;padding:14px 0;border-bottom:1px solid var(--line);text-decoration:none;font-weight:600" href="/${p.slug}/">${esc(p.title)}</a>`).join('')}</div>
</div></section>
${signupBanner('learn')}`,
};

function guidePage(g) {
  const prod = PRODUCT_BY_ID[g.productId];
  const lab = LAB.find((l) => l.id === g.productId);
  const others = GUIDES.filter((x) => x.slug !== g.slug);
  const tbl = (rows) => `<table class="lab-table"><tbody>${rows.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</tbody></table>`;
  return {
    path: `/learn/${g.slug}/`,
    title: g.seoTitle,
    description: g.description,
    ogType: 'article',
    image: g.image ? g.image.replace('.webp', '.jpg') : undefined,
    jsonld: [
      crumbs([['Home', '/'], ['Learn', '/learn/'], [g.name, `/learn/${g.slug}/`]]),
      { '@context': 'https://schema.org', '@type': 'Article', headline: `${g.name} (${g.latin})`, description: g.description, author: { '@id': SITE.url + '/#org' }, publisher: { '@id': SITE.url + '/#org' }, mainEntityOfPage: abs(`/learn/${g.slug}/`), ...(g.image ? { image: abs(g.image.replace('.webp', '.jpg')) } : {}) },
    ],
    body: `
<section class="page-hero"><div class="wrap split">
  <div class="stack-sm" style="gap:16px">
    <p class="eyebrow"><a href="/learn/" style="text-decoration:none">Learn</a> · Mushroom guide</p>
    <h1 class="h1" style="font-size:clamp(44px,6vw,76px)">${esc(g.name)}<span class="h1-sub">${esc(g.h1sub)}</span></h1>
    <p class="latin" style="font-size:20px">${esc(g.latin)}</p>
    <p class="lead">${esc(g.intro)}</p>
    <p class="small muted">${esc(g.aka)}</p>
    <div class="row"><a class="btn btn-dark" href="/shop/${prod.slug}/">Shop ${esc(prod.name)}</a><a class="btn btn-outline" href="/lab-results/">See lab results</a></div>
  </div>
  <div>${guideImg(g)}</div>
</div></section>
<section class="section"><div class="narrow prose" style="max-width:760px">
  ${g.sections.map(([h, ps]) => `<h2>${esc(h)}</h2>${ps.map((t) => `<p>${esc(t)}</p>`).join('')}`).join('')}
  <h2>How ours is grown</h2>
  <dl class="spec">${GROWN.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('')}</dl>
</div></section>
<section class="section stone"><div class="wrap grid-3">
  <div class="stack-sm">
    <h2 class="h3">What every lot is tested for</h2>
    <p class="muted small">Release standards every lot has to meet before it ships.</p>
    ${tbl(g.compounds)}
    ${lab ? `<p class="small">Latest lot (${esc(lab.lot)}): ${lab.results.slice(0, 2).map((r) => `${esc(r[0].replace(/ \(.*\)/, ''))} ${esc(r[2])}`).join(', ')}. <a class="link" href="/lab-results/">Full results</a></p>` : ''}
  </div>
  <div class="stack-sm">
    <h2 class="h3">Clean by design</h2>
    <ul class="checklist">${CLEAN.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
    <p class="small muted">${esc(MICRO)} No pesticides are used during production.</p>
  </div>
  <div class="stack-sm">
    ${g.heavy ? `<h2 class="h3">Heavy metals</h2><p class="muted small">Every lot must test under these limits.</p>${tbl(HEAVY)}` : `<h2 class="h3">Purity</h2><p class="muted small">Every lot is DNA verified, tested for gluten and water activity, and screened for microbes before release.</p>`}
  </div>
</div></section>
<section class="section"><div class="wrap split">
  <div class="stack">
    <p class="eyebrow">Taste and use</p>
    <h2 class="h2" style="font-size:clamp(30px,3.6vw,44px)">What it's like.</h2>
    <dl class="spec"><dt>Colour</dt><dd>${esc(g.sensory.colour)}</dd><dt>Aroma</dt><dd>${esc(g.sensory.aroma)}</dd><dt>Flavour</dt><dd>${esc(g.sensory.flavour)}</dd></dl>
    <p>${esc(g.tips)}</p>
  </div>
  <div style="max-width:420px">${productCard(prod)}</div>
</div></section>
<section class="section stone"><div class="narrow prose" style="max-width:760px">
  <h2 style="margin-top:0">Go deeper</h2>
  <p>If you want to fall all the way down the rabbit hole, start with mycologist Paul Stamets. His book <em>Mycelium Running</em> and the 2019 documentary <em>Fantastic Fungi</em> are two of the best introductions to how fungi shape the living world, from forest soil to the food on your plate.</p>
  <p>Or keep reading here: ${others.map((o) => `<a href="/learn/${o.slug}/">${esc(o.name)}</a>`).join(', ')}, or the <a href="/journal/">journal</a>.</p>
  <p class="small muted">This guide is for education only and is not medical advice.</p>
</div></section>
${signupBanner('guide-' + g.slug)}`,
  };
}

/* ---------------- ORDER CONFIRMED / 404 ---------------- */
const confirmed = {
  path: '/order-confirmed/',
  title: 'Order confirmed | REWILD',
  description: 'Thank you for your order.',
  noindex: true,
  body: `
<section class="section"><div class="narrow stack center" style="text-align:center">
  <img src="/img/emblem-dark-sm.webp" alt="" width="84" height="84">
  <p class="eyebrow">Order confirmed</p>
  <h1 class="h1" style="font-size:clamp(36px,5vw,60px)" id="oc-title">Welcome, Rewilder.</h1>
  <div id="oc-details" class="lead">Your order is in. A receipt is on its way to your inbox.</div>
  <p class="muted">Canadian orders ship within 1 to 3 business days. Nelson hand deliveries happen Monday and Tuesday.</p>
  <div class="row" style="justify-content:center"><a class="btn btn-dark" href="/journal/">Read the journal</a><a class="btn btn-outline" href="/shop/">Back to the shop</a></div>
</div></section>`,
  scripts: `<script>
(function(){
  function clear(){ if(window.RewildCart){window.RewildCart.clear();} else { try{localStorage.removeItem('rewild_cart_v1')}catch(e){} } }
  window.addEventListener('DOMContentLoaded', clear);
  var qs=new URLSearchParams(location.search), id=qs.get('orderId')||qs.get('order_id');
  if(!id){ try{ id=localStorage.getItem('rewild_last_order'); }catch(e){} }
  if(!id) return;
  try{ localStorage.removeItem('rewild_last_order'); }catch(e){}
  fetch('/api/order?order_id='+encodeURIComponent(id)).then(function(r){return r.ok?r.json():null}).then(function(o){
    if(!o) return;
    if(o.firstName) document.getElementById('oc-title').textContent='Thank you, '+o.firstName+'.';
    var items=(o.items||[]).map(function(i){return i.qty+' × '+i.name}).join(', ');
    var el=document.getElementById('oc-details');
    el.textContent='Order '+o.orderRef+': '+items+'. Total $'+(o.total/100).toFixed(2)+' CAD. A receipt is on its way to your inbox.';
  }).catch(function(){});
})();
</script>`,
};

const notFound = {
  path: '/404.html',
  file: '404.html',
  title: 'Page not found | REWILD',
  description: 'This page wandered off into the forest.',
  noindex: true,
  body: `<section class="section"><div class="narrow stack center" style="text-align:center"><p class="eyebrow">404</p><h1 class="h1" style="font-size:clamp(36px,5vw,60px)">This page went back to nature.</h1><p class="lead">Let's get you somewhere useful.</p><div class="row" style="justify-content:center"><a class="btn btn-dark" href="/shop/">Shop</a><a class="btn btn-outline" href="/">Home</a></div></div></section>`,
};

export const PAGES = [
  home,
  cordyfuelPage,
  shop,
  ...SELLABLE.map(productPage),
  quiz,
  lab,
  story,
  manifesto,
  learnIndex,
  ...GUIDES.map(guidePage),
  journalIndex,
  ...POSTS.map(postPage),
  shipping,
  faq,
  contact,
  contactThanks,
  privacy,
  terms,
  confirmed,
  notFound,
];
