import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';

export async function POST(req: NextRequest) {
  const walletToken = req.cookies.get('wallet_token')?.value;
  if (!walletToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  const res = await fetch(`${API_URL}/v1/wallet/cglt-withdraw-bsc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.GAMING_API_KEY!,
      Authorization: `Bearer ${walletToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
