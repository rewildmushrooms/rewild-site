// Real customer testimonials. Add new ones here and they appear everywhere automatically.
// Rules: only real people, their own words (trimmed with "..." is fine, never reworded),
// and no excerpt that claims a health effect (Canada treats testimonials as advertising claims).
//   products: which product pages show it (most relevant first)
import { esc } from './layout.mjs';

export const TESTIMONIALS = [
  {
    id: 'krystal',
    name: 'Krystal J.',
    detail: "Takes Lion's Mane, Reishi, Chaga + the Energy Tincture",
    head: 'Such an easy, grounding part of my routine',
    quote: "I love having something simple I can incorporate into my morning ritual... Starting my morning with coffee and functional mushrooms has become such an easy and grounding part of my routine. If you've been curious about exploring functional mushrooms, Rewild Mushrooms has definitely become a favourite in my wellness toolkit.",
    products: ['clarity', 'strength', 'peace', 'tincture'],
  },
  {
    id: 'jesse',
    name: 'Jesse F.',
    detail: "Men's Coach · Calgary, AB",
    head: 'It gave me so much energy',
    quote: "It gave me so much energy, that during the first snowfall I wanted to shovel my neighbours', the entire street. If it wasn't for having to go to work, I would have.",
    products: ['energy', 'tincture', 'duo'],
  },
];

const card = (t) => `<figure class="review">
  <div class="review-stars" aria-hidden="true">★★★★★</div>
  <p class="review-head">"${esc(t.head)}"</p>
  <blockquote>${esc(t.quote)}</blockquote>
  <figcaption><b>${esc(t.name)}</b><span>${esc(t.detail)}</span></figcaption>
</figure>`;

// Full section (homepage, CordyFuel page).
export function reviewsSection({ eyebrow = 'What Rewilders are saying', title = 'Real people. Real rituals.', ids, tone = 'stone' } = {}) {
  const list = ids ? ids.map((id) => TESTIMONIALS.find((t) => t.id === id)).filter(Boolean) : TESTIMONIALS;
  if (!list.length) return '';
  return `<section class="section ${tone} reviews-band" aria-label="Customer reviews"><div class="wrap">
  <div class="stack-sm" style="max-width:640px;gap:14px;margin-bottom:40px"><p class="eyebrow">${esc(eyebrow)}</p><h2 class="h2" style="font-size:clamp(30px,3.6vw,46px)">${esc(title)}</h2></div>
  <div class="reviews">${list.map(card).join('')}</div>
</div></section>`;
}

// One compact review right under the buy button on a product page.
export function productReview(productId) {
  const t = TESTIMONIALS.find((x) => x.products.includes(productId));
  if (!t) return '';
  return `<figure class="review review-compact"><div class="review-stars" aria-hidden="true">★★★★★</div><blockquote>"${esc(t.head)}." ${esc(t.quote.length > 170 ? t.quote.slice(0, t.quote.lastIndexOf(' ', 165)) + '...' : t.quote)}</blockquote><figcaption><b>${esc(t.name)}</b><span>${esc(t.detail)}</span></figcaption></figure>`;
}
