'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.unipaycongo.com';
const MIN_USD  = 5;

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Stripe Checkout — aucun JS Stripe côté client.
 * On crée une Checkout Session sur le backend et on redirige vers session.url.
 * Le webhook backend (payment_intent.succeeded) crédite usd_balance.
 * ───────────────────────────────────────────────────────────────────────────── */
export default function StripeDepositTab({ usdBalance }: { usdBalance: number }) {
  const router             = useRouter();
  const { locale }         = useParams<{ locale: string }>();
  const [amount,  setAmount]  = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const amountNum = Number(amount);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (amountNum < MIN_USD) { setError(`Montant minimum : ${MIN_USD} USD.`); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/wallet/stripe/create-checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_usd:  amountNum,
          success_url: `${APP_URL}/${locale}/wallet?payment=success`,
          cancel_url:  `${APP_URL}/${locale}/wallet/deposit`,
        }),
      });
      if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setError(d.error ?? 'Erreur lors de la création du paiement.');
        return;
      }
      const { url } = await res.json() as { url: string };
      window.location.href = url;
    } catch {
      setError('Erreur réseau, réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="flex flex-col gap-5 px-4 py-5">

      {usdBalance > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-2 flex justify-between text-xs">
          <span className="text-blue-700 dark:text-blue-400">Solde USD actuel</span>
          <span className="font-bold text-blue-700 dark:text-blue-400">{usdBalance.toFixed(2)} USD</span>
        </div>
      )}

      {/* Montant */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">
          Montant (USD) <span className="text-gray-400 font-normal">— min {MIN_USD} USD</span>
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="20.00"
          min={MIN_USD}
          step="0.01"
          required
          className="border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
        />
      </div>

      {/* Info */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-xs text-slate-300 flex flex-col gap-1">
        <p className="font-semibold text-slate-100">💳 Paiement par carte bancaire</p>
        <p className="opacity-75">Vous serez redirigé vers la page de paiement sécurisée Stripe. Votre solde USD sera crédité automatiquement après confirmation.</p>
        <p className="opacity-60 mt-1">Visa · Mastercard · Amex · 3D Secure</p>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-[52px] bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 text-base mt-2"
      >
        {loading ? <><Spinner /> Redirection…</> : `Payer ${amountNum >= MIN_USD ? amountNum.toFixed(2) + ' USD' : ''} →`}
      </button>

      <p className="text-center text-xs text-slate-500">🔒 Paiement hébergé et sécurisé par Stripe</p>
    </form>
  );
}
