// Lab data, taken from the grower's certificates of analysis (COAs).
// To update: change the lot, date and results below from the newest COA.
// Full COA PDFs are sent on request (they name the grower), so they are not published on the site.
export const LAB = [
  {
    id: 'energy', lot: '240807-CM300-4118', issued: 'June 2025', idMethod: 'FTIR / HPTLC',
    results: [
      ['Cordycepin (UPLC)', '≥ 3 mg/g', '5.7 mg/g'],
      ['Cordycepin, independent lab', '≥ 3 mg/g', '7.1 mg/g'],
      ['Beta-glucans (1,3-1,6)', '≥ 30%', '42.8%'],
      ['Total polysaccharides', '≥ 50%', '50.1%'],
    ],
  },
  {
    id: 'clarity', lot: '250716-HE100-4237', issued: 'August 2025', idMethod: 'DNA (Sanger sequencing)',
    results: [
      ['Beta-glucans (1,3-1,6)', '≥ 30%', '52.0%'],
      ['Total polysaccharides', '≥ 50%', '60.0%'],
    ],
  },
  {
    id: 'strength', lot: '240227-IO-4037', issued: 'April 2024', idMethod: 'FTIR / HPTLC',
    results: [
      ['Beta-glucans (1,3-1,6)', '≥ 15%', '62.1%'],
      ['Total polysaccharides', '≥ 50%', '71.6%'],
    ],
  },
  {
    id: 'peace', lot: '250603-GL100-4215', issued: 'August 2025', idMethod: 'DNA (Sanger sequencing)',
    results: [
      ['Beta-glucans (1,3-1,6)', '≥ 30%', '54.4%'],
      ['Total polysaccharides', '≥ 50%', '57.4%'],
    ],
  },
];

// What every powder lot is tested for (from the COAs).
export const TESTS = [
  ['Identity', 'The right species', 'Every lot is confirmed to be the species on the label, by DNA sequencing or chemical fingerprinting (FTIR / HPTLC).'],
  ['Potency', 'What’s actually in it', 'Polysaccharides and 1,3-1,6 beta-glucans are measured in every lot. CordyFuel™ is also tested for cordycepin by UPLC.'],
  ['Purity', 'What’s not in it', 'Seven microbial tests: total plate count, yeast, mould, coliforms, E. coli, Salmonella and S. aureus. Plus gluten, which has to test under 15 ppm.'],
  ['Stability', 'Made to last', 'Water activity is measured so the powder stays dry and stable. Every lot carries a 3-year shelf life.'],
];

// Cultivation process (as provided by the grower), in REWILD's words.
export const PROCESS = [
  ['Cook', 'Organic sorghum grain is cooked in an autoclave.'],
  ['Bag', 'The grain is cooled and portioned into grow bags.'],
  ['Sterilize', 'Bags go back through the autoclave so nothing unwanted survives.'],
  ['Inoculate', 'Each bag is seeded with living mycelium from a fully mature bag.'],
  ['Grow', 'The mushrooms grow for 4 to 6 weeks, depending on the species.'],
  ['Harvest', 'Bags are opened onto trays and the whole colonized block is broken apart.'],
  ['Dry', 'Everything goes into a dryer: mycelium, primordia, fruiting bodies and the compounds they release.'],
  ['Mill', 'Dried material is milled into a fine powder.'],
  ['Test', 'Every lot is lab tested before it’s released.'],
];
