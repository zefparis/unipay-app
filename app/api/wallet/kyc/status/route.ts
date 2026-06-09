import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'https://unipay-api.onrender.com';

export async function GET(request: NextRequest) {
  const t = request.cookies.get('wallet_token')?.value;
  if (!t) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const upstream = await fetch(`${API_URL}/v1/wallet/kyc/status`, {
    headers: { Authorization: `Bearer ${t}` },
  });
  const data = await upstream.json();
  if (!upstream.ok) return NextResponse.json({ error: data.error ?? 'Failed' }, { status: upstream.status });
  return NextResponse.json(data);
}
