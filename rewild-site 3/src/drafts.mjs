// Audience pages built from the advisor review (Oct 2026): Start here (new to mushrooms), Why REWILD (people who
// already use mushrooms), Wholesale (+ the price list shown after the form) and Partners. Live since Oct 2026.
// draft(page, note) still works for future pages: noindex, out of the sitemap, with a yellow review bar.
import { SITE } from './site.mjs';
import { esc } from './layout.mjs';
import { reviewsSection } from './testimonials.mjs';
import { PRODUCT_BY_ID, money } from '../netlify/functions/_shared/catalog.mjs';
import { GUIDES } from './learn.mjs';

const draftBar = (note) => `<div class="draft-bar" role="note"><b>Draft for review.</b> Not linked anywhere and hidden from search. ${note}</div>`;
const draft = (page, note) => ({ ...page, noindex: true, draft: true, body: draftBar(note) + page.body });
const GUARANTEE = "Don't love it? Email us within 14 days of delivery for a full refund. No questions asked.";
const faqs = (list) => list.map(([q, a]) => `<details class="faq"><summary>${esc(q)}</summary><div class="answer">${a}</div></details>`).join('');

/* ---------- "Why REWILD" block: goes on the homepage (after the product grid) and the Shop page ---------- */
export const WHY_POINTS = [
  ['Grown in BC. Not imported and relabelled.', 'Every REWILD mushroom is grown by NuCelium in Coldstream, British Columbia, in a solar-powered facility. We can tell you exactly who grows it.'],
  ['The whole mushroom. Nothing added.', 'Fruiting body and mycelium, milled together with the organic sorghum it grew on. No fillers, flavours, colours or preservatives. One mushroom per bag, never a mystery blend.'],
  ['Every lot tested. The numbers are public.', 'Species identity, potency and seven microbial checks, before anything ships. We publish the results instead of just saying "lab tested".'],
  ['Award-winning Cordyceps.', 'Rewild Energy is CordyFuel™ Cordyceps militaris, winner of Best Fruiting Body / Full Spectrum at the 2025 Cordy Cup. Every lot has at least 3 mg/g cordycepin.'],
];
export const WHY_SECTION = `<section class="section why-band"><div class="wrap">
  <div class="stack-sm" style="max-width:680px;gap:14px;margin-bottom:40px">
    <p class="eyebrow">Why REWILD</p>
    <h2 class="h2" style="font-size:clamp(30px,3.6vw,46px)">Questions every mushroom powder should answer. Ours can.</h2>
  </div>
  <div class="why-grid">${WHY_POINTS.map(([h, p], i) => `<div class="why-item"><span class="why-n">0${i + 1}</span><h3>${esc(h)}</h3><p>${esc(p).replace('CordyFuel™', '<span class="cf">CordyFuel™</span>')}</p></div>`).join('')}</div>
  <p style="margin-top:28px"><a class="link" href="/why-rewild/">Compare us to any brand</a> · <a class="link" href="/lab-results/">See the lab numbers</a></p>
</div></section>`;

/* ---------- /why-rewild/ : for people who already use mushrooms ---------- */
const ASK = [
  ['Where is it grown?', 'Coldstream, British Columbia.', 'Many powders sold in Canada are grown overseas and packed here. "Packaged in Canada" and "Grown in Canada" are not the same thing.'],
  ['Who grows it?', 'NuCelium, a BC grower with its own DNA-verified strains.', 'A brand that knows its grower can tell you who it is.'],
  ['Fruiting body, mycelium or both?', 'Both, plus the organic sorghum the mycelium grew on. We say so on the label and on our Learn page.', 'Each approach has fans. What matters is that the label tells you which one you’re buying.'],
  ['Is every lot tested?', 'Yes. Species identity, potency, seven microbial checks, gluten and water activity.', 'Ask to see the numbers, not just the words "lab tested".'],
  ['Can I see the results?', 'Yes. Key numbers are on our lab results page and full reports are emailed on request.', 'A brand that is proud of its numbers will show you.'],
  ['What else is in it?', 'Nothing. No fillers, flavours, sweeteners, colours or preservatives.', 'Check the ingredient list for carriers, flavours and "proprietary blends".'],
  ['Is it a blend?', 'No. One mushroom per bag, so you always know what you’re using.', 'Blends can hide small amounts of each mushroom behind a long list.'],
];
const whyPage = ({
  path: '/why-rewild/',
  title: 'Why REWILD | BC-Grown, Lab-Tested Mushroom Powder',
  description: 'How REWILD compares: grown in BC by a named grower, whole mushroom with nothing added, every lot tested with the numbers published. Questions to ask any brand.',
  body: `
<section class="page-hero"><div class="wrap stack-sm" style="gap:16px">
  <p class="eyebrow">Already use mushrooms?</p>
  <h1 class="h1" style="font-size:clamp(40px,5vw,64px)">Here's why people switch to REWILD.</h1>
  <p class="lead" style="max-width:660px">You already know what you like. The question is what's actually in the bag. Here's what makes ours different, and the questions worth asking any brand, including us.</p>
  <div class="row"><a class="btn btn-dark" href="/shop/">Shop the mushrooms</a><a class="btn btn-outline" href="/lab-results/">See the lab numbers</a></div>
</div></section>
${WHY_SECTION}
<section class="section stone"><div class="wrap">
  <div class="stack-sm" style="max-width:680px;gap:14px;margin-bottom:32px">
    <p class="eyebrow">Compare any brand</p>
    <h2 class="h2" style="font-size:clamp(30px,3.6vw,44px)">Seven questions to ask before you buy.</h2>
    <p class="lead">Put these to any mushroom company. Here are our answers.</p>
  </div>
  <div class="ask-table" role="table" aria-label="Questions to ask any mushroom brand">
    <div class="ask-row ask-head" role="row"><span role="columnheader">The question</span><span role="columnheader">REWILD's answer</span><span role="columnheader">What to watch for</span></div>
    ${ASK.map(([q, a, w]) => `<div class="ask-row" role="row"><b role="cell">${esc(q)}</b><span role="cell" class="ask-us">${esc(a)}</span><span role="cell" class="muted">${esc(w)}</span></div>`).join('')}
  </div>
</div></section>
<section class="section"><div class="wrap split">
  <div><img class="cover sq" src="/img/cordyfuel-duo-square.webp" alt="REWILD Energy CordyFuel™ powder pouch and tincture bottle with fresh Cordyceps militaris" width="1024" height="1024" loading="lazy"></div>
  <div class="stack">
    <p class="eyebrow ember">The proof, in numbers</p>
    <h2 class="h2" style="font-size:clamp(30px,3.6vw,44px)">Cordyceps you can measure.</h2>
    <p class="lead">Cordycepin is the compound Cordyceps militaris is known for, so it's the one we use to judge quality. Every lot of CordyFuel™ has to reach 3 mg/g before it ships. Our best independent result so far is 7.1 mg/g. Most commercial Cordyceps tests at 0.1 to 0.5 mg/g.</p>
    <p class="small muted">CordyFuel™ is a trademark of NuCelium, our BC grower.</p>
    <div class="row"><a class="btn btn-dark" href="/shop/cordyceps-militaris-powder/">Shop Rewild Energy</a><a class="btn btn-outline" href="/lab-results/">All lab results</a></div>
  </div>
</div></section>
${reviewsSection({ eyebrow: 'From people who switched', tone: 'stone' })}
<section class="section"><div class="narrow stack center" style="text-align:center">
  <h2 class="h2" style="font-size:clamp(28px,3.4vw,40px)">Try it with nothing to lose.</h2>
  <p class="lead">${GUARANTEE}</p>
  <div class="row" style="justify-content:center"><a class="btn btn-yellow" href="/shop/">Shop all mushrooms</a><a class="btn btn-outline" href="/build-your-stack/">Build your stack</a></div>
</div></section>`,
});

/* ---------- /start-here/ : for people new to mushrooms ---------- */
const FOUR = [
  ['cordyceps', 'energy', 'Bright orange and grown on grain. Sweet, nutty, toasty.'],
  ['lions-mane', 'clarity', 'Shaggy, white and hangs like a waterfall. Mild and a little sweet.'],
  ['chaga', 'strength', 'Found wild on birch trees. Ours is grown on grain in BC. Earthy, like strong tea.'],
  ['reishi', 'peace', 'A glossy red shelf mushroom. Deep and bitter, like dark chocolate.'],
];
const NEW_FAQS = [
  ['Will these make me trip?', 'No. These are not psychedelic mushrooms. Cordyceps, Lion’s Mane, Chaga and Reishi are foods and contain no psilocybin.'],
  ['Do they taste like mushrooms?', 'A little. Mostly earthy, nutty or a bit bitter, depending on the mushroom. Stirred into coffee, cacao or a smoothie, most people barely notice. Not a fan of the taste? The <a href="/shop/cordyceps-tincture/">Energy tincture</a> is easy to drink.'],
  ['Is there caffeine?', 'No. None of our mushrooms contain caffeine, and nothing is added.'],
  ['How much do I use?', 'A serving is about ½ teaspoon of powder. Most people have one serving a day.'],
  ['How long until I notice something?', 'Everyone is different, so we won’t promise you anything. Most people use one every day for a few weeks before deciding whether it’s for them. That’s why every order has a 14-day money-back guarantee.'],
  ['I take medication or I’m pregnant. Can I use them?', 'Please check with your healthcare practitioner first. Our products are foods, and this site is not medical advice.'],
];
const startHere = ({
  path: '/start-here/',
  title: 'New to Functional Mushrooms? Start Here | REWILD',
  description: "A plain-language intro to functional mushrooms: what Cordyceps, Lion's Mane, Chaga and Reishi are, how people use them, and how to choose your first one.",
  body: `
<section class="page-hero dark hero-photo hero-larches"><div class="wrap stack-sm" style="gap:16px">
  <p class="eyebrow">New to functional mushrooms</p>
  <h1 class="h1" style="font-size:clamp(44px,6vw,76px);color:#fff">Start here.</h1>
  <p class="lead" style="color:var(--on-dark);max-width:620px">No hype and no jargon. What these mushrooms are, how people use them, and how to choose your first one. About three minutes.</p>
  <div class="row"><a class="btn btn-yellow" href="#first">How to start</a><a class="btn btn-ghost" href="/build-your-stack/">Build your stack</a></div>
</div></section>
<section class="section"><div class="wrap split">
  <div class="stack">
    <p class="eyebrow">The short version</p>
    <h2 class="h2" style="font-size:clamp(30px,3.6vw,44px)">Mushrooms you add to your day, not your dinner plate.</h2>
    <p class="lead">"Functional mushrooms" is the name for a handful of mushrooms people have brewed, cooked and kept around for centuries for more than their flavour. They aren't the ones on your pizza, and they aren't psychedelic.</p>
    <p>Ours are grown in British Columbia, dried and milled into a fine powder. Think of it like cacao or a spice: half a teaspoon stirred into something you already have every day.</p>
  </div>
  <div><img class="cover" src="/img/popup-mushrooms-forest.webp" alt="Mushrooms growing on the forest floor" width="1280" height="640" loading="lazy"></div>
</div></section>
<section class="section stone"><div class="wrap">
  <div class="stack-sm" style="max-width:680px;gap:14px;margin-bottom:36px">
    <p class="eyebrow">So why do people use them?</p>
    <h2 class="h2" style="font-size:clamp(30px,3.6vw,44px)">Everyone has their own reason.</h2>
    <p class="lead">Some grew up with mushrooms in the kitchen. Some heard about them from a friend who never skips her morning cup. Some just like knowing exactly what goes into their body and where it came from. We won't tell you what they'll do for you. We think the best way to find out is to choose one, use it every day for a few weeks, and notice for yourself.</p>
  </div>
  <div class="grid-4">${FOUR.map(([slug, pid, line]) => { const g = GUIDES.find((x) => x.slug === slug); const p = PRODUCT_BY_ID[pid]; return `<a class="post-card" href="/learn/${slug}/"><img class="cover sq" src="${g.image}" alt="${esc(g.alt)}" width="640" height="640" loading="lazy"><span class="eyebrow">${esc(p.name)}</span><h3 class="h3" style="font-size:24px;line-height:1.15">${esc(g.name)}</h3><p class="muted" style="font-size:16px">${esc(line)}</p><span class="link small">Meet ${esc(g.name)}</span></a>`; }).join('')}</div>
</div></section>
${reviewsSection({ eyebrow: 'Why Rewilders keep coming back', title: 'In their words, not ours.', tone: '' })}
<section class="section dark" id="first"><div class="wrap split">
  <div class="stack">
    <p class="eyebrow" style="color:var(--accent)">How to start</p>
    <h2 class="h2" style="font-size:clamp(30px,3.6vw,44px);color:#fff">Start with one. Keep it simple.</h2>
    <p class="lead" style="color:var(--on-dark)">You don't need four mushrooms on day one. Most people start with one, give it a few weeks, then add another.</p>
    <div class="row"><a class="btn btn-yellow" href="/build-your-stack/">Find my first mushroom</a><a class="btn btn-ghost" href="/shop/">Shop all</a></div>
  </div>
  <ol class="steps">
    <li><span class="n">01</span><div><b>Choose one</b><span>Take the one-minute quiz, or start where most people do: Rewild Energy, our award-winning Cordyceps.</span></div></li>
    <li><span class="n">02</span><div><b>Add it to something you already have</b><span>½ teaspoon in your coffee, cacao, smoothie or oats. Same time each day makes it easy to remember.</span></div></li>
    <li><span class="n">03</span><div><b>Give it a few weeks</b><span>Then decide for yourself. If it's not for you, our 14-day guarantee has you covered.</span></div></li>
  </ol>
</div></section>
<section class="section"><div class="wrap stack" style="gap:40px">
  <div class="stack-sm" style="max-width:680px;gap:14px">
    <p class="eyebrow">How people use it</p>
    <h2 class="h2" style="font-size:clamp(30px,3.6vw,44px)">Half a teaspoon. That's it.</h2>
  </div>
  <div class="grid-4 use-grid">${[['coffee', 'Coffee', 'Stir it into your morning cup.'], ['cacao', 'Cacao', 'Whisk it into hot cacao.'], ['smoothie', 'Smoothies', 'Blend it in.'], ['food', 'Food', 'Soups, sauces, oats.']].map(([k, t, s]) => `<div class="use-tile"><img src="/img/use-${k}.webp" alt="${t} with REWILD mushroom powder" width="477" height="489" loading="lazy"><b>${t}</b><span class="muted" style="font-size:16px;margin-top:-8px">${s}</span></div>`).join('')}</div>
  <p><a class="link" href="/mushroom-hot-cacao-recipe/">Try our trail-morning hot cacao recipe</a></p>
</div></section>
<section class="section stone"><div class="wrap split">
  <div class="stack">
    <p class="eyebrow">Shopping anywhere?</p>
    <h2 class="h2" style="font-size:clamp(30px,3.6vw,44px)">What to look for in any mushroom powder.</h2>
    <p class="lead">Whether you buy ours or someone else's, a good label answers these.</p>
    <p><a class="link" href="/why-rewild/">See how REWILD answers them</a></p>
  </div>
  <ul class="checklist" style="font-size:18px">
    <li>Which mushroom is it, by its Latin name?</li>
    <li>Where was it grown, not just packed?</li>
    <li>Fruiting body, mycelium, or both?</li>
    <li>Is every lot tested, and can you see the results?</li>
    <li>Is anything added, like fillers, flavours or sweeteners?</li>
  </ul>
</div></section>
<section class="section"><div class="narrow">
  <h2 class="h2" style="font-size:clamp(28px,3.4vw,40px);margin-bottom:24px">First-timer questions.</h2>
  ${faqs(NEW_FAQS)}
  <div class="row" style="margin-top:32px"><a class="btn btn-yellow" href="/build-your-stack/">Build your stack</a><a class="btn btn-outline" href="/learn/">Read the mushroom guides</a></div>
  <p class="small muted" style="margin-top:20px">REWILD mushroom powders are sold as foods. This page is for general education and is not medical advice.</p>
</div></section>`,
});

/* ---------- /wholesale/ : retailers ---------- */
const formCss = 'class="stack" style="margin-top:8px;gap:16px"';
const wholesale = ({
  path: '/wholesale/',
  title: 'Wholesale Mushroom Powder for Canadian Retailers | REWILD',
  description: 'Stock REWILD in your store, café or studio: organic mushroom powders grown in BC, single-species labels, every lot lab tested. Apply for wholesale pricing.',
  body: `
<section class="page-hero"><div class="wrap split">
  <div class="stack-sm" style="gap:16px">
    <p class="eyebrow">Wholesale</p>
    <h1 class="h1" style="font-size:clamp(40px,5vw,64px)">Stock REWILD on your shelf.</h1>
    <p class="lead">Organic mushroom powders grown in British Columbia, with labels your customers can actually read. Made for independent shops that care where things come from.</p>
    <div class="row"><a class="btn btn-dark" href="#apply">Apply for wholesale</a></div>
  </div>
  <div><img class="cover sq" src="/img/all-four-set.webp" alt="The four REWILD mushroom powder pouches: Energy, Clarity, Strength and Peace" width="800" height="800" loading="lazy"></div>
</div></section>
<section class="section stone"><div class="wrap">
  <div class="stack-sm" style="max-width:680px;gap:14px;margin-bottom:36px">
    <p class="eyebrow">Why it sells</p>
    <h2 class="h2" style="font-size:clamp(30px,3.6vw,44px)">Easy to explain. Easy to trust.</h2>
  </div>
  <div class="why-grid">
    <div class="why-item"><span class="why-n">01</span><h3>A local story</h3><p>Grown in Coldstream, BC by a named grower. Customers ask "where is it from?" and you have a real answer.</p></div>
    <div class="why-item"><span class="why-n">02</span><h3>Clear, simple range</h3><p>Four single-mushroom powders and one tincture. No blends to explain. Each has one word on the front: Energy, Clarity, Strength, Peace.</p></div>
    <div class="why-item"><span class="why-n">03</span><h3>Proof on request</h3><p>Every lot is third-party tested, and we send lot reports to you and your customers when asked.</p></div>
    <div class="why-item"><span class="why-n">04</span><h3>An award-winning hero</h3><p>Rewild Energy is CordyFuel™ Cordyceps, 2025 Cordy Cup winner. The alcohol-free tincture is a natural counter add-on.</p></div>
  </div>
</div></section>
<section class="section"><div class="wrap grid-3">
  <div class="stack-sm"><h2 class="h3" style="font-size:22px">Who we work with</h2><p class="muted">Health food and natural grocery stores, cafés and tea shops, gyms and climbing gyms, yoga and wellness studios, outdoor and ski shops, and markets.</p></div>
  <div class="stack-sm"><h2 class="h3" style="font-size:22px">What you get</h2><p class="muted">Wholesale pricing at 50% off retail, lot reports on request, and a real person to call when you need us.</p></div>
  <div class="stack-sm"><h2 class="h3" style="font-size:22px">Cafés</h2><p class="muted">Want to add a mushroom latte or cacao to your menu? Ask us about using REWILD in your drinks.</p></div>
</div></section>
<section class="section stone" id="apply"><div class="narrow">
  <h2 class="h2" style="font-size:clamp(28px,3.4vw,40px)">Apply for wholesale.</h2>
  <p class="lead">Tell us about your shop and you'll see our wholesale price list right away. We'll follow up by email, usually within two business days.</p>
  <form name="wholesale" method="POST" action="/wholesale/prices/" data-netlify="true" netlify-honeypot="company_url" ${formCss}>
    <input type="hidden" name="form-name" value="wholesale">
    <p class="hp"><label>Leave this empty <input name="company_url"></label></p>
    <div class="field"><label for="w-biz">Business name</label><input id="w-biz" name="business" type="text" required></div>
    <div class="field"><label for="w-name">Your name</label><input id="w-name" name="name" type="text" autocomplete="name" required></div>
    <div class="field"><label for="w-email">Email</label><input id="w-email" name="email" type="email" autocomplete="email" required></div>
    <div class="field"><label for="w-phone">Phone <span class="muted" style="font-weight:400">(optional)</span></label><input id="w-phone" name="phone" type="tel" autocomplete="tel"></div>
    <div class="field"><label for="w-type">Type of business</label><select id="w-type" name="business_type" required>
      <option value="">Choose one</option><option>Health food or grocery store</option><option>Café or tea shop</option><option>Gym or studio</option><option>Outdoor or ski shop</option><option>Market or pop-up</option><option>Online store</option><option>Other</option>
    </select></div>
    <div class="field"><label for="w-city">City and province</label><input id="w-city" name="location" type="text" required></div>
    <div class="field"><label for="w-web">Website or Instagram <span class="muted" style="font-weight:400">(optional)</span></label><input id="w-web" name="website" type="text"></div>
    <div class="field"><label for="w-msg">Anything else? <span class="muted" style="font-weight:400">(which products interest you, questions)</span></label><textarea id="w-msg" name="message"></textarea></div>
    <button type="submit" class="btn btn-dark" style="align-self:flex-start">Send application</button>
  </form>
  <p class="small muted" style="margin-top:16px">Prefer email? <a href="mailto:${SITE.email}?subject=Wholesale">${SITE.email}</a></p>
</div></section>`,
});

/* ---------- /partners/ : affiliates, ambassadors, creators ---------- */
const partners = ({
  path: '/partners/',
  title: 'Partner With REWILD | Ambassadors and Creators',
  description: 'Coaches, guides, athletes and creators: share REWILD with your community. Your own code, a commission on every order and product to try.',
  body: `
<section class="page-hero dark hero-photo hero-larches"><div class="wrap stack-sm" style="gap:16px">
  <p class="eyebrow">Partners</p>
  <h1 class="h1" style="font-size:clamp(40px,5vw,64px);color:#fff">Share what you already use.</h1>
  <p class="lead" style="color:var(--on-dark);max-width:640px">For coaches, guides, athletes, makers and creators whose people would love REWILD. If you'd recommend it anyway, let's make it worth your while.</p>
  <div class="row"><a class="btn btn-yellow" href="#apply">Apply to partner</a></div>
</div></section>
<section class="section"><div class="wrap">
  <div class="stack-sm" style="max-width:680px;gap:14px;margin-bottom:36px">
    <p class="eyebrow">How it works</p>
    <h2 class="h2" style="font-size:clamp(30px,3.6vw,44px)">Simple, and fair both ways.</h2>
  </div>
  <div class="why-grid">
    <div class="why-item"><span class="why-n">01</span><h3>Your own code</h3><p>Your community gets a discount at checkout, and every order with your code is tracked to you.</p></div>
    <div class="why-item"><span class="why-n">02</span><h3>A commission on every order</h3><p>You earn on every order placed with your code.</p></div>
    <div class="why-item"><span class="why-n">03</span><h3>Product to try</h3><p>We send you REWILD to use first. We only want partners who actually like it.</p></div>
    <div class="why-item"><span class="why-n">04</span><h3>Real people</h3><p>You'll deal with Jade, Pete or Sean directly. Ideas for events, giveaways and collaborations are welcome.</p></div>
  </div>
</div></section>
<section class="section stone"><div class="wrap split">
  <div class="stack">
    <p class="eyebrow">The ground rules</p>
    <h2 class="h2" style="font-size:clamp(30px,3.6vw,44px)">Honest, always.</h2>
    <p class="lead">Our mushrooms are sold as foods, so we keep how we talk about them honest and simple. Partners do too.</p>
  </div>
  <ul class="checklist" style="font-size:18px">
    <li>Say you're a REWILD partner when you share your code.</li>
    <li>Talk about your own experience, how you use it and why you like it.</li>
    <li>No health or medical claims. We'll give you a one-page guide to what you can and can't say.</li>
    <li>CordyFuel™ is NuCelium's trademark. Always use the ™.</li>
  </ul>
</div></section>
<section class="section" id="apply"><div class="narrow">
  <h2 class="h2" style="font-size:clamp(28px,3.4vw,40px)">Apply to partner.</h2>
  <p class="lead">Tell us a little about you and your community. We read every one.</p>
  <form name="partners" method="POST" action="/contact/thanks/" data-netlify="true" netlify-honeypot="company_url" ${formCss}>
    <input type="hidden" name="form-name" value="partners">
    <p class="hp"><label>Leave this empty <input name="company_url"></label></p>
    <div class="field"><label for="p-name">Name</label><input id="p-name" name="name" type="text" autocomplete="name" required></div>
    <div class="field"><label for="p-email">Email</label><input id="p-email" name="email" type="email" autocomplete="email" required></div>
    <div class="field"><label for="p-link">Where can we find you? <span class="muted" style="font-weight:400">(Instagram, YouTube, website)</span></label><input id="p-link" name="links" type="text" required></div>
    <div class="field"><label for="p-type">What best describes you?</label><select id="p-type" name="partner_type" required>
      <option value="">Choose one</option><option>Coach or trainer</option><option>Guide or outdoor instructor</option><option>Athlete</option><option>Yoga or movement teacher</option><option>Creator or writer</option><option>Event or festival organizer</option><option>Other</option>
    </select></div>
    <div class="field"><label for="p-size">Roughly how many people do you reach?</label><select id="p-size" name="audience_size">
      <option value="">Choose one</option><option>Under 1,000</option><option>1,000 to 10,000</option><option>10,000 to 50,000</option><option>50,000+</option><option>Mostly in person (classes, clients, events)</option>
    </select></div>
    <div class="field"><label for="p-why">Who is your community, and why REWILD?</label><textarea id="p-why" name="message" required></textarea></div>
    <button type="submit" class="btn btn-dark" style="align-self:flex-start">Send application</button>
  </form>
</div></section>`,
});

/* ---------- /wholesale/prices/ : shown after the wholesale form is sent (noindex, unlinked) ---------- */
const WHOLESALE_IDS = ['energy', 'clarity', 'strength', 'peace', 'tincture'];
const wholesalePrices = ({
  noindex: true, // only reached after sending the wholesale form
  path: '/wholesale/prices/',
  title: 'Wholesale Price List | REWILD',
  description: 'REWILD wholesale price list for approved retailers.',
  body: `
<section class="page-hero"><div class="narrow stack-sm" style="gap:16px">
  <p class="eyebrow">Thanks, your application is in</p>
  <h1 class="h1" style="font-size:clamp(36px,4.6vw,56px)">Wholesale price list.</h1>
  <p class="lead">Wholesale is 50% off our retail price. We'll be in touch by email within two business days to set up your first order.</p>
</div></section>
<section class="section tight"><div class="narrow">
  <table class="lab-table"><thead><tr><td><b>Product</b></td><td><b>Size</b></td><td><b>Retail</b></td><td><b>Wholesale</b></td></tr></thead><tbody>
  ${WHOLESALE_IDS.map((id) => { const p = PRODUCT_BY_ID[id]; return `<tr><td>${esc(p.name)} <span class="muted">(${esc(p.mushroom)})</span></td><td>${esc(p.format)}</td><td>${money(p.price)}</td><td><b>${money(p.price / 2)}</b></td></tr>`; }).join('')}
  </tbody></table>
  <p class="small muted" style="margin-top:16px">Prices in Canadian dollars, before shipping and tax. Lot reports (COAs) are available for every product on request.</p>
  <p>Questions in the meantime? Email <a class="link" href="mailto:${SITE.email}?subject=Wholesale">${SITE.email}</a>.</p>
</div></section>`,
});

export const DRAFT_PAGES = [startHere, whyPage, wholesale, wholesalePrices, partners];
