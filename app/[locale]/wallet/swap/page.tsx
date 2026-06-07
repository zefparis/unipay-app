'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ArrowDownUp, RefreshCw } from 'lucide-react';
import Link from 'next/link';

type Direction = 'cglt_to_usdt' | 'usdt_to_cglt';

function fmt(n: number, max = 2) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: max }).format(n);
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function WalletSwapPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [rate, setRate]               = useState<number | null>(null);
  const [feePct, setFeePct]           = useState(0.5);
  const [paused, setPaused]           = useState(false);
  const [cgltBalance, setCgltBalance] = useState<number | null>(null);
  const [direction, setDirection]     = useState<Direction>('cglt_to_usdt');
  const [amount, setAmount]           = useState('');
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [loading, setLoading]         = useState(false);
  const [loadingRate, setLoadingRate] = useState(true);

  function loadRate() {
    setLoadingRate(true);
    fetch('/api/wallet/swap/rate')
      .then((r) => { if (r.status === 401) { router.replace(`/${locale}/wallet/login`); return null; } return r.json(); })
      .then((d) => {
        if (d && typeof d.rate === 'number') {
          setRate(d.rate);
          setFeePct(Number(d.fee ?? 0.5));
          setPaused(Boolean(d.paused));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingRate(false));
  }

  useEffect(() => {
    loadRate();
    fetch('/api/wallet/balance')
      .then((r) => { if (r.status === 401) { router.replace(`/${locale}/wallet/login`); return null; } return r.json(); })
      .then((d) => { if (d) setCgltBalance(Number(d.cglt_balance ?? 0)); })
      .catch(() => {});
  }, []);

  const amountNum = Number(amount) || 0;
  const fromSym   = direction === 'cglt_to_usdt' ? 'CGLT' : 'USDT';
  const toSym     = direction === 'cglt_to_usdt' ? 'USDT' : 'CGLT';

  // Real-time estimate (mirrors backend / reserve math)
  let grossOut = 0;
  if (rate) {
    grossOut = direction === 'cglt_to_usdt' ? amountNum / rate : amountNum * rate;
  }
  const feeOut    = grossOut * (feePct / 100);
  const netOut    = Math.max(grossOut - feeOut, 0);
  const usdtBalance = cgltBalance !== null && rate ? cgltBalance / rate : null;
  const overBudget  = direction === 'cglt_to_usdt' && cgltBalance !== null && amountNum > cgltBalance;

  function toggleDirection() {
    setDirection((d) => (d === 'cglt_to_usdt' ? 'usdt_to_cglt' : 'cglt_to_usdt'));
    setAmount('');
    setError('');
  }

  async function handleSwap(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (amountNum <= 0) { setError('Montant invalide.'); return; }
    if (overBudget) { setError(`Solde CGLT insuffisant (${fmt(cgltBalance!)} disponibles).`); return; }
    if (paused) { setError('Les conversions sont temporairement suspendues.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/wallet/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction, amount: amountNum }),
      });
      const data = await res.json();
      if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
      if (!res.ok) { setError(data.error ?? 'Conversion échouée'); return; }

      setSuccess(`${fmt(data.amount_in)} ${fromSym} convertis en ${fmt(data.amount_out)} ${toSym}.`);
      setAmount('');
      // refresh balance
      fetch('/api/wallet/balance').then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) setCgltBalance(Number(d.cglt_balance ?? 0)); });
    } catch {
      setError('Erreur réseau, réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0f172a] transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-gray-50 dark:border-[#334155]">
        <Link href={`/${locale}/wallet`} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200">
          <ArrowLeft size={20} className="text-gray-600 dark:text-slate-300" />
        </Link>
        <h1 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-[#f1f5f9]">
          <ArrowDownUp className="text-indigo-500" size={20} />
          Convertir
        </h1>
      </div>

      {/* Rate card */}
      <div className="mx-4 mt-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl px-5 py-4 text-white shadow-lg flex items-center justify-between">
        <div>
          <p className="text-xs opacity-80">Taux actuel</p>
          {loadingRate ? (
            <div className="h-7 mt-1"><Spinner /></div>
          ) : (
            <p className="text-xl font-bold mt-0.5">1 USDT = {rate ? fmt(rate, 0) : '—'} CGLT</p>
          )}
          <p className="text-[11px] opacity-70 mt-1">Frais de conversion : {fmt(feePct)}%</p>
        </div>
        <button onClick={loadRate} className="p-2 rounded-full bg-white/15 hover:bg-white/25 transition" aria-label="Rafraîchir">
          <RefreshCw size={18} className={loadingRate ? 'animate-spin' : ''} />
        </button>
      </div>

      {paused && (
        <p className="mx-4 mt-3 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3">
          Conversions temporairement suspendues (disjoncteur actif).
        </p>
      )}

      {/* Swap form */}
      <form onSubmit={handleSwap} className="flex flex-col gap-4 px-4 py-5">
        {/* Direction toggle */}
        <div className="flex items-center justify-center gap-3">
          <span className={`text-sm font-semibold ${direction === 'cglt_to_usdt' ? 'text-indigo-600' : 'text-gray-400 dark:text-slate-500'}`}>CGLT → USDT</span>
          <button type="button" onClick={toggleDirection}
            className="w-12 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 relative transition">
            <span className={`absolute top-1 w-5 h-5 rounded-full bg-indigo-600 transition-all duration-200 ${direction === 'cglt_to_usdt' ? 'left-1' : 'left-6'}`} />
          </button>
          <span className={`text-sm font-semibold ${direction === 'usdt_to_cglt' ? 'text-indigo-600' : 'text-gray-400 dark:text-slate-500'}`}>USDT → CGLT</span>
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">Montant ({fromSym})</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min={0}
            step="any"
            required
            className={`border rounded-xl px-4 py-3 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all duration-200 ${
              overBudget ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 dark:border-slate-600 focus:ring-indigo-400'
            }`}
          />
        </div>

        {/* Estimate */}
        <div className="bg-gray-50 dark:bg-slate-800 rounded-xl px-4 py-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-slate-400">Montant brut</span>
            <span className="font-medium text-gray-800 dark:text-slate-200">{fmt(grossOut, 4)} {toSym}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-slate-400">Frais ({fmt(feePct)}%)</span>
            <span className="font-medium text-orange-500">− {fmt(feeOut, 4)} {toSym}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 dark:border-slate-600 pt-2">
            <span className="text-gray-600 dark:text-slate-300 font-semibold">Vous recevez</span>
            <span className="font-bold text-indigo-600">{fmt(netOut, 4)} {toSym}</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">{error}</p>}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl px-4 py-3">
            <p className="text-sm text-green-800 dark:text-green-300 font-medium">✓ {success}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || paused || overBudget || amountNum <= 0}
          className="w-full h-[52px] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 text-base mt-1"
        >
          {loading && <Spinner />}
          {loading ? 'Conversion…' : 'Convertir'}
        </button>
      </form>

      {/* Balances */}
      <div className="px-4 pb-8">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">Mes soldes</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-gray-100 dark:border-[#334155] bg-white dark:bg-[#1e293b] shadow-sm p-4">
            <p className="text-xs text-gray-400 dark:text-slate-500">Solde CGLT</p>
            <p className="text-lg font-bold text-gray-800 dark:text-slate-100 mt-1">{cgltBalance !== null ? fmt(cgltBalance) : '—'}</p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">CGLT</p>
          </div>
          <div className="rounded-2xl border border-gray-100 dark:border-[#334155] bg-white dark:bg-[#1e293b] shadow-sm p-4">
            <p className="text-xs text-gray-400 dark:text-slate-500">Équivalent USDT</p>
            <p className="text-lg font-bold text-gray-800 dark:text-slate-100 mt-1">{usdtBalance !== null ? fmt(usdtBalance, 2) : '—'}</p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">USDT (au taux actuel)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
