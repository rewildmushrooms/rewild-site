// /cordyfuel/  "What is CordyFuel™?" long-form sales page for Rewild Energy.
// Rules: CordyFuel™ is NuCelium's trademark. Our products are "Rewild Energy" and
// "Rewild Energy Tincture", powered by CordyFuel™. Never call a REWILD product CordyFuel™.
// The 14.87 mg/g Cordy Cup sample figure appears on this page only (Jade, 2026-10-03).
import { SITE } from './site.mjs';
import { PRODUCT_BY_ID, money } from '../netlify/functions/_shared/catalog.mjs';

const energy = PRODUCT_BY_ID.energy;
const tincture = PRODUCT_BY_ID.tincture;
const duo = PRODUCT_BY_ID.duo;

const cta = (label = 'Shop Rewild Energy', dark = false) =>
  `<a class="btn ${dark ? 'btn-yellow' : 'btn-dark'} lp-cta" href="#get-it">${label}</a>`;

const pull = (text, by = '') =>
  `<figure class="lp-pull"><blockquote>${text}</blockquote>${by ? `<figcaption>${by}</figcaption>` : ''}</figure>`;

const FAQ = [
  ['What is CordyFuel™?', 'CordyFuel™ is a full-spectrum Cordyceps militaris (fruiting body and mycelium) grown in Coldstream, British Columbia, and standardized to a minimum of 3 mg/g cordycepin in every batch. It won Best Fruiting Body / Full Spectrum at the 2025 Cordy Cup. Rewild Energy and Rewild Energy Tincture are powered by CordyFuel™.'],
  ['Is CordyFuel™ a blend?', 'No. It is 100% Cordyceps militaris. No fillers, no proprietary blend, nothing else in the bag.'],
  ['How do I take Rewild Energy?', 'Powder: ½ teaspoon in a smoothie, elixir, soup, tea, coffee, or hot water and honey. Tincture: 10 to 20 ml per serving, straight or added to a drink.'],
];

export const cordyfuelPage = {
  path: '/cordyfuel/',
  title: 'What is CordyFuel™? Award-Winning Cordyceps Militaris from BC | REWILD',
  description: 'CordyFuel™ is high-potency, full-spectrum Cordyceps militaris grown in BC. 2025 Cordy Cup winner, third-party tested, no fillers. Powering Rewild Energy.',
  ogTitle: 'What is CordyFuel™? Energy. Movement. Recovery.',
  image: '/img/cordyfuel-duo-square.webp',
  preload: '/img/learn-cordyceps.webp',
  jsonld: [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [['Home', '/'], ['What is CordyFuel™?', '/cordyfuel/']].map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE.url + p })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  ],
  body: `
<section class="hero lp-hero">
  <div class="wrap"><div class="hero-copy" style="max-width:680px">
    <p class="eyebrow">What is CordyFuel™?</p>
    <h1 class="h1">CordyFuel™<span class="h1-sub lp-h1-sub">High-potency Cordyceps militaris, grown in British Columbia</span></h1>
    <p class="tag">Energy. Movement. Recovery.</p>
    <p class="body">No mystery blend. No laundry list of ingredients. No complicated protocol. Just full-spectrum <em>Cordyceps militaris</em>, grown in BC and third-party tested for what actually matters.</p>
    <ul class="lp-badges" aria-label="At a glance">
      <li>Award-winning potency</li><li>Canadian grown</li><li>Full spectrum</li><li>No fillers</li><li>Non-GMO</li>
    </ul>
    <div class="row" style="margin-top:6px">${cta('Shop Rewild Energy', true)}</div>
    <p class="note">Return to your natural state.</p>
  </div></div>
</section>

<section class="section lp"><div class="lp-col">
  <p class="eyebrow ember">The problem</p>
  <h2 class="h2">We've forgotten what real energy feels like.</h2>
  <p class="lp-big">Somewhere along the way, being tired became normal.</p>
  <p>Coffee to wake up. Something else to push through the afternoon. More stimulation. More inputs. More ways to keep going when our bodies are asking for something different.</p>
  <p>REWILD isn't about rejecting modern life.</p>
  <p>It's about remembering that you're still part of nature, and choosing simple, natural tools that help you reconnect with how you were built to live.</p>
  <p class="lp-big">CordyFuel™ is one of those tools.</p>
</div></section>

<section class="section stone lp"><div class="lp-col">
  <p class="eyebrow">Cordyceps militaris, explained</p>
  <h2 class="h2">Meet CordyFuel™.</h2>
  <p>Cordyceps has been used for generations and has become one of the most recognized functional mushrooms for people interested in energy, endurance and performance.</p>
  <p class="lp-big">But not all Cordyceps is the same.</p>
  <p>CordyFuel™ is grown in British Columbia using a carefully selected strain of <em>Cordyceps militaris</em> and cultivated for unusually high levels of naturally occurring cordycepin.</p>
  <p>Nothing is hidden behind a proprietary blend. What you see is what you get.</p>
  <p class="lp-stamp">100% Cordyceps militaris.<span>That's it.</span></p>
</div></section>

<section class="section dark lp"><div class="lp-col">
  <p class="eyebrow">2025 Cordy Cup winner</p>
  <h2 class="h2">This one is different.</h2>
  <p>In 2025, CordyFuel™ was entered into the Cordy Cup, an international competition that independently tests Cordyceps products for potency.</p>
  <p class="lp-big" style="color:#fff">It won.</p>
  <p>Best Fruiting Body / Full Spectrum. The winning sample measured:</p>
  <div class="lp-number"><b>14.87 <small>mg/g</small></b><span>cordycepin</span></div>
  <div class="stats lp-stats">
    <div class="stat inverse"><b>11X+</b><span>the competition average in that event</span></div>
    <div class="stat inverse"><b style="color:var(--on-dark-2)">1.34</b><span>mg/g, the competition average</span></div>
  </div>
  ${pull('No clever formulation required.<br>Just an exceptionally potent mushroom.')}
  <div class="row">${cta('Shop Rewild Energy', true)}</div>
</div></section>

<section class="section lp"><div class="lp-col">
  <p class="eyebrow">Grown in Coldstream, BC</p>
  <h2 class="h2">Grown here. Tested here. Traceable.</h2>
  <p>We believe you should know what you're putting into your body.</p>
  <p>CordyFuel™ is cultivated in Coldstream, British Columbia, in a dedicated mushroom growing facility, and third-party tested for potency and quality.</p>
  <ul class="lp-checks">
    <li>Grown in BC</li><li>Third-party tested</li><li>Full spectrum: fruiting body + mycelium</li><li>Grown on organic sorghum</li><li>No fillers</li><li>Non-GMO</li>
  </ul>
  ${pull("We don't believe you should need a chemistry degree to understand what's in the bag.")}
  <p><a class="link" href="/lab-results/">See how it's grown and tested</a></p>
</div></section>

<section class="section stone lp"><div class="lp-col">
  <p class="eyebrow">Fruiting body + mycelium</p>
  <h2 class="h2">What does "full spectrum" mean?</h2>
  <p>We use the whole organism: fruiting body and mycelium.</p>
  <p>Rather than isolating a single compound or creating an extract designed around one number, CordyFuel™ keeps the mushroom intact.</p>
  <p>It's closer to our philosophy at REWILD:</p>
  <p class="lp-big">Keep it simple. Keep it close to nature. Know what you're taking.</p>
</div></section>

<section class="section lp"><div class="lp-col">
  <p class="eyebrow">Why Cordyceps?</p>
  <h2 class="h2">For anyone who wants to keep moving.</h2>
  <p>Cordyceps has become a favourite among athletes, hikers, skiers, snowboarders, dancers, gym people, busy humans and anyone who simply wants to keep moving.</p>
  <p>For us, CordyFuel™ isn't about becoming superhuman.</p>
  <p class="lp-big">It's about supporting the human underneath all the noise.</p>
  <ul class="lp-litany">
    <li>The one who wants to move.</li><li>To explore.</li><li>To create.</li><li>To dance longer.</li><li>To climb another mountain.</li><li>To get up tomorrow and do it again.</li>
  </ul>
</div></section>

<section class="section stone lp" id="story"><div class="lp-col">
  <p class="eyebrow">A note from our founder</p>
  <h2 class="h2">How CordyFuel™ found REWILD.</h2>
  <div class="lp-letter">
    <img src="/img/jade-founder.webp" alt="Jade Stevens, founder of REWILD Mushrooms" width="160" height="160" loading="lazy" class="lp-avatar">
    <p class="lp-big">I didn't go looking for mushrooms.<br>They found me.</p>
    <p>I first received CordyFuel™ as part of a trade for some marketing and design work.</p>
    <p>I tried it. And I kept taking it.</p>
    <p>At the time, I was rebuilding after one of the hardest periods of my life. I had lost my mom, ended an engagement and walked away from a five-year chapter of my career.</p>
    <p>My energy was low. I wasn't moving like myself. I didn't really feel like myself.</p>
    <p>CordyFuel™ became one small part of finding my way back.</p>
    ${pull('Not a miracle. Not the thing that fixed everything.<br>A tool.')}
    <p>One that helped reconnect me with movement, energy and a body I actually wanted to use again.</p>
    <p>That trade eventually became REWILD.</p>
    <p>Funny how mushrooms work.</p>
    <p class="lp-sign">Jade</p>
  </div>
</div></section>

<section class="section lp"><div class="lp-col">
  <p class="eyebrow">You don't need to be an elite athlete</p>
  <h2 class="h2">Built for people who move.</h2>
  <p>We take CordyFuel™:</p>
  <ul class="lp-litany">
    <li>Before hikes.</li><li>Before the gym.</li><li>Before snowboarding.</li><li>Before long work days.</li><li>Before dancing until stupid hours of the morning.</li><li>Before hauling wood.</li><li>Before festivals.</li>
  </ul>
  <p>And sometimes just because it's Tuesday and there's a lot to do.</p>
  <p>It's become part of how we live. Not because we're trying to optimize every second of our existence.</p>
  ${pull('Because feeling capable in your body is pretty damn great.')}
  <div class="row">${cta()}</div>
</div></section>

<section class="section dark lp"><div class="lp-col">
  <p class="eyebrow">From the people growing it</p>
  <h2 class="h2">Obsessed with getting mushrooms right.</h2>
  <p>CordyFuel™ is cultivated by our partner grower, an experienced Canadian mushroom team in British Columbia.</p>
  <p>Their work combines decades of mushroom cultivation, food-safety and production experience with a slightly obsessive interest in getting mushrooms right.</p>
  <ul class="lp-litany lp-litany-dark">
    <li>Strain selection matters.</li><li>Growing conditions matter.</li><li>The substrate matters.</li><li>Testing matters.</li><li>And the final numbers matter.</li>
  </ul>
  <p>The Cordy Cup result gave us something unusual in the mushroom world:</p>
  <p class="lp-big" style="color:var(--accent)">Proof you can actually measure.</p>
</div></section>

<section class="section lp"><div class="lp-col">
  <p class="eyebrow">Know what you're taking</p>
  <h2 class="h2">No mystery blends.</h2>
  <p>We have a pretty simple philosophy. You should understand what you're taking.</p>
  <p>We don't need twelve trendy ingredients on the front of the bag. We don't need a proprietary blend. And we don't need to pretend mushrooms are magic.</p>
  <p>CordyFuel™ is simply an exceptionally potent <em>Cordyceps militaris</em> grown here in Canada.</p>
  <p class="lp-stamp">Simple. Traceable. Tested.</p>
</div></section>

<section class="section stone lp"><div class="lp-col">
  <p class="eyebrow">What people are saying</p>
  <figure class="lp-testimonial">
    <p class="lp-t-head">"It gave me so much energy"</p>
    <blockquote>It gave me so much energy, that during the first snowfall I wanted to shovel my neighbours', the entire street. If it wasn't for having to go to work, I would have.</blockquote>
    <figcaption><b>Jesse F.</b> Men's Coach · Calgary, AB</figcaption>
  </figure>
</div></section>

<section class="section lp"><div class="lp-col">
  <p class="eyebrow">How to take it</p>
  <h2 class="h2">No complicated ritual required.</h2>
  <p>CordyFuel™ is easy to work into what you're already doing. Add it to:</p>
  <ul class="lp-tags"><li>Coffee</li><li>Smoothies</li><li>Cacao</li><li>Protein shakes</li><li>Hot water + honey</li><li>Or find your own way</li></ul>
  <p>Consistency matters more to us than turning it into another complicated wellness ritual.</p>
  <div class="lp-dose">
    <div><b>Powder</b><span>Add ½ teaspoon to your favourite smoothie, elixir, soup, tea, coffee, or hot water and honey.</span></div>
    <div><b>Tincture</b><span>Take 10 to 20 ml per serving, straight or added to a drink. A 100 ml bottle holds 5 to 10 servings.</span></div>
  </div>
</div></section>

<section class="section stone lp" id="get-it"><div class="wrap split">
  <div><img class="cover sq" src="/img/cordyfuel-duo-square.webp" alt="Rewild Energy Cordyceps militaris powder pouch and tincture bottle, powered by CordyFuel™, beside a mountain lake" width="1024" height="1024" loading="lazy"></div>
  <div class="stack">
    <p class="eyebrow">Powder or tincture?</p>
    <h2 class="h2">Same CordyFuel™.<br>Two ways to take it.</h2>
    <div class="lp-formats">
      <div><b>Rewild Energy</b><span class="lp-f-sub">The original.</span><p>Full-spectrum Cordyceps militaris powder, powered by CordyFuel™, for smoothies, coffee, cacao or whatever you're already drinking.</p></div>
      <div><b>Rewild Energy Tincture</b><span class="lp-f-sub">Rewild Energy, without the powder.</span><p>Alcohol-free, portable and ridiculously easy to take straight or add to a drink.</p></div>
    </div>
    <p>Same philosophy. Choose the format that works for your life.</p>
    <div class="offer" role="group" aria-label="Choose your Rewild Energy">
      <div class="offer-row"><div><b>Rewild Energy powder</b><span>100g · coffee, smoothies, food</span></div><span class="offer-price">${money(energy.price)}</span><button type="button" class="btn btn-dark" data-add="energy">Add</button></div>
      <div class="offer-row"><div><b>Rewild Energy Tincture</b><span>100 ml · alcohol-free, take it anywhere</span></div><span class="offer-price">${money(tincture.price)}</span><button type="button" class="btn btn-dark" data-add="tincture">Add</button></div>
      <div class="offer-row best"><div><b>Get both <em class="save-tag">Save ${money(energy.price + tincture.price - duo.price)}</em></b><span>Powder at home, tincture on the go</span></div><span class="offer-price"><s>${money(energy.price + tincture.price)}</s> ${money(duo.price)}</span><button type="button" class="btn btn-yellow" data-add="duo">Add</button></div>
    </div>
    <p class="small muted">Free shipping in Canada on orders over $175. Every batch third-party tested.</p>
  </div>
</div></section>

<section class="section dark lp lp-close"><div class="lp-col" style="text-align:center">
  <p class="eyebrow">This is REWILD</p>
  <h2 class="h2">We're part of nature.</h2>
  <p>REWILD isn't about escaping modern life. It's about remembering what modern life makes really easy to forget.</p>
  <p class="lp-big" style="color:#fff">We're animals. We're part of nature.</p>
  <p>And you were built to move your body, breathe deeply, sleep, play, explore, create and connect.</p>
  <p>Mushrooms aren't the answer to everything. But they are incredible tools. And we think some of the oldest tools on Earth still have a place in modern life.</p>
  <p class="lp-stamp" style="color:var(--accent)">Return to your natural state.<span style="color:#fff">One choice at a time.</span></p>
  <div class="row" style="justify-content:center">${cta('Shop Rewild Energy', true)}</div>
</div></section>

<section class="section tight lp"><div class="lp-col">
  <h2 class="h3" style="font-size:22px;margin-bottom:12px">CordyFuel™ questions</h2>
  ${FAQ.map(([q, a]) => `<details class="faq"><summary>${q}</summary><div class="answer">${a}</div></details>`).join('')}
</div></section>`,
};
