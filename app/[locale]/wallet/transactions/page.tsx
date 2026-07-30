'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, ArrowRightLeft } from 'lucide-react';
import { wT } from '@/lib/i18n-wallet';

interface Tx {
  id: string;
  direction: 'collect' | 'payout' | 'p2p' | 'p2p_usdt' | 'cglt_gaming_debit' | 'cglt_gaming_credit';
  operator: string;
  amount: number;
  net_amount: number;
  usdt_amount?: number | null;
  currency?: string;
  created_at: string;
  status: string;
}

type Filter = 'all' | 'collect' | 'payout' | 'p2p' | 'p2p_usdt' | 'gaming';

const PAGE_SIZE = 20;

function fmt(n: number) { return new Intl.NumberFormat('fr-FR').format(n); }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    success:   'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    pending:   'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    failed:    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    cancelled: 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400',
  };
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const TT = wT(typeof window !== 'undefined' ? (document.documentElement.lang || 'fr') : 'fr');
  const label: Record<string, string> = {
    success: TT.tx_status_success, pending: TT.tx_status_pending,
    failed: TT.tx_status_failed,   cancelled: TT.tx_status_cancelled,
  };
  const cls = map[status] ?? 'bg-gray-100 text-gray-500';
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label[status] ?? status}</span>;
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-gray-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function WalletTransactionsPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const T = wT(locale);

  const [txList, setTxList]   = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [filter, setFilter]   = useState<Filter>('all');
  const [page, setPage]       = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch('/api/wallet/transactions?limit=200')
      .then((r) => {
        if (r.status === 401) { router.replace(`/${locale}/wallet/login`); return null; }
        return r.json();
      })
      .then((d) => { if (d?.data) setTxList(d.data); else if (d) setError(T.tx_err_load); })
      .catch(() => setError(T.tx_err_net))
      .finally(() => setLoading(false));
  }, [locale, router, T]);

  useEffect(() => { setPage(1); }, [filter]);

  const filtered  =
    filter === 'all'
      ? txList
      : filter === 'gaming'
        ? txList.filter((t) => t.direction === 'cglt_gaming_debit' || t.direction === 'cglt_gaming_credit')
        : txList.filter((t) => t.direction === filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all',      label: T.tx_all },
    { key: 'collect',  label: T.tx_deposits },
    { key: 'payout',   label: T.tx_withdrawals },
    { key: 'p2p',      label: T.tx_p2p },
    { key: 'p2p_usdt', label: T.tx_usdt },
    { key: 'gaming',   label: T.tx_gaming },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0f172a] transition-colors duration-200">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-gray-50 dark:border-[#334155]">
        <Link href={`/${locale}/wallet`} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200">
          <ArrowLeft size={20} className="text-gray-600 dark:text-slate-300" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900 dark:text-[#f1f5f9]">{T.tx_title}</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 px-4 py-3">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              filter === key
                ? 'bg-[#00A651] text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 px-4 pb-6">
        {loading && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 mt-2">{error}</p>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-slate-500 text-center py-16">{T.tx_empty}</p>
        )}

        {!loading && !error && paginated.length > 0 && (
          <div className="flex flex-col gap-2">
            {paginated.map((tx) => {
              const isCredit = tx.direction === 'collect';
              const isP2P    = tx.direction === 'p2p';
              const isUsdt   = tx.direction === 'p2p_usdt';
              const isGameDebit  = tx.direction === 'cglt_gaming_debit';
              const isGameCredit = tx.direction === 'cglt_gaming_credit';
              const isGaming = isGameDebit || isGameCredit;
              const usdtIn   = isUsdt && Number(tx.usdt_amount ?? 0) >= 0;
              const label    = isGaming
                ? (isGameCredit ? T.tx_gain_cglt : T.tx_mise_cglt)
                : isUsdt ? (usdtIn ? T.tx_usdt_in : T.tx_usdt_out) : tx.operator;
              return (
                <div key={tx.id} className="flex items-center gap-3 p-3 bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-gray-50 dark:border-[#334155] transition-all duration-200">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xl ${
                    isGaming ? 'bg-purple-50 dark:bg-purple-900/20' : isUsdt ? 'bg-emerald-50 dark:bg-emerald-900/20' : isCredit ? 'bg-green-50 dark:bg-green-900/20' : isP2P ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-orange-50 dark:bg-orange-900/20'
                  }`}>
                    {isGaming  && <span aria-hidden>🎮</span>}
                    {!isGaming && isUsdt    && <ArrowRightLeft  className="text-emerald-500" size={20} />}
                    {!isGaming && !isUsdt && isCredit  && <ArrowDownCircle  className="text-[#00A651]"  size={20} />}
                    {!isGaming && !isUsdt && tx.direction === 'payout' && <ArrowUpCircle   className="text-orange-500" size={20} />}
                    {!isGaming && !isUsdt && isP2P     && <ArrowLeftRight   className="text-blue-500"   size={20} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 dark:text-slate-200 capitalize">{label}</p>
                      <StatusBadge status={tx.status} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">{fmtDate(tx.created_at)}</p>
                  </div>

                  <div className="text-right shrink-0">
                    {isGaming ? (
                      <p className={`text-sm font-bold whitespace-nowrap ${isGameCredit ? 'text-[#00A651]' : 'text-purple-500'}`}>
                        {isGameCredit ? '+' : '−'}{fmt(tx.amount)} CGLT
                      </p>
                    ) : isUsdt ? (
                      <p className={`text-sm font-bold whitespace-nowrap ${usdtIn ? 'text-emerald-500' : 'text-orange-500'}`}>
                        {usdtIn ? '+' : '−'}{fmt(Math.abs(Number(tx.usdt_amount ?? tx.amount)))} USDT
                      </p>
                    ) : (() => {
                      const cur = (tx.currency ?? 'CDF').toUpperCase();
                      const isUsd = cur === 'USD';
                      const val = isCredit ? tx.net_amount : tx.amount;
                      const display = isUsd ? val.toFixed(2) : fmt(val);
                      const gross = isUsd ? tx.amount.toFixed(2) : fmt(tx.amount);
                      return (
                        <>
                          <p className={`text-sm font-bold whitespace-nowrap ${
                            isCredit ? 'text-[#00A651]' : isP2P ? 'text-blue-500' : 'text-orange-500'
                          }`}>
                            {isCredit ? '+' : '−'}{display} {cur}
                          </p>
                          {!isCredit && <p className="text-[10px] text-gray-500 dark:text-slate-500">{gross} {T.tx_gross}</p>}
                        </>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-4 mt-2 border-t border-gray-100 dark:border-[#334155]">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200"
            >
              {T.tx_prev}
            </button>
            <span className="text-sm text-gray-500 dark:text-slate-400">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200"
            >
              {T.tx_next}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
