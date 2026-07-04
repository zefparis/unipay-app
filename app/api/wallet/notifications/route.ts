import { NextRequest, NextResponse } from 'next/server';
import { API_URL, upstreamFetch } from '../_proxy';

const ALLOWED_PARAMS = new Set(['page', 'limit']);

export async function GET(request: NextRequest) {
  const walletToken = request.cookies.get('wallet_token')?.value;
  if (!walletToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const safe = new URLSearchParams();
  searchParams.forEach((v, k) => { if (ALLOWED_PARAMS.has(k)) safe.set(k, v); });
  const qs = safe.toString();
  const result = await upstreamFetch(
    `${API_URL}/v1/wallet/notifications${qs ? `?${qs}` : ''}`,
    { headers: { Authorization: `Bearer ${walletToken}` }, cache: 'no-store' }
  );
  if (!result.ok) return result.errorResponse;
  const { res, data } = result;
  return NextResponse.json(data, { status: res.status });
}
