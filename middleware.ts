import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /{locale}/wallet routes (B2C wallet) — except login & register
  if (/^\/(fr|en)\/wallet(\/.*)?$/.test(pathname)) {
    const isPublicWalletPath = /^\/(fr|en)\/wallet\/(login|register)(\/.*)?$/.test(pathname);
    if (!isPublicWalletPath) {
      const token = request.cookies.get('wallet_token');
      if (!token?.value) {
        const locale = pathname.startsWith('/en/') ? 'en' : 'fr';
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}/wallet/login`;
        return NextResponse.redirect(url);
      }
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
