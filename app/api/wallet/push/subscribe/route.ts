import { NextRequest, NextResponse } from 'next/server';
import { API_URL, upstreamFetch } from '../../_proxy';

export async function POST(request: NextRequest) {
  const walletToken = request.cookies.get('wallet_token')?.value;
  if (!walletToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const result = await upstreamFetch(`${API_URL}/v1/wallet/push/subscribe`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${walletToken}` },
    body:    JSON.stringify(body),
  });
  if (!result.ok) return result.errorResponse;
  const { res, data } = result;
  return NextResponse.json(data, { status: res.status });
}
