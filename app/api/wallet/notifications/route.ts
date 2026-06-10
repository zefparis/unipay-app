import { NextRequest, NextResponse } from 'next/server';
import { API_URL, upstreamFetch } from '../_proxy';

export async function GET(request: NextRequest) {
  const walletToken = request.cookies.get('wallet_token')?.value;
  if (!walletToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const result = await upstreamFetch(
    `${API_URL}/v1/wallet/notifications${qs ? `?${qs}` : ''}`,
    { headers: { Authorization: `Bearer ${walletToken}` }, cache: 'no-store' }
  );
  if (!result.ok) return result.errorResponse;
  const { res, data } = result;
  return NextResponse.json(data, { status: res.status });
}
