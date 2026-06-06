'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight } from 'lucide-react';

interface Tx {
  id: string;
  direction: 'collect' | 'payout' | 'p2p';
  operator: string;
  amount: number;
  net_amount: number;
  created_at: string;
  status: string;
}

type Filter = 'all' | 'collect' | 'payout' | 'p2p';

const PAGE_SIZE = 20;

function fmt(n: number) { return new Intl.NumberFormat('fr-FR').format(n); }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    success:   'bg-green-100 text-green-700',
    pending:   'bg-yellow-100 text-yellow-700',
    failed:    'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };
  const label: Record<string, string> = {
    success: 'Succès', pending: 'En attente', failed: 'Échoué', cancelled: 'Annulé',
  };
  const cls = map[status] ?? 'bg-gray-100 text-gray-500';
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label[status] ?? status}</span>;
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-gray-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function WalletTransactionsPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

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
      .then((d) => { if (d?.data) setTxList(d.data); else if (d) setError('Impossible de charger les transactions.'); })
      .catch(() => setError('Erreur réseau.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { setPage(1); }, [filter]);

  const filtered  = filter === 'all' ? txList : txList.filter((t) => t.direction === filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all',    label: 'Tout' },
    { key: 'collect', label: 'Dépôts' },
    { key: 'payout',  label: 'Retraits' },
    { key: 'p2p',     label: 'P2P' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-gray-50">
        <Link href={`/${locale}/wallet`} className="p-2 rounded-full hover:bg-gray-100 transition">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Historique</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition ${
              filter === key
                ? 'bg-[#00A651] text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
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
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mt-2">{error}</p>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-16">Aucune transaction trouvée.</p>
        )}

        {!loading && !error && paginated.length > 0 && (
          <div className="flex flex-col divide-y divide-gray-50">
            {paginated.map((tx) => {
              const isCredit = tx.direction === 'collect';
              const isP2P    = tx.direction === 'p2p';
              return (
                <div key={tx.id} className="flex items-center gap-3 py-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    isCredit ? 'bg-green-50' : isP2P ? 'bg-blue-50' : 'bg-orange-50'
                  }`}>
                    {isCredit  && <ArrowDownCircle  className="text-[#00A651]"  size={20} />}
                    {tx.direction === 'payout' && <ArrowUpCircle   className="text-orange-500" size={20} />}
                    {isP2P     && <ArrowLeftRight   className="text-blue-500"   size={20} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 capitalize">{tx.operator}</p>
                      <StatusBadge status={tx.status} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{fmtDate(tx.created_at)}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${
                      isCredit ? 'text-[#00A651]' : isP2P ? 'text-blue-600' : 'text-orange-500'
                    }`}>
                      {isCredit ? '+' : '−'}{fmt(isCredit ? tx.net_amount : tx.amount)} CDF
                    </p>
                    {!isCredit && <p className="text-[10px] text-gray-400">{fmt(tx.amount)} brut</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-4 mt-2 border-t border-gray-100">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
            >
              Précédent
            </button>
            <span className="text-sm text-gray-500">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
