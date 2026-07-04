import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL, upstreamFetch } from '../../_proxy';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const refreshToken = request.cookies.get('wallet_refresh')?.value
    ?? cookieStore.get('wallet_refresh')?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }

  const result = await upstreamFetch(`${API_URL}/v1/wallet/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!result.ok) return result.errorResponse;
  const { res, data } = result;

  if (!res.ok) {
    const response = NextResponse.json({ error: (data as { error?: string }).error ?? 'Refresh failed' }, { status: res.status });
    response.cookies.set('wallet_refresh', '', { maxAge: 0, path: '/' });
    return response;
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('wallet_token', (data as { access_token: string }).access_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60,
  });
  return response;
}
