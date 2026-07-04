import { NextRequest, NextResponse } from 'next/server';
import { API_URL, upstreamFetch } from '../../_proxy';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = await upstreamFetch(`${API_URL}/v1/wallet/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!result.ok) return result.errorResponse;
  const { res, data } = result;

  if (!res.ok) {
    return NextResponse.json({ error: (data as { error?: string }).error ?? 'Login failed' }, { status: res.status });
  }

  const d = data as { wallet_id: string; phone: string; access_token: string; refresh_token?: string };
  const response = NextResponse.json({
    ok: true,
    wallet_id: d.wallet_id,
    phone: d.phone,
  });

  response.cookies.set('wallet_token', d.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60,
  });

  if (d.refresh_token) {
    response.cookies.set('wallet_refresh', d.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}
