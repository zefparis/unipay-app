import { NextRequest, NextResponse } from 'next/server';
import { API_URL, upstreamFetch } from '../../_proxy';

export async function GET(request: NextRequest) {
  const walletToken = request.cookies.get('wallet_token')?.value;
  if (!walletToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await upstreamFetch(`${API_URL}/v1/wallet/pref/notifications`, {
    headers: { Authorization: `Bearer ${walletToken}` },
    cache: 'no-store',
  });
  if (!result.ok) return result.errorResponse;
  return NextResponse.json(result.data);
}

export async function PATCH(request: NextRequest) {
  const walletToken = request.cookies.get('wallet_token')?.value;
  if (!walletToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const result = await upstreamFetch(`${API_URL}/v1/wallet/pref/notifications`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${walletToken}` },
    body:    JSON.stringify(body),
  });
  if (!result.ok) return result.errorResponse;
  const { res, data } = result;
  return NextResponse.json(data, { status: res.status });
}
