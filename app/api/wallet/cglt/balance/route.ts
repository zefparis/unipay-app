import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';

export async function GET(req: NextRequest) {
  const walletToken = req.cookies.get('wallet_token')?.value;
  if (!walletToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await fetch(`${API_URL}/v1/wallet/balance`, {
    headers: { Authorization: `Bearer ${walletToken}` },
    cache: 'no-store',
  });

  if (!res.ok) return NextResponse.json({ error: 'Failed' }, { status: res.status });

  const data = await res.json() as { cglt_balance?: number };
  return NextResponse.json({ cglt_balance: Number(data.cglt_balance ?? 0) });
}
