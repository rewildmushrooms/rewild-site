// Resources: books and people worth following on functional mushrooms.
// Rules: functional and culinary mushrooms only (no psychedelic titles). No shop links on this page.
// Links point to each author's own site or publisher page, plus socials we have verified.
import { SITE } from './site.mjs';
import { esc } from './layout.mjs';

const ext = (href, label) => `<a href="${href}" target="_blank" rel="noopener">${esc(label)}</a>`;

const AUTHORS = [
  {
    name: 'Christopher Hobbs',
    note: 'Fourth-generation herbalist, botanist and mycologist with more than 35 years in the field.',
    books: ["Christopher Hobbs's Medicinal Mushrooms: The Essential Guide"],
    links: [['https://www.christopherhobbs.com', 'christopherhobbs.com'], ['https://www.instagram.com/christopherhobbs1/', 'Instagram'], ['https://www.youtube.com/user/chrisrhobbs/featured', 'YouTube']],
  },
  {
    name: 'Robert Rogers',
    note: 'Edmonton-based herbalist and author with more than 40 years of experience, writing about the fungi of North America.',
    books: ['The Fungal Pharmacy'],
    links: [['https://www.northatlanticbooks.com/author/robert-rogers/', 'Author page'], ['https://www.instagram.com/selfhealdistributing/', 'Instagram']],
  },
  {
    name: 'Merlin Sheldrake',
    note: 'Biologist and writer who makes the hidden world of fungi impossible to stop thinking about.',
    books: ['Entangled Life'],
    links: [['https://merlinsheldrake.com', 'merlinsheldrake.com'], ['https://www.instagram.com/merlin.sheldrake', 'Instagram'], ['https://www.youtube.com/user/merlinsheldrake', 'YouTube']],
  },
];

const linkList = (links) => `<ul class="res-links">${links.map(([h, l]) => `<li>${ext(h, l)}</li>`).join('')}</ul>`;

const card = (a) => `<article class="res-card">
  <h2 class="h3" style="margin:0">${esc(a.name)}</h2>
  <p class="muted" style="margin:0">${esc(a.note)}</p>
  <ul class="res-books">${a.books.map((b) => `<li><em>${esc(b)}</em></li>`).join('')}</ul>
  ${linkList(a.links)}
</article>`;

const STAMETS = `<section class="section tight"><div class="wrap res-feature">
  <div class="stack">
    <p class="eyebrow">Start here</p>
    <h2 class="h2" style="font-size:clamp(30px,3.6vw,46px);margin:0">Paul Stamets</h2>
    <p class="lead" style="margin:0">Mycologist, grower and the reason a lot of us got curious about fungi in the first place.</p>
    <div class="res-book">
      <p class="small muted" style="margin:0;text-transform:uppercase;letter-spacing:.12em;font-weight:700">His essential read</p>
      <p style="margin:0;font-size:22px"><em>Mycelium Running</em></p>
      <p class="muted" style="margin:0">How the hidden network under our feet holds forests, soil and food together.</p>
    </div>
    <p class="small" style="margin:0">Also by Paul: <em>Growing Gourmet and Medicinal Mushrooms</em> and <em>The Mushroom Cultivator</em> (with J.S. Chilton).</p>
    ${linkList([['https://paulstamets.com', 'paulstamets.com'], ['https://instagram.com/paulstamets', 'Instagram'], ['https://www.youtube.com/channel/UCR8Y7Ay6PJXndscDLpkLafg', 'YouTube']])}
  </div>
  <div class="stack-sm">
    <button type="button" class="yt" data-yt="boN-ac5NP0o" aria-label="Play the Fantastic Fungi trailer">
      <img src="https://i.ytimg.com/vi/boN-ac5NP0o/hqdefault.jpg" alt="" loading="lazy" width="480" height="360">
      <span class="yt-play" aria-hidden="true"></span>
    </button>
    <p class="small muted" style="margin:0"><b style="color:var(--ink)">Watch: Fantastic Fungi.</b> The documentary featuring Paul Stamets, from filmmaker Louie Schwartzberg.</p>
  </div>
</div></section>`;

export const resources = {
  path: '/resources/',
  title: 'Mushroom Books & Resources | Functional Mushrooms | REWILD',
  description: 'Books and people worth following if you want to go deeper on functional mushrooms: Paul Stamets, Christopher Hobbs, Robert Rogers and Merlin Sheldrake.',
  jsonld: [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url + '/' },
    { '@type': 'ListItem', position: 2, name: 'Resources', item: SITE.url + '/resources/' },
  ] }],
  body: `
<section class="page-hero"><div class="narrow stack-sm" style="gap:16px">
  <p class="eyebrow">Go deeper</p>
  <h1 class="h1" style="font-size:clamp(36px,4.6vw,56px)">Mushroom books worth your time.</h1>
  <p class="lead">The people and books that shaped how we think about fungi. Grab one, get outside, and keep learning.</p>
</div></section>
${STAMETS}
<section class="section tight stone"><div class="wrap"><h2 class="h3" style="margin:0 0 24px">More worth reading</h2><div class="res-grid">${AUTHORS.map(card).join('')}</div>
  <p class="small muted" style="margin-top:36px;max-width:720px">We're not affiliated with these authors and don't earn anything from these links. Their views are their own, and nothing here is medical advice.</p>
</div></section>`,
};
