import { NextRequest, NextResponse } from 'next/server';
import { API_URL, upstreamFetch } from '../../_proxy';

export async function GET(req: NextRequest) {
  const walletToken = req.cookies.get('wallet_token')?.value;
  if (!walletToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await upstreamFetch(`${API_URL}/v1/wallet/balance`, {
    headers: { Authorization: `Bearer ${walletToken}` },
    cache: 'no-store',
  });
  if (!result.ok) return result.errorResponse;
  const { res, data } = result;
  if (!res.ok) return NextResponse.json({ error: 'Failed' }, { status: res.status });
  return NextResponse.json({ cglt_balance: Number((data as { cglt_balance?: number }).cglt_balance ?? 0) });
}
