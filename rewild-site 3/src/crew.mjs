// REWILD crew training: a private, unlinked page (noindex, out of the sitemap, not in any menu)
// for Jade, Pete, Sean and anyone working the table. Learn the grower, the four mushrooms,
// the lab numbers and how to answer common questions without making health claims.
// Facts come from the live site, the lab results page and nucelium.com (Oct 2026).

const DECK = [
  // ---------- The grower ----------
  { c: 'grower', q: 'Who grows REWILD mushrooms?', a: ['NuCelium, a certified organic grower in British Columbia', 'REWILD grows them on Jade\'s land in the Slocan Valley', 'An importer that sources from several farms', 'A lab in Vancouver'], ok: 0,
    why: 'REWILD is the seller, not the grower. NuCelium grows them. REWILD chooses the products, brands them, packs them and shares the lab results. Never say "we grow".' },
  { c: 'grower', q: 'Where is the NuCelium facility?', a: ['Coldstream, BC (North Okanagan)', 'Nelson, BC', 'Calgary, AB', 'Vancouver Island'], ok: 0,
    why: 'Coldstream, British Columbia. Nothing is imported from overseas.' },
  { c: 'grower', q: 'What makes the facility stand out?', a: ['45,000 sq ft and 100% solar powered (BC\'s largest rooftop array)', 'It\'s a wild-harvest operation in the forest', 'It\'s a shared kitchen space', 'It runs on natural gas'], ok: 0,
    why: '45,000 square feet, run entirely on solar from BC\'s largest rooftop installation. A great line for people who care how things are made.' },
  { c: 'grower', q: '"Grown, not sourced" means:', a: ['They cultivate their own DNA-verified strains instead of buying cheap powder and relabelling it', 'Mushrooms are foraged from the wild', 'They buy from the cheapest farm each season', 'It is a slogan with no meaning'], ok: 0,
    why: 'NuCelium grows its own hand-picked, DNA-verified strains. Many brands import bulk powder and put their label on it.' },
  { c: 'grower', q: 'What do the mushrooms grow on?', a: ['Certified organic sorghum grain', 'Wood chips and sawdust', 'Rice flour with fillers', 'Soil'], ok: 0,
    why: 'Organic sorghum. The powder honestly includes the grain the mycelium grew on, which is why we say "Nothing added", never "no fillers".' },
  { c: 'grower', q: 'Which certifications does the grower list?', a: ['Organic, Vegan, Non-GMO, GMP, Kosher, Halal, Gluten Free', 'Only "natural"', 'Health Canada drug approval', 'None'], ok: 0,
    why: 'Seven certifications. Gluten tests under 10 ppm on our lots (the limit is 15).' },
  { c: 'grower', q: 'Who owns the CordyFuel™ trademark?', a: ['NuCelium, our grower', 'REWILD', 'Nobody, it is a generic word', 'Health Canada'], ok: 0,
    why: 'It is NuCelium\'s trademark, used with permission. Say "Rewild Energy, powered by CordyFuel™". Never "our CordyFuel™". Always the ™ and a capital F.' },
  { c: 'grower', q: 'What award did CordyFuel™ win?', a: ['2025 Cordy Cup, Best Fruiting Body / Full Spectrum', 'Best New Supplement 2024', 'Canada\'s Top Coffee Additive', 'It has not won an award'], ok: 0,
    why: 'NuCelium reports it as the highest bioactive potency recorded in the competition\'s history. Use the award\'s exact name.' },
  { c: 'grower', q: 'How does the grower check every batch?', a: ['UPLC lab testing for potency and DNA checks for species', 'They taste it', 'Visual check only', 'Customers report back'], ok: 0,
    why: 'AOAC-certified, UPLC-based testing, plus DNA confirmation of the species.' },
  { c: 'grower', q: 'What is coming from the grower in late 2026?', a: ['Standardized Lion\'s Mane (Nov), Reishi (Dec) and Chaga (soon)', 'A coffee shop chain', 'Nothing new', 'Psilocybin products'], ok: 0,
    why: 'Lion\'s Mane standardized to Erinacine A, Reishi to ganoderic acid, Chaga to betulin and others. Good to know, but don\'t promise dates to customers.' },

  // ---------- The core 4 ----------
  { c: 'mushrooms', q: 'Which mushroom is Rewild Energy?', a: ['Cordyceps militaris, powered by CordyFuel™', 'Lion\'s Mane', 'Reishi', 'Chaga'], ok: 0,
    why: 'Energy = Cordyceps. Clarity = Lion\'s Mane. Strength = Chaga. Peace = Reishi.' },
  { c: 'mushrooms', q: 'Rewild Clarity is:', a: ['Lion\'s Mane', 'Reishi', 'Chaga', 'Cordyceps'], ok: 0, why: 'Clarity = Lion\'s Mane. Gentle, savoury, earthy taste.' },
  { c: 'mushrooms', q: 'Rewild Strength is:', a: ['Chaga', 'Reishi', 'Lion\'s Mane', 'Cordyceps'], ok: 0, why: 'Strength = Chaga, "the king of mushrooms". Smooth, a little smoky and nutty.' },
  { c: 'mushrooms', q: 'Rewild Peace is:', a: ['Reishi', 'Chaga', 'Lion\'s Mane', 'Cordyceps'], ok: 0, why: 'Peace = Reishi. Bitter and bold, herbal and woody. Pairs with rich drinks like hot cacao or chai.' },
  { c: 'mushrooms', q: 'Which one tastes the most bitter?', a: ['Reishi (Peace)', 'Cordyceps (Energy)', 'Lion\'s Mane (Clarity)', 'They all taste the same'], ok: 0,
    why: 'Reishi is bitter and bold. Tip: pair it with something rich like cacao, chai or a dark roast.' },
  { c: 'mushrooms', q: 'Which has a mild, slightly sweet, caramel-toasty taste?', a: ['Cordyceps (Energy)', 'Reishi (Peace)', 'Chaga (Strength)', 'None of them'], ok: 0, why: 'Energy disappears into coffee, matcha, smoothies and oats.' },
  { c: 'mushrooms', q: 'When do most people use Peace (Reishi)?', a: ['The quiet end of the day', 'Right before a workout', 'Only at lunch', 'Never with food'], ok: 0,
    why: 'Describe timing and taste, not effects. "Many people save it for the evening, in a hot cacao."' },
  { c: 'mushrooms', q: 'Chaga is different from the other three because it is a:', a: ['Sclerotium (the dense growth on birch), not fruiting body + mycelium', 'Liquid', 'Seaweed', 'Synthetic extract'], ok: 0,
    why: 'Don\'t describe Chaga as "fruiting body and mycelium". It grows as a sclerotium.' },
  { c: 'mushrooms', q: 'What does "full spectrum" mean for our powders?', a: ['The whole organism: fruiting body, mycelium and the compounds they release', 'Fruiting body only', 'An extract with everything else removed', 'A blend of all four mushrooms'], ok: 0,
    why: 'In our own words: "the whole organism". Don\'t use NuCelium\'s trademarked MFM™ name in public.' },
  { c: 'mushrooms', q: 'The Energy Tincture is:', a: ['Alcohol-free, made with CordyFuel™, nothing added, 100 ml', 'A blend of all four mushrooms', 'Alcohol-based', 'Cordyceps plus caffeine'], ok: 0,
    why: '10 to 20 ml per serving, 5 to 10 servings per bottle. Drink it straight or add it to a drink. Never quote the old "3-5 ml" label.' },
  { c: 'mushrooms', q: 'Regular prices (CAD):', a: ['Energy $80 · Clarity, Strength, Peace $50 · Tincture $30 · Duo $90', 'All $50', 'Energy $50 · the rest $80', 'Everything $30'], ok: 0,
    why: 'The Duo is Energy powder plus a tincture for $90.' },

  // ---------- Quality and lab ----------
  { c: 'lab', q: 'How often are products tested?', a: ['Every lot, before it is released', 'Once a year', 'Only the first batch', 'Only if a customer asks'], ok: 0,
    why: 'Identity, potency, a 7-test microbial panel, gluten and water activity. Every lot.' },
  { c: 'lab', q: 'What is the minimum cordycepin standard for CordyFuel™?', a: ['3 mg/g or higher, every batch', '0.1 mg/g', '50%', 'There is no standard'], ok: 0,
    why: 'Our best independent lab result is 7.1 mg/g. A recent UPLC result was 5.7 mg/g. Cordycepin is a marker of quality, not a health claim.' },
  { c: 'lab', q: 'Beta-glucans across our four powders measured roughly:', a: ['42% to 62%', '1% to 5%', '90% to 99%', 'Not measured'], ok: 0,
    why: 'Energy 42.8%, Clarity 52.0%, Peace 54.4%, Strength 62.1%. Polysaccharides 50% to 72%. These describe what is in it, not what it does.' },
  { c: 'lab', q: 'A customer asks for the lab report. You:', a: ['Offer the full COA for their lot by email, usually within one business day', 'Say reports are secret', 'Send a screenshot from Instagram', 'Tell them to trust us'], ok: 0,
    why: 'Point them to rewildmushrooms.com/lab-results/ (the request form is there). Full PDFs are on request because they name the grower.' },
  { c: 'lab', q: 'Shelf life of the powders:', a: ['3 years from production', '3 months', '1 week after opening', 'Forever'], ok: 0, why: 'Water activity is measured on every lot so the powder stays dry and stable.' },
  { c: 'lab', q: 'Does CordyFuel™ contain caffeine?', a: ['No. No caffeine or stimulants', 'Yes, a little', 'Only the tincture does', 'It depends on the lot'], ok: 0, why: 'Pure Cordyceps militaris, nothing added.' },

  // ---------- Using it ----------
  { c: 'use', q: 'How much powder does the label suggest?', a: ['½ teaspoon a day', '3 tablespoons', 'One whole pouch a week', '10 grams per meal'], ok: 0,
    why: 'Add it to a smoothie, coffee, tea, soup, elixir, or hot water and honey. A pouch lasts about 60 days.' },
  { c: 'use', q: 'Best tip for warm drinks?', a: ['Add a little coconut oil or butter and blend so it mixes smooth', 'Boil it for 20 minutes', 'Add it to ice water only', 'Never mix it with anything'], ok: 0,
    why: 'The fat helps it emulsify so the drink isn\'t muddy. Customers love this tip.' },
  { c: 'use', q: 'Which words do we use?', a: ['"Use" or "add to your coffee"', '"Take your dose"', '"Your supplement regimen"', '"Your daily ritual"'], ok: 0,
    why: 'Our powders are sold as foods. Say use, add, enjoy, servings. Avoid take, dose, regimen, supplement. "Ritual" is banned from REWILD copy.' },
  { c: 'use', q: 'Shipping in Canada:', a: ['$20 flat, free on orders of $175+', 'Always free', '$5 flat', 'We don\'t ship in Canada'], ok: 0, why: 'US orders get a shipping and duties quote by email after checkout. Local pickup or delivery is free.' },
  { c: 'use', q: 'The guarantee:', a: ['Full refund within 14 days of delivery. No questions asked, no need to send it back', 'Store credit only', 'Refund only if unopened', 'No refunds'], ok: 0,
    why: '100% Risk-Free Guarantee. This is the best answer to "what if it doesn\'t work for me?"' },

  // ---------- Objections and tricky questions ----------
  { c: 'objections', q: '"What will it do for me?"', a: [
      'Talk about what it is, how people use it and how it tastes, then mention the 14-day guarantee',
      '"It will give you energy and fix your focus."',
      '"It cures anxiety."',
      '"It works better than coffee for everyone."'], ok: 0,
    why: 'We can\'t make health claims. Try: "It\'s a whole mushroom food. Most people add Energy to their morning coffee. Try it for two weeks, and if you don\'t love it you get a full refund."' },
  { c: 'objections', q: '"Can I use it with my medication / while pregnant?"', a: [
      '"Please check with your healthcare practitioner first."',
      '"Totally safe, go for it."',
      '"Just take half."',
      '"Stop your medication and try this instead."'], ok: 0,
    why: 'Never give medical advice. This is also printed on every page of the site.' },
  { c: 'objections', q: '"Why is this more expensive than Amazon mushroom powder?"', a: [
      'Grown in BC from DNA-verified strains, whole organism, every lot lab tested and the results are shared',
      '"Ours is just better, trust me."',
      '"Amazon powders are all fake."',
      '"We\'ll match any price."'], ok: 0,
    why: 'Stick to facts, don\'t trash competitors. A pouch lasts about 60 days, so $50 works out under a dollar a day.' },
  { c: 'objections', q: '"Isn\'t mycelium on grain just filler?"', a: [
      'Be honest: the powder includes the grain it grew on. It is the whole organism, and every lot is measured (beta-glucans 42% to 62%)',
      '"There\'s no grain in it at all."',
      '"We have no fillers."',
      '"Fruiting body only products are a scam."'], ok: 0,
    why: 'Honesty wins this one. Say "Nothing added", never "no fillers". Then show the numbers on the lab results page.' },
  { c: 'objections', q: '"Is this a magic mushroom?"', a: [
      '"No. These are functional, non-psychoactive mushrooms. No psilocybin."',
      '"Kind of, a little."',
      '"Only the Reishi."',
      '"We can\'t say."'], ok: 0, why: 'Clear and friendly. Cordyceps, Lion\'s Mane, Chaga and Reishi are not psychoactive.' },
  { c: 'objections', q: '"Where does it come from? Is it from China?"', a: [
      '"Grown in Coldstream, BC by NuCelium, on organic sorghum, in a solar-powered facility. Nothing imported."',
      '"We grow it ourselves in the Kootenays."',
      '"Mostly Canada, some overseas."',
      '"It\'s a secret."'], ok: 0, why: 'Remember: REWILD sells it, NuCelium grows it.' },
  { c: 'objections', q: '"Is it organic?"', a: ['"Yes. Our grower is certified organic and it\'s grown on organic sorghum."', '"Probably."', '"No, but it\'s natural."', '"Organic doesn\'t matter."'], ok: 0, why: 'Yes. It matches the pouches.' },
  { c: 'objections', q: '"I tried mushrooms before and felt nothing."', a: [
      'Ask how they used it and for how long, suggest a simple daily habit, and mention the 14-day guarantee',
      '"You need to take five times more."',
      '"You must have had a fake product."',
      '"It works instantly for everyone."'], ok: 0,
    why: 'Curious, not pushy: "Most people use it daily for a few weeks. Start with one bag in your morning cup. If it\'s not for you, it\'s refunded."' },
  { c: 'objections', q: 'You\'re asked something you don\'t know (like heavy metals in Chaga). You:', a: [
      '"Great question. Let me find out and get back to you." Then email hello@rewildmushrooms.com',
      'Make up a confident answer',
      'Change the subject',
      'Say "it\'s all tested for everything"'], ok: 0,
    why: 'Never guess. The full COA for their lot can be sent on request. Honesty builds trust faster than a perfect answer.' },
  { c: 'objections', q: '"Is it a supplement?"', a: ['"They\'re whole mushroom food powders. You add them to what you already eat and drink."', '"Yes, a medicinal supplement."', '"It\'s a drug-free medicine."', '"It\'s an NHP."'], ok: 0,
    why: 'Health Canada looks at how we present it. Food words keep us on the right side: food powder, use, add, servings.' },
];

const CATS = { grower: 'The grower', mushrooms: 'The core 4', lab: 'Quality & lab', use: 'Using it', objections: 'Questions & objections' };

const CHEAT = [
  ['The grower', ['NuCelium grows it. REWILD sells it.', 'Coldstream, BC · 45,000 sq ft · 100% solar', 'Own DNA-verified strains, organic sorghum', 'Organic, Vegan, Non-GMO, GMP, Kosher, Halal, GF', 'CordyFuel™ is NuCelium\'s trademark']],
  ['The core 4', ['Energy = Cordyceps · mild, caramel', 'Clarity = Lion\'s Mane · savoury, earthy', 'Strength = Chaga · smooth, smoky', 'Peace = Reishi · bitter, bold', 'Powders $50, Energy $80, Tincture $30']],
  ['The numbers', ['Every lot tested before release', 'Cordycepin ≥ 3 mg/g (best: 7.1)', 'Beta-glucans 42% to 62%', '7 microbial tests · gluten < 15 ppm', '3-year shelf life']],
  ['How to talk', ['Use / add, not take / dose', 'Taste and timing, never effects', '"Nothing added", never "no fillers"', 'Health questions: ask your practitioner', 'Don\'t know? "Let me find out."']],
];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const crewPage = {
  path: '/crew/',
  title: 'REWILD Crew Training',
  description: 'Private training for the REWILD crew.',
  noindex: true,
  head: `<style>
.crew{max-width:860px;margin:0 auto;padding:48px 20px 80px}
.crew h1{font-family:var(--display);text-transform:uppercase;font-size:clamp(34px,6vw,56px);line-height:1;margin:0 0 10px}
.crew .lead{font-size:18px;color:var(--soft);margin:0 0 26px}
.cw-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 22px}
.cw-tabs button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:9px 16px;font-weight:700;cursor:pointer;font-size:14px}
.cw-tabs button[aria-pressed=true]{background:#121310;color:#fff;border-color:#121310}
.cw-cheat{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}
.cw-cheat div{background:var(--stone);border-radius:var(--radius);padding:16px 18px}
.cw-cheat h3{margin:0 0 8px;font-size:15px;text-transform:uppercase;letter-spacing:.08em}
.cw-cheat li{margin:0 0 6px;font-size:15px;line-height:1.4}.cw-cheat ul{margin:0;padding-left:18px}
.cw-card{background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:22px;box-shadow:0 6px 24px rgba(0,0,0,.05)}
.cw-meta{display:flex;justify-content:space-between;gap:10px;font-size:13px;color:var(--soft);text-transform:uppercase;letter-spacing:.08em;margin:0 0 10px}
.cw-bar{height:6px;background:var(--stone);border-radius:9px;overflow:hidden;margin:0 0 16px}.cw-bar i{display:block;height:100%;background:linear-gradient(90deg,#22B573,#2F7FE0);transition:width .3s}
.cw-q{font-size:22px;font-weight:800;line-height:1.3;margin:0 0 16px}
.cw-opts{display:grid;gap:10px}
.cw-opts button{text-align:left;border:2px solid var(--line);background:#fff;border-radius:10px;padding:13px 15px;font-size:16px;line-height:1.35;cursor:pointer}
.cw-opts button:hover:not(:disabled){border-color:#121310}
.cw-opts button:disabled{color:#121310;opacity:1;cursor:default}
.cw-opts button.right{border-color:#22B573;background:#eaf8f1}.cw-opts button.wrong{border-color:#d0442b;background:#fdeeea}
.cw-why{margin:16px 0 0;padding:14px 16px;border-radius:10px;background:var(--stone);font-size:16px;line-height:1.5}
.cw-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;align-items:center}
.cw-score{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:14px 0}
.cw-score div{background:var(--stone);border-radius:10px;padding:12px 14px;font-size:14px}.cw-score b{display:block;font-size:22px}
.cw-play details{border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin:0 0 10px;background:#fff}
.cw-play summary{font-weight:800;cursor:pointer;font-size:17px}.cw-play p{margin:10px 0 0;line-height:1.5}
.cw-play .no{color:#b4321c}
</style>`,
  body: `<main class="crew" id="main">
  <p class="eyebrow">Crew only · not listed on the site</p>
  <h1>REWILD crew training</h1>
  <p class="lead">Ten minutes to know the grower, the core 4 and how to answer the questions people actually ask. Do a round, read why, retry what you missed.</p>
  <div class="cw-tabs" role="group" aria-label="Sections">
    <button data-v="cheat" aria-pressed="true">Cheat sheet</button>
    <button data-v="quiz" aria-pressed="false">Quiz</button>
    <button data-v="play" aria-pressed="false">Objection playbook</button>
  </div>
  <section data-view="cheat"><div class="cw-cheat">${CHEAT.map(([h, l]) => `<div><h3>${esc(h)}</h3><ul>${l.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</div>
    <div class="cw-row"><button class="btn btn-yellow" data-go="quiz">Start the quiz</button></div></section>
  <section data-view="quiz" hidden>
    <div class="cw-tabs" role="group" aria-label="Topic" id="cw-cats"></div>
    <div class="cw-card" id="cw-card"></div>
  </section>
  <section data-view="play" class="cw-play" hidden>
    ${DECK.filter((d) => d.c === 'objections').map((d) => `<details><summary>${esc(d.q)}</summary><p><b>Say:</b> ${esc(d.a[d.ok])}</p><p>${esc(d.why)}</p><p class="no"><b>Never:</b> ${esc(d.a.filter((_, i) => i !== d.ok)[0])}</p></details>`).join('')}
  </section>
</main>`,
  scripts: `<script>
(function(){
  var DECK=${JSON.stringify(DECK)}, CATS=${JSON.stringify(CATS)};
  var KEY='rewild_crew_v1', best={};try{best=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
  var $=function(s){return document.querySelector(s)}, esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
  function view(v){document.querySelectorAll('[data-v]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.v===v)});document.querySelectorAll('[data-view]').forEach(function(s){s.hidden=s.dataset.view!==v});}
  document.querySelectorAll('[data-v]').forEach(function(b){b.onclick=function(){view(b.dataset.v)}});
  document.querySelectorAll('[data-go]').forEach(function(b){b.onclick=function(){view(b.dataset.go)}});
  function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
  var cat='all', round=[], i=0, score=0, missed=[];
  function cats(){$('#cw-cats').innerHTML=['all'].concat(Object.keys(CATS)).map(function(k){var n=k==='all'?DECK.length:DECK.filter(function(d){return d.c===k}).length,b=best[k];return '<button data-cat="'+k+'" aria-pressed="'+(k===cat)+'">'+(k==='all'?'Everything':CATS[k])+' · '+n+(b!=null?' · best '+b+'%':'')+'</button>'}).join('');
    document.querySelectorAll('[data-cat]').forEach(function(b){b.onclick=function(){cat=b.dataset.cat;start(null)}});}
  function start(list){round=shuffle(list||DECK.filter(function(d){return cat==='all'||d.c===cat}));i=0;score=0;missed=[];cats();ask();}
  function ask(){var d=round[i],card=$('#cw-card');
    var opts=shuffle(d.a.map(function(t,k){return {t:t,ok:k===d.ok}}));
    card.innerHTML='<div class="cw-meta"><span>'+esc(CATS[d.c])+'</span><span>'+(i+1)+' of '+round.length+' · '+score+' right</span></div><div class="cw-bar"><i style="width:'+(i/round.length*100)+'%"></i></div><p class="cw-q">'+esc(d.q)+'</p><div class="cw-opts">'+opts.map(function(o,k){return '<button data-k="'+k+'">'+esc(o.t)+'</button>'}).join('')+'</div><div id="cw-after"></div>';
    card.querySelectorAll('[data-k]').forEach(function(b){b.onclick=function(){var o=opts[+b.dataset.k];
      card.querySelectorAll('[data-k]').forEach(function(x){x.disabled=true;if(opts[+x.dataset.k].ok)x.classList.add('right')});
      if(o.ok)score++;else{b.classList.add('wrong');missed.push(d)}
      $('#cw-after').innerHTML='<p class="cw-why"><b>'+(o.ok?'Yes. ':'Not quite. ')+'</b>'+esc(d.why)+'</p><div class="cw-row"><button class="btn btn-yellow" id="cw-next">'+(i+1<round.length?'Next question':'See my score')+'</button></div>';
      $('#cw-next').onclick=function(){i++;i<round.length?ask():done()};$('#cw-next').focus();}});}
  function done(){var pct=Math.round(score/round.length*100);if(best[cat]==null||pct>best[cat]){best[cat]=pct;try{localStorage.setItem(KEY,JSON.stringify(best))}catch(e){}}
    var by={};round.forEach(function(d){by[d.c]=by[d.c]||[0,0];by[d.c][1]++});round.forEach(function(d){if(missed.indexOf(d)<0)by[d.c][0]++});
    $('#cw-card').innerHTML='<p class="cw-q">'+score+' of '+round.length+' · '+pct+'%</p><p>'+(pct===100?'Perfect. You\\'re ready for the table.':pct>=80?'Nearly there. Run your misses once more.':'Good start. Read the cheat sheet, then retry your misses.')+'</p><div class="cw-score">'+Object.keys(by).map(function(k){return '<div>'+esc(CATS[k])+'<b>'+by[k][0]+' / '+by[k][1]+'</b></div>'}).join('')+'</div><div class="cw-row">'+(missed.length?'<button class="btn btn-yellow" id="cw-miss">Retry my '+missed.length+' miss'+(missed.length===1?'':'es')+'</button>':'')+'<button class="btn btn-outline" id="cw-again">New round</button></div>';cats();
    if(missed.length)$('#cw-miss').onclick=function(){start(missed.slice())};$('#cw-again').onclick=function(){start(null)};}
  cats();start(null);
})();
</script>`,
};
