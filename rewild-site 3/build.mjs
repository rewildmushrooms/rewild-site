// Zero-dependency static site build. Run: node build.mjs  -> outputs ./dist
import { mkdir, rm, writeFile, cp, readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES } from './src/pages.mjs';
import { layout } from './src/layout.mjs';
import { SITE } from './src/site.mjs';
import { PRODUCTS, SHIPPING } from './netlify/functions/_shared/catalog.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, 'dist');

const EM_DASH = /—/;

async function build() {
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
  // Skip original photo uploads (phone .jpeg / PHOTO- files and screenshots): only the optimized .webp copies go live.
  await cp(join(root, 'public'), dist, { recursive: true, filter: (src) => !/[\\/]img[\\/]([^\\/]+\.jpeg|PHOTO-[^\\/]+|Screenshot [^\\/]+)$/i.test(src) });

  // Browser copy of the catalog (only what the cart needs)
  const browserCatalog = {
    products: PRODUCTS.map(({ id, slug, name, word, mushroom, format, price, image, color }) => ({ id, slug, name, word, mushroom, format, price, image, color })),
    shipping: Object.fromEntries(Object.entries(SHIPPING).map(([k, v]) => [k, { flatRate: v.flatRate, freeOver: v.freeOver, quoted: !!v.quotedAfterOrder }])),
  };
  await writeFile(join(dist, 'js/catalog.js'), `window.REWILD_CATALOG=${JSON.stringify(browserCatalog)};\n`);

  const imgDir = join(root, 'public/img');
  const small = new Set((await readdir(imgDir)).filter((f) => f.endsWith('-640.webp')));
  // Responsive images: add srcset when a 640px copy exists, and async decoding everywhere.
  const optimizeImgs = (html, page) => html.replace(/<img\b([^>]*?)>/g, (tag, attrs) => {
    let a = attrs;
    const m = /src="\/img\/([^"?]+)\.webp"/.exec(a);
    if (m && !/srcset=/.test(a) && small.has(`${m[1]}-640.webp`) && page.preload !== `/img/${m[1]}.webp`) {
      const w = Number((/width="(\d+)"/.exec(a) || [])[1] || 1100);
      a += ` srcset="/img/${m[1]}-640.webp 640w, /img/${m[1]}.webp 1100w" sizes="(max-width: 700px) 100vw, ${w <= 700 ? '400px' : '50vw'}"`;
    }
    if (!/decoding=/.test(a)) a += ' decoding="async"';
    return `<img${a}>`;
  });

  const problems = [];
  for (const page of PAGES) {
    const html = optimizeImgs(layout(page), page);
    if (EM_DASH.test(html)) problems.push(`${page.path}: contains an em dash`);
    if (/CordyFuel(?!™)/.test(html.replace(/<[^>]+>/g, ' ').replace(/cordyfuel-[a-z-]+/gi, ''))) problems.push(`${page.path}: CordyFuel without ™`);
    if (page.title.length > 70) problems.push(`${page.path}: title ${page.title.length} chars`);
    if (page.description.length > 165) problems.push(`${page.path}: description ${page.description.length} chars`);
    const file = page.file ? join(dist, page.file) : join(dist, page.path, 'index.html');
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, html);
  }

  // sitemap + robots
  const today = new Date().toISOString().slice(0, 10);
  const urls = PAGES.filter((p) => !p.noindex && !p.file).map((p) => `<url><loc>${SITE.url}${p.path}</loc><lastmod>${today}</lastmod></url>`);
  await writeFile(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  await writeFile(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /hq/\nDisallow: /order-confirmed/\nDisallow: /api/\n\nSitemap: ${SITE.url}/sitemap.xml\n`);

  if (problems.length) {
    console.warn('Content checks:\n  ' + problems.join('\n  '));
    if (process.env.STRICT) process.exit(1);
  }
  console.log(`Built ${PAGES.length} pages to dist/ for ${SITE.url}`);
}

build().catch((e) => { console.error(e); process.exit(1); });
