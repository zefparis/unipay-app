import { NextRequest, NextResponse } from 'next/server';
import { API_URL, upstreamFetch } from '../../_proxy';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const walletToken = request.cookies.get('wallet_token')?.value;
  if (!walletToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await upstreamFetch(`${API_URL}/v1/wallet/swap/rate`, {
    headers: { Authorization: `Bearer ${walletToken}` },
  });

  if (!result.ok) return result.errorResponse;
  const { res, data } = result;

  if (!res.ok) {
    return NextResponse.json({ error: (data as { error?: string }).error ?? 'Rate unavailable' }, { status: res.status });
  }

  return NextResponse.json(data);
}
