'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ArrowDownUp, RefreshCw, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';
import { wT, type WalletDict } from '@/lib/i18n-wallet';

type Mode = 'cdf_cglt' | 'cglt_usdt' | 'cdf_usd' | 'usd_usdt';
type Direction = 'cglt_to_usdt' | 'usdt_to_cglt' | 'usd_to_usdt' | 'usdt_to_usd';
type InternalDir = 'cdf_to_cglt' | 'cglt_to_cdf' | 'cdf_to_usd' | 'usd_to_cdf';

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
  const T = wT(locale ?? 'fr');

  const [mode, setMode]               = useState<Mode>('cdf_cglt');
  const [rate, setRate]               = useState<number | null>(null);
  const [feePct, setFeePct]           = useState(0.5);
  const [paused, setPaused]           = useState(false);
  const [usdCdfRate, setUsdCdfRate]   = useState<number>(2850);
  const [usdCdfFallback, setUsdCdfFallback] = useState(true);
  const [cdfBalance, setCdfBalance]   = useState<number | null>(null);
  const [cgltBalance, setCgltBalance] = useState<number | null>(null);
  const [usdtBalance, setUsdtBalance] = useState<number | null>(null);
  const [usdBalance, setUsdBalance]   = useState<number | null>(null);
  const [direction, setDirection]     = useState<Direction>('usd_to_usdt');
  const [internalDir, setInternalDir] = useState<InternalDir>('cdf_to_cglt');
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
        const pairRate = d?.pairs?.CDF_USD?.rate;
        if (pairRate && typeof pairRate === 'number' && pairRate > 0) {
          setUsdCdfRate(pairRate);
          setUsdCdfFallback(false);
        } else {
          setUsdCdfFallback(true);
        }
      })
      .catch(() => { setUsdCdfFallback(true); })
      .finally(() => setLoadingRate(false));
  }

  useEffect(() => {
    loadRate();
    fetch('/api/wallet/balance')
      .then((r) => { if (r.status === 401) { router.replace(`/${locale}/wallet/login`); return null; } return r.json(); })
      .then((d) => { if (d) { setCdfBalance(Number(d.balance_cdf ?? 0)); setCgltBalance(Number(d.cglt_balance ?? 0)); setUsdtBalance(Number(d.usdt_balance ?? 0)); setUsdBalance(Number(d.usd_balance ?? 0)); } })
      .catch(() => {});
  }, []);

  const amountNum = Number(amount) || 0;
  const isCdfCglt = mode === 'cdf_cglt';
  const isCdfUsd  = mode === 'cdf_usd';
  const isUsdUsdt = mode === 'usd_usdt';
  const isAmm     = mode === 'cglt_usdt';

  const fromSym = isCdfCglt ? (internalDir === 'cdf_to_cglt' ? 'CDF' : 'CGLT')
               : isCdfUsd  ? (internalDir === 'cdf_to_usd' ? 'CDF' : 'USD')
               : isUsdUsdt ? (direction === 'usd_to_usdt' ? 'USD' : 'USDT')
               : (direction === 'cglt_to_usdt' ? 'CGLT' : 'USDT');
  const toSym = isCdfCglt ? (internalDir === 'cdf_to_cglt' ? 'CGLT' : 'CDF')
             : isCdfUsd  ? (internalDir === 'cdf_to_usd' ? 'USD' : 'CDF')
             : isUsdUsdt ? (direction === 'usd_to_usdt' ? 'USDT' : 'USD')
             : (direction === 'cglt_to_usdt' ? 'USDT' : 'CGLT');

  // Real-time estimate
  let grossOut = 0;
  if (isAmm && rate) {
    grossOut = direction === 'cglt_to_usdt' ? amountNum / rate : amountNum * rate;
  } else if (isCdfUsd) {
    grossOut = internalDir === 'cdf_to_usd' ? amountNum / usdCdfRate : amountNum * usdCdfRate;
  } else if (isUsdUsdt) {
    grossOut = amountNum; // 1:1
  } else {
    grossOut = amountNum; // CDF<->CGLT 1:1
  }
  const feeOut = isCdfCglt ? 0 : grossOut * (feePct / 100);
  const netOut = Math.max(grossOut - feeOut, 0);

  const availFrom = isCdfCglt ? (internalDir === 'cdf_to_cglt' ? cdfBalance : cgltBalance)
                 : isCdfUsd  ? (internalDir === 'cdf_to_usd' ? cdfBalance : usdBalance)
                 : isUsdUsdt ? (direction === 'usd_to_usdt' ? usdBalance : usdtBalance)
                 : (direction === 'cglt_to_usdt' ? cgltBalance : usdtBalance);
  const overBudget = availFrom !== null && amountNum > availFrom;

  function toggleDirection() {
    if (mode === 'usd_usdt') {
      setDirection((d) => (d === 'usd_to_usdt' ? 'usdt_to_usd' : 'usd_to_usdt'));
    } else {
      setDirection((d) => (d === 'cglt_to_usdt' ? 'usdt_to_cglt' : 'cglt_to_usdt'));
    }
    setAmount('');
    setError('');
  }

  function toggleInternal() {
    if (mode === 'cdf_usd') {
      setInternalDir((d) => (d === 'cdf_to_usd' ? 'usd_to_cdf' : 'cdf_to_usd'));
    } else {
      setInternalDir((d) => (d === 'cdf_to_cglt' ? 'cglt_to_cdf' : 'cdf_to_cglt'));
    }
    setAmount('');
    setError('');
  }

  function switchMode(m: Mode) {
    setMode(m);
    setAmount('');
    setError('');
    setSuccess('');
    if (m === 'cdf_cglt') setInternalDir('cdf_to_cglt');
    else if (m === 'cdf_usd') setInternalDir('cdf_to_usd');
    else if (m === 'usd_usdt') setDirection('usd_to_usdt');
    else setDirection('cglt_to_usdt');
  }

  async function handleSwap(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (amountNum <= 0) { setError(T.err_swap_invalid); return; }
    if (overBudget) {
      setError(`Solde ${fromSym} insuffisant (${fmt(availFrom ?? 0)} disponibles).`);
      return;
    }
    if (isAmm && paused) { setError(T.err_swap_paused); return; }

    const swapDirection: Direction | InternalDir = (isCdfCglt || isCdfUsd) ? internalDir : direction;

    setLoading(true);
    try {
      const res = await fetch('/api/wallet/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction: swapDirection, amount: amountNum }),
      });
      const data = await res.json();
      if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
      if (!res.ok) { setError(data.error ?? T.err_swap_failed); return; }

      const sent = Number(data.amount_sent ?? amountNum);
      const recv = Number(data.amount_received ?? amountNum);
      setSuccess(`${fmt(sent)} ${fromSym} → ${fmt(recv, 4)} ${toSym}`);
      setAmount('');
      // update balances from response (no second fetch needed)
      if (data.new_balances) {
        const b = data.new_balances;
        setCdfBalance(Number(b.balance_cdf  ?? 0));
        setCgltBalance(Number(b.cglt_balance ?? 0));
        setUsdtBalance(Number(b.usdt_balance ?? 0));
        setUsdBalance(Number(b.usd_balance   ?? 0));
      } else {
        fetch('/api/wallet/balance').then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) { setCdfBalance(Number(d.balance_cdf ?? 0)); setCgltBalance(Number(d.cglt_balance ?? 0)); setUsdtBalance(Number(d.usdt_balance ?? 0)); setUsdBalance(Number(d.usd_balance ?? 0)); } });
      }
    } catch {
      setError(T.err_network);
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
          {T.swap_title}
        </h1>
      </div>

      {/* Mode tabs */}
      <div className="grid grid-cols-2 gap-2 px-4 pt-4">
        <button
          type="button"
          onClick={() => switchMode('cdf_cglt')}
          className={`h-10 rounded-xl text-xs font-semibold transition-all duration-200 ${
            isCdfCglt
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300'
          }`}
        >
          CDF ↔ CGLT
        </button>
        <button
          type="button"
          onClick={() => switchMode('cdf_usd')}
          className={`h-10 rounded-xl text-xs font-semibold transition-all duration-200 ${
            isCdfUsd
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300'
          }`}
        >
          CDF ↔ USD
        </button>
        <button
          type="button"
          onClick={() => switchMode('cglt_usdt')}
          className={`h-10 rounded-xl text-xs font-semibold transition-all duration-200 ${
            isAmm
              ? 'bg-purple-600 text-white shadow'
              : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300'
          }`}
        >
          CGLT ↔ USDT
        </button>
        <button
          type="button"
          onClick={() => switchMode('usd_usdt')}
          className={`h-10 rounded-xl text-xs font-semibold transition-all duration-200 ${
            isUsdUsdt
              ? 'bg-teal-600 text-white shadow'
              : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300'
          }`}
        >
          USD ↔ USDT
        </button>
      </div>

      {/* Rate card */}
      {isCdfCglt && (
        <div className="mx-4 mt-4 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl px-5 py-4 text-white shadow-lg">
          <p className="text-xs opacity-80">{T.swap_internal}</p>
          <p className="text-xl font-bold mt-0.5">1 CDF = 1 CGLT</p>
          <p className="text-[11px] opacity-70 mt-1">{T.swap_fee_free}</p>
        </div>
      )}
      {isCdfUsd && (
        <div className="mx-4 mt-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl px-5 py-4 text-white shadow-lg">
          <p className="text-xs opacity-80">{T.swap_rate_off}</p>
          <p className="text-xl font-bold mt-0.5">1 USD = {fmt(usdCdfRate, 0)} CDF{usdCdfFallback && <span className="text-[11px] font-normal opacity-70 ml-1">(indicatif)</span>}</p>
          <p className="text-[11px] opacity-70 mt-1">{T.swap_fee_pct_lbl} {fmt(feePct)}%</p>
        </div>
      )}
      {isUsdUsdt && (
        <div className="mx-4 mt-4 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl px-5 py-4 text-white shadow-lg">
          <p className="text-xs opacity-80">{T.swap_parity}</p>
          <p className="text-xl font-bold mt-0.5">1 USD = 1 USDT</p>
          <p className="text-[11px] opacity-70 mt-1">{T.swap_fee_pct_lbl} {fmt(feePct)}%</p>
        </div>
      )}
      {isAmm && (
        <div className="mx-4 mt-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl px-5 py-4 text-white shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80">{T.swap_amm_rate}</p>
            {loadingRate ? (
              <div className="h-7 mt-1"><Spinner /></div>
            ) : (
              <p className="text-xl font-bold mt-0.5">1 USDT = {rate ? fmt(rate, 0) : '—'} CGLT</p>
            )}
            <p className="text-[11px] opacity-70 mt-1">{T.swap_fee_pct_lbl} {fmt(feePct)}%</p>
          </div>
          <button onClick={loadRate} className="p-2 rounded-full bg-white/15 hover:bg-white/25 transition" aria-label={T.swap_refresh}>
            <RefreshCw size={18} className={loadingRate ? 'animate-spin' : ''} />
          </button>
        </div>
      )}

      {isAmm && paused && (
        <p className="mx-4 mt-3 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3">
          {T.swap_suspended}
        </p>
      )}

      {/* Swap form */}
      <form onSubmit={handleSwap} className="flex flex-col gap-4 px-4 py-5">
        {/* Direction toggle */}
        {isCdfCglt ? (
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm font-semibold ${internalDir === 'cdf_to_cglt' ? 'text-indigo-600' : 'text-gray-500 dark:text-slate-500'}`}>CDF → CGLT</span>
            <button type="button" onClick={toggleInternal}
              className="w-12 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 relative transition">
              <span className={`absolute top-1 w-5 h-5 rounded-full bg-indigo-600 transition-all duration-200 ${internalDir === 'cdf_to_cglt' ? 'left-1' : 'left-6'}`} />
            </button>
            <span className={`text-sm font-semibold ${internalDir === 'cglt_to_cdf' ? 'text-indigo-600' : 'text-gray-500 dark:text-slate-500'}`}>CGLT → CDF</span>
          </div>
        ) : isCdfUsd ? (
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm font-semibold ${internalDir === 'cdf_to_usd' ? 'text-emerald-600' : 'text-gray-500 dark:text-slate-500'}`}>CDF → USD</span>
            <button type="button" onClick={toggleInternal}
              className="w-12 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 relative transition">
              <span className={`absolute top-1 w-5 h-5 rounded-full bg-emerald-600 transition-all duration-200 ${internalDir === 'cdf_to_usd' ? 'left-1' : 'left-6'}`} />
            </button>
            <span className={`text-sm font-semibold ${internalDir === 'usd_to_cdf' ? 'text-emerald-600' : 'text-gray-500 dark:text-slate-500'}`}>USD → CDF</span>
          </div>
        ) : isUsdUsdt ? (
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm font-semibold ${direction === 'usd_to_usdt' ? 'text-teal-600' : 'text-gray-500 dark:text-slate-500'}`}>USD → USDT</span>
            <button type="button" onClick={toggleDirection}
              className="w-12 h-7 rounded-full bg-teal-100 dark:bg-teal-900/40 relative transition">
              <span className={`absolute top-1 w-5 h-5 rounded-full bg-teal-600 transition-all duration-200 ${direction === 'usd_to_usdt' ? 'left-1' : 'left-6'}`} />
            </button>
            <span className={`text-sm font-semibold ${direction === 'usdt_to_usd' ? 'text-teal-600' : 'text-gray-500 dark:text-slate-500'}`}>USDT → USD</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm font-semibold ${direction === 'cglt_to_usdt' ? 'text-purple-600' : 'text-gray-500 dark:text-slate-500'}`}>CGLT → USDT</span>
            <button type="button" onClick={toggleDirection}
              className="w-12 h-7 rounded-full bg-purple-100 dark:bg-purple-900/40 relative transition">
              <span className={`absolute top-1 w-5 h-5 rounded-full bg-purple-600 transition-all duration-200 ${direction === 'cglt_to_usdt' ? 'left-1' : 'left-6'}`} />
            </button>
            <span className={`text-sm font-semibold ${direction === 'usdt_to_cglt' ? 'text-purple-600' : 'text-gray-500 dark:text-slate-500'}`}>USDT → CGLT</span>
          </div>
        )}

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">{T.swap_amount} ({fromSym})</label>
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
          {isAmm && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">{T.swap_gross}</span>
                <span className="font-medium text-gray-800 dark:text-slate-200">{fmt(grossOut, 4)} {toSym}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">{T.swap_fee} ({fmt(feePct)}%)</span>
                <span className="font-medium text-orange-500">− {fmt(feeOut, 4)} {toSym}</span>
              </div>
            </>
          )}
          {isCdfCglt && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-slate-400">{T.swap_fee}</span>
              <span className="font-medium text-emerald-600">{T.swap_free}</span>
            </div>
          )}
          {(isCdfUsd || isUsdUsdt) && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">{T.swap_fee} ({fmt(feePct)}%)</span>
                <span className="font-medium text-orange-500">− {fmt(feeOut, 4)} {toSym}</span>
              </div>
            </>
          )}
          <div className={`flex justify-between ${isAmm ? 'border-t border-gray-200 dark:border-slate-600 pt-2' : ''}`}>
            <span className="text-gray-600 dark:text-slate-300 font-semibold">{T.you_receive}</span>
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
          disabled={loading || overBudget || amountNum <= 0 || (isAmm && paused)}
          className="w-full h-[52px] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 text-base mt-1"
        >
          {loading && <Spinner />}
          {loading ? T.swap_loading : T.swap_cta}
        </button>
      </form>

      {/* Balances */}
      <div className="px-4 pb-8">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-3">{T.swap_balances}</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-gray-100 dark:border-[#334155] bg-white dark:bg-[#1e293b] shadow-sm p-4">
            <p className="text-xs text-gray-500 dark:text-slate-500">Solde CDF</p>
            <p className="text-lg font-bold text-gray-800 dark:text-slate-100 mt-1">{cdfBalance !== null ? fmt(cdfBalance) : '—'}</p>
            <p className="text-[11px] text-gray-500 dark:text-slate-500 mt-0.5">CDF</p>
          </div>
          <div className="rounded-2xl border border-gray-100 dark:border-[#334155] bg-white dark:bg-[#1e293b] shadow-sm p-4">
            <p className="text-xs text-gray-500 dark:text-slate-500">Solde USD</p>
            <p className="text-lg font-bold text-gray-800 dark:text-slate-100 mt-1">{usdBalance !== null ? fmt(usdBalance, 2) : '—'}</p>
            <p className="text-[11px] text-gray-500 dark:text-slate-500 mt-0.5">USD</p>
          </div>
          <div className="rounded-2xl border border-gray-100 dark:border-[#334155] bg-white dark:bg-[#1e293b] shadow-sm p-4">
            <p className="text-xs text-gray-500 dark:text-slate-500">Solde CGLT</p>
            <p className="text-lg font-bold text-gray-800 dark:text-slate-100 mt-1">{cgltBalance !== null ? fmt(cgltBalance) : '—'}</p>
            <p className="text-[11px] text-gray-500 dark:text-slate-500 mt-0.5">CGLT</p>
          </div>
          <div className="rounded-2xl border border-gray-100 dark:border-[#334155] bg-white dark:bg-[#1e293b] shadow-sm p-4">
            <p className="text-xs text-gray-500 dark:text-slate-500">Solde USDT</p>
            <p className="text-lg font-bold text-gray-800 dark:text-slate-100 mt-1">{usdtBalance !== null ? fmt(usdtBalance, 2) : '—'}</p>
            <p className="text-[11px] text-gray-500 dark:text-slate-500 mt-0.5">USDT</p>
          </div>
        </div>

        <Link href={`/${locale}/wallet/send-usdt`}
          className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition">
          <ArrowRightLeft size={16} /> {T.swap_send_usdt}
        </Link>

        <Link href={`/${locale}/wallet/exchange`}
          className="mt-2 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl py-3 transition">
          <ArrowRightLeft size={16} /> {T.swap_to_wcglt}
        </Link>
      </div>
    </div>
  );
}
