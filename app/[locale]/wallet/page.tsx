'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, ArrowDownUp, QrCode } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';

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
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [txList, setTxList] = useState<Tx[]>([]);
  const [loadingBal, setLoadingBal] = useState(true);

  useEffect(() => {
    fetch('/api/wallet/balance')
      .then((r) => {
        if (r.status === 401) { router.replace(`${base}/login`); return null; }
        return r.json();
      })
      .then((d) => { if (d) { setBalance(Number(d.balance_cdf ?? 0)); setUsdtBalance(Number(d.usdt_balance ?? 0)); } })
      .catch(() => {})
      .finally(() => setLoadingBal(false));

    fetch('/api/wallet/transactions?limit=3')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.data) setTxList(d.data); })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col">

      {/* Balance card — gradient + lang switcher */}
      <div className="bg-gradient-to-br from-[#00A651] to-[#007a3d] px-6 pt-10 pb-8 flex flex-col gap-1 text-white shadow-lg relative">
        <div className="absolute top-4 left-4">
          <LanguageSwitcher />
        </div>
        <p className="text-sm opacity-80 tracking-wide mt-7">Solde disponible</p>
        {loadingBal ? (
          <div className="h-12 mt-1"><Spinner /></div>
        ) : (
          <p className="text-4xl font-bold leading-tight tracking-tight mt-1">
            {balance !== null ? fmt(balance) : '—'}
            <span className="text-2xl font-normal opacity-70 ml-2">CDF</span>
          </p>
        )}
        <p className="text-xs opacity-50 mt-3">UniPay Wallet · RDC</p>
      </div>

      {/* USDT balance card (secondary) */}
      {usdtBalance > 0 && (
        <div className="bg-slate-800 rounded-xl p-4 mx-4 mt-2">
          <p className="text-xs text-gray-400">Solde USDT</p>
          <p className="text-2xl font-bold text-green-400">{usdtBalance.toFixed(2)} USDT</p>
        </div>
      )}

      {/* Action grid */}
      <div className="grid grid-cols-2 gap-3 px-4 py-5">
        {([
          { href: `${base}/deposit`,  icon: <ArrowDownCircle className="text-[#00A651]" size={26} />, iconBg: 'bg-green-50 dark:bg-green-900/20',   label: 'Déposer' },
          { href: `${base}/withdraw`, icon: <ArrowUpCircle  className="text-orange-500" size={26} />, iconBg: 'bg-orange-50 dark:bg-orange-900/20', label: 'Retirer' },
          { href: `${base}/send`,     icon: <ArrowLeftRight className="text-blue-500"   size={26} />, iconBg: 'bg-blue-50 dark:bg-blue-900/20',     label: 'Envoyer' },
          { href: `${base}/swap`,     icon: <ArrowDownUp   className="text-indigo-500" size={26} />, iconBg: 'bg-indigo-50 dark:bg-indigo-900/20', label: 'Convertir USDT' },
        ] as const).map(({ href, icon, iconBg, label }) => (
          <Link key={label} href={href}
            className="flex flex-col items-center gap-2.5 rounded-2xl border border-gray-100 dark:border-[#334155] bg-white dark:bg-[#1e293b] shadow-sm p-5 active:scale-95 hover:scale-105 transition-all duration-200">
            <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center`}>{icon}</div>
            <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">{label}</span>
          </Link>
        ))}

        <Link href={`${base}/scan`}
          className="flex flex-col items-center gap-2.5 rounded-2xl border border-gray-100 dark:border-[#334155] bg-white dark:bg-[#1e293b] shadow-sm p-5 active:scale-95 hover:scale-105 transition-all duration-200">
          <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
            <QrCode className="text-purple-500" size={26} />
          </div>
          <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">Scanner QR</span>
        </Link>
      </div>

      {/* Recent transactions */}
      <div className="px-4 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Dernières opérations</h2>
          <Link href={`${base}/transactions`} className="text-xs text-[#00A651] font-semibold">Voir tout</Link>
        </div>

        {txList.length === 0 && !loadingBal && (
          <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-8">Aucune transaction pour le moment.</p>
        )}

        <div className="flex flex-col gap-2">
          {txList.map((tx) => {
            const isCredit = tx.direction === 'collect';
            const isP2P    = tx.direction === 'p2p';
            return (
              <div key={tx.id} className="flex items-center gap-3 p-3 bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-gray-50 dark:border-[#334155] transition-all duration-200">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  isCredit ? 'bg-green-50 dark:bg-green-900/20' : isP2P ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-orange-50 dark:bg-orange-900/20'
                }`}>
                  {isCredit && <ArrowDownCircle className="text-[#00A651]" size={20} />}
                  {tx.direction === 'payout' && <ArrowUpCircle className="text-orange-500" size={20} />}
                  {isP2P && <ArrowLeftRight className="text-blue-500" size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-slate-200 capitalize">{tx.operator}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{relativeDate(tx.created_at)}</p>
                </div>
                <p className={`text-sm font-bold shrink-0 ${isCredit ? 'text-[#00A651]' : isP2P ? 'text-blue-500' : 'text-orange-500'}`}>
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
