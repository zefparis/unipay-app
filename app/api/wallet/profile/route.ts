import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://unipay-api.onrender.com';

function token(request: NextRequest) {
  return request.cookies.get('wallet_token')?.value;
}

export async function GET(request: NextRequest) {
  const t = token(request);
  if (!t) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const upstream = await fetch(`${API_URL}/v1/wallet/profile`, {
    headers: { Authorization: `Bearer ${t}` },
  });
  const data = await upstream.json();
  if (!upstream.ok) return NextResponse.json({ error: data.error ?? 'Failed' }, { status: upstream.status });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const t = token(request);
  if (!t) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const upstream = await fetch(`${API_URL}/v1/wallet/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
    body: JSON.stringify(body),
  });
  const data = await upstream.json();
  if (!upstream.ok) return NextResponse.json({ error: data.error ?? 'Failed' }, { status: upstream.status });
  return NextResponse.json(data);
}
