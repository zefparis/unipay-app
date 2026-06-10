import { NextResponse } from 'next/server';
import { API_URL, upstreamFetch } from '../../_proxy';

export async function GET() {
  const result = await upstreamFetch(`${API_URL}/v1/wallet/push/vapid-public-key`);
  if (!result.ok) return result.errorResponse;
  return NextResponse.json(result.data);
}
