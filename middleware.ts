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
      const token   = request.cookies.get('wallet_token');
      const refresh = request.cookies.get('wallet_refresh');

      if (!token?.value) {
        const locale = pathname.startsWith('/en/') ? 'en' : 'fr';

        if (refresh?.value) {
          // Refresh silencieux : redirect vers la route de refresh qui reposera le cookie
          const url = request.nextUrl.clone();
          url.pathname = '/api/wallet/auth/silent-refresh';
          url.searchParams.set('next', pathname);
          return NextResponse.redirect(url);
        }

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
