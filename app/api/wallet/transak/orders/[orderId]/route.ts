import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL, upstreamFetch } from '../../../_proxy';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const token = (await cookies()).get('wallet_token')?.value;
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { orderId } = await params;
  const isValidOrderId = /^[a-zA-Z0-9-]{1,64}$/.test(orderId);
  if (!isValidOrderId) {
    return NextResponse.json({ error: 'Invalid orderId' }, { status: 400 });
  }

  const result = await upstreamFetch(
    `${API_URL}/v1/wallet/transak/orders/${orderId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!result.ok) return result.errorResponse;
  const { res, data } = result;
  return NextResponse.json(data, { status: res.status });
}
