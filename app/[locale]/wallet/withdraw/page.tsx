'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowUpCircle } from 'lucide-react';
import { normalizePhone } from '@/lib/phone';

const OPERATORS = [
  { key: 'orange',     label: 'Orange Money', color: 'bg-orange-500', active: 'ring-orange-500' },
  { key: 'airtel',    label: 'Airtel Money',  color: 'bg-red-500',    active: 'ring-red-500'    },
  { key: 'afrimoney', label: 'Afrimoney',     color: 'bg-blue-600',   active: 'ring-blue-600'   },
] as const;

const FEE_RATE  = 0.02;
const MIN_AMOUNT = 100;

function fmt(n: number) { return new Intl.NumberFormat('fr-FR').format(Math.round(n)); }

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

  const [balance, setBalance]   = useState<number | null>(null);
  const [operator, setOperator] = useState<string>('');
  const [phone, setPhone]       = useState('');
  const [amount, setAmount]     = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('wallet_phone');
    if (saved) setPhone(saved);

    fetch('/api/wallet/balance')
      .then((r) => { if (r.status === 401) { router.replace(`/${locale}/wallet/login`); return null; } return r.json(); })
      .then((d) => { if (d) setBalance(Number(d.balance_cdf ?? 0)); })
      .catch(() => {});
  }, []);

  const amountNum  = Number(amount);
  const fee        = amountNum > 0 ? amountNum * FEE_RATE : 0;
  const totalCost  = amountNum + fee;
  const overBudget = balance !== null && amountNum > 0 && totalCost > balance;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!operator) { setError('Sélectionnez un opérateur.'); return; }
    if (amountNum < MIN_AMOUNT) { setError(`Montant minimum : ${fmt(MIN_AMOUNT)} CDF.`); return; }
    if (overBudget) { setError(`Solde insuffisant. Coût total (montant + frais) : ${fmt(totalCost)} CDF.`); return; }
    setLoading(true);

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator, phone_number: normalizePhone(phone), amount: amountNum }),
      });
      const data = await res.json();
      if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
      if (!res.ok) { setError(data.error ?? 'Retrait échoué'); return; }

      setSuccess(`Retrait de ${fmt(amountNum)} CDF initié. Vous recevrez ${fmt(amountNum - fee)} CDF sur votre compte ${operator}.`);
      setTimeout(() => router.push(`/${locale}/wallet`), 5000);
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

      {balance !== null && (
        <div className="mx-4 mt-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-orange-700 dark:text-orange-400">Solde disponible</span>
          <span className="text-sm font-bold text-orange-700 dark:text-orange-400">{fmt(balance)} CDF</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 py-5">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">Opérateur Mobile Money</label>
          <div className="flex flex-wrap gap-2">
            {OPERATORS.map((op) => (
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
            Montant (CDF) <span className="text-gray-400 dark:text-slate-500 font-normal">— min {fmt(MIN_AMOUNT)} CDF</span>
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100"
            min={MIN_AMOUNT}
            required
            className={`border rounded-xl px-4 py-3 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all duration-200 ${
              overBudget ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 dark:border-slate-600 focus:ring-orange-400'
            }`}
          />
          {overBudget && <p className="text-xs text-red-500">Solde insuffisant pour couvrir montant + frais.</p>}
        </div>

        {amountNum >= MIN_AMOUNT && (
          <div className="bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-600 rounded-xl px-4 py-3 flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between text-gray-500 dark:text-slate-400">
              <span>Frais (2%)</span>
              <span>−{fmt(fee)} CDF</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-slate-400">
              <span>Coût total prélevé</span>
              <span>{fmt(totalCost)} CDF</span>
            </div>
            <div className="flex justify-between font-bold text-gray-800 dark:text-slate-200 pt-1 border-t border-gray-200 dark:border-slate-600 mt-1">
              <span>Vous recevez</span>
              <span className="text-orange-500">{fmt(amountNum - fee)} CDF</span>
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
