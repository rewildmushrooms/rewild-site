// REWILD crew training: a private, unlinked page (noindex, out of the sitemap, not in any menu)
// for Jade, Pete, Sean and anyone working the table. Learn the grower, the four mushrooms,
// the lab numbers and how to answer common questions without making health claims.
// Facts come from the live site, the lab results page, catalog/pricing and nucelium.com (Oct 2026).
//
// Question format: { c: topic, h: 1 = hard, q, a: [answers], ok: index or [indexes] (pick all), why }
// Wrong answers are deliberately close to the truth (near-miss numbers, plausible wording that breaks a rule).

const DECK = [
  // ---------- The grower ----------
  { c: 'grower', q: 'Where exactly is the grow facility?', a: ['Coldstream, BC', 'Vernon, BC', 'Kelowna, BC', 'Salmon Arm, BC'], ok: 0,
    why: 'Coldstream, in the North Okanagan (right next to Vernon, which is why people mix them up).' },
  { c: 'grower', q: 'How big is the facility?', a: ['45,000 sq ft', '25,000 sq ft', '60,000 sq ft', '100,000 sq ft'], ok: 0, why: '45,000 square feet.' },
  { c: 'grower', q: 'How is the facility powered?', a: ['Entirely by solar, from BC\'s largest rooftop array', 'Half solar, half BC Hydro', 'BC Hydro with solar backup', 'Geothermal'], ok: 0,
    why: '100% solar, BC\'s largest rooftop installation. Say "entirely solar", not "mostly".' },
  { c: 'grower', q: 'What do the mushrooms grow on?', a: ['Certified organic sorghum', 'Organic brown rice', 'Organic oats', 'Birch sawdust'], ok: 0,
    why: 'Sorghum. Brown rice and oats are what a lot of other brands use, so it\'s an easy trap.' },
  { c: 'grower', h: 1, q: 'Which of these is NOT on the grower\'s certification list?', a: ['Fair Trade', 'Kosher', 'GMP', 'Halal'], ok: 0,
    why: 'The list is Organic, Vegan, Non-GMO, GMP, Kosher, Halal and Gluten Free. No Fair Trade.' },
  { c: 'grower', h: 1, q: 'Which phrasing is correct?', a: ['"Rewild Energy, powered by CordyFuel™"', '"Our CordyFuel™ Cordyceps"', '"Rewild CordyFuel™"', '"CordyFuel™ by REWILD"'], ok: 0,
    why: 'CordyFuel™ is NuCelium\'s trademark. We are authorized to say "powered by". Anything that implies we own it is wrong.' },
  { c: 'grower', h: 1, q: 'In public, how do you describe what goes into a full-spectrum powder?', a: ['"The whole organism: fruiting body, mycelium and what they release"', '"Our Myco-Fermented Matrix™"', '"Pure fruiting body extract"', '"MFM™ technology"'], ok: 0,
    why: 'MFM™ / Myco-Fermented Matrix™ is NuCelium\'s trademarked term. Explain it in our own words instead.' },
  { c: 'grower', h: 1, q: 'The exact award name to use:', a: ['2025 Cordy Cup · Best Fruiting Body / Full Spectrum', '2025 Cordy Cup · Most Potent Cordyceps', '2024 Cordy Cup · Gold Medal', '2025 Cordy Cup · Best Extract'], ok: 0,
    why: 'Use the exact name. NuCelium reports it as the highest bioactive potency recorded in the competition\'s history.' },
  { c: 'grower', q: 'How does the grower verify batches?', a: ['UPLC testing for potency, DNA for species', 'A taste panel', 'HPLC once a year', 'Supplier paperwork only'], ok: 0, why: 'AOAC-certified, UPLC-based testing, plus DNA species authentication.' },
  { c: 'grower', h: 1, q: 'NuCelium\'s upcoming standardized Reishi is standardized to:', a: ['Ganoderic acid', 'Erinacine A', 'Betulin', 'Cordycepin'], ok: 0,
    why: 'Reishi: ganoderic acid (Dec 2026). Lion\'s Mane: Erinacine A (Nov 2026). Chaga: betulin and others (coming). Don\'t promise these dates to customers.' },
  { c: 'grower', q: 'Who does NuCelium mainly sell to?', a: ['Other brands (supplements, drinks, foods, pet, equine)', 'Shoppers at farmers markets', 'Pharmacies only', 'Restaurants'], ok: 0,
    why: 'They are a B2B grower. That\'s why REWILD exists: we bring their mushrooms to people directly.' },

  // ---------- The core 4 ----------
  { c: 'mushrooms', h: 1, q: 'Which Cordyceps species is Rewild Energy?', a: ['Cordyceps militaris', 'Cordyceps sinensis', 'Ophiocordyceps sinensis', 'Cordyceps ventricosa'], ok: 0,
    why: 'Militaris. Sinensis (Ophiocordyceps) is the wild caterpillar fungus from the Himalayas, which is not what we sell.' },
  { c: 'mushrooms', h: 1, q: 'Hericium is the genus of:', a: ['Lion\'s Mane', 'Reishi', 'Chaga', 'Cordyceps'], ok: 0, why: 'Lion\'s Mane = Hericium erinaceus. Reishi = Ganoderma. Chaga = Inonotus obliquus.' },
  { c: 'mushrooms', h: 1, q: 'Ganoderma is the genus of:', a: ['Reishi', 'Chaga', 'Lion\'s Mane', 'Cordyceps'], ok: 0, why: 'Reishi = Ganoderma.' },
  { c: 'mushrooms', q: 'In the wild, Chaga grows on:', a: ['Birch', 'Pine', 'Oak', 'Maple'], ok: 0, why: 'Birch. It grows as a sclerotium, so never call Chaga "fruiting body and mycelium".' },
  { c: 'mushrooms', q: 'A customer hates bitter flavours. Which one do you gently steer them away from to start?', a: ['Peace (Reishi)', 'Energy (Cordyceps)', 'Clarity (Lion\'s Mane)', 'Strength (Chaga)'], ok: 0,
    why: 'Reishi is bitter and bold. If they still want it: pair it with hot cacao, chai or a dark roast.' },
  { c: 'mushrooms', q: 'Which taste note goes with Strength (Chaga)?', a: ['Smooth, a little smoky, nutty', 'Mild, slightly sweet, caramel', 'Gentle, savoury, earthy', 'Bitter, bold, woody'], ok: 0,
    why: 'Energy: mild, caramel. Clarity: savoury, earthy. Strength: smooth, smoky, nutty. Peace: bitter, bold.' },
  { c: 'mushrooms', q: 'Someone asks what to put in their evening hot cacao. Best pick?', a: ['Peace (Reishi)', 'Energy (Cordyceps)', 'The Energy Tincture', 'Clarity (Lion\'s Mane)'], ok: 0,
    why: 'Talk timing and taste: many people save Peace for the quiet end of the day, and its bitterness suits rich drinks.' },
  { c: 'mushrooms', q: 'Energy Tincture serving size:', a: ['10 to 20 ml', '3 to 5 ml', '1 dropper', '30 ml'], ok: 0,
    why: '10 to 20 ml, so 5 to 10 servings per 100 ml bottle. "3 to 5 ml" is the old label and must never be quoted.' },
  { c: 'mushrooms', q: 'The All Four Set (4 × 100 g) costs:', a: ['$195 ($230 value)', '$230', '$180', '$200'], ok: 0, why: '$195, a $35 saving on buying all four separately.' },
  { c: 'mushrooms', q: 'The Energy Duo (powder + tincture) costs:', a: ['$90 ($110 value)', '$110', '$80', '$100'], ok: 0, why: '$90 for Energy powder ($80) plus a tincture ($30).' },

  // ---------- Quality and lab ----------
  { c: 'lab', q: 'Minimum cordycepin standard for CordyFuel™:', a: ['3 mg/g', '1 mg/g', '5 mg/g', '10 mg/g'], ok: 0, why: '≥ 3 mg/g in every batch, third-party verified before release.' },
  { c: 'lab', h: 1, q: 'Which cordycepin number can you quote as our best lab result?', a: ['7.1 mg/g', '14.87 mg/g', '11X the average', '5.7 mg/g is the highest'], ok: 0,
    why: '7.1 mg/g (independent lab). 14.87 and "11X" were removed from the site because NuCelium doesn\'t state them publicly. 5.7 is a recent UPLC result, not the best.' },
  { c: 'lab', h: 1, q: 'Which test is NOT in our 7-test microbial panel?', a: ['Listeria', 'Salmonella', 'E. coli', 'S. aureus'], ok: 0,
    why: 'The seven: total plate count, yeast, mould, coliforms, E. coli, Salmonella and S. aureus.' },
  { c: 'lab', q: 'Which powder measured the highest beta-glucans?', a: ['Strength (Chaga) · 62.1%', 'Energy (Cordyceps) · 42.8%', 'Clarity (Lion\'s Mane) · 52.0%', 'Peace (Reishi) · 54.4%'], ok: 0,
    why: 'Chaga 62.1%, Reishi 54.4%, Lion\'s Mane 52.0%, Cordyceps 42.8%. Composition only, never what it does.' },
  { c: 'lab', h: 1, q: 'Which product has a LOWER beta-glucan standard (15% instead of 30%)?', a: ['Strength (Chaga)', 'Energy (Cordyceps)', 'Clarity (Lion\'s Mane)', 'Peace (Reishi)'], ok: 0,
    why: 'Chaga\'s standard is ≥ 15%, yet it measured the highest of all (62.1%). Good trivia for the table.' },
  { c: 'lab', q: 'Gluten limit and recent result:', a: ['Under 15 ppm (tested under 10)', 'Under 20 ppm (tested 18)', 'Gluten isn\'t tested', 'Zero gluten guaranteed'], ok: 0, why: 'Must be under 15 ppm. Recent lots tested under 10 ppm.' },
  { c: 'lab', h: 1, q: 'How is species identity confirmed on our lots?', a: ['DNA sequencing or chemical fingerprinting (FTIR / HPTLC)', 'Microscope check only', 'Smell and colour', 'The grower\'s word'], ok: 0, why: 'Every lot, by DNA or chemical fingerprinting.' },
  { c: 'lab', q: 'Why are full COA PDFs sent on request instead of posted?', a: ['Each is lot-specific and names our grower', 'They are confidential', 'They don\'t exist', 'Only wholesale buyers can see them'], ok: 0,
    why: 'We email the report for their lot, usually within one business day. The summary numbers are public on /lab-results/.' },
  { c: 'lab', q: 'What does the water-activity test tell you?', a: ['The powder stays dry and stable (3-year shelf life)', 'How fast it dissolves', 'Its caffeine level', 'How much water to mix it with'], ok: 0, why: 'Stability. Every lot carries a 3-year shelf life.' },

  // ---------- Offers and policies ----------
  { c: 'use', q: 'The guarantee window:', a: ['14 days from delivery', '30 days from purchase', '14 days from purchase', '60 days'], ok: 0,
    why: 'Full refund within 14 days of delivery. No questions asked, no need to send it back.' },
  { c: 'use', q: 'Free shipping in Canada starts at:', a: ['$175', '$150', '$100', '$200'], ok: 0, why: 'Otherwise $20 flat. No local pickup.' },
  { c: 'use', h: 1, q: 'What triggers a free Energy Tincture?', a: ['Paying $200+ for products (after discounts)', 'Buying any 2 bags', 'Using a promo code', 'Ordering the All Four Set'], ok: 0,
    why: 'When what they pay for products reaches $200. Not during the launch party, which has its own pricing.' },
  { c: 'use', h: 1, q: 'What is the "stock up" saving?', a: ['10% off when you buy 2 or more bags', '20% off 3 bags', 'Free shipping on 2 bags', '$10 off each extra bag'], ok: 0,
    why: '10% off with 2+ bags. Codes don\'t stack with it: the cart applies whichever saves more.' },
  { c: 'use', q: 'The referral program:', a: ['Friend gets $20 off a first order of $75+, you get $20 off your next', '20% off for both', '$10 each, no minimum', 'Free bag after 3 referrals'], ok: 0, why: 'Give $20, get $20.' },
  { c: 'use', h: 1, q: 'A US customer asks about shipping. You say:', a: ['Check out with United States selected, then we email a shipping and duties quote to pay before it ships', 'It\'s free over $175', 'We don\'t ship to the US', 'Flat $20 like Canada'], ok: 0,
    why: 'US shipping and duties are quoted per order after checkout (Square invoice).' },
  { c: 'use', h: 1, q: 'Launch party: what does someone pay for a cart worth $333+ at regular prices?', a: ['40% off the whole order', '33% off, plus 7% with a code', '40% off only the items over $333', '33% off plus free shipping only'], ok: 0,
    why: '33% off everything, and the whole order is 40% off at $333+ (measured at regular prices). Codes are paused. Limit 3 of each.' },

  // ---------- Objections: every option sounds friendly. Only one stays inside the rules. ----------
  { c: 'objections', h: 1, q: '"Will Lion\'s Mane help my memory?"', a: [
      '"Lots of people make it part of their workday. I can\'t speak to health effects, but every lot is tested and you\'ve got 14 days to see if you love it."',
      '"Studies suggest it supports memory, so that\'s why most people buy it."',
      '"It\'s known as the brain mushroom."',
      '"Give it a couple of weeks and you\'ll notice sharper focus."'], ok: 0,
    why: 'Options 2 to 4 all imply a health effect. "Studies suggest" is still a claim when we\'re the ones selling it.' },
  { c: 'objections', h: 1, q: '"Does Cordyceps give you energy like coffee?"', a: [
      '"There\'s no caffeine or stimulants in it. A lot of people add it to their morning coffee or before they head out."',
      '"Yes, but cleaner, with no crash."',
      '"It\'s natural energy, that\'s why it\'s called Energy."',
      '"Athletes use it for stamina."'], ok: 0,
    why: '"Cleaner energy, no crash" and "stamina" are effect claims. Describe what it is and when people use it.' },
  { c: 'objections', h: 1, q: '"Why is Energy $80 when the others are $50?"', a: [
      '"It\'s CordyFuel™: standardized to at least 3 mg/g cordycepin every batch, third-party verified, and it won the 2025 Cordy Cup."',
      '"Because it works better than the others."',
      '"It has 11 times more cordycepin than other Cordyceps."',
      '"Cordyceps is the strongest mushroom in the world."'], ok: 0,
    why: 'Stick to verifiable facts. "11X" was removed from the site, and "works better" or "strongest" are claims.' },
  { c: 'objections', h: 1, q: '"Is it just mycelium on grain? That\'s filler."', a: [
      '"It includes the grain it grew on. It\'s the whole organism, and every lot is measured: beta-glucans come in between 42% and 62%."',
      '"No grain at all, it\'s 100% mushroom."',
      '"We have no fillers."',
      '"Fruiting-body-only brands are ripping people off."'], ok: 0,
    why: 'Honesty wins. "No fillers" and "100% mushroom" were removed from the site because they aren\'t accurate. Don\'t trash other brands.' },
  { c: 'objections', h: 1, q: '"How is this different from Four Sigmatic?"', a: [
      '"I can only speak for ours: grown in BC from DNA-verified strains, the whole organism, every lot tested and the numbers shared."',
      '"Theirs are imported from China."',
      '"Theirs are mostly filler."',
      '"Ours are about twice as strong."'], ok: 0,
    why: 'Never make claims about a competitor you can\'t prove. Talk about what you know about ours.' },
  { c: 'objections', q: '"I\'m pregnant. Which one is safest?"', a: [
      '"Please check with your healthcare practitioner before using any of them."',
      '"Reishi is the gentlest."',
      '"They\'re just foods, so any of them is fine."',
      '"Start with half a serving."'], ok: 0,
    why: 'Pregnant, nursing or on medication: always the practitioner. It\'s printed on every page of the site.' },
  { c: 'objections', q: '"Can I give it to my dog?"', a: [
      '"We make it for people, so I\'d check with your vet first."',
      '"Yes, pets love Lion\'s Mane."',
      '"Our grower makes pet products, so it\'s the same thing."',
      '"Half a serving for small dogs."'], ok: 0,
    why: 'NuCelium supplies pet brands, but REWILD products are made and labelled for people. Vet first.' },
  { c: 'objections', h: 1, q: 'Pick the caption that is safe to post:', a: [
      '"Add Rewild Clarity to your morning coffee. Grown in BC, tested every lot."',
      '"Take Clarity daily for focus."',
      '"Our favourite daily mushroom ritual."',
      '"No fillers, just mushrooms."'], ok: 0,
    why: '"Take" and "for focus" read like a supplement claim, "ritual" is banned, and "no fillers" was retired.' },
  { c: 'objections', h: 1, q: 'Pick ALL the things you can say:', a: [
      'Grown in British Columbia', 'Every lot is third-party tested', 'Supports your immune system', 'We grow our own mushrooms', 'Organic', 'Caffeine-free'], ok: [0, 1, 4, 5],
    why: 'Immune support is a health claim. "We grow" is false: NuCelium grows, REWILD sells.' },
  { c: 'objections', h: 1, q: 'Pick ALL the words to avoid in REWILD copy:', a: ['Ritual', 'Dose', 'Use', 'No fillers', 'Supplement regimen', 'Journey'], ok: [0, 1, 3, 4],
    why: '"Use" is the food word we want. "Journey" is fine (Jade likes it). Ritual, dose, regimen and "no fillers" are out.' },
  { c: 'objections', q: '"I tried mushrooms before and felt nothing."', a: [
      'Ask how they used it and for how long, suggest one bag in their morning cup for a few weeks, and mention the 14-day guarantee',
      '"Ours are stronger, so you\'ll feel these."',
      '"You probably had a low-quality brand."',
      '"Double the serving and you\'ll notice."'], ok: 0,
    why: 'Curious, not pushy. No promises about feeling anything.' },
  { c: 'objections', q: 'Someone asks about heavy metals in Chaga and you\'re not sure. You:', a: [
      '"Good question. Let me check and email you." Then follow up from hello@rewildmushrooms.com',
      '"It\'s all tested for everything."',
      '"Chaga never has heavy metals."',
      '"That\'s only a problem with Chinese mushrooms."'], ok: 0,
    why: 'Never guess. The heavy metal limits are on the spec sheets for some products, and the Chaga sheet is still an open question with the grower.' },
];

const CATS = { grower: 'The grower', mushrooms: 'The core 4', lab: 'Quality & lab', use: 'Offers & policies', objections: 'Objections' };

const CHEAT = [
  ['The grower', ['NuCelium grows it. REWILD sells it.', 'Coldstream, BC · 45,000 sq ft · 100% solar', 'DNA-verified strains on organic sorghum', 'Organic, Vegan, Non-GMO, GMP, Kosher, Halal, GF', '2025 Cordy Cup · Best Fruiting Body / Full Spectrum', '"Powered by CordyFuel™" (their trademark)']],
  ['The core 4', ['Energy · Cordyceps militaris · mild, caramel · $80', 'Clarity · Lion\'s Mane (Hericium) · savoury · $50', 'Strength · Chaga (birch sclerotium) · smoky · $50', 'Peace · Reishi (Ganoderma) · bitter · $50', 'Tincture $30 · 10 to 20 ml · Duo $90 · All Four $195']],
  ['The numbers', ['Cordycepin ≥ 3 mg/g · best 7.1 mg/g', 'Beta-glucans 42.8 / 52.0 / 54.4 / 62.1%', 'Chaga standard ≥ 15%, others ≥ 30%', '7 microbial tests · gluten < 15 ppm', '3-year shelf life · COA on request']],
  ['Offers', ['14 days from delivery, full refund', 'Free shipping $175+ · else $20', 'Stock up: 10% off 2+ bags', 'Free tincture at $200+ paid', 'Refer: give $20, get $20 ($75+)']],
  ['How to talk', ['Use / add, never take / dose', 'Taste and timing, never effects', '"Nothing added", never "no fillers"', 'No "ritual", no competitor claims', 'Health or pets: practitioner or vet', 'Not sure? "Let me check."']],
];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const okList = (d) => (Array.isArray(d.ok) ? d.ok : [d.ok]);

export const crewPage = {
  path: '/crew/',
  title: 'REWILD Crew Training',
  description: 'Private training for the REWILD crew.',
  noindex: true,
  head: `<style>
.crew{max-width:880px;margin:0 auto;padding:48px 20px 80px}
.crew h1{font-family:var(--display);text-transform:uppercase;font-size:clamp(34px,6vw,56px);line-height:1;margin:0 0 10px}
.crew .lead{font-size:18px;color:var(--soft);margin:0 0 22px}
.cw-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 18px}
.cw-tabs button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:9px 16px;font-weight:700;cursor:pointer;font-size:14px}
.cw-tabs button[aria-pressed=true]{background:#121310;color:#fff;border-color:#121310}
.cw-modes{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin:0 0 18px}
.cw-modes button{text-align:left;border:2px solid var(--line);background:#fff;border-radius:12px;padding:14px 16px;cursor:pointer}
.cw-modes button b{display:block;font-size:16px;margin-bottom:3px}.cw-modes button span{font-size:13px;color:var(--soft)}
.cw-modes button[aria-pressed=true]{border-color:#121310;background:#121310;color:#fff}.cw-modes button[aria-pressed=true] span{color:rgba(255,255,255,.75)}
.cw-cheat{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.cw-cheat div{background:var(--stone);border-radius:var(--radius);padding:16px 18px}
.cw-cheat h3{margin:0 0 8px;font-size:15px;text-transform:uppercase;letter-spacing:.08em}
.cw-cheat li{margin:0 0 6px;font-size:15px;line-height:1.4}.cw-cheat ul{margin:0;padding-left:18px}
.cw-card{background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:22px;box-shadow:0 6px 24px rgba(0,0,0,.05)}
.cw-meta{display:flex;justify-content:space-between;gap:10px;font-size:13px;color:var(--soft);text-transform:uppercase;letter-spacing:.08em;margin:0 0 10px;flex-wrap:wrap}
.cw-hard{background:#121310;color:#F5D81C;border-radius:4px;padding:1px 6px;margin-left:6px;font-weight:800}
.cw-bar{height:6px;background:var(--stone);border-radius:9px;overflow:hidden;margin:0 0 16px}.cw-bar i{display:block;height:100%;background:linear-gradient(90deg,#22B573,#2F7FE0);transition:width .3s}
.cw-timer{height:4px;background:#f3d6cf;border-radius:9px;overflow:hidden;margin:-10px 0 16px}.cw-timer i{display:block;height:100%;background:#d0442b;width:100%}
.cw-q{font-size:22px;font-weight:800;line-height:1.3;margin:0 0 6px}
.cw-hint{font-size:14px;color:var(--soft);margin:0 0 14px}
.cw-opts{display:grid;gap:10px}
.cw-opts button{text-align:left;border:2px solid var(--line);background:#fff;border-radius:10px;padding:13px 15px;font-size:16px;line-height:1.35;cursor:pointer;color:#121310}
.cw-opts button:hover:not(:disabled){border-color:#121310}
.cw-opts button.sel{border-color:#2F7FE0;background:#eef4fd}
.cw-opts button:disabled{color:#121310;opacity:1;cursor:default}
.cw-opts button.right{border-color:#22B573;background:#eaf8f1}.cw-opts button.wrong{border-color:#d0442b;background:#fdeeea}.cw-opts button.missed{border-style:dashed;border-color:#22B573}
.cw-why{margin:16px 0 0;padding:14px 16px;border-radius:10px;background:var(--stone);font-size:16px;line-height:1.5}
.cw-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;align-items:center}
.cw-score{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:14px 0}
.cw-score div{background:var(--stone);border-radius:10px;padding:12px 14px;font-size:14px}.cw-score b{display:block;font-size:22px}
.cw-review{margin:14px 0 0;padding:0;list-style:none}.cw-review li{border-top:1px solid var(--line);padding:12px 0;font-size:15px;line-height:1.45}
.cw-review li b{display:block}.cw-review .ans{color:#147a4d}
.cw-mastery{font-size:14px;color:var(--soft);margin:-6px 0 16px}
.cw-play details{border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin:0 0 10px;background:#fff}
.cw-play summary{font-weight:800;cursor:pointer;font-size:17px}.cw-play p{margin:10px 0 0;line-height:1.5}
.cw-play .no{color:#b4321c}
</style>`,
  body: `<main class="crew" id="main">
  <p class="eyebrow">Crew only · not listed on the site</p>
  <h1>REWILD crew training</h1>
  <p class="lead">Know the grower, the core 4, the numbers and how to answer anything at the table without making a health claim. The wrong answers are close to the truth on purpose.</p>
  <div class="cw-tabs" role="group" aria-label="Sections">
    <button data-v="quiz" aria-pressed="true">Quiz</button>
    <button data-v="cheat" aria-pressed="false">Cheat sheet</button>
    <button data-v="play" aria-pressed="false">Objection playbook</button>
  </div>
  <section data-view="quiz">
    <div class="cw-modes" role="group" aria-label="Mode">
      <button data-mode="practice" aria-pressed="true"><b>Practice</b><span>Pick a topic. See why after every answer.</span></button>
      <button data-mode="table" aria-pressed="false"><b>Table test</b><span>20 questions, hard ones only, no hints until the end. Pass is 85%.</span></button>
      <button data-mode="lightning" aria-pressed="false"><b>Lightning</b><span>15 questions, 10 seconds each.</span></button>
      <button data-mode="weak" aria-pressed="false"><b>Weak spots</b><span>Only what you haven’t mastered yet (right twice in a row).</span></button>
    </div>
    <p class="cw-mastery" id="cw-mastery"></p>
    <div class="cw-tabs" role="group" aria-label="Topic" id="cw-cats"></div>
    <div class="cw-card" id="cw-card"></div>
  </section>
  <section data-view="cheat" hidden><div class="cw-cheat">${CHEAT.map(([h, l]) => `<div><h3>${esc(h)}</h3><ul>${l.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</div></section>
  <section data-view="play" class="cw-play" hidden>
    ${DECK.filter((d) => d.c === 'objections' && !Array.isArray(d.ok)).map((d) => `<details><summary>${esc(d.q)}</summary><p><b>Say:</b> ${esc(d.a[d.ok])}</p><p>${esc(d.why)}</p><p class="no"><b>Don’t say:</b> ${esc(d.a.filter((_, i) => i !== d.ok).join(' · '))}</p></details>`).join('')}
  </section>
</main>`,
  scripts: `<script>
(function(){
  var DECK=${JSON.stringify(DECK.map((d, i) => ({ ...d, id: i, ok: okList(d) })))}, CATS=${JSON.stringify(CATS)};
  var KEY='rewild_crew_v2', st={best:{},streak:{}};try{var s=JSON.parse(localStorage.getItem(KEY)||'null');if(s)st=s;}catch(e){}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}}
  var $=function(s){return document.querySelector(s)}, esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
  function view(v){document.querySelectorAll('[data-v]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.v===v)});document.querySelectorAll('[data-view]').forEach(function(s){s.hidden=s.dataset.view!==v});}
  document.querySelectorAll('[data-v]').forEach(function(b){b.onclick=function(){view(b.dataset.v)}});
  function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
  var mode='practice', cat='all', round=[], i=0, score=0, missed=[], timer=null;
  function mastered(d){return (st.streak[d.id]||0)>=2}
  function mastery(){var m=DECK.filter(mastered).length;$('#cw-mastery').textContent='Mastered '+m+' of '+DECK.length+' questions'+(m===DECK.length?'. You know this cold.':'.');}
  function cats(){var el=$('#cw-cats');if(mode!=='practice'){el.hidden=true;return;}el.hidden=false;
    el.innerHTML=['all'].concat(Object.keys(CATS)).map(function(k){var n=k==='all'?DECK.length:DECK.filter(function(d){return d.c===k}).length,b=st.best['practice:'+k];return '<button data-cat="'+k+'" aria-pressed="'+(k===cat)+'">'+(k==='all'?'Everything':CATS[k])+' · '+n+(b!=null?' · best '+b+'%':'')+'</button>'}).join('');
    el.querySelectorAll('[data-cat]').forEach(function(b){b.onclick=function(){cat=b.dataset.cat;start()}});}
  document.querySelectorAll('[data-mode]').forEach(function(b){b.onclick=function(){mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(function(x){x.setAttribute('aria-pressed',x===b)});start()}});
  function pick(){
    if(mode==='table')return shuffle(DECK.filter(function(d){return d.h})).slice(0,20);
    if(mode==='lightning')return shuffle(DECK.filter(function(d){return d.ok.length===1})).slice(0,15);
    if(mode==='weak'){var w=DECK.filter(function(d){return !mastered(d)});return shuffle(w.length?w:DECK).slice(0,15);}
    return shuffle(DECK.filter(function(d){return cat==='all'||d.c===cat}));
  }
  function start(list){clearInterval(timer);round=list||pick();i=0;score=0;missed=[];cats();mastery();ask();}
  function record(d,right){st.streak[d.id]=right?(st.streak[d.id]||0)+1:0;save();}
  function ask(){clearInterval(timer);var d=round[i],card=$('#cw-card'),multi=d.ok.length>1;
    var opts=shuffle(d.a.map(function(t,k){return {t:t,ok:d.ok.indexOf(k)>=0}}));
    card.innerHTML='<div class="cw-meta"><span>'+esc(CATS[d.c])+(d.h?'<span class="cw-hard">HARD</span>':'')+'</span><span>'+(i+1)+' of '+round.length+' · '+score+' right</span></div><div class="cw-bar"><i style="width:'+(i/round.length*100)+'%"></i></div>'+(mode==='lightning'?'<div class="cw-timer"><i id="cw-t"></i></div>':'')+'<p class="cw-q">'+esc(d.q)+'</p><p class="cw-hint">'+(multi?'Pick all that apply, then check.':'Pick one.')+'</p><div class="cw-opts">'+opts.map(function(o,k){return '<button data-k="'+k+'">'+esc(o.t)+'</button>'}).join('')+'</div><div id="cw-after">'+(multi?'<div class="cw-row"><button class="btn btn-yellow" id="cw-check">Check</button></div>':'')+'</div>';
    var btns=card.querySelectorAll('[data-k]');
    function finish(chosen){clearInterval(timer);btns.forEach(function(x){x.disabled=true;var o=opts[+x.dataset.k],picked=chosen.indexOf(+x.dataset.k)>=0;if(o.ok)x.classList.add(picked?'right':'missed');else if(picked)x.classList.add('wrong');x.classList.remove('sel')});
      var right=opts.every(function(o,k){return o.ok===(chosen.indexOf(k)>=0)});
      if(right)score++;else missed.push(d);record(d,right);
      var next='<div class="cw-row"><button class="btn btn-yellow" id="cw-next">'+(i+1<round.length?'Next question':'See my score')+'</button></div>';
      $('#cw-after').innerHTML=(mode==='table'?'<p class="cw-why"><b>'+(right?'Right.':'Wrong.')+'</b> Explanations at the end.</p>':'<p class="cw-why"><b>'+(right?'Yes. ':chosen.length?'Not quite. ':'Out of time. ')+'</b>'+esc(d.why)+'</p>')+next;
      $('#cw-next').onclick=function(){i++;i<round.length?ask():done()};$('#cw-next').focus();}
    if(multi){btns.forEach(function(b){b.onclick=function(){b.classList.toggle('sel')}});$('#cw-check').onclick=function(){finish([].map.call(card.querySelectorAll('.sel'),function(x){return +x.dataset.k}))};}
    else btns.forEach(function(b){b.onclick=function(){finish([+b.dataset.k])}});
    if(mode==='lightning'){var t0=Date.now(),T=10000,bar=$('#cw-t');timer=setInterval(function(){var left=T-(Date.now()-t0);if(bar)bar.style.width=Math.max(0,left/T*100)+'%';if(left<=0)finish([]);},100);}
  }
  function done(){var pct=Math.round(score/round.length*100),key=mode+':'+(mode==='practice'?cat:'all');if(st.best[key]==null||pct>st.best[key]){st.best[key]=pct;save();}
    var by={};round.forEach(function(d){by[d.c]=by[d.c]||[0,0];by[d.c][1]++;if(missed.indexOf(d)<0)by[d.c][0]++});
    var verdict=mode==='table'?(pct>=85?'Passed. You\\'re ready for the table.':'Not yet. You need 85%. Review your misses below and try again.'):(pct===100?'Perfect round.':pct>=85?'Strong. Clean up the misses below.':'Keep going. Review the misses, then run Weak spots.');
    $('#cw-card').innerHTML='<p class="cw-q">'+score+' of '+round.length+' · '+pct+'%</p><p>'+verdict+(st.best[key]!=null?' Best in this mode: '+st.best[key]+'%.':'')+'</p><div class="cw-score">'+Object.keys(by).map(function(k){return '<div>'+esc(CATS[k])+'<b>'+by[k][0]+' / '+by[k][1]+'</b></div>'}).join('')+'</div>'+
      (missed.length?'<ul class="cw-review">'+missed.map(function(d){return '<li><b>'+esc(d.q)+'</b><span class="ans">'+esc(d.ok.map(function(k){return d.a[k]}).join(' · '))+'</span><br>'+esc(d.why)+'</li>'}).join('')+'</ul>':'')+
      '<div class="cw-row">'+(missed.length?'<button class="btn btn-yellow" id="cw-miss">Retry my '+missed.length+' miss'+(missed.length===1?'':'es')+'</button>':'')+'<button class="btn btn-outline" id="cw-again">New round</button></div>';
    cats();mastery();
    if(missed.length)$('#cw-miss').onclick=function(){start(shuffle(missed.slice()))};$('#cw-again').onclick=function(){start()};}
  start();
})();
</script>`,
};
