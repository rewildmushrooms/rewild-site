// GET /api/sale  ->  the current or next flash sale and how many of each product are left (public).
import { saleInfo } from './_shared/sale.mjs';

export default async (req) => {
  try {
    const early = new URL(req.url).searchParams.get('early') || '';
    return new Response(JSON.stringify(await saleInfo(Date.now(), early)), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': early ? 'no-store' : 'public, max-age=20' } });
  } catch (e) {
    console.error('sale info failed', e.message);
    return new Response(JSON.stringify({ sale: null }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
};

export const config = { path: '/api/sale' };
