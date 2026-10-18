// Real customer testimonials. Add new ones here and they appear everywhere automatically.
// Rules: only real people, their own words (trimmed with "..." is fine, never reworded),
// and no excerpt that claims a health effect (Canada treats testimonials as advertising claims).
//   products: which product pages show it (most relevant first)
//   youtube: video id for a video testimonial (shows a thumbnail; the player only loads on click)
import { esc } from './layout.mjs';

export const TESTIMONIALS = [
  {
    id: 'michelle',
    name: 'Michelle Dillard',
    detail: 'Video review · Rewild Energy with CordyFuel™',
    head: "Watch Michelle's review",
    youtube: '2L9vHQUFAqc',
    products: ['energy', 'tincture', 'duo'],
  },
  {
    id: 'lionsmane-video',
    name: '',
    detail: "Video review · Rewild Clarity (Lion's Mane)",
    head: "Watch a Lion's Mane review",
    youtube: 'Ige2jg9JyU8',
    products: ['clarity'],
    productPage: true, // also shown as a video band on the product page
  },
  {
    id: 'krystal',
    name: 'Krystal J.',
    detail: "Uses Lion's Mane, Reishi, Chaga + the Energy Tincture",
    head: 'Such an easy, grounding part of my routine',
    quote: "...Starting my morning with coffee and functional mushrooms has become such an easy and grounding part of my routine. If you've been curious about exploring functional mushrooms, Rewild Mushrooms has definitely become a favourite in my wellness toolkit.",
    products: ['clarity', 'strength', 'peace', 'tincture'],
  },
  {
    id: 'anna',
    name: 'Anna P.',
    detail: 'Rewild Energy (CordyFuel™) in her morning coffee',
    head: 'In my coffee every morning',
    quote: 'I have been putting your CordyFuel™ in my coffee every morning and today I played squash after weeks of doing nothing and I felt really good. I like it!!',
    products: ['energy', 'duo'],
  },
  {
    id: 'jesse',
    name: 'Jesse F.',
    detail: "Men's Coach · Calgary, AB",
    head: 'I wanted to shovel the whole street',
    quote: "It gave me so much energy, that during the first snowfall I wanted to shovel my neighbours', the entire street. If it wasn't for having to go to work, I would have.",
    products: ['energy', 'tincture', 'duo'],
  },
  {
    id: 'rebekah',
    name: 'Rebekah Q.',
    detail: 'Mushroom powders in her morning coffee or cacao',
    head: 'An epic addition to my life',
    quote: 'Rewild Mushrooms has been an epic addition to my life... Adding these mushroom powders into my morning coffee or cacao have been a game changer and it is truly obvious the quality here... This company is going places!',
    products: ['clarity', 'strength', 'peace', 'energy'],
  },
  {
    id: 'hyperkodi',
    name: 'Hyperkodi',
    detail: 'Uses all four mushrooms',
    head: 'Your mushrooms are killer',
    quote: "Your mushrooms are killer dude. I gave some to my coworker last night and he's probably gonna be buying some too. The four species as a combo gives you such a great feeling of natural wellbeing and energy boost!",
    products: ['energy', 'clarity', 'strength', 'peace'],
  },
];

const video = (t) => `<figure class="review review-video">
  <button type="button" class="yt" data-yt="${esc(t.youtube)}" aria-label="Play video: ${esc(t.head)}">
    <img src="https://i.ytimg.com/vi/${esc(t.youtube)}/hqdefault.jpg" alt="" loading="lazy" width="480" height="360">
    <span class="yt-play" aria-hidden="true"></span>
  </button>
  <p class="review-head">${esc(t.head)}</p>
  <figcaption>${t.name ? `<b>${esc(t.name)}</b>` : ''}<span>${esc(t.detail)}</span></figcaption>
</figure>`;

const card = (t) => t.youtube ? video(t) : `<figure class="review">
  <div class="review-stars" aria-hidden="true">★★★★★</div>
  <p class="review-head">"${esc(t.head)}"</p>
  <blockquote>${esc(t.quote)}</blockquote>
  <figcaption><b>${esc(t.name)}</b><span>${esc(t.detail)}</span></figcaption>
</figure>`;

// Full section (homepage, CordyFuel page).
export function reviewsSection({ eyebrow = 'What Rewilders are saying', title = 'Real people. Their words. Not ours.', ids, tone = 'stone' } = {}) {
  const list = ids ? ids.map((id) => TESTIMONIALS.find((t) => t.id === id)).filter(Boolean) : TESTIMONIALS;
  if (!list.length) return '';
  return `<section class="section ${tone} reviews-band" aria-label="Customer reviews"><div class="wrap">
  <div class="stack-sm" style="max-width:640px;gap:14px;margin-bottom:40px"><p class="eyebrow">${esc(eyebrow)}</p><h2 class="h2" style="font-size:clamp(30px,3.6vw,46px)">${esc(title)}</h2></div>
  <div class="rv-slider" data-rv-slider>
    <div class="reviews reviews-track" tabindex="0" aria-label="Customer reviews, scroll sideways for more">${list.map(card).join('')}</div>
    <div class="rv-nav"><button type="button" class="rv-btn" data-rv="-1" aria-label="Previous review">&larr;</button><button type="button" class="rv-btn" data-rv="1" aria-label="Next review">&rarr;</button></div>
  </div>
  <script>document.querySelectorAll('[data-rv-slider]').forEach(function(s){if(s.dataset.on)return;s.dataset.on=1;var t=s.querySelector('.reviews-track');s.querySelectorAll('[data-rv]').forEach(function(b){b.onclick=function(){var c=t.querySelector('.review');t.scrollBy({left:(+b.dataset.rv)*((c?c.offsetWidth:400)+20),behavior:'smooth'})}})});</script>
</div></section>`;
}

// Video band on a product page (videos marked productPage).
export function productVideos(productId) {
  const list = TESTIMONIALS.filter((t) => t.youtube && t.productPage && t.products.includes(productId));
  if (!list.length) return '';
  return `<section class="section tight" aria-label="Video review"><div class="wrap">
  <div class="stack-sm" style="gap:10px;margin-bottom:24px"><p class="eyebrow">In their words</p><h2 class="h3" style="font-size:clamp(26px,3vw,34px)">Watch a customer review.</h2></div>
  <div class="reviews">${list.map(video).join('')}</div>
</div></section>`;
}

// One compact review right under the buy button on a product page.
export function productReview(productId) {
  const t = TESTIMONIALS.find((x) => x.quote && x.products.includes(productId));
  if (!t) return '';
  return `<figure class="review review-compact"><div class="review-stars" aria-hidden="true">★★★★★</div><blockquote>"${esc(t.head)}${/[.!?]$/.test(t.head) ? '' : '.'}" ${esc(t.quote.length > 170 ? t.quote.slice(0, t.quote.lastIndexOf(' ', 165)) + '...' : t.quote)}</blockquote><figcaption><b>${esc(t.name)}</b><span>${esc(t.detail)}</span></figcaption></figure>`;
}
