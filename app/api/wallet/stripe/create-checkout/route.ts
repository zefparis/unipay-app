import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL, upstreamFetch } from '../../_proxy';

export async function POST(req: NextRequest) {
  const token = (await cookies()).get('wallet_token')?.value;
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const result = await upstreamFetch(`${API_URL}/v1/wallet/deposit/stripe/create-checkout`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify(body),
  });
  if (!result.ok) return result.errorResponse;
  const { res, data } = result;
  return NextResponse.json(data, { status: res.status });
}
