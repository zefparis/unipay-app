'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Home, ArrowLeftRight, List, User } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'home',         segment: '',              Icon: Home,           label: 'Accueil' },
  { key: 'send',         segment: '/send',         Icon: ArrowLeftRight, label: 'Envoyer' },
  { key: 'transactions', segment: '/transactions', Icon: List,           label: 'Historique' },
  { key: 'profile',      segment: '/profile',      Icon: User,           label: 'Profil' },
] as const;

export default function WalletBottomNav() {
  const pathname = usePathname();
  const { locale } = useParams<{ locale: string }>();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 flex items-center z-50">
      {NAV_ITEMS.map(({ key, segment, Icon, label }) => {
        const href = `/${locale}/wallet${segment}`;
        const isActive =
          key === 'home'
            ? pathname === `/${locale}/wallet`
            : pathname.startsWith(`/${locale}/wallet${segment}`);

        return (
          <Link
            key={key}
            href={href}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-3 select-none"
          >
            <Icon
              size={22}
              className={isActive ? 'text-[#00A651]' : 'text-gray-400'}
            />
            <span
              className={`text-[11px] ${
                isActive ? 'text-[#00A651] font-semibold' : 'text-gray-400'
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
