import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL, upstreamFetch } from '../_proxy';

export async function GET() {
  const token = (await cookies()).get('wallet_token')?.value;
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const result = await upstreamFetch(`${API_URL}/v1/wallet/deposit-address`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!result.ok) return result.errorResponse;
  const { res, data } = result;
  return NextResponse.json(data, { status: res.status });
}
