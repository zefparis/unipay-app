'use client';

import { usePathname } from 'next/navigation';
import WalletBottomNav from '@/components/WalletBottomNav';
import DarkModeToggle from '@/components/DarkModeToggle';

const AUTH_PATHS = ['/wallet/login', '/wallet/register'];

/**
 * Client-side gate for the wallet bottom navigation.
 *
 * The nav must NEVER appear on public auth pages (/wallet/login, /wallet/register),
 * even if a wallet_token cookie is still present (middleware lets logged-in users
 * reach those pages) or if a stale service-worker/CDN cache serves a logged-in
 * render of the layout. Because the pathname check runs live in the browser,
 * this gate is immune to both failure modes.
 */
export default function WalletNavGate({
  isLoggedIn,
  children,
}: {
  isLoggedIn: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Strip locale prefix (/fr or /en) before matching
  const pathWithoutLocale = pathname.replace(/^\/(fr|en)(?=\/|$)/, '');
  const isAuthPage = AUTH_PATHS.some((p) => pathWithoutLocale.startsWith(p));
  const showNav = isLoggedIn && !isAuthPage;

  return (
    <>
      <div className={`w-full max-w-md mx-auto min-h-screen flex flex-col${showNav ? ' pb-16' : ''}`}>
        {children}
      </div>
      {showNav && (
        <div className="fixed top-3 right-3 z-50">
          <DarkModeToggle />
        </div>
      )}
      {showNav && <WalletBottomNav isLoggedIn={isLoggedIn} />}
    </>
  );
}
