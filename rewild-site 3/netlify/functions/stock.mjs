// GET /api/stock  ->  { low: 10, status: { energy: 'in' | 'low' | 'out', ... } } (public, no counts).
import { publicStock } from './_shared/stock.mjs';

export default async () => {
  try {
    return new Response(JSON.stringify(await publicStock()), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' } });
  } catch (e) {
    console.error('stock info failed', e.message);
    return new Response(JSON.stringify({ status: {} }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }
};

export const config = { path: '/api/stock' };
