'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Home, ArrowLeftRight, ArrowDownUp, List, Bell, User } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

const NAV_ITEMS = [
  { key: 'home',          segment: '',               Icon: Home,           label: 'Accueil' },
  { key: 'send',          segment: '/send',          Icon: ArrowLeftRight, label: 'Envoyer' },
  { key: 'swap',          segment: '/swap',          Icon: ArrowDownUp,    label: 'Swap' },
  { key: 'transactions',  segment: '/transactions',  Icon: List,           label: 'Historique' },
  { key: 'notifications', segment: '/notifications', Icon: Bell,           label: 'Notifs' },
  { key: 'profile',       segment: '/profile',       Icon: User,           label: 'Profil' },
] as const;

export default function WalletBottomNav({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const pathname = usePathname();
  const { locale } = useParams<{ locale: string }>();
  const homeHref = isLoggedIn ? `/${locale}/wallet` : `/${locale}`;
  const { unreadCount } = useNotifications();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white dark:bg-[#1e293b] border-t border-gray-100 dark:border-[#334155] flex items-center z-50 transition-colors duration-200">
      {NAV_ITEMS.map(({ key, segment, Icon, label }) => {
        const href = key === 'home' ? homeHref : `/${locale}/wallet${segment}`;
        const isActive =
          key === 'home'
            ? pathname === `/${locale}/wallet`
            : pathname.startsWith(`/${locale}/wallet${segment}`);

        return (
          <Link
            key={key}
            href={href}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2.5 select-none transition-all duration-200"
          >
            <div className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${isActive ? 'bg-[#00A651]/10' : ''}`}>
              <Icon
                size={20}
                className={isActive ? 'text-[#00A651]' : 'text-gray-400 dark:text-slate-500'}
              />
              {key === 'notifications' && unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className={`text-[11px] transition-all duration-200 ${isActive ? 'text-[#00A651] font-semibold' : 'text-gray-400 dark:text-slate-500'}`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
