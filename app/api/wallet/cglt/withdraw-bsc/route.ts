import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';

export async function POST(req: NextRequest) {
  const walletToken = req.cookies.get('wallet_token')?.value;
  if (!walletToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Resolve phone from the authenticated user's balance
  const balRes = await fetch(`${API_URL}/v1/wallet/balance`, {
    headers: { Authorization: `Bearer ${walletToken}` },
    cache: 'no-store',
  });
  if (!balRes.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const balData = await balRes.json() as { phone?: string };
  const phone = balData.phone;
  if (!phone) return NextResponse.json({ error: 'Phone not found' }, { status: 400 });

  const { amount, bsc_address } = await req.json() as { amount: number; bsc_address: string };

  const res = await fetch(`${API_URL}/v1/wallet/cglt-withdraw-bsc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.GAMING_API_KEY!,
    },
    body: JSON.stringify({ phone, amount, bsc_address }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
