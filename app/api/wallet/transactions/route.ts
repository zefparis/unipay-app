import { NextRequest, NextResponse } from 'next/server';
import { API_URL, upstreamFetch } from '../_proxy';

const ALLOWED_PARAMS = new Set(['limit', 'offset', 'page', 'type', 'direction']);

export async function GET(request: NextRequest) {
  const walletToken = request.cookies.get('wallet_token')?.value;
  if (!walletToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const safe = new URLSearchParams();
  searchParams.forEach((v, k) => { if (ALLOWED_PARAMS.has(k)) safe.set(k, v); });
  const qs = safe.toString();

  const result = await upstreamFetch(
    `${API_URL}/v1/wallet/transactions${qs ? `?${qs}` : ''}`,
    { headers: { Authorization: `Bearer ${walletToken}` } }
  );
  if (!result.ok) return result.errorResponse;
  const { res, data } = result;
  if (!res.ok) return NextResponse.json({ error: (data as { error?: string }).error ?? 'Failed' }, { status: res.status });
  return NextResponse.json(data);
}
