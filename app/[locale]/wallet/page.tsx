'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, QrCode } from 'lucide-react';

interface Tx {
  id: string;
  direction: 'collect' | 'payout' | 'p2p';
  operator: string;
  amount: number;
  net_amount: number;
  created_at: string;
  status: string;
}

function relativeDate(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return `il y a ${Math.floor(s / 86400)} j`;
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n);
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-white/60 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function WalletHomePage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const base = `/${locale}/wallet`;

  const [balance, setBalance] = useState<number | null>(null);
  const [txList, setTxList] = useState<Tx[]>([]);
  const [loadingBal, setLoadingBal] = useState(true);

  useEffect(() => {
    fetch('/api/wallet/balance')
      .then((r) => {
        if (r.status === 401) { router.replace(`${base}/login`); return null; }
        return r.json();
      })
      .then((d) => { if (d) setBalance(Number(d.balance_cdf ?? 0)); })
      .catch(() => {})
      .finally(() => setLoadingBal(false));

    fetch('/api/wallet/transactions?limit=3')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.data) setTxList(d.data); })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col">

      {/* Balance card */}
      <div className="bg-[#00A651] px-6 pt-12 pb-8 flex flex-col gap-1 text-white">
        <p className="text-sm opacity-75 tracking-wide">Solde disponible</p>
        {loadingBal ? (
          <div className="h-11 mt-1"><Spinner /></div>
        ) : (
          <p className="text-[2.6rem] font-bold leading-tight tracking-tight">
            {balance !== null ? fmt(balance) : '—'}
            <span className="text-2xl font-normal opacity-80"> CDF</span>
          </p>
        )}
        <p className="text-xs opacity-50 mt-2">UniPay Wallet · RDC</p>
      </div>

      {/* Action grid */}
      <div className="grid grid-cols-2 gap-3 px-4 py-5">
        <Link href={`${base}/deposit`}
          className="flex flex-col items-center gap-2.5 rounded-2xl border border-gray-100 bg-white shadow-sm p-5 active:scale-95 transition-transform">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
            <ArrowDownCircle className="text-[#00A651]" size={26} />
          </div>
          <span className="text-sm font-semibold text-gray-700">Déposer</span>
        </Link>

        <Link href={`${base}/withdraw`}
          className="flex flex-col items-center gap-2.5 rounded-2xl border border-gray-100 bg-white shadow-sm p-5 active:scale-95 transition-transform">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
            <ArrowUpCircle className="text-orange-500" size={26} />
          </div>
          <span className="text-sm font-semibold text-gray-700">Retirer</span>
        </Link>

        <Link href={`${base}/send`}
          className="flex flex-col items-center gap-2.5 rounded-2xl border border-gray-100 bg-white shadow-sm p-5 active:scale-95 transition-transform">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
            <ArrowLeftRight className="text-blue-500" size={26} />
          </div>
          <span className="text-sm font-semibold text-gray-700">Envoyer</span>
        </Link>

        <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 opacity-50 cursor-not-allowed">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <QrCode className="text-gray-400" size={26} />
          </div>
          <span className="text-sm font-semibold text-gray-400">Scanner QR</span>
          <span className="text-[10px] text-gray-400 -mt-1.5">Bientôt</span>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="px-4 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Dernières opérations</h2>
          <Link href={`${base}/transactions`} className="text-xs text-[#00A651] font-semibold">Voir tout</Link>
        </div>

        {txList.length === 0 && !loadingBal && (
          <p className="text-sm text-gray-400 text-center py-8">Aucune transaction pour le moment.</p>
        )}

        <div className="flex flex-col divide-y divide-gray-50">
          {txList.map((tx) => {
            const isCredit = tx.direction === 'collect';
            const isP2P    = tx.direction === 'p2p';
            return (
              <div key={tx.id} className="flex items-center gap-3 py-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  isCredit ? 'bg-green-50' : isP2P ? 'bg-blue-50' : 'bg-orange-50'
                }`}>
                  {isCredit && <ArrowDownCircle className="text-[#00A651]" size={20} />}
                  {tx.direction === 'payout' && <ArrowUpCircle className="text-orange-500" size={20} />}
                  {isP2P && <ArrowLeftRight className="text-blue-500" size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 capitalize">{tx.operator}</p>
                  <p className="text-xs text-gray-400">{relativeDate(tx.created_at)}</p>
                </div>
                <p className={`text-sm font-bold shrink-0 ${
                  isCredit ? 'text-[#00A651]' : isP2P ? 'text-blue-600' : 'text-orange-500'
                }`}>
                  {isCredit ? '+' : '−'}{fmt(isCredit ? tx.net_amount : tx.amount)} CDF
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
