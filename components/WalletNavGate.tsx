'use client';

import { usePathname } from 'next/navigation';
import WalletBottomNav from '@/components/WalletBottomNav';
import WalletSidebar from '@/components/WalletSidebar';
import DarkModeToggle from '@/components/DarkModeToggle';

const AUTH_PATHS = ['/wallet/login', '/wallet/register'];

/**
 * Client-side gate for the wallet navigation.
 *
 * Layout strategy:
 *   - Mobile (< lg / 1024px): centered column max-w-md + bottom tab bar.
 *     This is the existing mobile experience — unchanged.
 *   - Desktop (lg+ / ≥1024px): fixed left sidebar (w-64) + main content
 *     area shifted right (lg:pl-64) with max-w-4xl centered content.
 *     The bottom tab bar is hidden on lg+.
 *
 * The nav must NEVER appear on public auth pages (/wallet/login,
 * /wallet/register), even if a wallet_token cookie is still present
 * (middleware lets logged-in users reach those pages) or if a stale
 * service-worker/CDN cache serves a logged-in render of the layout.
 * Because the pathname check runs live in the browser, this gate is
 * immune to both failure modes.
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
      {/* Mobile (< lg): centered column with bottom padding for tab bar.
          Desktop (lg+): full-width with left padding for sidebar. */}
      <div
        className={`w-full mx-auto min-h-screen flex flex-col max-w-md lg:max-w-4xl${
          showNav ? ' lg:pl-64 pb-16 lg:pb-0' : ''
        }`}
      >
        {children}
      </div>
      {showNav && (
        <div className="fixed top-3 right-3 z-50">
          <DarkModeToggle />
        </div>
      )}
      {/* Mobile nav: bottom tab bar (hidden on lg+) */}
      {showNav && <WalletBottomNav isLoggedIn={isLoggedIn} />}
      {/* Desktop nav: left sidebar (hidden below lg) */}
      {showNav && <WalletSidebar isLoggedIn={isLoggedIn} />}
    </>
  );
}
