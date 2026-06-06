'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowDownCircle } from 'lucide-react';

const OPERATORS = [
  { key: 'orange',    label: 'Orange Money',  color: 'bg-orange-500', active: 'ring-orange-500' },
  { key: 'airtel',   label: 'Airtel Money',   color: 'bg-red-500',    active: 'ring-red-500'    },
  { key: 'afrimoney',label: 'Afrimoney',      color: 'bg-blue-600',   active: 'ring-blue-600'   },
] as const;

const FEE_RATE = 0.03;
const MIN_AMOUNT = 500;

function fmt(n: number) { return new Intl.NumberFormat('fr-FR').format(Math.round(n)); }

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function WalletDepositPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [operator, setOperator] = useState<string>('');
  const [phone, setPhone]       = useState('');
  const [amount, setAmount]     = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('wallet_phone');
    if (saved) setPhone(saved);
  }, []);

  const amountNum = Number(amount);
  const fee       = amountNum > 0 ? amountNum * FEE_RATE : 0;
  const net       = amountNum > 0 ? amountNum - fee : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!operator) { setError('Sélectionnez un opérateur.'); return; }
    if (amountNum < MIN_AMOUNT) { setError(`Montant minimum : ${fmt(MIN_AMOUNT)} CDF.`); return; }
    setLoading(true);

    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator, phone_number: phone, amount: amountNum }),
      });
      const data = await res.json();
      if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
      if (!res.ok) { setError(data.error ?? 'Dépôt échoué'); return; }

      setSuccess(`Demande envoyée. Validez le paiement de ${fmt(amountNum)} CDF sur votre téléphone ${phone}.`);
      setTimeout(() => router.push(`/${locale}/wallet`), 5000);
    } catch {
      setError('Erreur réseau, réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-gray-50">
        <Link href={`/${locale}/wallet`} className="p-2 rounded-full hover:bg-gray-100 transition">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="text-lg font-bold flex items-center gap-2 text-gray-900">
          <ArrowDownCircle className="text-[#00A651]" size={20} />
          Déposer de l&apos;argent
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 py-5">

        {/* Operator */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-600">Opérateur Mobile Money</label>
          <div className="flex gap-3">
            {OPERATORS.map((op) => (
              <button
                key={op.key}
                type="button"
                onClick={() => setOperator(op.key)}
                className={`flex-1 py-3 rounded-xl border-2 text-white text-xs font-bold transition ${op.color} ${
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
          <label className="text-sm font-semibold text-gray-600">Numéro Mobile Money</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+243 XXX XXX XXX"
            required
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00A651]"
          />
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600">
            Montant (CDF) <span className="text-gray-400 font-normal">— min {fmt(MIN_AMOUNT)} CDF</span>
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="500"
            min={MIN_AMOUNT}
            required
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00A651]"
          />
        </div>

        {/* Fee preview */}
        {amountNum >= MIN_AMOUNT && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Frais (3%)</span>
              <span>−{fmt(fee)} CDF</span>
            </div>
            <div className="flex justify-between font-bold text-gray-800 pt-1 border-t border-gray-200 mt-1">
              <span>Vous recevez</span>
              <span className="text-[#00A651]">+{fmt(net)} CDF</span>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <p className="text-sm text-green-800 font-medium">✓ {success}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !!success}
          className="w-full bg-[#00A651] hover:bg-[#008f45] text-white font-semibold py-4 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2 text-base mt-2"
        >
          {loading && <Spinner />}
          {loading ? 'Envoi…' : 'Déposer'}
        </button>
      </form>
    </div>
  );
}
