import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'https://unipay-api.onrender.com';

export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get('next') ?? '/fr/wallet';
  const refreshToken = request.cookies.get('wallet_refresh')?.value;

  if (!refreshToken) {
    const locale = next.startsWith('/en/') ? 'en' : 'fr';
    return NextResponse.redirect(new URL(`/${locale}/wallet/login`, request.url));
  }

  try {
    const upstream = await fetch(`${API_URL}/v1/wallet/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!upstream.ok) {
      const locale = next.startsWith('/en/') ? 'en' : 'fr';
      const res = NextResponse.redirect(new URL(`/${locale}/wallet/login`, request.url));
      res.cookies.set('wallet_refresh', '', { maxAge: 0, path: '/' });
      return res;
    }

    const data = await upstream.json();
    const res = NextResponse.redirect(new URL(next, request.url));
    res.cookies.set('wallet_token', data.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60,
    });
    return res;
  } catch {
    const locale = next.startsWith('/en/') ? 'en' : 'fr';
    return NextResponse.redirect(new URL(`/${locale}/wallet/login`, request.url));
  }
}
