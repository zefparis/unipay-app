import { NextRequest, NextResponse } from 'next/server';
import { API_URL, upstreamFetch } from '../_proxy';

export async function GET(request: NextRequest) {
  const walletToken = request.cookies.get('wallet_token')?.value;
  if (!walletToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await upstreamFetch(`${API_URL}/v1/wallet/balance`, {
    headers: { Authorization: `Bearer ${walletToken}` },
    cache: 'no-store',
  });
  if (!result.ok) return result.errorResponse;
  const { res, data } = result;
  if (!res.ok) return NextResponse.json({ error: (data as { error?: string }).error ?? 'Failed' }, { status: res.status });
  return NextResponse.json(data);
}
