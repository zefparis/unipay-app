import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';

export async function POST(request: NextRequest) {
  const t = request.cookies.get('wallet_token')?.value;
  if (!t) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Forward raw multipart body with original content-type (preserves boundary)
  const contentType = request.headers.get('content-type') ?? '';
  const body = await request.arrayBuffer();

  const upstream = await fetch(`${API_URL}/v1/wallet/kyc/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      Authorization: `Bearer ${t}`,
    },
    body,
  });
  const data = await upstream.json();
  if (!upstream.ok) return NextResponse.json({ error: data.error ?? 'Failed' }, { status: upstream.status });
  return NextResponse.json(data, { status: 201 });
}
