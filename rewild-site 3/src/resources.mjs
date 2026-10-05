// Resources: books and people worth following on functional mushrooms.
// Rules: functional and culinary mushrooms only (no psychedelic titles). No shop links on this page.
// Links point to each author's own site or publisher page, plus socials we have verified.
import { SITE } from './site.mjs';
import { esc } from './layout.mjs';

const ext = (href, label) => `<a href="${href}" target="_blank" rel="noopener">${esc(label)}</a>`;

const AUTHORS = [
  {
    name: 'Paul Stamets',
    note: 'Mycologist, grower and the reason a lot of us got curious about fungi in the first place.',
    books: ['Mycelium Running', 'Growing Gourmet and Medicinal Mushrooms', 'The Mushroom Cultivator (with J.S. Chilton)'],
    links: [['https://paulstamets.com', 'paulstamets.com'], ['https://instagram.com/paulstamets', 'Instagram'], ['https://www.youtube.com/channel/UCR8Y7Ay6PJXndscDLpkLafg', 'YouTube']],
  },
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
  {
    name: 'Eugenia Bone',
    note: 'Food writer and mushroom hunter. A funny, curious way into the world of fungi, kitchen first.',
    books: ['Mycophilia: Revelations from the Weird World of Mushrooms'],
    links: [],
  },
];

const card = (a) => `<article class="res-card">
  <h2 class="h3" style="margin:0">${esc(a.name)}</h2>
  <p class="muted" style="margin:0">${esc(a.note)}</p>
  <ul class="res-books">${a.books.map((b) => `<li><em>${esc(b)}</em></li>`).join('')}</ul>
  ${a.links.length ? `<p class="small res-links">${a.links.map(([h, l]) => ext(h, l)).join(' · ')}</p>` : ''}
</article>`;

export const resources = {
  path: '/resources/',
  title: 'Mushroom Books & Resources | Functional Mushrooms | REWILD',
  description: 'Books and people worth following if you want to go deeper on functional mushrooms: Paul Stamets, Christopher Hobbs, Robert Rogers, Merlin Sheldrake and Eugenia Bone.',
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
<section class="section tight"><div class="wrap"><div class="res-grid">${AUTHORS.map(card).join('')}</div>
  <p class="small muted" style="margin-top:36px;max-width:720px">We're not affiliated with these authors and don't earn anything from these links. Their views are their own, and nothing here is medical advice.</p>
</div></section>`,
};
