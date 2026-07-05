'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { wT } from '@/lib/i18n-wallet';
import { useNotifications, type WalletNotification } from '@/hooks/useNotifications';

const TYPE_ICON: Record<string, string> = {
  deposit:           '✅',
  transfer_sent:     '↗️',
  transfer_received: '↘️',
  withdrawal:        '💸',
  system:            '📢',
};

function relativeTime(iso: string, locale: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const fr = locale !== 'en';
  if (s < 60)    return fr ? "À l'instant"     : 'Just now';
  if (s < 3600)  return fr ? `Il y a ${Math.floor(s/60)} min`  : `${Math.floor(s/60)} min ago`;
  if (s < 86400) return fr ? `Il y a ${Math.floor(s/3600)} h`  : `${Math.floor(s/3600)} h ago`;
  return fr ? `Il y a ${Math.floor(s/86400)} j` : `${Math.floor(s/86400)} d ago`;
}

function Spinner() {
  return (
    <svg className="animate-spin h-6 w-6 text-[#00A651] mx-auto" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const T = wT(locale ?? 'fr');
  const { markRead, fetchUnreadCount } = useNotifications();

  const [notifs, setNotifs]       = useState<WalletNotification[]>([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll]   = useState(false);

  const fetchPage = useCallback(async (p: number, append = false) => {
    try {
      const res = await fetch(`/api/wallet/notifications?page=${p}&limit=20`);
      if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
      if (!res.ok) return;
      const data = await res.json();
      const items: WalletNotification[] = data.notifications ?? [];
      setNotifs((prev) => append ? [...prev, ...items] : items);
      setHasMore(items.length === 20);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [locale, router]);

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  async function handleMarkAllRead() {
    setMarkingAll(true);
    await markRead();
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    fetchUnreadCount();
    setMarkingAll(false);
  }

  async function handleMarkOne(id: string) {
    await markRead(id);
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    fetchUnreadCount();
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    setLoadingMore(true);
    fetchPage(next, true);
  }

  const unread = notifs.filter((n) => !n.read).length;
  const isFr   = locale !== 'en';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 pt-12 pb-4 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Link href={`/${locale}/wallet`} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-gray-600 dark:text-slate-400">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            {isFr ? 'Notifications' : 'Notifications'}
          </h1>
        </div>
        {unread > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="text-xs text-[#00A651] font-semibold px-3 py-1.5 rounded-lg bg-[#00A651]/10 hover:bg-[#00A651]/20 transition disabled:opacity-50"
          >
            {markingAll ? '…' : isFr ? 'Tout lire' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex flex-col gap-0 pt-4 px-4">
        {notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <span className="text-5xl">🔔</span>
            <p className="text-gray-500 dark:text-slate-500 text-sm font-medium">
              {isFr ? 'Aucune notification' : 'No notifications yet'}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-600">
              {isFr
                ? 'Vos dépôts, transferts et retraits apparaîtront ici'
                : 'Your deposits, transfers and withdrawals will appear here'}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden divide-y divide-gray-50 dark:divide-slate-700/60">
            {notifs.map((n) => {
              const title = isFr ? n.title_fr : n.title_en;
              const body  = isFr ? n.body_fr  : n.body_en;
              const icon  = TYPE_ICON[n.type] ?? '📢';

              return (
                <button
                  key={n.id}
                  onClick={() => !n.read && handleMarkOne(n.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition hover:bg-gray-50 dark:hover:bg-slate-700/50 ${!n.read ? 'bg-[#00A651]/5 dark:bg-[#00A651]/10' : ''}`}
                >
                  <span className="text-2xl mt-0.5 leading-none shrink-0">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium truncate ${n.read ? 'text-gray-700 dark:text-slate-300' : 'text-gray-900 dark:text-white'}`}>
                        {title}
                      </p>
                      {!n.read && (
                        <span className="shrink-0 w-2 h-2 rounded-full bg-[#00A651] mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5 line-clamp-2">{body}</p>
                    <p className="text-[11px] text-gray-500 dark:text-slate-600 mt-1">
                      {relativeTime(n.created_at, locale)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {hasMore && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="mt-4 w-full py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-sm text-gray-600 dark:text-slate-400 font-medium hover:bg-gray-100 dark:hover:bg-slate-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loadingMore ? <Spinner /> : (isFr ? 'Charger plus' : 'Load more')}
          </button>
        )}
      </div>
    </div>
  );
}
