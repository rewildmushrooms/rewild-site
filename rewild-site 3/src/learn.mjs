// Mushroom guides (/learn/...). Facts about how REWILD's powders are grown and tested come from
// the grower's 2026 product specification sheets. Background, history and ecology are written in
// REWILD's own words. Keep this educational: no health claims.
// To swap a photo: drop a square image in public/img and change `image` below. Set image: null for a placeholder.

const CLEAN = ['Certified organic (Canada and US)', 'Non-GMO', 'Gluten free (under 15 ppm)', 'Vegan', 'Kosher', 'Halal', 'Made in a GMP-verified facility', 'No added fillers, colours, preservatives or desiccants'];
const MICRO = 'Seven microbial checks on every lot: total plate count, yeast, mould, coliforms, E. coli, Salmonella and S. aureus.';
const HEAVY = [['Arsenic', 'under 0.1 ppm'], ['Cadmium', 'under 0.1 ppm'], ['Lead', 'under 0.25 ppm'], ['Mercury', 'under 0.1 ppm']];
const GLUCANS = [
  ['Total polysaccharides', '50% or more'],
  ['1,3-1,6 beta-glucans', '30% or more'],
  ['Alpha-glucans (starch)', '10% or less'],
];

export const GUIDES = [
  {
    slug: 'cordyceps',
    h1sub: 'Cordyceps militaris mushroom guide',
    productId: 'energy',
    name: 'Cordyceps',
    latin: 'Cordyceps militaris',
    aka: 'Also called: scarlet caterpillar club, orange cordyceps',
    image: '/img/cordyceps-militaris-mushroom.webp',
    alt: 'Fresh, bright orange Cordyceps militaris fruiting bodies',
    seoTitle: 'Cordyceps militaris: A Guide to the Orange Mushroom | REWILD',
    description: 'What Cordyceps militaris is, how it grows in the wild, why it can be cultivated without insects, and how Rewild Energy (powered by CordyFuel™) is tested.',
    intro: 'A bright orange club fungus with one of the strangest life stories in nature, and the mushroom behind CordyFuel™.',
    sections: [
      ['Meet the mushroom', [
        'In the wild, Cordyceps militaris lives a double life. Its spores land on a moth or butterfly pupa buried in leaf litter, and the fungus quietly takes over its host. When it is ready to reproduce, it sends up slender orange clubs that poke through the forest floor. They look more like coral than a mushroom.',
        'It belongs to a big family of insect-loving fungi found on almost every continent. Its famous cousin, the Himalayan caterpillar fungus (now called Ophiocordyceps sinensis), grows only on high Himalayan plateaus and has never been farmed at scale, which has made it one of the most expensive natural products on earth.',
        'Cordyceps militaris is different. It grows happily on grain, so it can be cultivated indoors with no insects involved at all. That makes it the vegan, traceable member of the family.',
      ]],
      ['A little history', [
        'Cordyceps has a long record in traditional Chinese and Tibetan practice, mostly through the wild Himalayan species. Herders noticed it on high mountain pastures centuries ago, and it became one of the most prized ingredients of the region.',
        'Cordyceps militaris made its own mark in the lab. In 1950, researchers isolated a compound from it and named it cordycepin after the mushroom. Today cordycepin is one of the most studied compounds in the fungal world, and it is the main compound every lot of CordyFuel™ is tested for.',
      ]],
    ],
    compounds: [['Cordycepin (UPLC)', '3 mg/g or more']],
    sensory: { colour: 'Beech wood', aroma: 'Honeyed, floral, nutty', flavour: 'Caramel, botanical, toasty' },
    heavy: true,
    tips: 'Mild and slightly sweet, it disappears into coffee, matcha, smoothies and oats. Most people take it earlier in the day, before training or a long afternoon.',
  },
  {
    slug: 'lions-mane',
    h1sub: "Lion's Mane mushroom (Hericium erinaceus) guide",
    productId: 'clarity',
    name: "Lion's Mane",
    latin: 'Hericium erinaceus',
    aka: "Also called: bearded tooth, pom pom mushroom, yamabushitake",
    image: '/img/lions-mane-mushroom-hericium.webp',
    alt: "A Lion's Mane mushroom growing on a hardwood tree trunk in autumn",
    seoTitle: "Lion's Mane Mushroom (Hericium erinaceus): A Guide | REWILD",
    description: "What Lion's Mane is, where it grows, how it got its names, and how REWILD's organic Lion's Mane powder is grown and lab tested in British Columbia.",
    intro: "A white cascade of soft spines that grows on hardwood trees. Gourmet food, forager's prize and one of the best known mushrooms in the world.",
    sections: [
      ['Meet the mushroom', [
        "Lion's Mane is a tooth fungus. Instead of gills under a cap, it grows as a single white mass of long, hanging spines that look like icicles, a beard or a lion's mane, depending on who you ask. It ages from bright white to a soft yellow-brown.",
        'In the wild you will find it on hardwoods like oak, beech, maple and birch, often high up on a wounded trunk or a fallen log in late summer and fall. It is found across North America, Europe and Asia, but it is rarely common anywhere, which makes spotting one a good day in the woods.',
      ]],
      ['A little history', [
        "Lion's Mane has been eaten for centuries in China and Japan. In Japan it is called yamabushitake, after the yamabushi, mountain monks whose robes carried tufted pom poms. In China one of its names translates to monkey head mushroom.",
        'Chefs love it too. Sliced and seared in butter, fresh Lion\'s Mane has a texture and taste that people often compare to crab or lobster. It is also one of the mushrooms mycologist Paul Stamets has done the most to popularize, through his books and the documentary Fantastic Fungi.',
      ]],
    ],
    compounds: GLUCANS,
    sensory: { colour: 'Warm ivory', aroma: 'Clover, earthy, a hint of the sea', flavour: 'Savoury, delicate, earthy' },
    heavy: true,
    tips: 'Gentle and savoury, so it works in coffee, tea, soups, sauces and smoothies. Many people take it with their morning cup, or before deep work.',
  },
  {
    slug: 'reishi',
    h1sub: 'Reishi mushroom (Ganoderma lucidum) guide',
    productId: 'peace',
    name: 'Reishi',
    latin: 'Ganoderma lucidum',
    aka: 'Also called: lingzhi, varnished conk',
    image: '/img/reishi-mushroom-ganoderma.webp',
    alt: 'Two glossy red Reishi (Ganoderma) shelves growing on a tree trunk in a dark forest',
    seoTitle: 'Reishi Mushroom (Ganoderma lucidum): A Guide | REWILD',
    description: 'What Reishi is, how to recognize it, its long history as lingzhi, and how REWILD grows and lab tests its organic Reishi powder in British Columbia.',
    intro: 'A glossy, lacquered shelf mushroom with more than two thousand years of written history behind it.',
    sections: [
      ['Meet the mushroom', [
        'Reishi is easy to recognize once you have seen one. It grows as a woody, kidney-shaped shelf with a shiny, almost varnished top that shifts from deep red-brown in the centre to orange and creamy white at the growing edge. Flip it over and you will find tiny pores instead of gills.',
        'It is a wood decomposer. In nature it grows on the stumps and roots of hardwood trees, slowly breaking them down and returning them to the soil. Here in the Pacific Northwest, close relatives grow on hemlock and other conifers.',
        'Reishi is far too tough and bitter to eat like a culinary mushroom, which is why it has always been taken as a tea, a broth or a powder.',
      ]],
      ['A little history', [
        'In China, Reishi is called lingzhi, and it appears in one of the oldest surviving Chinese herbal texts, written roughly two thousand years ago. Over the centuries it became a symbol of good fortune and long life, showing up in paintings, carvings and palace architecture.',
        'Wild Reishi was once rare enough to be reserved for royalty. Cultivation changed that in the twentieth century, and today it is one of the most widely grown functional mushrooms in the world.',
      ]],
    ],
    compounds: GLUCANS,
    sensory: { colour: 'Chestnut brown', aroma: 'Herbal, toasty, earthy', flavour: 'Bitter and bold' },
    heavy: true,
    tips: 'Reishi is the bitter one, so pair it with something rich: hot cacao, a chai, golden milk or a dark roast. Many people save it for the evening.',
  },
  {
    slug: 'chaga',
    h1sub: 'Chaga mushroom (Inonotus obliquus) guide',
    productId: 'strength',
    name: 'Chaga',
    latin: 'Inonotus obliquus',
    aka: 'Also called: clinker polypore, birch conk, cinder conk',
    image: '/img/chaga-mushroom-birch.webp',
    alt: 'A black, cracked Chaga conk growing out of a tree trunk in a northern forest',
    seoTitle: 'Chaga (Inonotus obliquus): A Guide to the Birch Fungus | REWILD',
    description: 'What Chaga is, why it looks like charcoal on birch trees, its history in northern cultures, and why REWILD\'s Chaga is cultivated, not wild harvested.',
    intro: 'It looks like a lump of burnt charcoal on the side of a birch tree. Break it open and it is rusty gold inside.',
    sections: [
      ['Meet the mushroom', [
        'Chaga is not a typical mushroom at all. What people harvest is a sterile mass called a sclerotium, a dense knot of fungal tissue that bursts through the bark of living birch trees. The outside is black, cracked and crusty. The inside is a corky orange-brown.',
        'It grows in cold northern forests across Canada, the northern US, Scandinavia and Russia, almost always on birch. A single conk can take many years to grow, and the tree it lives on is slowly being colonized the whole time.',
      ]],
      ['A little history', [
        'Chaga has been brewed as a tea for centuries in northern Russia and Siberia, often as an everyday drink rather than anything special. Communities across the boreal forest have their own uses for it too, including carrying fire, since a smouldering piece of chaga holds an ember for a long time.',
        'Its popularity has grown fast, and that has a cost. Wild chaga grows slowly and is easy to over-harvest. Growing it indoors means no birch forest gets stripped to fill a pouch.',
      ]],
    ],
    compounds: GLUCANS,
    sensory: { colour: 'Soft almond', aroma: 'Mildly savoury, smoky, earthy', flavour: 'Savoury, toasty, nutty' },
    heavy: false,
    tips: 'Smooth and a little smoky. Try it in coffee, as a tea with a splash of milk and maple, or stirred into a smoothie. It suits any time of day.',
  },
];

export const GUIDE_BY_PRODUCT = Object.fromEntries(GUIDES.map((g) => [g.productId, g]));

export const GROWN = [
  ['Grown in BC', 'Cultivated indoors by our partner grower in British Columbia, using solid-state fermentation on certified organic grain.'],
  ['The whole organism', 'Each powder contains the fruiting body, mycelium, stroma, natural fibre and the compounds the mycelium releases as it grows, together with the organic grain it grew on.'],
  ['DNA verified', 'Every lot is identified by DNA (qPCR) and must match an authenticated reference sample of the species on the label.'],
  ['Made to last', 'Water activity is kept under 0.6 so the powder stays dry and stable for three years from production.'],
];

export { CLEAN, MICRO, HEAVY };
