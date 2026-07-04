import { NextRequest, NextResponse } from 'next/server';
import { API_URL, upstreamFetch } from '../../_proxy';

export async function GET(request: NextRequest) {
  const rawNext = request.nextUrl.searchParams.get('next') ?? '/fr/wallet';
  const next = (rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.includes('://'))
    ? rawNext
    : '/fr/wallet';
  const refreshToken = request.cookies.get('wallet_refresh')?.value;

  if (!refreshToken) {
    const locale = next.startsWith('/en/') ? 'en' : 'fr';
    return NextResponse.redirect(new URL(`/${locale}/wallet/login`, request.url));
  }

  const result = await upstreamFetch(`${API_URL}/v1/wallet/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!result.ok) {
    const locale = next.startsWith('/en/') ? 'en' : 'fr';
    return NextResponse.redirect(new URL(`/${locale}/wallet/login`, request.url));
  }

  const { res, data } = result;

  if (!res.ok) {
    const locale = next.startsWith('/en/') ? 'en' : 'fr';
    const redirectRes = NextResponse.redirect(new URL(`/${locale}/wallet/login`, request.url));
    redirectRes.cookies.set('wallet_refresh', '', { maxAge: 0, path: '/' });
    return redirectRes;
  }

  const redirectRes = NextResponse.redirect(new URL(next, request.url));
  redirectRes.cookies.set('wallet_token', (data as { access_token: string }).access_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60,
  });
  return redirectRes;
}
