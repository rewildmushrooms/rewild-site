// Resources: books and people worth following on functional mushrooms.
// Rules: books are functional and culinary only. Psychedelic content lives only in the Fringe section at the bottom, with its disclaimer. No shop links on this page.
// Links point to each author's own site or publisher page, plus socials we have verified.
import { SITE } from './site.mjs';
import { esc } from './layout.mjs';

const ext = (href, label) => `<a href="${href}" target="_blank" rel="noopener">${esc(label)}</a>`;

const AUTHORS = [
  {
    name: 'Christopher Hobbs',
    tone: '#F2780C',
    take: 'The field guide for the mushrooms you already have in your cupboard.',
    note: 'Fourth-generation herbalist, botanist and mycologist with more than 35 years in the field.',
    book: "Christopher Hobbs's Medicinal Mushrooms: The Essential Guide",
    links: [['https://www.christopherhobbs.com', 'christopherhobbs.com'], ['https://www.instagram.com/christopherhobbs1/', 'Instagram'], ['https://www.youtube.com/user/chrisrhobbs/featured', 'YouTube']],
  },
  {
    name: 'Robert Rogers',
    tone: '#2F7FE0',
    take: 'A Canadian herbalist\u2019s deep dive into the fungi growing around us.',
    note: 'Edmonton-based herbalist and author with more than 40 years of experience, writing about the fungi of North America.',
    book: 'The Fungal Pharmacy',
    links: [['https://www.northatlanticbooks.com/author/robert-rogers/', 'Author page'], ['https://www.instagram.com/selfhealdistributing/', 'Instagram']],
  },
  {
    name: 'Merlin Sheldrake',
    tone: '#22B573',
    take: 'You will never look at a forest floor the same way again.',
    note: 'Biologist and writer who makes the hidden world of fungi impossible to stop thinking about.',
    book: 'Entangled Life',
    links: [['https://merlinsheldrake.com', 'merlinsheldrake.com'], ['https://www.instagram.com/merlin.sheldrake', 'Instagram'], ['https://www.youtube.com/user/merlinsheldrake', 'YouTube']],
  },
];

const linkList = (links) => `<ul class="res-links">${links.map(([h, l]) => `<li>${ext(h, l)}</li>`).join('')}</ul>`;

const card = (a) => `<article class="res-card" style="--tone:${a.tone}">
  <p class="res-kind">Book</p>
  <blockquote class="res-take"><span aria-hidden="true">\u201C</span>${esc(a.take)}</blockquote>
  <p class="res-take-by">Our take</p>
  <h3 class="res-name">${esc(a.name)}</h3>
  <p class="res-book-title"><em>${esc(a.book)}</em></p>
  <p class="res-note">${esc(a.note)}</p>
  ${linkList(a.links)}
</article>`;

const STAMETS = `<section class="res-hero-band"><div class="wrap res-feature">
  <div class="res-cover-wrap">
    <span class="res-sticker">Start<br>here</span>
    <img class="res-cover" src="https://covers.openlibrary.org/b/isbn/9781580085793-L.jpg" alt="Mycelium Running by Paul Stamets, book cover" width="412" height="500" loading="lazy">
  </div>
  <div class="stack">
    <p class="eyebrow" style="color:var(--accent)">Book · The essential read</p>
    <h2 class="res-big"><em>Mycelium Running</em></h2>
    <p class="res-by">by Paul Stamets</p>
    <p class="lead" style="color:var(--on-dark);margin:0">The book that rewired how a lot of us see the forest. Paul Stamets on the hidden network under our feet, and how it holds soil, trees and food together.</p>
    <div class="res-more"><p class="res-more-label">More books by Paul</p><ul><li><a href="https://paulstamets.com/books" target="_blank" rel="noopener"><em>Growing Gourmet and Medicinal Mushrooms</em></a></li><li><a href="https://paulstamets.com/books" target="_blank" rel="noopener"><em>The Mushroom Cultivator</em></a> (with J.S. Chilton)</li></ul></div>
    ${linkList([['https://paulstamets.com', 'paulstamets.com'], ['https://instagram.com/paulstamets', 'Instagram'], ['https://www.youtube.com/channel/UCR8Y7Ay6PJXndscDLpkLafg', 'YouTube']])}
  </div>
</div>
<div class="wrap res-film">
  <button type="button" class="yt" data-yt="boN-ac5NP0o" aria-label="Play the Fantastic Fungi trailer">
    <img src="https://i.ytimg.com/vi/boN-ac5NP0o/hqdefault.jpg" alt="" loading="lazy" width="480" height="360">
    <span class="yt-play" aria-hidden="true"></span>
  </button>
  <div class="stack-sm">
    <p class="eyebrow" style="color:var(--accent)">Film · Then watch</p>
    <h3 class="h3" style="color:#fff;margin:0">Fantastic Fungi</h3>
    <p style="color:var(--on-dark);margin:0">The documentary featuring Paul Stamets, from filmmaker Louie Schwartzberg. Time-lapse mushrooms on a big screen. Bring snacks.</p>
  </div>
</div></section>`;

const FRINGE = [
  { id: 'vp3kBIvR2SE', title: 'Psilocybin Sporius', by: 'Aether Elf (music video)', note: 'A trippy little music video. Headphones on, lights low.' },
  { id: 'Cjs5HtaqZ_c', title: 'Amanita Muscaria: Why Was It Secret?', by: 'Simon Rilling with Marianne & Johan (podcast)', note: 'A long conversation about the red-and-white toadstool: history, folklore and why it was kept quiet.' },
];

const FRINGE_SECTION = `<section class="fringe"><div class="wrap">
  <div class="fringe-head">
    <p class="fringe-eyebrow">Videos \u00b7 Fringe fungi \u00b7 off the beaten trail</p>
    <h2 class="fringe-title">Down the rabbit hole.</h2>
    <p class="fringe-lead">Every forest has a weird corner. This is ours. Not everything in the fungi kingdom belongs in your coffee, and these two aren't about anything we sell. Just good stuff for the curious.</p>
  </div>
  <div class="fringe-grid">${FRINGE.map((v) => `<figure class="fringe-card">
    <button type="button" class="yt" data-yt="${v.id}" aria-label="Play: ${esc(v.title)}">
      <img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="" loading="lazy" width="480" height="360">
      <span class="yt-play" aria-hidden="true"></span>
    </button>
    <figcaption><b>${esc(v.title)}</b><span class="fringe-by">${esc(v.by)}</span><span>${esc(v.note)}</span></figcaption>
  </figure>`).join('')}</div>
  <p class="fringe-fine">For culture and curiosity only. We don't sell psychedelic or Amanita mushrooms, and nothing here is advice. Never eat a wild mushroom you can't identify with certainty.</p>
</div></section>`;

export const resources = {
  path: '/resources/',
  title: 'Mushroom Books & Videos | Functional Mushrooms | REWILD',
  description: 'Books and people worth following if you want to go deeper on functional mushrooms: Paul Stamets, Christopher Hobbs, Robert Rogers and Merlin Sheldrake.',
  jsonld: [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url + '/' },
    { '@type': 'ListItem', position: 2, name: 'Resources', item: SITE.url + '/resources/' },
  ] }],
  body: `
<section class="page-hero"><div class="narrow stack-sm" style="gap:16px">
  <p class="eyebrow">Go deeper</p>
  <h1 class="h1" style="font-size:clamp(36px,4.6vw,56px)">Mushroom books and videos worth your time.</h1>
  <p class="lead">The books, films and people that shaped how we think about fungi. Pick one, get outside, and keep learning.</p>
</div></section>
${STAMETS}
<section class="section stone"><div class="wrap"><p class="eyebrow">More books</p><h2 class="h2" style="font-size:clamp(28px,3.4vw,42px);margin:0 0 32px">Three more for the shelf.</h2><div class="res-grid">${AUTHORS.map(card).join('')}</div>
  <p class="small muted" style="margin-top:36px;max-width:720px">We're not affiliated with these authors and don't earn anything from these links. Their views are their own, and nothing here is medical advice.</p>
</div></section>
${FRINGE_SECTION}`,
};
