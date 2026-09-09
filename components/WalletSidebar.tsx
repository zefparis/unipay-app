'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Home, ArrowLeftRight, ArrowDownUp, List, Bell, User } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { wT } from '@/lib/i18n-wallet';

const NAV_KEYS = [
  { key: 'home',          segment: '',               Icon: Home,           labelKey: 'nav_home'    },
  { key: 'send',          segment: '/send',          Icon: ArrowLeftRight, labelKey: 'nav_send'    },
  { key: 'swap',          segment: '/swap',          Icon: ArrowDownUp,    labelKey: 'nav_swap'    },
  { key: 'transactions',  segment: '/transactions',  Icon: List,           labelKey: 'nav_history' },
  { key: 'notifications', segment: '/notifications', Icon: Bell,           labelKey: 'nav_notifs'  },
  { key: 'profile',       segment: '/profile',       Icon: User,           labelKey: 'nav_profile' },
] as const;

/**
 * Desktop sidebar navigation — shown on lg+ (≥1024px).
 *
 * Replaces the mobile bottom tab bar on large screens. Fixed left
 * sidebar with vertical nav items. Hidden below lg (the bottom tab
 * bar handles navigation on mobile/tablet).
 *
 * The nav items and labels are identical to WalletBottomNav — only
 * the layout changes (vertical sidebar vs horizontal bottom bar).
 */
export default function WalletSidebar({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const pathname = usePathname();
  const { locale } = useParams<{ locale: string }>();
  const T = wT(locale ?? 'fr');
  const homeHref = isLoggedIn ? `/${locale}/wallet` : `/${locale}`;
  const { unreadCount } = useNotifications();

  return (
    <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-[#1e293b] border-r border-gray-100 dark:border-[#334155] flex-col z-40 transition-colors duration-200">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-gray-100 dark:border-[#334155]">
        <Link href={homeHref} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#00A651] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-lg">U</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-gray-900 dark:text-white leading-tight">UniPay</span>
            <span className="text-[10px] text-gray-500 dark:text-slate-400 uppercase tracking-wider">Congo</span>
          </div>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV_KEYS.map(({ key, segment, Icon, labelKey }) => {
          const href = key === 'home' ? homeHref : `/${locale}/wallet${segment}`;
          const isActive =
            key === 'home'
              ? pathname === `/${locale}/wallet`
              : pathname.startsWith(`/${locale}/wallet${segment}`);

          return (
            <Link
              key={key}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#00A651]/10 text-[#00A651]'
                  : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50 hover:text-gray-700 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg shrink-0">
                <Icon
                  size={20}
                  className={isActive ? 'text-[#00A651]' : 'text-gray-400 dark:text-slate-500'}
                />
                {key === 'notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span>{T[labelKey]}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer — brand mark */}
      <div className="px-6 py-4 border-t border-gray-100 dark:border-[#334155]">
        <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider">
          {T.app_name} · RDC
        </p>
      </div>
    </aside>
  );
}
