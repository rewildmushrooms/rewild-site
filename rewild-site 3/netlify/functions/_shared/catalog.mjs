// Single source of truth for products, prices and shipping.
// The website build AND the checkout functions both read this file,
// so a price changed here changes everywhere. Prices are in cents (CAD).

export const CURRENCY = 'cad';

export const SHIPPING = {
  CA: {
    label: 'Canada',
    flatRate: 2000, // $20 flat rate
    freeOver: 17500, // free shipping on orders of $175+ (before discounts)
    standardName: 'Canada Post / courier, tracked',
    freeName: 'Free shipping, tracked',
    minDays: 2,
    maxDays: 7,
    // Nelson, BC hand delivery (Monday / Tuesday). Set enabled:false to hide it.
    localDelivery: { enabled: false, name: 'Hand delivery in Nelson, BC (Mon / Tue)', sameAsShipping: true },
  },
  US: {
    label: 'United States',
    // US shipping is quoted per order: Jade declares each parcel in Zonos, then sends
    // a Square invoice for shipping + duties from REWILD HQ. Nothing is charged for it at checkout.
    flatRate: 0,
    freeOver: null,
    quotedAfterOrder: true,
    standardName: 'US shipping + duties: quoted by email after you order',
    minDays: 5,
    maxDays: 12,
  },
};

export const PRODUCTS = [
  {
    id: 'energy',
    slug: 'cordyceps-militaris-powder',
    name: 'Rewild Energy',
    word: 'Energy',
    mushroom: 'Cordyceps · powered by CordyFuel™',
    commonName: 'Cordyceps',
    latin: 'Cordyceps militaris',
    format: '100g full-spectrum powder',
    size: '100g',
    price: 8000,
    color: '#D2481E',
    image: '/img/energy-cordyceps-powder.webp',
    gallery: [
      '/img/energy-cordyceps-powder.webp',
      '/img/cordyfuel-powder-and-tincture-forest.webp',
      '/img/label-energy-front.webp',
      '/img/label-energy-back.webp',
    ],
    alt: 'REWILD Energy CordyFuel™ Cordyceps militaris powder pouch on the forest floor',
    seoTitle: 'Cordyceps Militaris Powder Canada | CordyFuel™ | REWILD',
    seoDescription:
      'Organic, full-spectrum Cordyceps militaris powder grown in BC. CordyFuel™ is standardized to 3+ mg/g cordycepin, every batch third-party tested. $80 / 100g.',
    tagline: 'Award-winning. Standardized. Grown in BC.',
    story:
      'Cordyceps has been part of mountain traditions for centuries. Rewild Energy is powered by CordyFuel™ Cordyceps militaris, grown in British Columbia and awarded Best Fruiting Body / Full Spectrum at the 2025 Cordy Cup.',
    featured: true,
  },
  {
    id: 'clarity',
    slug: 'lions-mane-powder',
    name: 'Rewild Clarity',
    word: 'Clarity',
    mushroom: "Lion's Mane",
    commonName: "Lion's Mane",
    latin: 'Hericium erinaceus',
    format: '100g full-spectrum powder',
    size: '100g',
    price: 5000,
    color: '#7B3FB0',
    image: '/img/clarity-lions-mane-powder.webp',
    gallery: ['/img/clarity-lions-mane-powder.webp', '/img/label-clarity-front.webp', '/img/label-clarity-back.webp'],
    alt: "REWILD Clarity Lion's Mane powder pouch beside fresh Lion's Mane mushrooms",
    seoTitle: "Lion's Mane Powder Canada | Organic, BC-Grown | REWILD",
    seoDescription:
      "Organic, full-spectrum Lion's Mane mushroom powder grown in British Columbia. Fruiting body + mycelium, third-party tested. $50 / 100g.",
    tagline: 'Quiet, steady, and easy to take every day.',
    story:
      "Lion's Mane grows in long, cascading spines on hardwood trees. It has been a respected food in traditional kitchens for generations. Ours is grown in British Columbia as a full-spectrum powder.",
  },
  {
    id: 'strength',
    slug: 'chaga-powder',
    name: 'Rewild Strength',
    word: 'Strength',
    mushroom: 'Chaga',
    commonName: 'Chaga',
    latin: 'Inonotus obliquus',
    format: '100g full-spectrum powder',
    size: '100g',
    price: 5000,
    color: '#5E7A2E',
    image: '/img/strength-chaga-powder.webp',
    gallery: ['/img/strength-chaga-powder.webp', '/img/label-strength-front.webp', '/img/label-strength-back.webp'],
    alt: 'REWILD Strength Chaga powder pouch among chunks of wild Chaga',
    seoTitle: 'Chaga Powder Canada | Organic, BC-Grown | REWILD',
    seoDescription:
      'Organic, full-spectrum Chaga mushroom powder grown in British Columbia. Earthy, rich and simple to add to coffee, tea or broth. Third-party tested. $50 / 100g.',
    tagline: 'Deep, rooted and earthy.',
    story:
      'For thousands of years Chaga has quietly grown in northern forests. It is earthy, rich and a natural fit for coffee, tea and broth. Ours is grown in British Columbia as a full-spectrum powder.',
  },
  {
    id: 'peace',
    slug: 'reishi-powder',
    name: 'Rewild Peace',
    word: 'Peace',
    mushroom: 'Reishi',
    commonName: 'Reishi',
    latin: 'Ganoderma lucidum',
    format: '100g full-spectrum powder',
    size: '100g',
    price: 5000,
    color: '#B5261E',
    image: '/img/peace-reishi-powder.webp',
    gallery: ['/img/peace-reishi-powder.webp', '/img/label-peace-front.webp', '/img/label-peace-back.webp'],
    alt: 'REWILD Peace Reishi powder pouch beside glossy Reishi on a forest log',
    seoTitle: 'Reishi Powder Canada | Organic, BC-Grown | REWILD',
    seoDescription:
      'Organic, full-spectrum Reishi mushroom powder grown in British Columbia. Bitter, woody and grounding. Third-party tested. $50 / 100g.',
    tagline: 'For the quiet end of the day.',
    story:
      'Reishi has been revered for centuries as the mushroom of stillness. Bitter, woody and grounding. Ours is grown in British Columbia as a full-spectrum powder.',
  },
  {
    id: 'tincture',
    slug: 'cordyceps-tincture',
    name: 'Rewild Energy Tincture',
    word: 'Energy',
    mushroom: 'Cordyceps · powered by CordyFuel™',
    commonName: 'Cordyceps',
    latin: 'Cordyceps militaris',
    format: '100 ml alcohol-free tincture',
    size: '100 ml',
    price: 3000,
    color: '#D2481E',
    image: '/img/tincture-river.webp',
    gallery: ['/img/tincture-river.webp', '/img/tincture-alpine-larches-v2.webp', '/img/tincture-larch-rock.webp', '/img/tincture-in-hand-v2.webp', '/img/tincture-moss-mushrooms.webp', '/img/tincture-sunset-field.webp', '/img/tincture-rock.webp', '/img/tincture-creek.webp'],
    alt: 'CordyFuel™ Cordyceps militaris tincture on moss beside a mountain river',
    seoTitle: 'Cordyceps Tincture, Alcohol-Free | CordyFuel™ | REWILD',
    seoDescription:
      'Alcohol-free Cordyceps militaris tincture made with CordyFuel™. 100% Cordyceps, nothing added, grown in BC. Portable and easy to take. $30 / 100 ml.',
    tagline: 'Rewild Energy, without the powder.',
    story:
      'Same CordyFuel™ Cordyceps militaris, in a portable, alcohol-free liquid. Even people who do not love the taste of mushrooms tend to love this one.',
    isTincture: true,
  },
  {
    id: 'duo',
    slug: 'cordyfuel-powder-and-tincture',
    name: 'Rewild Energy Duo',
    word: 'Energy',
    mushroom: 'Cordyceps · powered by CordyFuel™',
    commonName: 'Cordyceps',
    latin: 'Cordyceps militaris',
    format: '100g powder + 100 ml tincture',
    size: '100g + 100 ml',
    price: 9000, // $110 value
    color: '#D2481E',
    image: '/img/cordyfuel-duo-square.webp',
    gallery: ['/img/cordyfuel-duo-square.webp'],
    alt: 'Rewild Energy powder pouch and tincture bottle, powered by CordyFuel™',
    isBundle: true, // sold from the home page, no product page of its own
  },
  {
    id: 'all4',
    slug: 'all-four-set',
    name: 'The All Four Set',
    word: 'All Four',
    mushroom: "Cordyceps, Lion's Mane, Chaga + Reishi",
    commonName: 'All four',
    latin: '',
    format: '4 × 100g full-spectrum powders',
    size: '4 × 100g',
    price: 19500, // $230 value
    color: '#121310',
    image: '/img/all-four-set.webp',
    gallery: ['/img/all-four-set.webp'],
    alt: 'REWILD Energy, Clarity, Strength and Peace powder pouches together',
    isBundle: true, // sold from the shop page and the cart, no product page of its own
  },
];

export const PRODUCT_BY_ID = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

export const money = (cents) =>
  '$' + (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);

// Pure function used by both the cart (browser copy) and the checkout function.
export function quote(items, country) {
  const ship = SHIPPING[country];
  if (!ship) throw new Error('Unsupported country');
  let subtotal = 0;
  const lines = [];
  for (const it of items || []) {
    const p = PRODUCT_BY_ID[it.id];
    const qty = Math.floor(Number(it.qty));
    if (!p || !(qty >= 1 && qty <= 20)) continue;
    subtotal += p.price * qty;
    lines.push({ id: p.id, qty, unit: p.price });
  }
  const free = ship.freeOver != null && subtotal >= ship.freeOver;
  const shipping = lines.length === 0 ? 0 : free ? 0 : ship.flatRate;
  return { lines, subtotal, shipping, free, total: subtotal + shipping, freeOver: ship.freeOver, quoted: !!ship.quotedAfterOrder };
}
