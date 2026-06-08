import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';

export async function POST(request: NextRequest) {
  const walletToken = request.cookies.get('wallet_token')?.value;
  if (!walletToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const upstream = await fetch(`${API_URL}/v1/wallet/unipesa/withdraw`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${walletToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await upstream.json();

  if (!upstream.ok) {
    return NextResponse.json({ error: data.error ?? 'Failed' }, { status: upstream.status });
  }

  return NextResponse.json(data);
}
