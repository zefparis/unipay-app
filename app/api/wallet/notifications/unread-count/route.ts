import { NextRequest, NextResponse } from 'next/server';
import { API_URL, upstreamFetch } from '../../_proxy';

export async function GET(request: NextRequest) {
  const walletToken = request.cookies.get('wallet_token')?.value;
  if (!walletToken) return NextResponse.json({ count: 0 });

  const result = await upstreamFetch(
    `${API_URL}/v1/wallet/notifications/unread-count`,
    { headers: { Authorization: `Bearer ${walletToken}` }, cache: 'no-store' }
  );
  if (!result.ok) return NextResponse.json({ count: 0 });
  return NextResponse.json(result.data);
}
