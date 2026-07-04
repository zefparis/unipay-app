import { NextRequest, NextResponse } from 'next/server';
import { API_URL, upstreamFetch } from '../../_proxy';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = await upstreamFetch(`${API_URL}/v1/wallet/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!result.ok) return result.errorResponse;
  const { res, data } = result;

  if (!res.ok) {
    return NextResponse.json({ error: (data as { error?: string }).error ?? 'Registration failed' }, { status: res.status });
  }

  return NextResponse.json({ ok: true, wallet_id: (data as { wallet_id: string }).wallet_id }, { status: 201 });
}
