// Image descriptions (alt text) for Google Images and screen readers.
//
// How it works (automatic):
// 1. Any <img> written with a real alt="..." keeps it.
// 2. Any <img> with an empty or missing alt gets its description from IMAGE_ALTS below,
//    matched by file name (without folder or extension).
// 3. No entry? The build makes one from the file name ("tincture-creek-v2.webp" becomes
//    "Tincture creek") and lists it under "Content checks" so a better line can be added here.
// 4. Purely decorative images (logo marks next to the word REWILD, background marks) stay
//    empty on purpose: mark them aria-hidden="true" or data-decorative.
//
// Tip: name new photos descriptively (e.g. "tincture-on-snowy-ridge.webp") and the automatic
// description is already decent before anyone writes a line here.

export const IMAGE_ALTS = {
  // Product labels
  'label-energy-front': 'Rewild Energy Cordyceps powder label, front: CordyFuel™ 100% organic, grown in BC, lab tested',
  'label-energy-back': 'Rewild Energy Cordyceps powder label, back: ingredients, suggested use and storage',
  'label-clarity-front': "Rewild Clarity Lion's Mane powder label, front",
  'label-clarity-back': "Rewild Clarity Lion's Mane powder label, back: ingredients, suggested use and storage",
  'label-strength-front': 'Rewild Strength Chaga powder label, front',
  'label-strength-back': 'Rewild Strength Chaga powder label, back: ingredients, suggested use and storage',
  'label-peace-front': 'Rewild Peace Reishi powder label, front',
  'label-peace-back': 'Rewild Peace Reishi powder label, back: ingredients, suggested use and storage',

  // Energy Tincture photos
  'tincture-alpine-larches-v2': 'Rewild Energy CordyFuel™ tincture bottle in front of golden alpine larches and mountain peaks',
  'tincture-larch-rock': 'Rewild Energy tincture on a rock with golden larches and a snowy mountainside behind',
  'tincture-in-hand-v2': 'Hand holding a bottle of Rewild Energy Cordyceps militaris tincture on a mountain trail',
  'tincture-moss-mushrooms': 'Rewild Energy tincture on a mossy log beside small wild mushrooms and lichen',
  'tincture-sunset-field': 'Rewild Energy tincture standing in tall grass at sunset',
  'tincture-rock': 'Rewild Energy tincture bottle on a granite boulder by a forest stream',
  'tincture-creek': 'Rewild Energy tincture among autumn leaves beside a forest creek',

  // Lifestyle and pages
  'hero-trail-larches-lake': 'Hiker on a mountain trail among golden larches above a misty valley',
  'rewild-hero-mobile': 'Hiker on a mountain trail among golden larches above a misty valley',
  'cordyfuel-powder-and-tincture-forest': 'Rewild Energy CordyFuel™ powder pouch in the forest with fresh orange Cordyceps militaris',
  'cordyfuel-duo-square': 'Rewild Energy Duo: CordyFuel™ tincture bottle and Energy powder pouch on a log with fresh Cordyceps militaris',
};

const base = (src) => src.split('?')[0].split('/').pop().replace(/\.(webp|jpe?g|png|gif|avif|svg)$/i, '');
const humanize = (name) => {
  const s = name.replace(/[-_]+/g, ' ').replace(/\b(v\d+|\d{2,4}|sm|lg|square|crop)\b/gi, '').replace(/\s+/g, ' ').trim();
  return s ? s[0].toUpperCase() + s.slice(1) : '';
};
const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** Alt text for one image file: the map first, then the file name. */
export const altFor = (src) => IMAGE_ALTS[base(src)] || humanize(base(src));

/**
 * Fill empty alt text in a finished page. Returns { html, missing } where `missing`
 * lists files that only got a file-name description (add them to IMAGE_ALTS).
 */
export function fillAlts(html) {
  const missing = new Set();
  // Video thumbnails: describe them from the play button's label.
  html = html.replace(/(<button\b[^>]*\baria-label="([^"]*)"[^>]*>\s*)<img\b([^>]*?)\balt=""/g, (m, pre, label, mid) =>
    /i\.ytimg\.com/.test(mid) ? `${pre}<img${mid}alt="${attr('Video: ' + label.replace(/^Play( video)?:?\s*/i, ''))}"` : m);
  html = html.replace(/<img\b[^>]*>/g, (tag) => {
    if (/\baria-hidden="true"|\bdata-decorative\b|\brole="presentation"/.test(tag)) return tag;
    const a = tag.match(/\balt="([^"]*)"/);
    if (a && a[1].trim()) return tag;
    const src = (tag.match(/\bsrc="([^"]*)"/) || [])[1];
    if (!src || /^data:|\$\{/.test(src)) return tag;
    const known = IMAGE_ALTS[base(src)];
    const text = known || humanize(base(src));
    if (!text) return tag;
    if (!known) missing.add(base(src));
    return a ? tag.replace(/\balt="[^"]*"/, `alt="${attr(text)}"`) : tag.replace(/<img\b/, `<img alt="${attr(text)}"`);
  });
  return { html, missing: [...missing] };
}
