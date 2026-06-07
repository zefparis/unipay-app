'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';

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

export default function WalletSendUsdtPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const [usdtBalance, setUsdtBalance] = useState<number | null>(null);
  const [phone, setPhone]   = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function loadBalance() {
    fetch('/api/wallet/balance')
      .then((r) => { if (r.status === 401) { router.replace(`/${locale}/wallet/login`); return null; } return r.json(); })
      .then((d) => { if (d) setUsdtBalance(Number(d.usdt_balance ?? 0)); })
      .catch(() => {});
  }

  useEffect(() => { loadBalance(); }, []);

  const amountNum  = Number(amount) || 0;
  const overBudget = usdtBalance !== null && amountNum > usdtBalance;
  const validPhone = /^\+?[0-9]{8,15}$/.test(phone);
  const canSubmit  = amountNum >= 0.01 && validPhone && !overBudget;

  function openConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (amountNum < 0.01) { setError('Montant minimum : 0.01 USDT.'); return; }
    if (!validPhone) { setError('Numéro de téléphone invalide.'); return; }
    if (overBudget) { setError(`Solde USDT insuffisant (${fmt(usdtBalance!)} disponibles).`); return; }
    setShowConfirm(true);
  }

  async function confirmSend() {
    setShowConfirm(false);
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/wallet/send-usdt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, amount: amountNum }),
      });
      const data = await res.json();
      if (res.status === 401) { router.replace(`/${locale}/wallet/login`); return; }
      if (!res.ok) {
        const map: Record<string, string> = {
          INSUFFICIENT_USDT:  'Solde USDT insuffisant.',
          RECEIVER_NOT_FOUND: 'Aucun compte UniPay trouvé pour ce numéro.',
        };
        setError(map[data.error] ?? data.error ?? 'Envoi échoué');
        return;
      }
      setSuccess(`${fmt(data.amount_usdt)} USDT envoyés à ${data.receiver_name ?? phone}.`);
      setAmount(''); setPhone('');
      if (typeof data.new_balance === 'number') setUsdtBalance(data.new_balance);
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
          <ArrowRightLeft className="text-emerald-500" size={20} />
          Envoyer USDT
        </h1>
      </div>

      {/* Balance card */}
      <div className="mx-4 mt-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl px-5 py-4 text-white shadow-lg">
        <p className="text-xs opacity-80">Solde USDT disponible</p>
        <p className="text-2xl font-bold mt-0.5">{usdtBalance !== null ? fmt(usdtBalance) : '—'} <span className="text-base font-normal opacity-80">USDT</span></p>
      </div>

      {/* Form */}
      <form onSubmit={openConfirm} className="flex flex-col gap-4 px-4 py-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">Numéro du destinataire</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+243..."
            required
            className="border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all duration-200"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-600 dark:text-slate-300">Montant (USDT)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min={0.01}
            step="0.01"
            required
            className={`border rounded-xl px-4 py-3 text-base bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all duration-200 ${
              overBudget ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 dark:border-slate-600 focus:ring-emerald-400'
            }`}
          />
        </div>

        <div className="bg-gray-50 dark:bg-slate-800 rounded-xl px-4 py-3 flex justify-between text-sm">
          <span className="text-gray-500 dark:text-slate-400">Vous envoyez</span>
          <span className="font-semibold text-gray-800 dark:text-slate-200">{fmt(amountNum)} USDT — <span className="text-emerald-500">Gratuit</span></span>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">{error}</p>}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl px-4 py-3">
            <p className="text-sm text-green-800 dark:text-green-300 font-medium">✓ {success}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="w-full h-[52px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 text-base mt-1"
        >
          {loading && <Spinner />}
          {loading ? 'Envoi…' : 'Envoyer'}
        </button>
      </form>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={() => setShowConfirm(false)}>
          <div className="w-full max-w-md bg-white dark:bg-[#1e293b] rounded-2xl p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-[#f1f5f9] mb-4">Confirmer l'envoi</h2>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Destinataire</span><span className="font-medium text-gray-800 dark:text-slate-200">{phone}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Montant</span><span className="font-bold text-emerald-600">{fmt(amountNum)} USDT</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Frais</span><span className="font-medium text-emerald-500">Gratuit</span></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowConfirm(false)} className="flex-1 h-[48px] rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-semibold">Annuler</button>
              <button onClick={confirmSend} className="flex-1 h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition">Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
