import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL ?? 'https://unipay-api.onrender.com';

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const refreshToken = request.cookies.get('wallet_refresh')?.value
    ?? cookieStore.get('wallet_refresh')?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }

  const upstream = await fetch(`${API_URL}/v1/wallet/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  const data = await upstream.json();

  if (!upstream.ok) {
    const res = NextResponse.json({ error: data.error ?? 'Refresh failed' }, { status: upstream.status });
    res.cookies.set('wallet_refresh', '', { maxAge: 0, path: '/' });
    return res;
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('wallet_token', data.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60,
  });
  return response;
}
