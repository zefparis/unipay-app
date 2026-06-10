import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { upstreamFetch } from '../../_proxy';

export async function POST(req: NextRequest) {
  const token = (await cookies()).get('wallet_token')?.value;
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  return upstreamFetch('/v1/wallet/deposit/stripe/create-intent', {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}` },
    body:    JSON.stringify(body),
  });
}
