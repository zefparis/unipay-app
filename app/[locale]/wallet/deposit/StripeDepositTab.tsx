'use client';

import { useState, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useRouter, useParams } from 'next/navigation';

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
const stripePromise   = PUBLISHABLE_KEY ? loadStripe(PUBLISHABLE_KEY) : null;
const MIN_USD         = 5;

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color:           '#ffffff',
      fontSize:        '16px',
      fontFamily:      'Arial, sans-serif',
      '::placeholder': { color: '#aaaaaa' },
    },
    invalid: { color: '#f87171' },
  },
} as const;

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function CardForm({ usdBalance }: { usdBalance: number }) {
  const stripe   = useStripe();
  const elements = useElements();
  const router   = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [amount,  setAmount]  = useState('');
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const amountNum = Number(amount);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!stripe || !elements) { setError('Stripe non chargé, réessayez.'); return; }
    if (amountNum < MIN_USD)   { setError(`Montant minimum : ${MIN_USD} USD.`); return; }

    const card = elements.getElement(CardElement);
    if (!card) { setError('Champ carte introuvable.'); return; }

    setLoading(true);
    try {
      // 1. Créer le PaymentIntent côté serveur
      const intentRes = await fetch('/api/wallet/stripe/create-intent', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amount_usd: amountNum }),
      });
      if (intentRes.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
      if (!intentRes.ok) {
        const d = await intentRes.json();
        setError(d.error ?? 'Erreur lors de la création du paiement.');
        return;
      }
      const { client_secret } = await intentRes.json();

      // 2. Confirmer le paiement avec la carte
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: { card },
      });

      if (stripeError) {
        setError(stripeError.message ?? 'Paiement refusé.');
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        setSuccess(`✓ Paiement de ${amountNum.toFixed(2)} USD confirmé ! Votre solde USD sera mis à jour dans quelques secondes.`);
        setTimeout(() => router.push(`/${locale}/wallet`), 4000);
      }
    } catch {
      setError('Erreur réseau, réessayez.');
    } finally {
      setLoading(false);
    }
  }, [stripe, elements, amountNum, router, locale]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 py-5">

      {/* Solde actuel */}
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

      {/* Carte bancaire */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">Numéro de carte</label>
        <div className="rounded-xl border-2 border-slate-600 bg-[#1e293b] px-4 py-4">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
          🔒 Paiement sécurisé par Stripe · Visa, Mastercard, Amex
        </p>
      </div>

      {error   && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">{error}</p>}
      {success && <p className="text-sm text-green-800 dark:text-green-300 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl px-4 py-3 font-medium">{success}</p>}

      <button
        type="submit"
        disabled={loading || !!success || !stripe}
        className="w-full h-[52px] bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 text-base mt-2"
      >
        {loading && <Spinner />}
        {loading ? 'Traitement…' : `Payer ${amountNum >= MIN_USD ? amountNum.toFixed(2) + ' USD' : ''}`}
      </button>
    </form>
  );
}

export default function StripeDepositTab({ usdBalance }: { usdBalance: number }) {
  if (!PUBLISHABLE_KEY) {
    return (
      <div className="mx-4 my-5 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-4 text-sm text-red-700 dark:text-red-400">
        ⚠️ Paiement par carte non disponible — clé Stripe manquante.<br />
        <span className="text-xs opacity-75">(Ajouter NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY dans les variables Vercel)</span>
      </div>
    );
  }
  return (
    <Elements stripe={stripePromise}>
      <CardForm usdBalance={usdBalance} />
    </Elements>
  );
}
