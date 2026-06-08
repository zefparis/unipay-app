'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowUpCircle } from 'lucide-react';
import { normalizePhone, validateDRCPhone } from '@/lib/phone';
import type { WalletBalance } from '@/lib/wallet-types';

const CDF_OPERATORS = [
  { key: 'orange',     label: 'Orange Money', color: 'bg-orange-500', active: 'ring-orange-500' },
  { key: 'airtel',    label: 'Airtel Money',  color: 'bg-red-500',    active: 'ring-red-500'    },
  { key: 'afrimoney', label: 'Afrimoney',     color: 'bg-blue-600',   active: 'ring-blue-600'   },
] as const;

const USD_OPERATORS = [
  { key: 'airtel',   label: 'Airtel USD',   color: 'bg-red-500',    active: 'ring-red-500'    },
  { key: 'africell', label: 'Africell USD', color: 'bg-yellow-500',  active: 'ring-yellow-500'  },
  { key: 'orange',   label: 'Orange USD',   color: 'bg-orange-500', active: 'ring-orange-500' },
] as const;

const FEE_RATE  = 0.03;
const MIN_CDF_AMOUNT = 100;
const MIN_USD_AMOUNT = 1;

function fmt(n: number, max = 0) { return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: max }).format(n); }

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function WalletWithdrawPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [tab, setTab]               = useState<'cdf' | 'usd'>('cdf');
  const [balance, setBalance]       = useState<number | null>(null);
  const [usdBalance, setUsdBalance] = useState<number | null>(null);
  const [operator, setOperator]     = useState<string>('orange');
  const [phone, setPhone]           = useState('');
  const [amount, setAmount]         = useState('');
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('wallet_phone');
    if (saved) setPhone(saved);

    fetch('/api/wallet/balance')
      .then((r) => { if (r.status === 401) { router.replace(`/${locale}/wallet/login`); return null; } return r.json(); })
      .then((d: WalletBalance | null) => { if (d) { setBalance(Number(d.balance_cdf ?? 0)); setUsdBalance(Number(d.usd_balance ?? 0)); } })
      .catch(() => {});
  }, []);

  const isCdf      = tab === 'cdf';
  const operators  = isCdf ? CDF_OPERATORS : USD_OPERATORS;
  const minAmt     = isCdf ? MIN_CDF_AMOUNT : MIN_USD_AMOUNT;
  const amountNum  = Number(amount);
  const fee        = amountNum > 0 ? Math.round(amountNum * FEE_RATE * 100) / 100 : 0;
  const totalCost  = amountNum > 0 ? Math.round((amountNum + fee) * 100) / 100 : 0;
  const activeBal  = isCdf ? balance : usdBalance;
  const overBudget = activeBal !== null && amountNum > 0 && totalCost > activeBal;

  function switchTab(t: 'cdf' | 'usd') {
    setTab(t);
    setAmount('');
    setError('');
    setSuccess('');
    setOperator(t === 'cdf' ? 'orange' : 'airtel');
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
    if (overBudget) { setError(`Solde insuffisant. Coût total (montant + frais) : ${isCdf ? fmt(totalCost) : totalCost.toFixed(2)} ${isCdf ? 'CDF' : 'USD'}.`); return; }
    setLoading(true);

    try {
      let res: Response;
      if (isCdf) {
        res = await fetch('/api/wallet/withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operator, phone_mm: normalizePhone(phone), amount: amountNum }),
        });
        const data = await res.json();
        if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
        if (!res.ok) { setError(data.error ?? 'Retrait échoué'); return; }
        setSuccess(`Retrait de ${fmt(amountNum)} CDF initié. Vous recevrez ${fmt(amountNum - fee)} CDF sur votre compte ${operator}.`);
        setTimeout(() => router.push(`/${locale}/wallet`), 5000);
      } else {
        res = await fetch('/api/wallet/unipesa/withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: normalizePhone(phone), operator, amount: amountNum }),
        });
        const data = await res.json();
        if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
        if (!res.ok) { setError(data.error ?? 'Retrait USD échoué'); return; }
        setSuccess(`Retrait de ${amountNum.toFixed(2)} USD initié. Vous recevrez ${(amountNum - fee).toFixed(2)} USD sur votre compte ${operator}.`);
        setTimeout(() => router.push(`/${locale}/wallet`), 5000);
      }
    } catch {
      setError('Erreur réseau, réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0f172a] transition-colors duration-200">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-gray-50 dark:border-[#334155]">
        <Link href={`/${locale}/wallet`} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-200">
          <ArrowLeft size={20} className="text-gray-600 dark:text-slate-300" />
        </Link>
        <h1 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-[#f1f5f9]">
          <ArrowUpCircle className="text-orange-500" size={20} />
          Retirer de l&apos;argent
        </h1>
      </div>

      {/* Currency tab */}
      <div className="flex gap-2 px-4 pt-4">
        <button type="button" onClick={() => switchTab('cdf')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition ${tab === 'cdf' ? 'border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'border-gray-200 bg-white text-gray-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
          CDF
        </button>
        <button type="button" onClick={() => switchTab('usd')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition ${tab === 'usd' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'border-gray-200 bg-white text-gray-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
          USD
        </button>
      </div>

      {activeBal !== null && (
        <div className="mx-4 mt-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-orange-700 dark:text-orange-400">Solde {isCdf ? 'CDF' : 'USD'} disponible</span>
          <span className="text-sm font-bold text-orange-700 dark:text-orange-400">{isCdf ? fmt(activeBal) : activeBal.toFixed(2)} {isCdf ? 'CDF' : 'USD'}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 py-5">
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

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">Numéro Mobile Money</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+243 XXX XXX XXX"
            required
            className="border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all duration-200"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
            Montant ({isCdf ? 'CDF' : 'USD'}) <span className="text-gray-400 dark:text-slate-500 font-normal">— min {isCdf ? fmt(minAmt) : minAmt} {isCdf ? 'CDF' : 'USD'}</span>
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={isCdf ? '100' : '10.00'}
            min={minAmt}
            step={isCdf ? '1' : '0.01'}
            required
            className={`border rounded-xl px-4 py-3 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all duration-200 ${
              overBudget ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 dark:border-slate-600 focus:ring-orange-400'
            }`}
          />
          {overBudget && <p className="text-xs text-red-500">Solde insuffisant pour couvrir montant + frais.</p>}
        </div>

        {amountNum >= minAmt && (
          <div className="bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-600 rounded-xl px-4 py-3 flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between text-gray-500 dark:text-slate-400">
              <span>Frais (3%)</span>
              <span>−{isCdf ? fmt(fee) : fee.toFixed(2)} {isCdf ? 'CDF' : 'USD'}</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-slate-400">
              <span>Coût total prélevé</span>
              <span>{isCdf ? fmt(totalCost) : totalCost.toFixed(2)} {isCdf ? 'CDF' : 'USD'}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-800 dark:text-slate-200 pt-1 border-t border-gray-200 dark:border-slate-600 mt-1">
              <span>Vous recevez</span>
              <span className="text-orange-500">{isCdf ? fmt(amountNum - fee) : (amountNum - fee).toFixed(2)} {isCdf ? 'CDF' : 'USD'}</span>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">{error}</p>}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl px-4 py-3">
            <p className="text-sm text-green-800 dark:text-green-300 font-medium">✓ {success}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !!success || overBudget}
          className="w-full h-[52px] bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 text-base mt-2"
        >
          {loading && <Spinner />}
          {loading ? 'Traitement…' : 'Retirer'}
        </button>
      </form>
    </div>
  );
}
