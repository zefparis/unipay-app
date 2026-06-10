import { NextResponse } from 'next/server';
import { API_URL, upstreamFetch } from '../../_proxy';

export async function GET() {
  const result = await upstreamFetch(`${API_URL}/v1/rates/usdt-cdf`);
  if (!result.ok) return result.errorResponse;
  const { res, data } = result;
  return NextResponse.json(data, {
    status: res.status,
    headers: { 'Cache-Control': 'public, max-age=60' },
  });
}
