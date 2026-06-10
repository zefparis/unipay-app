'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowDownCircle } from 'lucide-react';
import { normalizePhone, validateDRCPhone } from '@/lib/phone';
import type { WalletBalance } from '@/lib/wallet-types';

const StripeDepositTab   = dynamic(() => import('./StripeDepositTab'),   { ssr: false });
const CryptoDepositTab   = dynamic(() => import('./CryptoDepositTab'),   { ssr: false });

const CDF_OPERATORS = [
  { key: 'orange',    label: 'Orange Money',  color: 'bg-orange-500', active: 'ring-orange-500' },
  { key: 'airtel',   label: 'Airtel Money',   color: 'bg-red-500',    active: 'ring-red-500'    },
  { key: 'afrimoney',label: 'Afrimoney',      color: 'bg-blue-600',   active: 'ring-blue-600'   },
] as const;

const USD_OPERATORS = [
  { key: 'airtel',   label: 'Airtel USD',   color: 'bg-red-500',    active: 'ring-red-500'    },
  { key: 'africell', label: 'Africell USD', color: 'bg-yellow-500',  active: 'ring-yellow-500'  },
  { key: 'orange',   label: 'Orange USD',   color: 'bg-orange-500', active: 'ring-orange-500' },
] as const;

const FEE_RATE = 0.03;
const MIN_CDF_AMOUNT = 500;
const MIN_USD_AMOUNT = 1;

function fmt(n: number, max = 0) { return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: max }).format(n); }

function Spinner({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <svg className={`animate-spin ${cls}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function WalletDepositPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [tab, setTab]               = useState<'cdf' | 'usd' | 'card' | 'bsc'>('cdf');
  const [operator, setOperator]     = useState<string>('orange');
  const [phone, setPhone]           = useState('');
  const [amount, setAmount]         = useState('');
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [loading, setLoading]       = useState(false);
  const [polling, setPolling]       = useState(false);
  const [usdBalance, setUsdBalance] = useState(0);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('wallet_phone');
    if (saved) setPhone(saved);

    fetch('/api/wallet/balance')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: WalletBalance | null) => { if (d) setUsdBalance(Number(d.usd_balance ?? 0)); })
      .catch(() => {});

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const isCdf      = tab === 'cdf';
  const isCard     = tab === 'card';
  const isBsc      = tab === 'bsc';
  const operators  = isCdf ? CDF_OPERATORS : USD_OPERATORS;
  const minAmt     = isCdf ? MIN_CDF_AMOUNT : MIN_USD_AMOUNT;
  const amountNum  = Number(amount);
  const fee        = amountNum > 0 ? Math.round(amountNum * FEE_RATE * 100) / 100 : 0;
  const net        = amountNum > 0 ? Math.round((amountNum - fee) * 100) / 100 : 0;

  function switchTab(t: 'cdf' | 'usd' | 'card' | 'bsc') {
    setTab(t);
    setAmount('');
    setError('');
    setSuccess('');
    if (t !== 'card' && t !== 'bsc') setOperator(t === 'cdf' ? 'orange' : 'airtel');
  }

  function startPolling(preBalance: number) {
    setPolling(true);
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const r = await fetch('/api/wallet/balance');
        if (!r.ok) return;
        const d: WalletBalance = await r.json();
        const newBal = Number(d.usd_balance ?? 0);
        if (newBal > preBalance) {
          clearInterval(pollRef.current!);
          setPolling(false);
          setSuccess(`✓ Dépôt confirmé ! Solde USD : ${newBal.toFixed(2)} USD`);
          setUsdBalance(newBal);
          setTimeout(() => router.push(`/${locale}/wallet`), 3000);
          return;
        }
      } catch { /* ignore */ }
      if (attempts >= 20) {
        clearInterval(pollRef.current!);
        setPolling(false);
        setSuccess('Votre dépôt est en cours de traitement. Le solde sera mis à jour automatiquement.');
        setTimeout(() => router.push(`/${locale}/wallet`), 4000);
      }
    }, 3000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!operator) { setError('Sélectionnez un opérateur.'); return; }
    if (!validateDRCPhone(phone)) {
      setError('Numéro invalide. Format : 09XXXXXXXX ou +243 9X XXX XXXX');
      return;
    }
    if (amountNum < minAmt) { setError(`Montant minimum : ${isCdf ? fmt(minAmt) : minAmt} ${isCdf ? 'CDF' : 'USD'}.`); return; }
    setLoading(true);

    try {
      let res: Response;
      if (isCdf) {
        res = await fetch('/api/wallet/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operator, phone_mm: normalizePhone(phone), amount: amountNum }),
        });
        const data = await res.json();
        if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
        if (!res.ok) { setError(data.error ?? 'Dépôt échoué'); return; }
        setSuccess(`Demande envoyée. Validez le paiement de ${fmt(amountNum)} CDF sur votre téléphone ${phone}.`);
        setTimeout(() => router.push(`/${locale}/wallet`), 5000);
      } else {
        res = await fetch('/api/wallet/unipesa/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: normalizePhone(phone), operator, amount: amountNum }),
        });
        const data = await res.json();
        if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
        if (!res.ok) { setError(data.error ?? 'Dépôt USD échoué'); return; }
        setSuccess('Validez la demande sur votre téléphone. Vérification en cours…');
        startPolling(usdBalance);
      }
    } catch {
      setError('Erreur réseau, réessayez.');
    } finally {
      setLoading(false);
    }
  }

  const submitting = loading || polling;

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0f172a] transition-colors duration-200">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-gray-50 dark:border-[#334155]">
        <Link href={`/${locale}/wallet`} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200">
          <ArrowLeft size={20} className="text-gray-600 dark:text-slate-300" />
        </Link>
        <h1 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-[#f1f5f9]">
          <ArrowDownCircle className="text-[#00A651]" size={20} />
          Déposer de l&apos;argent
        </h1>
      </div>

      {/* Currency tab — scrollable on mobile */}
      <div className="flex gap-2 px-4 pt-4 overflow-x-auto scrollbar-hide">
        <button type="button" onClick={() => switchTab('cdf')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition ${tab === 'cdf' ? 'border-[#00A651] bg-green-50 text-[#00A651] dark:bg-green-900/30 dark:text-green-400' : 'border-gray-200 bg-white text-gray-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
          CDF
        </button>
        <button type="button" onClick={() => switchTab('usd')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition ${tab === 'usd' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'border-gray-200 bg-white text-gray-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
          USD
        </button>
        <button type="button" onClick={() => switchTab('card')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition ${tab === 'card' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'border-gray-200 bg-white text-gray-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
          💳 Carte
        </button>
        <button type="button" onClick={() => switchTab('bsc')}
          className={`flex-shrink-0 flex-1 min-w-[72px] py-2.5 rounded-xl text-sm font-bold border-2 transition ${tab === 'bsc' ? 'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'border-gray-200 bg-white text-gray-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
          🔗 BSC
        </button>
      </div>

      {tab === 'usd' && (
        <div className="mx-4 mt-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl px-4 py-2 flex items-center justify-between text-xs">
          <span className="text-emerald-700 dark:text-emerald-400">Solde USD actuel</span>
          <span className="font-bold text-emerald-700 dark:text-emerald-400">{usdBalance.toFixed(2)} USD</span>
        </div>
      )}

      {isCard && <StripeDepositTab usdBalance={usdBalance} />}
      {isBsc  && <CryptoDepositTab />}

      {!isCard && !isBsc && <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 py-5">

        {/* Operator */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">Opérateur Mobile Money</label>
          <div className="flex flex-wrap gap-2">
            {operators.map((op) => (
              <button
                key={op.key}
                type="button"
                onClick={() => setOperator(op.key)}
                className={`flex-1 min-w-[90px] py-3 rounded-xl border-2 text-white text-xs font-bold transition ${op.color} ${
                  operator === op.key ? `ring-2 ring-offset-2 ${op.active} opacity-100` : 'opacity-60 hover:opacity-80'
                }`}
              >
                {op.label}
              </button>
            ))}
          </div>
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">Numéro Mobile Money</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+243 XXX XXX XXX"
            required
            className="border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00A651] transition-all duration-200"
          />
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
            Montant ({isCdf ? 'CDF' : 'USD'}) <span className="text-gray-400 dark:text-slate-500 font-normal">— min {isCdf ? fmt(minAmt) : minAmt} {isCdf ? 'CDF' : 'USD'}</span>
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={isCdf ? '500' : '10.00'}
            min={minAmt}
            step={isCdf ? '1' : '0.01'}
            required
            className="border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00A651] transition-all duration-200"
          />
        </div>

        {/* Fee preview */}
        {amountNum >= minAmt && (
          <div className="bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-600 rounded-xl px-4 py-3 flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between text-gray-500 dark:text-slate-400">
              <span>Frais (3%)</span>
              <span>−{isCdf ? fmt(fee) : fee.toFixed(2)} {isCdf ? 'CDF' : 'USD'}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-800 dark:text-slate-200 pt-1 border-t border-gray-200 dark:border-slate-600 mt-1">
              <span>Vous recevez</span>
              <span className="text-[#00A651]">+{isCdf ? fmt(net) : net.toFixed(2)} {isCdf ? 'CDF' : 'USD'}</span>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">{error}</p>}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl px-4 py-3 flex items-center gap-2">
            {polling && <Spinner size="md" />}
            <p className="text-sm text-green-800 dark:text-green-300 font-medium">{success}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !!success}
          className="w-full h-[52px] bg-[#00A651] hover:bg-[#008f45] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 text-base mt-2"
        >
          {loading && <Spinner />}
          {loading ? 'Envoi…' : polling ? 'Vérification…' : 'Déposer'}
        </button>
      </form>}
    </div>
  );
}
