// Build Your Stack quiz: 8 questions -> a recommended stack, timing, how-to, optional email.
// Edit questions, copy and scoring here. Product data comes from window.REWILD_CATALOG.
(function () {
  const app = document.getElementById('quiz-app');
  if (!app) return;
  const C = window.REWILD_CATALOG;
  const byId = Object.fromEntries(C.products.map((p) => [p.id, p]));
  const money = (c) => '$' + (c / 100).toFixed(c % 100 === 0 ? 0 : 2);
  const cf = (t) => String(t).replace(/CordyFuel™/g, '<span class="cf">CordyFuel™</span>');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const Q = [
    { key: 'why', q: 'What brings you here?', opts: [
      ['regular', 'I already take mushrooms', 'Looking for better ones'],
      ['switching', "I'm switching from a blend", 'Want to know what I’m taking'],
      ['new', "I'm curious and new to this", 'Show me where to start'],
      ['gift', "I'm buying for someone else", 'A gift that means something'],
    ] },
    { key: 'want', q: 'What do you want more of?', hint: 'Pick up to two.', max: 2, opts: [
      ['steady', 'Steady energy', 'To keep going all day'],
      ['stamina', 'Stamina', 'For training, hiking and moving'],
      ['focus', 'Focus', 'Deep work without the drift'],
      ['creative', 'Creative flow', 'Ideas that keep coming'],
      ['resilience', 'Resilience', 'Bouncing back from busy'],
      ['grounded', 'Feeling grounded', 'Solid, steady, strong'],
      ['calm', 'Calm', 'Taking the edge off'],
      ['winddown', 'A better wind-down', 'Ending the day well'],
    ] },
    { key: 'day', q: 'What does a typical day look like?', opts: [
      ['physical', 'Long and physical', 'Outside or on my feet'],
      ['focus', 'Deep focus', 'Hours at a desk'],
      ['juggling', 'Juggling it all', 'People and responsibilities'],
      ['creative', 'Creative', 'No two days alike'],
      ['family', 'Raising a family', 'Little people, big days'],
      ['shift', 'Shift work', 'Odd hours, early starts, late nights'],
      ['travel', 'Always on the move', 'Travel, commutes, different beds'],
      ['study', 'Learning something', 'School, training or a new craft'],
    ] },
    { key: 'when', q: 'When do you want a boost most?', opts: [
      ['morning', 'First thing', 'Starting the day right'],
      ['afternoon', 'The afternoon dip', 'Getting through the middle'],
      ['training', 'Before activity', 'Training, hiking, moving'],
      ['night', 'Winding down', 'The quiet end of the day'],
    ] },
    { key: 'coffee', q: "What's your coffee situation?", opts: [
      ['lots', '2+ cups a day', 'Coffee is a lifestyle'],
      ['one', 'One and done', 'A single morning cup'],
      ['cutting', 'Cutting back', 'Trying to drink less'],
      ['none', "I don't drink it", 'Tea, water or nothing'],
    ] },
    { key: 'how', q: 'How do you like to take things?', opts: [
      ['drink', 'In coffee or tea', 'Stirred into my cup'],
      ['smoothie', 'Smoothies', 'Blended in'],
      ['food', 'In food', 'Soups, oats, sauces'],
      ['straight', 'Straight and on the go', 'Quick and simple'],
    ] },
    { key: 'format', q: 'Where will you take it most?', opts: [
      ['home', 'At home', 'Part of my morning or kitchen routine'],
      ['go', 'On the go', 'Work, trails, travel, the gym bag'],
      ['both', 'Both', 'A home routine plus one in my bag'],
      ['taste', "I'm not a fan of mushroom taste", 'Make it quick and easy'],
    ] },
    { key: 'start', q: 'What are you hoping to feel?', opts: [
      ['one', 'One clear change', 'Start simple and notice the difference'],
      ['two', 'Two things at once', 'A small stack that works together'],
      ['full', 'My whole day supported', 'Morning, afternoon and evening'],
    ] },
  ];

  const WORD = { energy: 'Energy', clarity: 'Clarity', strength: 'Strength', peace: 'Peace' };
  const DAY_LINE = {
    physical: 'Built for long, physical days.',
    focus: 'Built for long stretches of deep focus.',
    juggling: 'Built for days spent showing up for everyone.',
    creative: 'Built for days that never look the same.',
    family: 'Built for days spent raising little humans.',
    shift: 'Built for odd hours and early starts.',
    travel: 'Built for life on the move.',
    study: 'Built for days spent learning something new.',
  };
  // Question 2 answers map to the four mushrooms.
  const WANT_MAP = { steady: 'energy', stamina: 'energy', focus: 'clarity', creative: 'clarity', resilience: 'strength', grounded: 'strength', calm: 'peace', winddown: 'peace' };
  const TIMING = {
    energy: 'Most people take it in the morning or before activity.',
    clarity: 'Most people take it in the morning or early afternoon.',
    strength: 'Fits any time of day, especially in coffee or tea.',
    peace: 'Most people save it for the evening.',
  };
  const HOW = {
    drink: 'Stir ½ teaspoon into your coffee or tea.',
    smoothie: 'Add ½ teaspoon to your smoothie.',
    food: 'Stir ½ teaspoon into soup, oats or sauce just before serving.',
    straight: 'Mix ½ teaspoon into water and go.',
  };
  const WHY = {
    regular: 'You already know mushrooms. Here are ones grown in BC, full spectrum and third-party tested.',
    switching: "One mushroom per product, so you'll always know exactly what you're getting from each one.",
    new: 'Start with one, give it a few weeks, then add another when you’re ready.',
    gift: 'A thoughtful gift for someone doing meaningful things in the world.',
  };

  const A = { why: [], want: [], day: [], when: [], coffee: [], how: [], format: [], start: [] };
  let step = 0;

  function choiceHtml(item, q) {
    const [v, title, sub] = item;
    const on = A[q.key].includes(v);
    return `<button type="button" class="choice" data-v="${v}" aria-pressed="${on}"><b>${cf(esc(title))}</b><span>${cf(esc(sub))}</span></button>`;
  }

  function renderStep() {
    const q = Q[step];
    const pct = Math.round((step / Q.length) * 100);
    app.innerHTML = `
      <div class="quiz-progress" aria-hidden="true"><span style="width:${pct}%"></span></div>
      <p class="eyebrow">Question ${step + 1} of ${Q.length}</p>
      <h2 class="h3" id="quiz-q" tabindex="-1">${esc(q.q)}</h2>
      ${q.hint ? `<p class="muted">${q.hint}</p>` : ''}
      <div class="choices" role="group" aria-labelledby="quiz-q">${q.opts.map((o) => choiceHtml(o, q)).join('')}</div>
      <div class="row" style="margin-top:12px">
        ${step > 0 ? '<button type="button" class="btn btn-outline" id="q-back">Back</button>' : ''}
        ${q.max > 1 ? `<button type="button" class="btn btn-dark" id="q-next" ${A[q.key].length ? '' : 'disabled'}>Next</button>` : ''}
      </div>`;
    app.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => pick(q, b.dataset.v)));
    const back = document.getElementById('q-back');
    if (back) back.addEventListener('click', () => { step--; renderStep(); });
    const nx = document.getElementById('q-next');
    if (nx) nx.addEventListener('click', advance);
    if (step > 0) { const h = document.getElementById('quiz-q'); h && h.focus({ preventScroll: true }); }
  }

  function pick(q, v) {
    const list = A[q.key];
    const max = q.max || 1;
    if (max === 1) { A[q.key] = [v]; renderStep(); setTimeout(advance, 160); return; }
    if (list.includes(v)) list.splice(list.indexOf(v), 1);
    else { if (list.length >= max) list.shift(); list.push(v); }
    renderStep();
  }

  function advance() {
    if (step < Q.length - 1) { step++; renderStep(); app.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    else renderResult();
  }

  // Scoring: chosen words dominate; day and timing nudge the second pick.
  function recommend() {
    const score = { energy: 0, clarity: 0, strength: 0, peace: 0 };
    A.want.forEach((w, i) => { const k = WANT_MAP[w]; if (k) score[k] += i === 0 ? 10 : 8; });
    const day = A.day[0], when = A.when[0];
    ({ physical: ['energy', 'strength'], focus: ['clarity'], juggling: ['peace', 'clarity'], creative: ['clarity', 'peace'], family: ['energy', 'peace'], shift: ['energy', 'peace'], travel: ['strength', 'energy'], study: ['clarity', 'energy'] }[day] || []).forEach((k, i) => (score[k] += i ? 1 : 2));
    ({ morning: ['energy', 'clarity'], afternoon: ['clarity', 'energy'], training: ['energy'], night: ['peace'] }[when] || []).forEach((k, i) => (score[k] += i ? 1 : 2));
    const ranked = Object.keys(score).sort((a, b) => score[b] - score[a]);
    const n = { one: 1, two: 2, full: 4 }[A.start[0]] || 2;
    let pickIds = ranked.slice(0, n);
    // Format: powder at home, tincture on the go (or for anyone who'd rather skip the taste), or both.
    const fmt = A.format[0];
    let duo = false;
    if (pickIds.includes('energy')) {
      if (fmt === 'go' || fmt === 'taste') pickIds = pickIds.map((x) => (x === 'energy' ? 'tincture' : x));
      else if (fmt === 'both') duo = true;
    }
    const addLater = n === 1 ? ranked[1] : null;
    return { pickIds, duo, addLater, ranked };
  }

  function renderResult() {
    const { pickIds, duo, addLater } = recommend();
    const cartIds = duo ? pickIds.map((x) => (x === 'energy' ? 'duo' : x)) : pickIds;
    const total = cartIds.reduce((a, id) => a + byId[id].price, 0);
    const names = pickIds.map((id) => (id === 'tincture' ? 'Energy Tincture' : WORD[id]));
    const hasEnergy = pickIds.includes('energy') || pickIds.includes('tincture');
    const coffee = A.coffee[0];
    let coffeeLine = '';
    if (hasEnergy && (coffee === 'cutting' || coffee === 'none')) coffeeLine = 'CordyFuel™ is caffeine-free, so it fits right in whether you drink coffee or not.';
    else if (coffee === 'lots' || coffee === 'one') coffeeLine = 'Already have a coffee ritual? Stir your mushrooms into it. Nothing new to remember.';
    const hasTincture = pickIds.includes('tincture') || duo;
    const howLine = hasTincture ? (duo ? 'Powder at home: ½ teaspoon in your usual drink or food. Tincture on the go: 10 to 20 ml, straight or in a drink.' : 'Take 10 to 20 ml of the tincture straight or in a drink.' + (pickIds.length > 1 ? ' ' + (HOW[A.how[0]] || '') : '')) : HOW[A.how[0]] || '';
    const fmtNote = !pickIds.includes('energy') && !pickIds.includes('tincture') && (A.format[0] === 'go' || A.format[0] === 'taste') ? 'Our tincture currently comes in Energy only. The powders mix easily into water or a smoothie on the go.' : '';
    const qs = new URLSearchParams(Object.entries(A).map(([k, v]) => [k, v.join('+')])).toString();
    try { history.replaceState(null, '', location.pathname + '?' + qs + location.hash); } catch (e) {}

    app.innerHTML = `
      <div class="quiz-progress" aria-hidden="true"><span style="width:100%"></span></div>
      <p class="eyebrow">Your stack</p>
      <h2 class="h2" id="quiz-q" tabindex="-1">${cf(names.join(' + '))}.</h2>
      <p class="lead">${esc(DAY_LINE[A.day[0]] || '')} ${esc(WHY[A.why[0]] || '')}</p>
      <form class="quiz-email quiz-email-top stack-sm" novalidate>
        <h3 style="font-size:22px">Get your stack sent to you</h3>
        <p style="font-size:16px">We'll email your stack, when to take it and how, so it's there when you need it. Plus field notes a few times a month. Unsubscribe anytime.</p>
        <div class="signup">
          <label for="quiz-email" class="sr-only">Email address</label>
          <input id="quiz-email" name="email" type="email" placeholder="Your email" autocomplete="email" required>
          <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
          <button type="submit" class="btn btn-yellow">Email me my stack</button>
        </div>
        <p class="small" role="status" data-qmsg></p>
      </form>
      <div class="grid-3" style="margin-top:8px">${cartIds.map(card).join('')}</div>
      <div class="stat" style="background:var(--stone);margin-top:8px">
        <h3 style="font-size:20px;margin-bottom:10px">How to take it</h3>
        <ul class="ticks">
          ${howLine ? `<li>${cf(esc(howLine))}</li>` : ''}
          ${pickIds.map((id) => `<li><strong>${cf(esc(id === 'tincture' ? 'Energy Tincture' : WORD[id]))}:</strong> ${esc(TIMING[id === 'tincture' ? 'energy' : id])}</li>`).join('')}
          ${coffeeLine ? `<li>${cf(esc(coffeeLine))}</li>` : ''}
          ${fmtNote ? `<li>${esc(fmtNote)}</li>` : ''}
        </ul>
      </div>
      ${duo ? `<p class="small muted">${cf('Your Energy comes as the Rewild Energy Duo: powder at home, tincture on the go. You save $20.')}</p>` : ''}
      <div class="row" style="margin-top:12px"><button type="button" class="btn btn-yellow" data-add-many="${cartIds.join(',')}">Add my stack · ${money(total)}</button><button type="button" class="btn btn-outline" id="q-restart">Start over</button></div>
      <p class="small"><strong>100% Risk-Free Guarantee.</strong> Don't love it? Email us within 14 days of delivery for a full refund. No questions asked.</p>
      ${addLater ? `<p class="muted">Worth adding later: <a class="link" href="/shop/${byId[addLater].slug}/">${cf(esc(byId[addLater].name))}</a></p>` : ''}
      <p class="small muted">Suggestions are based on your answers and our product names. They are not medical advice.</p>`;
    document.getElementById('q-restart').addEventListener('click', () => { Object.keys(A).forEach((k) => (A[k] = [])); step = 0; try { history.replaceState(null, '', location.pathname); } catch (e) {} renderStep(); });
    const f = app.querySelector('.quiz-email');
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = f.querySelector('[data-qmsg]'), btn = f.querySelector('button');
      btn.disabled = true;
      try {
        const res = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: f.email.value, website: f.website.value, source: 'quiz',
            quiz: { stack: cartIds.join(','), stack_names: names.join(' + ') + (duo ? ' (Duo)' : ''), how_to: howLine, why: A.why[0], want: A.want.join(','), day: A.day[0], when: A.when[0], coffee: A.coffee[0], how: A.how[0], format: A.format[0], start: A.start[0] } }) });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(d.error || 'Something went wrong. Please try again.');
        msg.textContent = 'Done. Check your inbox shortly. Welcome, Rewilder.'; f.email.value = '';
      } catch (err) { msg.textContent = err.message; }
      btn.disabled = false;
    });
    const h = document.getElementById('quiz-q'); h && h.focus({ preventScroll: true });
    app.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (window.gtag) window.gtag('event', 'quiz_complete', { stack: cartIds.join(',') });
  }

  function card(id) {
    const p = byId[id];
    const url = id === 'duo' ? '/shop/cordyceps-militaris-powder/' : `/shop/${p.slug}/`;
    return `<article class="card"><a class="img-link" href="${url}"><img src="${p.image}" alt="" width="600" height="600" loading="lazy"></a>
      <div class="meta"><div class="dot-label"><span class="dot" style="background:${p.color}"></span>${cf(esc(p.mushroom))}</div><h3 style="font-size:24px"><a href="${url}">${cf(esc(p.name))}</a></h3><div class="price-line">${esc(p.format)} · <span class="price">${money(p.price)}</span></div></div></article>`;
  }

  // Restore a shared result link (?why=..&want=..)
  const sp = new URLSearchParams(location.search);
  if (Q.every((q) => sp.get(q.key))) {
    Q.forEach((q) => (A[q.key] = sp.get(q.key).split(/[+ ]/).filter((v) => q.opts.some((o) => o[0] === v))));
    if (Q.every((q) => A[q.key].length)) { renderResult(); return; }
  }
  renderStep();
})();
